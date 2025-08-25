/**
 * Category Image Manager Component
 * 
 * Specialized component for managing category images with icon support
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Image as ImageIcon, 
  Star, 
  Upload, 
  Grid3X3, 
  List,
  Palette,
  Shapes,
  Eye,
  Edit,
  Trash2,
  Download,
  RefreshCw,
  Plus
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '../ui/dialog';
import { cn } from '../../lib/utils';
import { ImageMetadata, ViewMode } from '../../types/imageManagement';
import ImageManagementAPI from '../../services/imageManagementApi';
import { ImageGallery } from './ImageGallery';
import { ImageViewer } from './ImageViewer';
import { ImageUpload } from './ImageUpload';

interface CategoryImageManagerProps {
  categoryId: string;
  categoryName?: string;
  className?: string;
  onImageUpdate?: (images: ImageMetadata[]) => void;
}

interface IconPreset {
  id: string;
  name: string;
  icon: string;
  category: 'business' | 'jewelry' | 'general';
  svg: string;
}

// Predefined icon presets for categories
const ICON_PRESETS: IconPreset[] = [
  {
    id: 'jewelry-ring',
    name: 'Ring',
    icon: '💍',
    category: 'jewelry',
    svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L8 8h8l-4-6zm0 20c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8zm0-14c-3.3 0-6 2.7-6 6s2.7 6 6 6 6-2.7 6-6-2.7-6-6-6z"/></svg>'
  },
  {
    id: 'jewelry-necklace',
    name: 'Necklace',
    icon: '📿',
    category: 'jewelry',
    svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 16c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z"/></svg>'
  },
  {
    id: 'jewelry-earring',
    name: 'Earring',
    icon: '👂',
    category: 'jewelry',
    svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>'
  },
  {
    id: 'jewelry-bracelet',
    name: 'Bracelet',
    icon: '⌚',
    category: 'jewelry',
    svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 2v6h.01L6 8.01 10 12l-4 4 .01.01H6V22h12v-5.99h-.01L18 16l-4-4 4-3.99-.01-.01H18V2H6z"/></svg>'
  },
  {
    id: 'business-store',
    name: 'Store',
    icon: '🏪',
    category: 'business',
    svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7l3-7z"/></svg>'
  },
  {
    id: 'business-gold',
    name: 'Gold',
    icon: '🥇',
    category: 'business',
    svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>'
  },
  {
    id: 'general-category',
    name: 'Category',
    icon: '📁',
    category: 'general',
    svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/></svg>'
  },
  {
    id: 'general-tag',
    name: 'Tag',
    icon: '🏷️',
    category: 'general',
    svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z"/></svg>'
  }
];

export const CategoryImageManager: React.FC<CategoryImageManagerProps> = ({
  categoryId,
  categoryName = 'Category',
  className,
  onImageUpdate
}) => {
  const [images, setImages] = useState<ImageMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'images' | 'icons'>('images');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedIcon, setSelectedIcon] = useState<IconPreset | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImageMetadata | null>(null);

  // Load category images
  const loadImages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const imageData = await ImageManagementAPI.getEntityImages('category', categoryId, true);
      setImages(imageData);
      onImageUpdate?.(imageData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load images');
    } finally {
      setLoading(false);
    }
  }, [categoryId, onImageUpdate]);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  // Handle icon selection and upload
  const handleIconSelect = async (icon: IconPreset) => {
    try {
      setSelectedIcon(icon);
      
      // Create SVG blob
      const svgBlob = new Blob([icon.svg], { type: 'image/svg+xml' });
      const svgFile = new File([svgBlob], `${icon.name.toLowerCase()}-icon.svg`, { 
        type: 'image/svg+xml' 
      });

      // Upload as category icon
      const result = await ImageManagementAPI.uploadImage(
        svgFile,
        'category',
        categoryId,
        {
          altText: `${icon.name} icon for ${categoryName}`,
          caption: `Category icon: ${icon.name}`,
          isPrimary: images.length === 0
        }
      );

      // Reload images
      await loadImages();
      setSelectedIcon(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload icon');
      setSelectedIcon(null);
    }
  };

  // Handle image selection
  const handleImageSelect = (image: ImageMetadata) => {
    setSelectedImage(image);
  };

  // Handle image view
  const handleImageView = (image: ImageMetadata) => {
    setSelectedImage(image);
    setShowViewer(true);
  };

  // Handle upload complete
  const handleUploadComplete = () => {
    loadImages();
    setShowUpload(false);
  };

  // Filter icons by category
  const iconsByCategory = ICON_PRESETS.reduce((acc, icon) => {
    if (!acc[icon.category]) {
      acc[icon.category] = [];
    }
    acc[icon.category].push(icon);
    return acc;
  }, {} as Record<string, IconPreset[]>);

  // Get primary image for display
  const primaryImage = images.find(img => img.is_primary);
  const hasImages = images.length > 0;

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-0 shadow-lg">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-blue-800 font-medium">Loading category images...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {primaryImage ? (
            <div className="w-12 h-12 rounded-lg overflow-hidden border">
              <img
                src={ImageManagementAPI.getImageUrl(primaryImage.id, 'small', true)}
                alt={primaryImage.alt_text || categoryName}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold">{categoryName} Images</h3>
            <p className="text-sm text-muted-foreground">
              {hasImages ? `${images.length} images` : 'No images uploaded'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
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

          <Button 
            onClick={() => setShowUpload(true)}
            className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Plus className="h-4 w-4 mr-2" />
            Upload Images
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-gradient-to-r from-red-50 to-rose-50 border-0 rounded-lg p-4 shadow-lg">
          <div className="text-red-800 font-medium">{error}</div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadImages}
            className="mt-3 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-300"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'images' | 'icons')}>
        <TabsList className="grid w-full grid-cols-2 bg-gradient-to-r from-green-50 via-teal-50 to-blue-50 p-1 rounded-lg border-0 shadow-lg">
          <TabsTrigger 
            value="images" 
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-green-300 data-[state=active]:text-green-700"
          >
            <ImageIcon className="h-4 w-4" />
            Images ({images.length})
          </TabsTrigger>
          <TabsTrigger 
            value="icons" 
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-blue-300 data-[state=active]:text-blue-700"
          >
            <Shapes className="h-4 w-4" />
            Icon Presets
          </TabsTrigger>
        </TabsList>

        {/* Images Tab */}
        <TabsContent value="images" className="space-y-4">
          {hasImages ? (
            <ImageGallery
              entityType="category"
              entityId={categoryId}
              viewMode={viewMode}
              enableReorder={true}
              enableZoom={true}
              enableFullscreen={true}
              onImageSelect={handleImageSelect}
              onImageUpdate={() => loadImages()}
              onImageDelete={() => loadImages()}
            />
          ) : (
            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-teal-100/50 hover:shadow-xl transition-all duration-300">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                  <ImageIcon className="h-8 w-8 text-white" />
                </div>
                <h4 className="text-lg font-semibold mb-2 text-green-800">No Images</h4>
                <p className="text-green-700/80 mb-4">
                  Upload images or select an icon preset to represent this category
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Button 
                    onClick={() => setShowUpload(true)}
                    className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Images
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveTab('icons')}
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Shapes className="h-4 w-4 mr-2" />
                    Choose Icon
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Icons Tab */}
        <TabsContent value="icons" className="space-y-4">
          <div className="text-sm text-muted-foreground mb-4">
            Select a predefined icon to represent this category. Icons are scalable and perfect for navigation and display.
          </div>

          {Object.entries(iconsByCategory).map(([category, icons]) => (
            <Card key={category} className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-violet-100/50 hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-base capitalize flex items-center gap-2 text-purple-800">
                  <div className="w-6 h-6 rounded bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-md">
                    <Palette className="h-3 w-3 text-white" />
                  </div>
                  {category} Icons
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                  {icons.map((icon) => (
                    <button
                      key={icon.id}
                      className={cn(
                        "aspect-square p-3 rounded-lg border-2 transition-all hover:border-primary hover:shadow-md",
                        "flex flex-col items-center justify-center gap-1",
                        selectedIcon?.id === icon.id 
                          ? "border-primary bg-primary/5" 
                          : "border-muted hover:border-muted-foreground/50"
                      )}
                      onClick={() => handleIconSelect(icon)}
                      disabled={!!selectedIcon}
                    >
                      <div className="text-2xl mb-1">{icon.icon}</div>
                      <div className="text-xs text-center font-medium truncate w-full">
                        {icon.name}
                      </div>
                      {selectedIcon?.id === icon.id && (
                        <div className="absolute inset-0 flex items-center justify-center bg-primary/10 rounded-lg">
                          <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Custom Icon Upload */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-amber-100/50 hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-orange-800">
                <div className="w-6 h-6 rounded bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-md">
                  <Upload className="h-3 w-3 text-white" />
                </div>
                Custom Icon
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-orange-700/80 mb-4">
                Upload your own icon or image to represent this category.
              </p>
              <Button 
                onClick={() => setShowUpload(true)} 
                className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Custom Icon
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upload Dialog */}
      {showUpload && (
        <ImageUpload
          entityType="category"
          entityId={categoryId}
          multiple={true}
          maxFiles={20}
          onUploadComplete={handleUploadComplete}
          onUploadError={(error) => {
            setError(error);
            setShowUpload(false);
          }}
        />
      )}

      {/* Image Viewer */}
      {showViewer && selectedImage && (
        <ImageViewer
          image={selectedImage}
          images={images}
          currentIndex={images.findIndex(img => img.id === selectedImage.id)}
          enableZoom={true}
          enableFullscreen={true}
          enableNavigation={true}
          showMetadata={true}
          showThumbnails={true}
          onClose={() => setShowViewer(false)}
          onImageChange={(index) => setSelectedImage(images[index])}
        />
      )}
    </div>
  );
};

export default CategoryImageManager;