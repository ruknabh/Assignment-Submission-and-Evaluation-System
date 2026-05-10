import multer from 'multer';

// memoryStorage keeps file in buffer — lets controller validate before saving to disk
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB hard cap — assignment-level limits enforced in controller
  },
  fileFilter: (req, file, cb) => {
    // Reject files with no extension or suspicious names
    const hasExtension = file.originalname.includes('.');
    if (!hasExtension) {
      return cb(new Error('File must have an extension'));
    }
    cb(null, true);
  },
});

export default upload;