import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { CloudinaryService } from '../services/cloudinary';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

router.post(
  '/',
  authenticate,
  requireAdmin,
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { folder = 'ophmart/products', url } = req.body;

      if (url) {
        const image = await CloudinaryService.uploadImage(url, folder);
        res.status(200).json({ success: true, data: image });
        return;
      }

      if (!req.file) {
        res.status(400).json({ success: false, message: 'No file or image URL provided', code: 'FILE_MISSING' });
        return;
      }

      const b64 = Buffer.from(req.file.buffer).toString('base64');
      const dataURI = `data:${req.file.mimetype};base64,${b64}`;
      const image = await CloudinaryService.uploadImage(dataURI, folder);

      res.status(200).json({
        success: true,
        message: 'Image uploaded successfully',
        data: image
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
