import { Product, IProduct } from '../models/Product';

export class RecommendationService {
  /**
   * Get related products based on category, tags, and brand
   */
  static async getSimilarProducts(productId: string, limit: number = 4): Promise<IProduct[]> {
    const current = await Product.findById(productId);
    if (!current) return [];

    return Product.find({
      _id: { $ne: current._id },
      status: 'PUBLISHED',
      $or: [
        { category: current.category },
        { brand: current.brand },
        { tags: { $in: current.tags } }
      ]
    })
      .populate('brand', 'name slug')
      .populate('category', 'name slug')
      .populate('variants')
      .limit(limit)
      .lean();
  }

  /**
   * Complete the Look recommendations (frequently bought together / cross-category matching)
   */
  static async getCompleteTheLook(productId: string, limit: number = 3): Promise<IProduct[]> {
    const current = await Product.findById(productId);
    if (!current) return [];

    // Find complementary pieces (different category, matching gender/collection or tags)
    return Product.find({
      _id: { $ne: current._id },
      category: { $ne: current.category },
      gender: current.gender,
      status: 'PUBLISHED'
    })
      .populate('brand', 'name slug')
      .populate('category', 'name slug')
      .populate('variants')
      .limit(limit)
      .lean();
  }

  /**
   * Trending and personalized items
   */
  static async getTrending(limit: number = 8): Promise<IProduct[]> {
    return Product.find({ status: 'PUBLISHED', trending: true })
      .populate('brand', 'name slug')
      .populate('category', 'name slug')
      .populate('variants')
      .limit(limit)
      .lean();
  }
}
