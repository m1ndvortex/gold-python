/**
 * Advanced Image Viewer Component
 * 
 * Provides zoom functionality, fullscreen support, and navigation
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  RotateCcw,
  Maximize, 
  Minimize,
  ChevronLeft, 
  ChevronRight,
  Download,
  Info,
  Grid3X3,
  Star,
  Calendar,
  FileImage,
  HardDrive,
  Palette
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '../ui/dialog';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '../../lib/utils';
import { ImageMetadata, ImageViewerProps } from '../../types/imageManagement';
import ImageManagementAPI from '../../services/imageManagementApi';

export const ImageViewer: React.FC<ImageViewerProps> = ({
  image,
  images = [],
  currentIndex = 0,
  enableZoom = true,
  enableFullscreen = true,
  enableNavigation = true,
  showMetadata = true,
  showThumbnails = true,
  onClose,
  onNext,
  onPrevious,
  onImageChange,
  className
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showMetadataPanel, setShowMetadataPanel] = useState(showMetadata);
  const [showThumbnailStrip, setShowThumbnailStrip] = useState(showThumbnails);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);

  const currentImage = images.length > 0 ? images[currentIndex] : image;
  const hasMultipleImages = images.length > 1;

  // Reset state when image changes
  useEffect(() => {
    setZoomLevel(1);
    setRotation(0);
    setImagePosition({ x: 0, y: 0 });
    setImageLoaded(false);
    setImageError(false);
  }, [currentImage.id]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          if (isFullscreen) {
            setIsFullscreen(false);
          } else {
            onClose?.();
          }
          break;
        case 'ArrowLeft':
          if (enableNavigation && hasMultipleImages) {
            handlePrevious();
          }
          break;
        case 'ArrowRight':
          if (enableNavigation && hasMultipleImages) {
            handleNext();
          }
          break;
        case '+':
        case '=':
          if (enableZoom) {
            handleZoomIn();
          }
          break;
        case '-':
          if (enableZoom) {
            handleZoomOut();
          }
          break;
        case '0':
          if (enableZoom) {
            handleZoomReset();
          }
          break;
        case 'r':
          handleRotateRight();
          break;
        case 'R':
          handleRotateLeft();
          break;
        case 'f':
          if (enableFullscreen) {
            setIsFullscreen(!isFullscreen);
          }
          break;
        case 'i':
          setShowMetadataPanel(!showMetadataPanel);
          break;
        case 't':
          setShowThumbnailStrip(!showThumbnailStrip);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    isFullscreen, 
    enableNavigation, 
    hasMultipleImages, 
    enableZoom, 
    enableFullscreen,
    showMetadataPanel,
    showThumbnailStrip
  ]);

  // Navigation handlers
  const handleNext = useCallback(() => {
    if (!hasMultipleImages) return;
    const nextIndex = (currentIndex + 1) % images.length;
    onNext?.();
    onImageChange?.(nextIndex);
  }, [currentIndex, images.length, hasMultipleImages, onNext, onImageChange]);

  const handlePrevious = useCallback(() => {
    if (!hasMultipleImages) return;
    const prevIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
    onPrevious?.();
    onImageChange?.(prevIndex);
  }, [currentIndex, images.length, hasMultipleImages, onPrevious, onImageChange]);

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    if (!enableZoom) return;
    setZoomLevel(prev => Math.min(prev * 1.5, 5));
  }, [enableZoom]);

  const handleZoomOut = useCallback(() => {
    if (!enableZoom) return;
    setZoomLevel(prev => Math.max(prev / 1.5, 0.1));
  }, [enableZoom]);

  const handleZoomReset = useCallback(() => {
    if (!enableZoom) return;
    setZoomLevel(1);
    setImagePosition({ x: 0, y: 0 });
  }, [enableZoom]);

  // Rotation handlers
  const handleRotateRight = useCallback(() => {
    setRotation(prev => (prev + 90) % 360);
  }, []);

  const handleRotateLeft = useCallback(() => {
    setRotation(prev => (prev - 90 + 360) % 360);
  }, []);

  // Mouse drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoomLevel <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - imagePosition.x, y: e.clientY - imagePosition.y });
  }, [zoomLevel, imagePosition]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || zoomLevel <= 1) return;
    setImagePosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  }, [isDragging, zoomLevel, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!enableZoom) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoomLevel(prev => Math.max(0.1, Math.min(5, prev * delta)));
  }, [enableZoom]);

  // Download handler
  const handleDownload = async () => {
    try {
      const imageUrl = ImageManagementAPI.getImageUrl(currentImage.id, 'original', true);
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = currentImage.original_filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download image:', error);
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const imageUrl = ImageManagementAPI.getImageUrl(currentImage.id, 'original', true);

  const viewerContent = (
    <div 
      ref={viewerRef}
      className={cn(
        "relative bg-black text-white",
        isFullscreen ? "fixed inset-0 z-50" : "h-[80vh]",
        className
      )}
    >
      {/* Header Controls */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/90 via-black/60 to-transparent p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold truncate">
              {currentImage.alt_text || currentImage.original_filename}
            </h3>
            {currentImage.is_primary && (
              <Badge className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white shadow-lg">
                <Star className="h-3 w-3 mr-1" />
                Primary
              </Badge>
            )}
            {hasMultipleImages && (
              <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg">
                {currentIndex + 1} of {images.length}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            {enableZoom && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomOut}
                  disabled={zoomLevel <= 0.1}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm min-w-[4rem] text-center">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomIn}
                  disabled={zoomLevel >= 5}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </>
            )}
            
            {/* Rotation Controls */}
            <Button variant="ghost" size="sm" onClick={handleRotateLeft}>
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleRotateRight}>
              <RotateCw className="h-4 w-4" />
            </Button>
            
            {/* Download */}
            <Button variant="ghost" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4" />
            </Button>
            
            {/* Metadata Toggle */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowMetadataPanel(!showMetadataPanel)}
            >
              <Info className="h-4 w-4" />
            </Button>
            
            {/* Thumbnail Toggle */}
            {hasMultipleImages && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowThumbnailStrip(!showThumbnailStrip)}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
            )}
            
            {/* Fullscreen Toggle */}
            {enableFullscreen && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </Button>
            )}
            
            {/* Close */}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex h-full">
        {/* Image Container */}
        <div 
          ref={containerRef}
          className={cn(
            "flex-1 relative overflow-hidden",
            showMetadataPanel ? "mr-80" : ""
          )}
        >
          {/* Navigation Arrows */}
          {enableNavigation && hasMultipleImages && (
            <>
              <Button
                variant="ghost"
                size="lg"
                className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70"
                onClick={handlePrevious}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70"
                onClick={handleNext}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}

          {/* Image */}
          <div 
            className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          >
            {imageError ? (
              <div className="text-center text-muted-foreground">
                <FileImage className="h-16 w-16 mx-auto mb-4" />
                <p>Failed to load image</p>
              </div>
            ) : (
              <img
                ref={imageRef}
                src={imageUrl}
                alt={currentImage.alt_text || currentImage.original_filename}
                className={cn(
                  "max-w-none transition-transform duration-200",
                  isDragging ? "cursor-grabbing" : "cursor-grab"
                )}
                style={{
                  transform: `scale(${zoomLevel}) rotate(${rotation}deg) translate(${imagePosition.x}px, ${imagePosition.y}px)`,
                  maxHeight: zoomLevel === 1 ? '100%' : 'none',
                  maxWidth: zoomLevel === 1 ? '100%' : 'none'
                }}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
                draggable={false}
              />
            )}
          </div>
        </div>

        {/* Metadata Panel */}
        {showMetadataPanel && (
          <div className="w-80 bg-gradient-to-b from-gray-900 to-gray-800 border-l border-gray-600 flex flex-col shadow-xl">
            <div className="p-4 border-b border-gray-700">
              <h4 className="font-semibold mb-2">Image Details</h4>
            </div>
            
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {/* Basic Info */}
                <Card className="bg-gradient-to-br from-gray-800 to-gray-700 border-gray-600 shadow-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <FileImage className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Filename:</span>
                      <span className="break-all">{currentImage.original_filename}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Palette className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Type:</span>
                      <span>{currentImage.mime_type}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <HardDrive className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Size:</span>
                      <span>{formatFileSize(currentImage.file_size_bytes)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Created:</span>
                      <span>{formatDate(currentImage.created_at)}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Dimensions */}
                <Card className="bg-gradient-to-br from-gray-800 to-gray-700 border-gray-600 shadow-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Dimensions</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-muted-foreground">Width:</span>
                        <div className="font-mono">{currentImage.image_width}px</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Height:</span>
                        <div className="font-mono">{currentImage.image_height}px</div>
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className="text-muted-foreground">Aspect Ratio:</span>
                      <div className="font-mono">
                        {(currentImage.image_width / currentImage.image_height).toFixed(2)}:1
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Optimization */}
                {currentImage.optimization_applied && (
                  <Card className="bg-gradient-to-br from-gray-800 to-gray-700 border-gray-600 shadow-lg">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Optimization</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Optimized:</span>
                          <Badge variant="secondary">Yes</Badge>
                        </div>
                        {currentImage.compression_ratio && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Compression:</span>
                            <span>{Math.round(currentImage.compression_ratio * 100)}%</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Alt Text & Caption */}
                {(currentImage.alt_text || currentImage.caption) && (
                  <Card className="bg-gradient-to-br from-gray-800 to-gray-700 border-gray-600 shadow-lg">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Description</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                      {currentImage.alt_text && (
                        <div>
                          <span className="text-muted-foreground">Alt Text:</span>
                          <p className="mt-1">{currentImage.alt_text}</p>
                        </div>
                      )}
                      {currentImage.caption && (
                        <div>
                          <span className="text-muted-foreground">Caption:</span>
                          <p className="mt-1">{currentImage.caption}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Thumbnails */}
                {currentImage.thumbnails && Object.keys(currentImage.thumbnails).length > 0 && (
                  <Card className="bg-gradient-to-br from-gray-800 to-gray-700 border-gray-600 shadow-lg">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Available Sizes</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm">
                      <div className="space-y-2">
                        {Object.entries(currentImage.thumbnails).map(([size, info]) => (
                          <div key={size} className="flex justify-between">
                            <span className="text-muted-foreground capitalize">{size}:</span>
                            <span>{info.width} × {info.height}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>

      {/* Thumbnail Strip */}
      {showThumbnailStrip && hasMultipleImages && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <ScrollArea>
            <div className="flex gap-2">
              {images.map((img, index) => (
                <button
                  key={img.id}
                  className={cn(
                    "flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden transition-all",
                    index === currentIndex 
                      ? "border-white shadow-lg" 
                      : "border-gray-600 hover:border-gray-400"
                  )}
                  onClick={() => onImageChange?.(index)}
                >
                  <img
                    src={ImageManagementAPI.getImageUrl(img.id, 'small', true)}
                    alt={img.alt_text || img.original_filename}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Loading Indicator */}
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
            <p>Loading image...</p>
          </div>
        </div>
      )}
    </div>
  );

  if (isFullscreen) {
    return viewerContent;
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] p-0">
        {viewerContent}
      </DialogContent>
    </Dialog>
  );
};

export default ImageViewer;