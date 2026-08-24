import React, { useState, useRef } from "react";
import { UploadCloud, FileText, Image as ImageIcon, Trash2, ExternalLink, Loader2 } from "lucide-react";
import api from "../api/axios";
import toast from "react-hot-toast";

/**
 * FileUpload Component
 * Uploads documents/images to Supabase Storage "Uploads" bucket via backend API
 *
 * @param {Array} value - Current array of uploaded document objects [{ name, url, size, mimeType, path }]
 * @param {Function} onChange - Callback when documents change
 * @param {Boolean} multiple - Whether multiple files can be uploaded (default: true)
 * @param {String} folder - Subfolder name inside the bucket (default: 'documents')
 * @param {String} label - Display label
 */
const FileUpload = ({
  value = [],
  onChange,
  multiple = true,
  folder = "documents",
  label = "Upload Documents (PDF, Scans, Images)",
}) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // Validate size (max 20MB per file)
    for (const f of files) {
      if (f.size > 20 * 1024 * 1024) {
        toast.error(`File "${f.name}" exceeds the 20MB limit`);
        return;
      }
    }

    setUploading(true);
    const toastId = toast.loading(`Uploading ${files.length} file(s) to Supabase Storage...`);

    try {
      if (multiple && files.length > 1) {
        const formData = new FormData();
        files.forEach((f) => formData.append("files", f));
        formData.append("folder", folder);

        const res = await api.post("/upload/multiple", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        const newDocs = res.data.files || [];
        onChange?.([...(value || []), ...newDocs]);
        toast.success(`${newDocs.length} document(s) uploaded successfully!`, { id: toastId });
      } else {
        // Upload one by one or single
        const uploaded = [];
        for (const file of files) {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("folder", folder);

          const res = await api.post("/upload/single", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          if (res.data?.file) {
            uploaded.push(res.data.file);
          }
        }
        onChange?.(multiple ? [...(value || []), ...uploaded] : uploaded);
        toast.success(`Document uploaded successfully!`, { id: toastId });
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error.response?.data?.message || "Failed to upload document to Supabase", { id: toastId });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = (indexToRemove) => {
    const filtered = (value || []).filter((_, idx) => idx !== indexToRemove);
    onChange?.(filtered);
    toast.success("Attachment removed");
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isImage = (mimeType, name = "") => {
    return (
      (mimeType && mimeType.startsWith("image/")) ||
      /\.(jpg|jpeg|png|webp|gif)$/i.test(name)
    );
  };

  return (
    <div className="space-y-2">
      {label && <label className="block text-xs font-semibold text-gray-700">{label}</label>}

      {/* Upload Dropzone / Trigger */}
      <div
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
          uploading
            ? "border-primary-300 bg-primary-50/50 cursor-not-allowed"
            : "border-gray-300 hover:border-primary-500 hover:bg-gray-50/80"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          onChange={handleFileChange}
          className="hidden"
          accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.txt"
          disabled={uploading}
        />

        <div className="flex flex-col items-center justify-center gap-2">
          {uploading ? (
            <div className="flex items-center gap-2 text-primary-600 text-sm font-medium">
              <Loader2 className="animate-spin" size={20} />
              <span>Uploading to Supabase Storage bucket (Uploads)...</span>
            </div>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center">
                <UploadCloud size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">
                  Click to upload documents or drag & drop
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  PDF, DOC, DOCX, PNG, JPG up to 20MB
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Uploaded Documents List */}
      {value && value.length > 0 && (
        <div className="space-y-1.5 mt-2">
          <p className="text-xs font-semibold text-gray-500">
            Attached Documents ({value.length}):
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {value.map((doc, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs hover:border-primary-300 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {isImage(doc.mimeType, doc.name) ? (
                    <div className="w-7 h-7 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                      <ImageIcon size={15} />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0">
                      <FileText size={15} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-800 truncate" title={doc.name || doc.originalName}>
                      {doc.name || doc.originalName || "Uploaded Document"}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {doc.size ? formatFileSize(doc.size) : "Cloud file"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                  {doc.url && (
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-primary-600 hover:text-primary-800 hover:bg-primary-50 rounded"
                      title="Open / Download from Supabase"
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                    title="Remove attachment"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
