import multer from 'multer';
import { ApiError } from '../utils/apiError';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; 

const storage = multer.memoryStorage();

export const uploadAvatar = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(ApiError.badRequest('Only JPEG, PNG, or WEBP images are allowed'));
    }
    cb(null, true);
  },
}).single('avatar');
