import multer from 'multer';
import { ApiError } from '../utils/apiError';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'application/zip',
];
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;

const storage = multer.memoryStorage();

export const uploadChatFile = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(ApiError.badRequest(`File type ${file.mimetype} is not allowed`));
    }
    cb(null, true);
  },
}).single('file');
