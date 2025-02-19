'use client';

import { useState, useEffect } from 'react';
import MediaUpload from './MediaUpload';
import { listMediaFiles, deleteMediaFile, MediaFile, updateMediaFile } from '@/lib/dynamodb';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedFileUrl } from '@/lib/s3';

interface EditMediaDetailsModalProps {
  file: MediaFile;
  onSubmit: (details: { displayName: string; description: string }) => void;
  onCancel: () => void;
}

function EditMediaDetailsModal({ file, onSubmit, onCancel }: EditMediaDetailsModalProps) {
  const [displayName, setDisplayName] = useState(file.displayName || file.fileName);
  const [description, setDescription] = useState(file.description || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ displayName, description });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Edit Media Details</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                rows={3}
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MediaPreview({ file }: { file: MediaFile }) {
  const [signedUrl, setSignedUrl] = useState<string>('');

  useEffect(() => {
    async function generateSignedUrl() {
      try {
        const urlParts = file.fileUrl.split('/');
        const key = urlParts.slice(3).join('/');
        const url = await getSignedFileUrl(key);
        setSignedUrl(url);
      } catch (error) {
        console.error('Error generating signed URL:', error);
      }
    }

    generateSignedUrl();
  }, [file]);

  if (!signedUrl) {
    return (
      <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
        <span className="text-gray-500">Loading...</span>
      </div>
    );
  }

  const isVideo = file.fileType.startsWith('video/');

  if (isVideo) {
    return (
      <div className="w-full h-48">
        <video
          src={signedUrl}
          className="w-full h-full object-cover rounded-lg"
          controls
          preload="metadata"
        >
          <source src={signedUrl} type={file.fileType} />
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  return (
    <div className="w-full h-48">
      <img
        src={signedUrl}
        alt={file.displayName || file.fileName}
        className="w-full h-full object-cover rounded-lg"
        loading="lazy"
        onError={(e) => {
          console.error('Image failed to load:', signedUrl);
          const target = e.target as HTMLImageElement;
          target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23eee"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" fill="%23999">Error</text></svg>';
        }}
      />
    </div>
  );
}

export default function MediaLibrary() {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [editingFile, setEditingFile] = useState<MediaFile | null>(null);

  const loadMediaFiles = async () => {
    try {
      const files = await listMediaFiles();
      setMediaFiles(files);
    } catch (error) {
      console.error('Error loading media files:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMediaFiles();
  }, []);

  const handleDelete = async (mediaId: string) => {
    if (!confirm('Are you sure you want to delete this media file?')) {
      return;
    }

    setDeleteLoading(mediaId);
    try {
      const fileToDelete = mediaFiles.find(f => f.mediaId === mediaId);
      if (!fileToDelete) return;

      await deleteMediaFile(mediaId);

      const s3Client = new S3Client({
        region: process.env.NEXT_PUBLIC_AWS_REGION,
        credentials: {
          accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!
        }
      });

      const urlParts = fileToDelete.fileUrl.split('/');
      const key = urlParts.slice(3).join('/');

      await s3Client.send(new DeleteObjectCommand({
        Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME,
        Key: key
      }));

      setMediaFiles(mediaFiles.filter(file => file.mediaId !== mediaId));
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Failed to delete file. Please try again.');
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleEdit = (file: MediaFile) => {
    setEditingFile(file);
  };

  const handleEditSubmit = async (details: { displayName: string; description: string }) => {
    if (!editingFile) return;

    try {
      const updatedFile = {
        ...editingFile,
        displayName: details.displayName,
        description: details.description
      };

      await updateMediaFile(updatedFile);
      setMediaFiles(mediaFiles.map(file => 
        file.mediaId === editingFile.mediaId ? updatedFile : file
      ));
      setEditingFile(null);
    } catch (error) {
      console.error('Error updating file:', error);
      alert('Failed to update file details. Please try again.');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Media Library</h2>
      </div>

      <MediaUpload onUploadComplete={loadMediaFiles} />

      {loading ? (
        <div className="mt-6 text-center">Loading media files...</div>
      ) : mediaFiles.length === 0 ? (
        <div className="mt-6 text-center text-gray-500">
          No media files yet. Upload some files to get started.
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {mediaFiles.map((file) => (
            <div
              key={file.mediaId}
              className="relative group bg-white p-3 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <MediaPreview file={file} />
              <div className="mt-2">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {file.displayName || file.fileName}
                </p>
                {file.description && (
                  <p className="text-sm text-gray-500 truncate">
                    {file.description}
                  </p>
                )}
                <p className="text-xs text-gray-400">
                  {new Date(file.uploadDate).toLocaleDateString()}
                </p>
              </div>
              <div className="absolute top-2 right-2 flex space-x-1">
                <button
                  onClick={() => handleEdit(file)}
                  className="p-1 bg-blue-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(file.mediaId)}
                  disabled={deleteLoading === file.mediaId}
                  className="p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:bg-red-400"
                >
                  {deleteLoading === file.mediaId ? (
                    <svg 
                      className="h-4 w-4 animate-spin" 
                      viewBox="0 0 24 24"
                    >
                      <circle 
                        className="opacity-25" 
                        cx="12" 
                        cy="12" 
                        r="10" 
                        stroke="currentColor" 
                        strokeWidth="4"
                      />
                      <path 
                        className="opacity-75" 
                        fill="currentColor" 
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingFile && (
        <EditMediaDetailsModal
          file={editingFile}
          onSubmit={handleEditSubmit}
          onCancel={() => setEditingFile(null)}
        />
      )}
    </div>
  );
}