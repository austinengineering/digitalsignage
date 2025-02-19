'use client';

import { useState } from 'react';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { addMediaFile } from '@/lib/dynamodb';
import { v4 as uuidv4 } from 'uuid';
import MediaDetailsModal from './MediaDetailsModal';

export default function MediaUpload({ onUploadComplete }: { onUploadComplete: () => void }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const uploadToS3 = async (file: File) => {
    const client = new S3Client({
      region: process.env.NEXT_PUBLIC_AWS_REGION,
      credentials: {
        accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!
      }
    });

    const fileKey = `uploads/${Date.now()}-${file.name}`;
    
    try {
      const fileContent = await file.arrayBuffer();

      await client.send(new PutObjectCommand({
        Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME,
        Key: fileKey,
        Body: new Uint8Array(fileContent),
        ContentType: file.type
      }));

      return `https://${process.env.NEXT_PUBLIC_S3_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${fileKey}`;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setShowDetailsModal(true);
    }
  };

  const handleDetailsSubmit = async (details: { displayName: string; description: string }) => {
    if (!selectedFile) return;
    
    setShowDetailsModal(false);
    setUploading(true);
    setProgress(0);

    try {
      const fileUrl = await uploadToS3(selectedFile);
      
      await addMediaFile({
        mediaId: uuidv4(),
        fileName: selectedFile.name,
        displayName: details.displayName,
        description: details.description,
        fileUrl,
        fileType: selectedFile.type,
        uploadDate: new Date().toISOString(),
        userId: 'current-user'
      });

      onUploadComplete();
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
      setProgress(0);
      setSelectedFile(null);
    }
  };

  const handleCancel = () => {
    setShowDetailsModal(false);
    setSelectedFile(null);
  };

  return (
    <div className="mt-4">
      <div className="max-w-xl">
        <label className="block text-sm font-medium text-gray-700">
          Upload Media
        </label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
          <div className="space-y-1 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="flex text-sm text-gray-600">
              <label className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500">
                <span>Upload a file</span>
                <input
                  type="file"
                  className="sr-only"
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  disabled={uploading}
                />
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs text-gray-500">
              PNG, JPG, GIF, MP4 up to 10MB
            </p>
          </div>
        </div>
      </div>

      {showDetailsModal && (
        <MediaDetailsModal
          fileName={selectedFile?.name || ''}
          onSubmit={handleDetailsSubmit}
          onCancel={handleCancel}
        />
      )}

      {uploading && (
        <div className="mt-4">
          <div className="bg-indigo-100 rounded-full overflow-hidden">
            <div
              className="bg-indigo-500 h-2 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}