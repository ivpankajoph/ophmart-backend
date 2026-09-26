import { Request, Response, NextFunction } from 'express';
import { Product } from '../models/Product';
import { ProductVariant } from '../models/ProductVariant';
import { Category } from '../models/Category';
import { Brand } from '../models/Brand';
import { RecommendationService } from '../services/recommendation';
import { AnalyticsService } from '../services/analytics';
import { AuthenticatedRequest } from '../middleware/auth';

export const getProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 24,
      category,
      brand,
      minPrice,
      maxPrice,
      size,
      color,
      rating,
      availability,
      discount,
      material,
      collection,
      gender,
      sort = 'featured',
      search
    } = req.query;

    const query: any = { status: 'PUBLISHED' };

    // Search query
    if (search && typeof search === 'string' && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: regex },
        { description: regex },
        { tags: regex },
        { material: regex },
        { sku: regex }
      ];
      AnalyticsService.track('product_search', { query: search.trim() });
    }

    // Category filter (handles slug or id, and finds descendants)
    if (category) {
      const catDoc = await Category.findOne({
        $or: [{ slug: category }, { _id: category.toString().match(/^[0-9a-fA-F]{24}$/) ? category : null }]
      });

      if (catDoc) {
        const subCats = await Category.find({ parent: catDoc._id }).select('_id');
        const catIds = [catDoc._id, ...subCats.map(c => c._id)];
        query.$or = query.$or
          ? query.$or.concat([{ category: { $in: catIds } }, { subCategory: { $in: catIds } }])
          : [{ category: { $in: catIds } }, { subCategory: { $in: catIds } }];
      }
    }

    // Brand filter
    if (brand) {
      const brandDoc = await Brand.findOne({
        $or: [{ slug: brand }, { _id: brand.toString().match(/^[0-9a-fA-F]{24}$/) ? brand : null }]
      });
      if (brandDoc) {
        query.brand = brandDoc._id;
      }
    }

    // Gender filter
    if (gender) {
      query.gender = (gender as string).toUpperCase();
    }

    // Collection filter
    if (collection) {
      query.collections = collection;
    }

    // Price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Size filter
    if (size) {
      const sizesArray = (size as string).split(',');
      query.sizes = { $in: sizesArray };
    }

    // Color filter
    if (color) {
      const colorsArray = (color as string).split(',');
      query.colors = { $in: colorsArray };
    }

    // Material filter
    if (material) {
      const materialsArray = (material as string).split(',');
      query.material = { $in: materialsArray };
    }

    // Rating filter
    if (rating) {
      query.ratings = { $gte: Number(rating) };
    }

    // Availability filter
    if (availability === 'in_stock') {
      query.inventory = { $gt: 0 };
    }

    // Discount filter
    if (discount) {
      const minDisc = Number(discount);
      query.$expr = {
        $gte: [
          {
            $multiply: [
              { $divide: [{ $subtract: ['$compareAtPrice', '$price'] }, '$compareAtPrice'] },
              100
            ]
          },
          minDisc
        ]
      };
    }

    // Sorting
    let sortOptions: any = { createdAt: -1 };
    switch (sort) {
      case 'newest':
        sortOptions = { createdAt: -1 };
        break;
      case 'price_asc':
        sortOptions = { price: 1 };
        break;
      case 'price_desc':
        sortOptions = { price: -1 };
        break;
      case 'rating':
        sortOptions = { ratings: -1, reviewsCount: -1 };
        break;
      case 'best_selling':
        sortOptions = { bestSeller: -1, reviewsCount: -1 };
        break;
      case 'discount':
        sortOptions = { compareAtPrice: -1 };
        break;
      case 'featured':
      default:
        sortOptions = { featured: -1, trending: -1, createdAt: -1 };
        break;
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('brand', 'name slug originCountry')
        .populate('category', 'name slug')
        .populate('subCategory', 'name slug')
        .populate('variants')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Product.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: {
        products,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getProductBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { slug } = req.params;
    const product = await Product.findOne({ slug })
      .populate('brand', 'name slug logo description originCountry')
      .populate('category', 'name slug')
      .populate('subCategory', 'name slug')
      .populate('variants');

    if (!product) {
      res.status(404).json({
        success: false,
        message: 'Product not found',
        code: 'PRODUCT_NOT_FOUND'
      });
      return;
    }

    AnalyticsService.track('product_view', {
      productId: product._id,
      slug: product.slug,
      name: product.name,
      price: product.price
    });

    const [similar, completeLook] = await Promise.all([
      RecommendationService.getSimilarProducts(product._id.toString(), 4),
      RecommendationService.getCompleteTheLook(product._id.toString(), 3)
    ]);

    res.status(200).json({
      success: true,
      data: {
        product,
        recommendations: {
          similar,
          completeLook
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const searchOverlayData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string' || !q.trim()) {
      const [trending, categories, brands] = await Promise.all([
        RecommendationService.getTrending(6),
        Category.find({ level: 0, status: 'ACTIVE' }).limit(6).lean(),
        Brand.find({ featured: true, status: 'ACTIVE' }).limit(6).lean()
      ]);

      res.status(200).json({
        success: true,
        data: {
          suggestedProducts: trending,
          categories,
          brands,
          trendingSearches: [
            'Cashmere Sweater',
            'Italian Wool Blazer',
            'Satin Evening Dress',
            'Leather Shoulder Bag',
            'Minimalist Sneakers',
            'Gold Jewellery'
          ]
        }
      });
      return;
    }

    const regex = new RegExp(q.trim(), 'i');
    const [products, categories, brands] = await Promise.all([
      Product.find({
        status: 'PUBLISHED',
        $or: [{ name: regex }, { tags: regex }, { material: regex }]
      })
        .populate('brand', 'name')
        .limit(6)
        .lean(),
      Category.find({ name: regex, status: 'ACTIVE' }).limit(4).lean(),
      Brand.find({ name: regex, status: 'ACTIVE' }).limit(4).lean()
    ]);

    res.status(200).json({
      success: true,
      data: {
        products,
        categories,
        brands
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      name,
      slug,
      sku,
      description,
      shortDescription,
      brand,
      category,
      subCategory,
      collections,
      tags,
      gender,
      material,
      colors,
      sizes,
      price,
      compareAtPrice,
      salePrice,
      inventory,
      images,
      details,
      seo,
      variantsData
    } = req.body;

    const product = new Product({
      name,
      slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
      sku: sku || `OPH-${Date.now().toString(36).toUpperCase()}`,
      description,
      shortDescription,
      brand,
      category,
      subCategory,
      collections: collections || [],
      tags: tags || [],
      gender: gender || 'UNISEX',
      material,
      colors: colors || [],
      sizes: sizes || [],
      price,
      compareAtPrice,
      salePrice,
      inventory: inventory || 0,
      images: images || [],
      details: details || {},
      seo: seo || { title: name, description: shortDescription || description.slice(0, 150) }
    });

    await product.save();

    // If variants were provided
    if (variantsData && Array.isArray(variantsData) && variantsData.length > 0) {
      const createdVariants = [];
      for (const v of variantsData) {
        const variant = await ProductVariant.create({
          product: product._id,
          sku: v.sku || `${product.sku}-${v.color}-${v.size}`.toUpperCase(),
          color: v.color,
          colorCode: v.colorCode,
          size: v.size,
          price: v.price || product.price,
          salePrice: v.salePrice || product.salePrice,
          stock: v.stock || 10,
          images: v.images || product.images
        });
        createdVariants.push(variant._id);
      }
      product.variants = createdVariants as any;
      await product.save();
    }

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const updated = await Product.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!updated) {
      res.status(404).json({ success: false, message: 'Product not found', code: 'PRODUCT_NOT_FOUND' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    await Product.findByIdAndDelete(id);
    await ProductVariant.deleteMany({ product: id });

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
