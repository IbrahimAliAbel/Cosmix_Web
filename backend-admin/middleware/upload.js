const multer = require('multer');

// Konfigurasi multer untuk handle file upload
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Hanya terima file gambar
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: fileFilter
});

module.exports = upload;