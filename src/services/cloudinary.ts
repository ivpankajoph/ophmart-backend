import { v2 as cloudinary } from 'cloudinary';
import { ICloudinaryImage } from '../types';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'demo',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
  secure: true
});

export class CloudinaryService {
  /**
   * Upload an image from a base64 string, URL, or local file buffer
   */
  static async uploadImage(
    fileStr: string,
    folder: string = 'ophmart/products',
    tags: string[] = ['ophmart', 'luxury']
  ): Promise<ICloudinaryImage> {
    try {
      // If mock demo credentials, allow direct pass-through for already hosted URLs
      if (fileStr.startsWith('http') && (!process.env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY === '1234567890')) {
        return {
          public_id: `ophmart_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          secure_url: fileStr,
          width: 1200,
          height: 1500,
          format: 'jpg',
          resource_type: 'image'
        };
      }

      const result = await cloudinary.uploader.upload(fileStr, {
        folder,
        tags,
        transformation: [
          { quality: 'auto:best' },
          { fetch_format: 'auto' }
        ]
      });

      return {
        public_id: result.public_id,
        secure_url: result.secure_url,
        width: result.width,
        height: result.height,
        format: result.format,
        resource_type: result.resource_type
      };
    } catch (error) {
      console.warn('[CloudinaryService] Upload notice:', (error as Error).message);
      // Fallback safe object
      return {
        public_id: `ophmart_fallback_${Date.now()}`,
        secure_url: fileStr.startsWith('http') ? fileStr : 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200',
        width: 1200,
        height: 1500,
        format: 'jpg',
        resource_type: 'image'
      };
    }
  }

  /**
   * Generate optimized transformed URLs for various device targets
   */
  static getTransformedUrl(
    publicIdOrUrl: string,
    options: {
      width?: number;
      height?: number;
      crop?: string;
      gravity?: string;
      quality?: string | number;
      format?: string;
    } = {}
  ): string {
    if (publicIdOrUrl.startsWith('http')) {
      // If it's an Unsplash or external URL, support Unsplash dynamic query parameters
      if (publicIdOrUrl.includes('images.unsplash.com')) {
        const url = new URL(publicIdOrUrl);
        if (options.width) url.searchParams.set('w', options.width.toString());
        if (options.quality) url.searchParams.set('q', options.quality.toString());
        url.searchParams.set('auto', 'format');
        return url.toString();
      }
      return publicIdOrUrl;
    }

    return cloudinary.url(publicIdOrUrl, {
      secure: true,
      quality: options.quality || 'auto',
      fetch_format: options.format || 'auto',
      width: options.width,
      height: options.height,
      crop: options.crop || 'fill',
      gravity: options.gravity || 'auto'
    });
  }

  static async deleteImage(publicId: string): Promise<boolean> {
    try {
      if (!publicId || publicId.startsWith('ophmart_fallback')) return true;
      await cloudinary.uploader.destroy(publicId);
      return true;
    } catch (err) {
      console.warn('[CloudinaryService] Delete failed:', (err as Error).message);
      return false;
    }
  }
}
