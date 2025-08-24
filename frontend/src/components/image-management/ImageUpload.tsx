/**
 * Advanced Image Upload Component
 * 
 * Provides drag-drop upload with progress tracking and validation
 */

import React, { useState, useRef, useCallback } from 'react';
import { 
  Upload, 
  X, 
  FileImage, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  Plus,
  Image as ImageIcon
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Alert, AlertDescription } from '../ui/alert';
import { cn } from '../../lib/utils';
import { 
  ImageUploadProps, 
  ImageUploadResult, 
  EntityType 
} from '../../types/imageManagement';
import ImageManagementAPI from '../../services/imageManagementApi';

interface UploadFile {
  file: File;
  id: string;
  preview: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  result?: ImageUploadResult;
  error?: string;
  altText?: string;
  caption?: string;
  isPrimary?: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  entityType,
  entityId,
  multiple = true,
  maxFiles = 10,
  onUploadComplete,
  onUploadError,
  className
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  const maxFileSize = 10 * 1024 * 1024; // 10MB
  const acceptedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

  // File validation
  const validateFile = (file: File): string | null => {
    if (!acceptedFormats.includes(file.type)) {
      return `Invalid file format. Accepted formats: ${acceptedFormats.map(f => f.split('/')[1]).join(', ')}`;
    }
    
    if (file.size > maxFileSize) {
      return `File too large. Maximum size: ${maxFileSize / 1024 / 1024}MB`;
    }
    
    return null;
  };

