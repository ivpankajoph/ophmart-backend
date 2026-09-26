import { Request, Response, NextFunction } from 'express';
import { Brand } from '../models/Brand';
import { Product } from '../models/Product';
import { AuthenticatedRequest } from '../middleware/auth';

export const getBrands = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const brands = await Brand.find({ status: 'ACTIVE' }).sort({ featured: -1, name: 1 }).lean();
    res.status(200).json({ success: true, data: brands });
  } catch (error) {
    next(error);
  }
};

export const getBrandBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { slug } = req.params;
    const brand = await Brand.findOne({ slug });
    if (!brand) {
      res.status(404).json({ success: false, message: 'Brand not found', code: 'BRAND_NOT_FOUND' });
      return;
    }

    const products = await Product.find({ brand: brand._id, status: 'PUBLISHED' })
      .populate('variants')
      .limit(16)
      .lean();

    res.status(200).json({
      success: true,
      data: {
        brand,
        products
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createBrand = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, slug, description, logo, banner, originCountry, featured, website } = req.body;
    const brand = await Brand.create({
      name,
      slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description,
      logo,
      banner,
      originCountry,
      featured: !!featured,
      website
    });
    res.status(201).json({ success: true, message: 'Brand created', data: brand });
  } catch (error) {
    next(error);
  }
};
