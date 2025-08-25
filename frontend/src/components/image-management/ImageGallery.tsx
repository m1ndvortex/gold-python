/**
 * Advanced Image Gallery Component
 * 
 * Provides grid/list view modes, lazy loading, and comprehensive image management
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Grid3X3, 
  List, 
  ZoomIn, 
  Edit, 
  Trash2, 
  Star, 
  StarOff, 
  Download,
  Move,
  Eye,
  MoreVertical,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  RefreshCw,
  FileImage
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel
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
import { 
  ImageMetadata, 
  ImageGalleryProps, 
  ViewMode, 
  SortBy, 
  SortOrder 
} from '../../types/imageManagement';
import ImageManagementAPI from '../../services/imageManagementApi';
import { ImageViewer } from './ImageViewer';
import { ImageUpload } from './ImageUpload';

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  entityType,
  entityId,
  viewMode: initialViewMode = 'grid',
  enableReorder = true,
  enableZoom = true,
  enableFullscreen = true,
  maxImages = 50,
  onImageSelect,
  onImageUpdate,
  onImageDelete,
  className
}) => {
  const [images, setImages] = useState<ImageMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  const [selectedImage, setSelectedImage] = useState<ImageMetadata | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [deleteConfirmImage, setDeleteConfirmImage] = useState<ImageMetadata | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [draggedImage, setDraggedImage] = useState<ImageMetadata | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadedImagesRef = useRef<Set<string>>(new Set());

  // Load images
  const loadImages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const imageData = await ImageManagementAPI.getEntityImages(entityType, entityId, true);
      setImages(imageData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load images');
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  // Lazy loading observer
  useEffect(() => {
    if (typeof IntersectionObserver !== 'undefined') {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const img = entry.target as HTMLImageElement;
              const src = img.dataset.src;
              if (src && !loadedImagesRef.current.has(src)) {
                img.src = src;
                loadedImagesRef.current.add(src);
                observerRef.current?.unobserve(img);
              }
            }
          });
        },
        { threshold: 0.1 }
      );
    }

    return () => {
      if (observerRef.current && typeof observerRef.current.disconnect === 'function') {
        observerRef.current.disconnect();
      }
    };
  }, []);

  // Filter and sort images
  const filteredAndSortedImages = React.useMemo(() => {
    let filtered = images;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(image => 
        image.alt_text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        image.caption?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        image.original_filename.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'created_at':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case 'sort_order':
          aValue = a.sort_order;
          bValue = b.sort_order;
          break;
        case 'name':
          aValue = a.alt_text || a.original_filename;
          bValue = b.alt_text || b.original_filename;
          break;
        case 'size':
          aValue = a.file_size_bytes;
          bValue = b.file_size_bytes;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [images, searchQuery, sortBy, sortOrder]);

  // Handle image selection
  const handleImageSelect = (image: ImageMetadata) => {
    setSelectedImage(image);
    onImageSelect?.(image);
  };

  // Handle image view
  const handleImageView = (image: ImageMetadata) => {
    setSelectedImage(image);
    setViewerOpen(true);
  };

  // Handle image delete
  const handleImageDelete = async (imageId: string) => {
    try {
      await ImageManagementAPI.deleteImage(imageId);
      const updatedImages = images.filter(img => img.id !== imageId);
      setImages(updatedImages);
      onImageDelete?.(imageId);
      setDeleteConfirmImage(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete image');
    }
  };

  // Handle set primary
  const handleSetPrimary = async (imageId: string) => {
    try {
      await ImageManagementAPI.updateImageMetadata(imageId, { isPrimary: true });
      const updatedImages = images.map(img => ({
        ...img,
        is_primary: img.id === imageId
      }));
      setImages(updatedImages);
      onImageUpdate?.(imageId, { is_primary: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update image');
    }
  };

  // Handle drag and drop reordering
  const handleDragStart = (e: React.DragEvent, image: ImageMetadata) => {
    if (!enableReorder) return;
    setDraggedImage(image);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!enableReorder) return;
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetImage: ImageMetadata) => {
    if (!enableReorder || !draggedImage) return;
    e.preventDefault();

    if (draggedImage.id === targetImage.id) return;

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

    setImages(updatedImages);
    setDraggedImage(null);

    // Update sort order on server
    try {
      await ImageManagementAPI.updateImageMetadata(draggedImage.id, { 
        sortOrder: targetIndex 
      });
    } catch (err) {
      console.error('Failed to update sort order:', err);
    }
  };

  // Handle image download
  const handleImageDownload = async (image: ImageMetadata) => {
    try {
      const imageUrl = ImageManagementAPI.getImageUrl(image.id, 'original', true);
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = image.original_filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to download image:', err);
    }
  };

  // Lazy loading image component
  const LazyImage: React.FC<{ 
    image: ImageMetadata; 
    size?: 'small' | 'medium' | 'large' | 'gallery';
    className?: string;
    onClick?: () => void;
  }> = ({ image, size = 'medium', className, onClick }) => {
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
      const img = imgRef.current;
      if (img && observerRef.current && typeof observerRef.current.observe === 'function') {
        observerRef.current.observe(img);
      }
    }, []);

    const imageUrl = ImageManagementAPI.getImageUrl(image.id, size, true);

    return (
      <img
        ref={imgRef}
        data-src={imageUrl}
        alt={image.alt_text || image.original_filename}
        className={cn("bg-muted", className)}
        onClick={onClick}
        loading="lazy"
      />
    );
  };

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-0 shadow-lg">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-blue-800 font-medium">Loading images...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("text-center p-8", className)}>
        <div className="bg-gradient-to-r from-red-50 to-rose-50 border-0 rounded-lg p-6 shadow-lg">
          <div className="text-red-800 font-medium mb-4">{error}</div>
          <Button 
            onClick={loadImages} 
            className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Images</h3>
          <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg">
            {filteredAndSortedImages.length} of {images.length}
          </Badge>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search images..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-48"
            />
          </div>

          {/* Sort */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Filter className="h-4 w-4 mr-2" />
                Sort
                {sortOrder === 'asc' ? <SortAsc className="h-4 w-4 ml-2" /> : <SortDesc className="h-4 w-4 ml-2" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={sortBy === 'created_at'}
                onCheckedChange={() => setSortBy('created_at')}
              >
                Date Created
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={sortBy === 'sort_order'}
                onCheckedChange={() => setSortBy('sort_order')}
              >
                Custom Order
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={sortBy === 'name'}
                onCheckedChange={() => setSortBy('name')}
              >
                Name
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={sortBy === 'size'}
                onCheckedChange={() => setSortBy('size')}
              >
                File Size
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={sortOrder === 'asc'}
                onCheckedChange={() => setSortOrder('asc')}
              >
                Ascending
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={sortOrder === 'desc'}
                onCheckedChange={() => setSortOrder('desc')}
              >
                Descending
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View Mode */}
          <div className="flex items-center bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg border-0 shadow-md p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className={viewMode === 'grid' ? 'bg-white shadow-md border-2 border-blue-300 text-blue-700' : 'hover:bg-white/50'}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className={viewMode === 'list' ? 'bg-white shadow-md border-2 border-blue-300 text-blue-700' : 'hover:bg-white/50'}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Upload Button */}
          <Button 
            onClick={() => setShowUpload(true)}
            className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Upload Images
          </Button>
        </div>
      </div>

      {/* Images Display */}
      {filteredAndSortedImages.length === 0 ? (
        <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-slate-100/50 hover:shadow-xl transition-all duration-300">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center shadow-lg">
              <FileImage className="h-8 w-8 text-white" />
            </div>
            <div className="text-gray-700 font-medium mb-4">
              {searchQuery ? 'No images match your search' : 'No images uploaded'}
            </div>
            {!searchQuery && (
              <Button 
                onClick={() => setShowUpload(true)}
                className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Upload Images
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredAndSortedImages.map((image) => (
            <Card 
              key={image.id}
              className={cn(
                "relative group cursor-pointer transition-all hover:shadow-xl border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50",
                enableReorder && "cursor-move",
                selectedImage?.id === image.id && "ring-2 ring-blue-400 shadow-xl"
              )}
              draggable={enableReorder}
              onDragStart={(e) => handleDragStart(e, image)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, image)}
              onClick={() => handleImageSelect(image)}
            >
              <CardContent className="p-2">
                <div className="aspect-square relative">
                  <LazyImage
                    image={image}
                    size="medium"
                    className="w-full h-full object-cover rounded-md"
                    onClick={() => handleImageView(image)}
                  />
                  
                  {/* Primary Badge */}
                  {image.is_primary && (
                    <Badge className="absolute top-2 left-2 text-xs bg-gradient-to-r from-yellow-500 to-amber-600 text-white shadow-lg">
                      <Star className="h-3 w-3 mr-1" />
                      Primary
                    </Badge>
                  )}
                  
                  {/* Actions */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="icon" className="h-6 w-6">
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleImageView(image)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        {enableZoom && (
                          <DropdownMenuItem onClick={() => handleImageView(image)}>
                            <ZoomIn className="h-4 w-4 mr-2" />
                            Zoom
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleImageDownload(image)}>
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

                  {/* Reorder Handle */}
                  {enableReorder && (
                    <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-black/50 rounded p-1">
                        <Move className="h-3 w-3 text-white" />
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Image Info */}
                <div className="mt-2 text-xs text-muted-foreground truncate">
                  {image.alt_text || image.original_filename}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredAndSortedImages.map((image) => (
            <Card 
              key={image.id}
              className={cn(
                "transition-all hover:shadow-xl border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50",
                selectedImage?.id === image.id && "ring-2 ring-blue-400 shadow-xl"
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 relative flex-shrink-0">
                    <LazyImage
                      image={image}
                      size="small"
                      className="w-full h-full object-cover rounded-md cursor-pointer"
                      onClick={() => handleImageView(image)}
                    />
                    {image.is_primary && (
                      <Star className="absolute -top-1 -right-1 h-4 w-4 text-yellow-500 fill-current" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {image.alt_text || image.original_filename}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {image.image_width} × {image.image_height} • {(image.file_size_bytes / 1024 / 1024).toFixed(2)} MB
                    </div>
                    {image.caption && (
                      <div className="text-sm text-muted-foreground truncate mt-1">
                        {image.caption}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleImageView(image)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {!image.is_primary && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetPrimary(image.id)}
                      >
                        <StarOff className="h-4 w-4" />
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleImageDownload(image)}>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </DropdownMenuItem>
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
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Image Viewer */}
      {viewerOpen && selectedImage && (
        <ImageViewer
          image={selectedImage}
          images={filteredAndSortedImages}
          currentIndex={filteredAndSortedImages.findIndex(img => img.id === selectedImage.id)}
          enableZoom={enableZoom}
          enableFullscreen={enableFullscreen}
          enableNavigation={true}
          showMetadata={true}
          showThumbnails={true}
          onClose={() => setViewerOpen(false)}
          onImageChange={(index) => setSelectedImage(filteredAndSortedImages[index])}
        />
      )}

      {/* Upload Dialog */}
      {showUpload && (
        <ImageUpload
          entityType={entityType}
          entityId={entityId}
          multiple={true}
          maxFiles={maxImages - images.length}
          onUploadComplete={(results) => {
            loadImages(); // Reload images after upload
            setShowUpload(false);
          }}
          onUploadError={(error) => {
            setError(error);
            setShowUpload(false);
          }}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirmImage && (
        <AlertDialog open={!!deleteConfirmImage} onOpenChange={() => setDeleteConfirmImage(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Image</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{deleteConfirmImage.alt_text || deleteConfirmImage.original_filename}"? 
                This action cannot be undone.
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

export default ImageGallery;