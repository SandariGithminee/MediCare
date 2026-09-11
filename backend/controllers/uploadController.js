const { supabase, bucketName } = require("../config/supabase");
const path = require("path");
const { formatErrorMessage } = require("../utils/errorHandler");

/**
 * Helper to upload a single buffer to Supabase Storage bucket "Uploads"
 */
const uploadBufferToSupabase = async (file, folder = "documents") => {
  const fileExt = path.extname(file.originalname).toLowerCase();
  const sanitizedBaseName = path
    .basename(file.originalname, fileExt)
    .replace(/[^a-zA-Z0-9_-]/g, "_");
  const uniqueName = `${folder}/${Date.now()}_${sanitizedBaseName}${fileExt}`;

  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(uniqueName, file.buffer, {
      contentType: file.mimetype,
      upsert: true,
    });

  if (error) {
    throw new Error(`Supabase Storage upload failed: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(data.path);

  return {
    name: file.originalname,
    originalName: file.originalname,
    path: data.path,
    url: publicUrlData.publicUrl,
    size: file.size,
    mimeType: file.mimetype,
    uploadedAt: new Date().toISOString(),
  };
};

/**
 * @desc    Upload single file to Supabase Storage "Uploads" bucket
 * @route   POST /api/upload/single
 * @access  Private
 */
const uploadSingleFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please select a file to upload." });
    }

    const folder = req.body.folder || "general";
    const fileResult = await uploadBufferToSupabase(req.file, folder);

    res.status(200).json({
      success: true,
      message: "File uploaded successfully to Supabase Storage",
      file: fileResult,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: formatErrorMessage(error) });
  }
};

/**
 * @desc    Upload multiple files to Supabase Storage "Uploads" bucket
 * @route   POST /api/upload/multiple
 * @access  Private
 */
const uploadMultipleFiles = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "Please upload at least one file" });
    }

    const folder = req.body.folder || "documents";
    const uploadPromises = req.files.map((file) => uploadBufferToSupabase(file, folder));
    const uploadedFiles = await Promise.all(uploadPromises);

    res.status(200).json({
      success: true,
      message: `${uploadedFiles.length} file(s) uploaded successfully to Supabase Storage`,
      files: uploadedFiles,
    });
  } catch (error) {
    console.error("Upload multiple error:", error);
    res.status(500).json({ message: formatErrorMessage(error) });
  }
};

/**
 * @desc    Delete a file from Supabase Storage
 * @route   DELETE /api/upload
 * @access  Private
 */
const deleteFile = async (req, res) => {
  try {
    const { filePath } = req.body;
    if (!filePath) {
      return res.status(400).json({ message: "filePath is required." });
    }

    const { data, error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);

    if (error) {
      return res.status(400).json({ message: formatErrorMessage(error) });
    }

    res.status(200).json({
      success: true,
      message: "File deleted successfully from Supabase Storage",
      data,
    });
  } catch (error) {
    res.status(500).json({ message: formatErrorMessage(error) });
  }
};

module.exports = {
  uploadSingleFile,
  uploadMultipleFiles,
  deleteFile,
};
