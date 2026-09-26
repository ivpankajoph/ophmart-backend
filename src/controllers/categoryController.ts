import { Request, Response, NextFunction } from 'express';
import { Category } from '../models/Category';
import { AuthenticatedRequest } from '../middleware/auth';

export const getCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { format = 'tree' } = req.query;

    if (format === 'flat') {
      const categories = await Category.find({ status: 'ACTIVE' }).sort({ order: 1, name: 1 }).lean();
      res.status(200).json({ success: true, data: categories });
      return;
    }

    // Tree structure for Mega Menu & Navigation
    const all = await Category.find({ status: 'ACTIVE' }).sort({ order: 1, name: 1 }).lean();

    const categoryMap: Record<string, any> = {};
    all.forEach(cat => {
      categoryMap[cat._id.toString()] = { ...cat, children: [] };
    });

    const tree: any[] = [];
    all.forEach(cat => {
      if (cat.parent && categoryMap[cat.parent.toString()]) {
        categoryMap[cat.parent.toString()].children.push(categoryMap[cat._id.toString()]);
      } else if (!cat.parent) {
        tree.push(categoryMap[cat._id.toString()]);
      }
    });

    res.status(200).json({
      success: true,
      data: tree
    });
  } catch (error) {
    next(error);
  }
};

export const getCategoryBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { slug } = req.params;
    const category = await Category.findOne({ slug }).populate('parent', 'name slug');
    if (!category) {
      res.status(404).json({ success: false, message: 'Category not found', code: 'CATEGORY_NOT_FOUND' });
      return;
    }

    const subCategories = await Category.find({ parent: category._id, status: 'ACTIVE' }).sort({ order: 1 });

    res.status(200).json({
      success: true,
      data: {
        category,
        subCategories
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, slug, description, parent, level = 0, image, banner, featured, order } = req.body;

    const existing = await Category.findOne({ slug });
    if (existing) {
      res.status(400).json({ success: false, message: 'Category slug already exists', code: 'SLUG_EXISTS' });
      return;
    }

    const cat = await Category.create({
      name,
      slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description,
      parent: parent || null,
      level,
      image,
      banner,
      featured: !!featured,
      order: order || 0
    });

    res.status(201).json({ success: true, message: 'Category created', data: cat });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const updated = await Category.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) {
      res.status(404).json({ success: false, message: 'Category not found', code: 'NOT_FOUND' });
      return;
    }
    res.status(200).json({ success: true, message: 'Category updated', data: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    await Category.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Category deleted' });
  } catch (error) {
    next(error);
  }
};
