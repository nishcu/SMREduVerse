'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, X, File, Image as ImageIcon, Video as VideoIcon, FileText } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';

interface FileUploadProps {
  onUploadComplete: (url: string, fileName: string, fileType: string) => void;
  acceptedTypes?: string;
  maxSize?: number; // in MB
  label?: string;
  className?: string;
}

export function FileUpload({ 
  onUploadComplete, 
  acceptedTypes = 'image/*,video/*,application/pdf,.doc,.docx,.ppt,.pptx', 
  maxSize = 100,
  label = 'Upload File',
  className = ''
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<{ url: string; name: string; type: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="h-5 w-5" />;
    if (type.startsWith('video/')) return <VideoIcon className="h-5 w-5" />;
    if (type.includes('pdf') || type.includes('document') || type.includes('presentation')) return <FileText className="h-5 w-5" />;
    return <File className="h-5 w-5" />;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      alert(`File size must be less than ${maxSize}MB`);
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      // Simulate file upload with progress
      // In production, replace this with actual file upload to Firebase Storage or your CDN
      const formData = new FormData();
      formData.append('file', file);

      // Simulate upload progress
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // TODO: Replace with actual upload API call
      // For now, create a data URL (not recommended for production)
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        setTimeout(() => {
          setProgress(100);
          setUploadedFile({ url, name: file.name, type: file.type });
          onUploadComplete(url, file.name, file.type);
          setUploading(false);
          clearInterval(interval);
        }, 500);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload file. Please try again.');
      setUploading(false);
      setProgress(0);
    }
  };

  const handleRemove = () => {
    setUploadedFile(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-sm font-medium">{label}</label>
      {!uploadedFile ? (
        <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors">
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedTypes}
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
            disabled={uploading}
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm font-medium mb-1">
              {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
            </p>
            <p className="text-xs text-muted-foreground">
              {acceptedTypes.includes('image') && 'Images, '}
              {acceptedTypes.includes('video') && 'Videos, '}
              PDF, Documents (Max {maxSize}MB)
            </p>
            {uploading && (
              <div className="mt-4">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">{progress}%</p>
              </div>
            )}
          </label>
        </div>
      ) : (
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {getFileIcon(uploadedFile.type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{uploadedFile.name}</p>
                <p className="text-xs text-muted-foreground">Uploaded successfully</p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="ml-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


