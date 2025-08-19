import React, { useState, useRef, useCallback } from 'react';
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  Star, 
  StarOff, 
  Edit, 
  Trash2, 
  ZoomIn, 
  Download, 
  RotateCw, 
  Crop,
  Move,
  Grid3X3,
  List,
  Plus
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { cn } from '../../lib/utils';
import { useUploadInventoryImage } from '../../hooks/useInventory';

interface ProductImage {
  id: string;
  url: string;
  alt_text?: string;
  is_primary: boolean;
  sort_order: number;
  file_size?: number;
  dimensions?: {
    width: number;
    height: number;
  };
  created_at?: string;
}

interface ImageGalleryManagerProps {
  images: ProductImage[];
  onImagesChange: (images: ProductImage[]) => void;
  maxImages?: number;
  maxFileSize?: number; // in MB
  acceptedFormats?: string[];
  className?: string;
}

interface ImageEditDialogProps {
  image: ProductImage;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedImage: ProductImage) => void;
}

const ImageEditDialog: React.FC<ImageEditDialogProps> = ({
  image,
  isOpen,
  onClose,
  onSave
}) => {
  const [altText, setAltText] = useState(image.alt_text || '');
  const [isPrimary, setIsPrimary] = useState(image.is_primary);

  const handleSave = () => {
    onSave({
      ...image,
      alt_text: altText,
      is_primary: isPrimary
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Image</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="aspect-video relative bg-muted rounded-lg overflow-hidden">
            <img
              src={image.url}
              alt={image.alt_text || 'Product image'}
              className="w-full h-full object-contain"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="alt-text">Alt Text</Label>
            <Textarea
              id="alt-text"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="Describe this image for accessibility..."
              rows={3}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is-primary"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="is-primary">Set as primary image</Label>
          </div>
          
          {image.dimensions && (
            <div className="text-sm text-muted-foreground">
              Dimensions: {image.dimensions.width} × {image.dimensions.height}px
              {image.file_size && ` • Size: ${(image.file_size / 1024 / 1024).toFixed(2)} MB`}
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const ImageGalleryManager: React.FC<ImageGalleryManagerProps> = ({
  images,
  onImagesChange,
  maxImages = 10,
  maxFileSize = 5, // 5MB
  acceptedFormats = ['image/jpeg', 'image/png', 'image/webp'],
  className
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedImage, setSelectedImage] = useState<ProductImage | null>(null);
  const [editingImage, setEditingImage] = useState<ProductImage | null>(null);
  const [deleteConfirmImage, setDeleteConfirmImage] = useState<ProductImage | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [draggedImage, setDraggedImage] = useState<ProductImage | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadImageMutation = useUploadInventoryImage();

  const handleFileSelect = useCallback(async (files: FileList) => {
    if (images.length + files.length > maxImages) {
      alert(`Maximum ${maxImages} images allowed`);
      return;
    }

    setIsUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file, index) => {
        // Validate file
        if (!acceptedFormats.includes(file.type)) {
          throw new Error(`Invalid file format: ${file.name}`);
        }
        
        if (file.size > maxFileSize * 1024 * 1024) {
          throw new Error(`File too large: ${file.name} (max ${maxFileSize}MB)`);
        }

        // Get image dimensions
        const dimensions = await getImageDimensions(file);
        
        const result = await uploadImageMutation.mutateAsync(file);
        return {
          id: `img_${Date.now()}_${index}`,
          url: result.image_url,
          alt_text: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
          is_primary: images.length === 0 && index === 0,
          sort_order: images.length + index,
          file_size: file.size,
          dimensions,
          created_at: new Date().toISOString(),
        };
      });

      const newImages = await Promise.all(uploadPromises);
      onImagesChange([...images, ...newImages]);
    } catch (error) {
      console.error('Failed to upload images:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload images');
    } finally {
      setIsUploading(false);
    }
  }, [images, maxImages, maxFileSize, acceptedFormats, onImagesChange, uploadImageMutation]);

  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleImageDelete = (imageId: string) => {
    const updatedImages = images.filter(img => img.id !== imageId);
    
    // If we deleted the primary image, make the first remaining image primary
    if (updatedImages.length > 0 && !updatedImages.some(img => img.is_primary)) {
      updatedImages[0].is_primary = true;
    }
    
    onImagesChange(updatedImages);
    setDeleteConfirmImage(null);
  };

  const handleSetPrimary = (imageId: string) => {
    const updatedImages = images.map(img => ({
      ...img,
      is_primary: img.id === imageId
    }));
    onImagesChange(updatedImages);
  };

  const handleImageEdit = (updatedImage: ProductImage) => {
    const updatedImages = images.map(img => {
      if (img.id === updatedImage.id) {
        return updatedImage;
      }
      // If this image is being set as primary, unset others
      if (updatedImage.is_primary && img.is_primary && img.id !== updatedImage.id) {
        return { ...img, is_primary: false };
      }
      return img;
    });
    onImagesChange(updatedImages);
  };

  const handleDragStart = (e: React.DragEvent, image: ProductImage) => {
    setDraggedImage(image);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedImage(null);
  };

  const handleImageDrop = (e: React.DragEvent, targetImage: ProductImage) => {
    e.preventDefault();
    if (!draggedImage || draggedImage.id === targetImage.id) return;

    const draggedIndex = images.findIndex(img => img.id === draggedImage.id);
    const targetIndex = images.findIndex(img => img.id === targetImage.id);

    const newImages = [...images];
    const [removed] = newImages.splice(draggedIndex, 1);
    newImages.splice(targetIndex, 0, removed);

    // Update sort orders
    const updatedImages = newImages.map((img, index) => ({
      ...img,
      sort_order: index
    }));

    onImagesChange(updatedImages);
  };

  const downloadImage = async (image: ProductImage) => {
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `product-image-${image.id}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download image:', error);
    }
  };

  const sortedImages = [...images].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Product Images</h3>
          <Badge variant="secondary">
            {images.length} / {maxImages}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || images.length >= maxImages}
          >
            <Plus className="h-4 w-4 mr-2" />
            {isUploading ? 'Uploading...' : 'Add Images'}
          </Button>
        </div>
      </div>

      {/* Upload Area */}
      <div
        className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground mb-2">
          Drag and drop images here, or click to select files
        </p>
        <p className="text-xs text-muted-foreground">
          Supports: {acceptedFormats.map(f => f.split('/')[1]).join(', ')} • Max {maxFileSize}MB per file
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFormats.join(',')}
          multiple
          onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
          className="hidden"
        />
      </div>

      {/* Images Display */}
      {sortedImages.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No images uploaded</p>
            <p className="text-sm text-muted-foreground">
              Upload product images to showcase your item
            </p>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {sortedImages.map((image, index) => (
            <Card 
              key={image.id} 
              className="relative group cursor-move"
              draggable
              onDragStart={(e) => handleDragStart(e, image)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleImageDrop(e, image)}
            >
              <CardContent className="p-2">
                <div className="aspect-square relative">
                  <img
                    src={image.url}
                    alt={image.alt_text || `Product image ${index + 1}`}
                    className="w-full h-full object-cover rounded-md cursor-pointer"
                    onClick={() => setSelectedImage(image)}
                  />
                  
                  {/* Primary Badge */}
                  {image.is_primary && (
                    <Badge className="absolute top-2 left-2 text-xs">
                      <Star className="h-3 w-3 mr-1" />
                      Primary
                    </Badge>
                  )}
                  
                  {/* Action Buttons */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="icon" className="h-6 w-6">
                          <Edit className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingImage(image)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSelectedImage(image)}>
                          <ZoomIn className="h-4 w-4 mr-2" />
                          View Full Size
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => downloadImage(image)}>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {!image.is_primary && (
                          <DropdownMenuItem onClick={() => handleSetPrimary(image.id)}>
                            <Star className="h-4 w-4 mr-2" />
                            Set as Primary
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          onClick={() => setDeleteConfirmImage(image)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  {/* Move Handle */}
                  <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-black/50 rounded p-1">
                      <Move className="h-3 w-3 text-white" />
                    </div>
                  </div>
                </div>
                
                {/* Image Info */}
                <div className="mt-2 text-xs text-muted-foreground">
                  {image.dimensions && (
                    <div>{image.dimensions.width} × {image.dimensions.height}</div>
                  )}
                  {image.file_size && (
                    <div>{(image.file_size / 1024 / 1024).toFixed(2)} MB</div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {sortedImages.map((image, index) => (
            <Card key={image.id} className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 relative">
                  <img
                    src={image.url}
                    alt={image.alt_text || `Product image ${index + 1}`}
                    className="w-full h-full object-cover rounded-md cursor-pointer"
                    onClick={() => setSelectedImage(image)}
                  />
                  {image.is_primary && (
                    <Star className="absolute -top-1 -right-1 h-4 w-4 text-yellow-500 fill-current" />
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="font-medium">
                    {image.alt_text || `Product Image ${index + 1}`}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {image.dimensions && `${image.dimensions.width} × ${image.dimensions.height} • `}
                    {image.file_size && `${(image.file_size / 1024 / 1024).toFixed(2)} MB`}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {!image.is_primary && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetPrimary(image.id)}
                    >
                      <StarOff className="h-4 w-4 mr-1" />
                      Set Primary
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingImage(image)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteConfirmImage(image)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Full Size Image Dialog */}
      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>
                {selectedImage.alt_text || 'Product Image'}
                {selectedImage.is_primary && (
                  <Badge className="ml-2">Primary</Badge>
                )}
              </DialogTitle>
            </DialogHeader>
            <div className="flex justify-center">
              <img
                src={selectedImage.url}
                alt={selectedImage.alt_text || 'Product image'}
                className="max-w-full max-h-[70vh] object-contain"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Image Dialog */}
      {editingImage && (
        <ImageEditDialog
          image={editingImage}
          isOpen={!!editingImage}
          onClose={() => setEditingImage(null)}
          onSave={handleImageEdit}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmImage && (
        <AlertDialog open={!!deleteConfirmImage} onOpenChange={() => setDeleteConfirmImage(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Image</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this image? This action cannot be undone.
                {deleteConfirmImage.is_primary && (
                  <div className="mt-2 text-amber-600">
                    This is the primary image. Another image will be set as primary automatically.
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleImageDelete(deleteConfirmImage.id)}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};