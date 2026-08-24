const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadMiddleware");
const { protect } = require("../middleware/authMiddleware");
const {
  uploadSingleFile,
  uploadMultipleFiles,
  deleteFile,
} = require("../controllers/uploadController");

// Upload single document / image (field name: 'file')
router.post("/single", protect, upload.single("file"), uploadSingleFile);

// Upload multiple documents / images (field name: 'files')
router.post("/multiple", protect, upload.array("files", 10), uploadMultipleFiles);

// Delete file from Supabase storage
router.delete("/", protect, deleteFile);

module.exports = router;
