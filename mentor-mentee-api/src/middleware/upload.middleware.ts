import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), 'uploads', 'avatars');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Ensure posts images directory exists
const postsUploadDir = path.join(process.cwd(), 'storage', 'posts');
if (!fs.existsSync(postsUploadDir)) {
  fs.mkdirSync(postsUploadDir, { recursive: true });
}

// Configure storage for avatars
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: userId_timestamp.extension
    const userId = (req as any).user?.id || 'unknown';
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `${userId}_${timestamp}${ext}`;
    cb(null, filename);
  }
});

// Configure storage for post images
const postImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, postsUploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: post_userId_timestamp_random.extension
    const userId = (req as any).user?.sub || 'unknown';
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const ext = path.extname(file.originalname);
    const filename = `post_${userId}_${timestamp}_${random}${ext}`;
    cb(null, filename);
  }
});

// File filter - only allow images
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'));
  }
};

// Create multer instance for avatar
export const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  }
});

// Create multer instance for post images (multiple files)
export const uploadPostImages = multer({
  storage: postImageStorage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size per image
    files: 10, // Maximum 10 images per post
  }
});

// Helper function to delete old avatar file
export const deleteAvatarFile = (avatarPath: string | null) => {
  if (!avatarPath) return;
  
  try {
    const fullPath = path.join(process.cwd(), avatarPath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log(`Deleted old avatar: ${avatarPath}`);
    }
  } catch (error) {
    console.error('Error deleting avatar file:', error);
  }
};

// Helper function to delete post image file
export const deletePostImageFile = (imagePath: string) => {
  try {
    const fullPath = path.join(process.cwd(), imagePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log(`Deleted post image: ${imagePath}`);
    }
  } catch (error) {
    console.error('Error deleting post image file:', error);
  }
};
