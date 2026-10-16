const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Private secure storage directory (NOT exposed via express.static)
const STORAGE_DIR = path.resolve(__dirname, '../../storage/documents');
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

// Configured storage with randomized cryptographic filenames to prevent path traversal
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, STORAGE_DIR);
  },
  filename: (req, file, cb) => {
    const randomHash = crypto.randomBytes(16).toString('hex');
    const safeExt = path.extname(file.originalname).toLowerCase();
    cb(null, `doc-${Date.now()}-${randomHash}${safeExt}`);
  }
});

// File filter restricting to PDF (E-Pehchan, appointment letters, declarations) and images (JPEG, PNG)
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
  const allowedExtensions = ['.pdf', '.jpeg', '.jpg', '.png'];

  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype.toLowerCase();

  if (allowedMimeTypes.includes(mime) && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    const error = new Error(
      `File rejected: '${file.originalname}'. Only secure PDF documents (e.g. E-Pehchan card, KYC certificates) and image files (JPEG, PNG) up to 5MB are permitted.`
    );
    error.status = 400;
    cb(error, false);
  }
};

const secureUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB maximum
  }
});

module.exports = {
  secureUpload,
  STORAGE_DIR
};
