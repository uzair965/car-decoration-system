import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', '..', process.env.UPLOAD_DIR || 'uploads');

// Create subdirectories for organized storage
const directories = ['products', 'profiles', 'logos'];
directories.forEach(dir => {
  const fullPath = path.join(uploadDir, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// Configure where and how files are stored
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    // Default to products folder; controllers can override via req.uploadSubDir
    const subDir = (_req as any).uploadSubDir || 'products';
    const dest = path.join(uploadDir, subDir);
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    cb(null, dest);
  },
  filename: (_req, file, cb) => {
    // Generate unique filename: timestamp-randomstring.extension
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

// File filter - only allow images
const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, WebP, GIF) are allowed'));
  }
};

// Export configured multer instance
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB default
  },
});

export default upload;