  // Create file preview
  const createFilePreview = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });
  };

  // Add files to upload queue
  const addFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    if (!multiple && fileArray.length > 1) {
      onUploadError?.('Only one file allowed');
      return;
    }
    
    if (uploadFiles.length + fileArray.length > maxFiles) {
      onUploadError?.(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const newUploadFiles: UploadFile[] = [];
    
    for (const file of fileArray) {
      const error = validateFile(file);
      if (error) {
        onUploadError?.(error);
        continue;
      }

      const preview = await createFilePreview(file);
      const uploadFile: UploadFile = {
        file,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        preview,
        status: 'pending',
        progress: 0,
        isPrimary: uploadFiles.length === 0 && newUploadFiles.length === 0
      };
      
      newUploadFiles.push(uploadFile);
    }

    setUploadFiles(prev => [...prev, ...newUploadFiles]);
  }, [uploadFiles.length, maxFiles, multiple, onUploadError]);

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(e.target.files);
    }
  };

  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    dragCounterRef.current = 0;
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      addFiles(files);
    }
  }, [addFiles]);

  // Remove file from queue
  const removeFile = (fileId: string) => {
    setUploadFiles(prev => {
      const updated = prev.filter(f => f.id !== fileId);
      // If we removed the primary file, make the first remaining file primary
      if (updated.length > 0 && !updated.some(f => f.isPrimary)) {
        updated[0].isPrimary = true;
      }
      return updated;
    });
  };

  // Update file metadata
  const updateFileMetadata = (fileId: string, updates: Partial<UploadFile>) => {
    setUploadFiles(prev => prev.map(f => {
      if (f.id === fileId) {
        // If setting as primary, unset others
        if (updates.isPrimary) {
          return { ...f, ...updates };
        }
        return { ...f, ...updates };
      }
      // If another file is being set as primary, unset this one
      if (updates.isPrimary && f.isPrimary) {
        return { ...f, isPrimary: false };
      }
      return f;
    }));
  };

  // Upload single file
  const uploadSingleFile = async (uploadFile: UploadFile): Promise<void> => {
    try {
      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'uploading', progress: 0 }
          : f
      ));

      const result = await ImageManagementAPI.uploadImage(
        uploadFile.file,
        entityType,
        entityId,
        {
          altText: uploadFile.altText,
          caption: uploadFile.caption,
          isPrimary: uploadFile.isPrimary
        }
      );

      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'success', progress: 100, result }
          : f
      ));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'error', error: errorMessage }
          : f
      ));
    }
  };

  // Upload all files
  const handleUpload = async () => {
    if (uploadFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    const pendingFiles = uploadFiles.filter(f => f.status === 'pending');
    const totalFiles = pendingFiles.length;
    let completedFiles = 0;

    try {
      // Upload files sequentially to avoid overwhelming the server
      for (const uploadFile of pendingFiles) {
        await uploadSingleFile(uploadFile);
        completedFiles++;
        setUploadProgress((completedFiles / totalFiles) * 100);
      }

      // Check results
      const results = uploadFiles
        .filter(f => f.result)
        .map(f => f.result!);
      
      const errors = uploadFiles
        .filter(f => f.status === 'error')
        .map(f => f.error!);

      if (results.length > 0) {
        onUploadComplete?.(results);
      }

      if (errors.length > 0) {
        onUploadError?.(errors.join(', '));
      }

      // Close dialog after successful upload
      if (errors.length === 0) {
        setTimeout(() => {
          setIsOpen(false);
        }, 1000);
      }
    } catch (error) {
      onUploadError?.(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle close
  const handleClose = () => {
    if (isUploading) return;
    setIsOpen(false);
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const hasFiles = uploadFiles.length > 0;
  const canUpload = hasFiles && !isUploading && uploadFiles.some(f => f.status === 'pending');
  const hasErrors = uploadFiles.some(f => f.status === 'error');
  const allUploaded = hasFiles && uploadFiles.every(f => f.status === 'success');

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Upload Images</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Upload Area */}
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
              isDragOver 
                ? "border-primary bg-primary/5" 
                : "border-muted-foreground/25 hover:border-muted-foreground/50"
            )}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {isDragOver ? 'Drop files here' : 'Upload Images'}
            </h3>
            <p className="text-muted-foreground mb-4">
              Drag and drop images here, or click to select files
            </p>
            <Button onClick={() => fileInputRef.current?.click()}>
              <Plus className="h-4 w-4 mr-2" />
              Select Files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptedFormats.join(',')}
              multiple={multiple}
              onChange={handleFileInputChange}
              className="hidden"
            />
            <div className="mt-4 text-sm text-muted-foreground">
              <p>Supported formats: {acceptedFormats.map(f => f.split('/')[1]).join(', ')}</p>
              <p>Maximum file size: {maxFileSize / 1024 / 1024}MB</p>
              <p>Maximum files: {maxFiles}</p>
            </div>
          </div>

          {/* File List */}
          {hasFiles && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Files to Upload ({uploadFiles.length})</h4>
                <div className="flex items-center gap-2">
                  <Label htmlFor="show-advanced" className="text-sm">
                    Advanced Options
                  </Label>
                  <Switch
                    id="show-advanced"
                    checked={showAdvanced}
                    onCheckedChange={setShowAdvanced}
                  />
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto space-y-3">
                {uploadFiles.map((uploadFile) => (
                  <Card key={uploadFile.id} className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Preview */}
                      <div className="w-16 h-16 flex-shrink-0 relative">
                        <img
                          src={uploadFile.preview}
                          alt="Preview"
                          className="w-full h-full object-cover rounded-md"
                        />
                        {uploadFile.isPrimary && (
                          <Badge className="absolute -top-1 -right-1 text-xs">
                            Primary
                          </Badge>
                        )}
                      </div>

                      {/* File Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="font-medium truncate">{uploadFile.file.name}</h5>
                          <Badge variant="outline" className="text-xs">
                            {formatFileSize(uploadFile.file.size)}
                          </Badge>
                          {uploadFile.status === 'success' && (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          )}
                          {uploadFile.status === 'error' && (
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          )}
                          {uploadFile.status === 'uploading' && (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          )}
                        </div>

                        {/* Progress */}
                        {uploadFile.status === 'uploading' && (
                          <Progress value={uploadFile.progress} className="mb-2" />
                        )}

                        {/* Error */}
                        {uploadFile.status === 'error' && uploadFile.error && (
                          <Alert variant="destructive" className="mb-2">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{uploadFile.error}</AlertDescription>
                          </Alert>
                        )}

                        {/* Advanced Options */}
                        {showAdvanced && uploadFile.status === 'pending' && (
                          <div className="space-y-2 mt-2">
                            <div>
                              <Label htmlFor={`alt-${uploadFile.id}`} className="text-xs">
                                Alt Text
                              </Label>
                              <Input
                                id={`alt-${uploadFile.id}`}
                                value={uploadFile.altText || ''}
                                onChange={(e) => updateFileMetadata(uploadFile.id, { altText: e.target.value })}
                                placeholder="Describe this image..."
                                className="text-sm"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`caption-${uploadFile.id}`} className="text-xs">
                                Caption
                              </Label>
                              <Textarea
                                id={`caption-${uploadFile.id}`}
                                value={uploadFile.caption || ''}
                                onChange={(e) => updateFileMetadata(uploadFile.id, { caption: e.target.value })}
                                placeholder="Image caption..."
                                rows={2}
                                className="text-sm"
                              />
                            </div>
                            <div className="flex items-center space-x-2">
                              <Switch
                                id={`primary-${uploadFile.id}`}
                                checked={uploadFile.isPrimary || false}
                                onCheckedChange={(checked) => updateFileMetadata(uploadFile.id, { isPrimary: checked })}
                              />
                              <Label htmlFor={`primary-${uploadFile.id}`} className="text-xs">
                                Set as primary image
                              </Label>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {uploadFile.status === 'pending' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeFile(uploadFile.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Uploading files...</span>
                <span className="text-sm text-muted-foreground">
                  {Math.round(uploadProgress)}%
                </span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          {/* Success Message */}
          {allUploaded && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                All files uploaded successfully! The dialog will close automatically.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isUploading}>
            {allUploaded ? 'Close' : 'Cancel'}
          </Button>
          {canUpload && (
            <Button onClick={handleUpload} disabled={isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload {uploadFiles.filter(f => f.status === 'pending').length} Files
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImageUpload;