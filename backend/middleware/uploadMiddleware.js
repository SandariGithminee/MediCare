const multer = require("multer");
const path = require("path");

// Use memory storage so we can stream/buffer directly into Supabase Storage
const storage = multer.memoryStorage();

// File filter for documents and medical images
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /jpeg|jpg|png|webp|gif|pdf|doc|docx|txt|csv|xlsx/;
  const ext = path.extname(file.originalname).toLowerCase().replace(".", "");
  const mimeAllowed = 
    file.mimetype.startsWith("image/") ||
    file.mimetype === "application/pdf" ||
    file.mimetype === "application/msword" ||
    file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    file.mimetype === "text/plain" ||
    file.mimetype === "text/csv";

  if (allowedExtensions.test(ext) || mimeAllowed) {
    return cb(null, true);
  }
  return cb(new Error("File format not supported. Only documents (PDF, DOC, DOCX, TXT) and images (JPEG, PNG, WEBP) are allowed."));
};

const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB max per file
  },
  fileFilter,
});

module.exports = upload;
