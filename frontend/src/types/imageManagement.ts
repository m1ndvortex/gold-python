/**
 * Image Management Types
 * 
 * Type definitions for image gallery, viewer, and management functionality
 */

export interface ImageMetadata {
  id: string;
  original_filename: string;
  stored_filename: string;
  file_path: string;
  file_size_bytes: number;
  mime_type: string;
  image_width: number;
  image_height: number;
  is_primary: boolean;
  alt_text?: string;
  caption?: string;
  sort_order: number;
  optimization_applied: boolean;
  compression_ratio?: number;
  created_at: string;
  updated_at: string;
  thumbnails?: Record<string, ThumbnailInfo>;
}

export interface ThumbnailInfo {
  filename: string;
  path: string;
  width: number;
  height: number;
  file_size: number;
  quality: number;
}

export interface ImageUploadResult {
  success: boolean;
  image_id: string;
  stored_filename: string;
  file_path: string;
  thumbnails: Record<string, ThumbnailInfo>;
  optimization: OptimizationResult;
  metadata: ImageFileMetadata;
}

export interface OptimizationResult {
  applied: boolean;
  original_size: number;
  optimized_size: number;
  compression_ratio: number;
  optimized_path?: string;
  quality?: number;
  error?: string;
}

export interface ImageFileMetadata {
  width: number;
  height: number;
  format: string;
  mode: string;
  file_size: number;
}

export interface ImageGalleryProps {
  entityType: 'product' | 'category' | 'company' | 'customer';
  entityId: string;
  viewMode?: 'grid' | 'list';
  enableReorder?: boolean;
  enableZoom?: boolean;
  enableFullscreen?: boolean;
  maxImages?: number;
  onImageSelect?: (image: ImageMetadata) => void;
  onImageUpdate?: (imageId: string, updates: Partial<ImageMetadata>) => void;
  onImageDelete?: (imageId: string) => void;
  className?: string;
}

export interface ImageViewerProps {
  image: ImageMetadata;
  images?: ImageMetadata[];
  currentIndex?: number;
  enableZoom?: boolean;
  enableFullscreen?: boolean;
  enableNavigation?: boolean;
  showMetadata?: boolean;
  showThumbnails?: boolean;
  onClose?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onImageChange?: (index: number) => void;
  className?: string;
}

export interface ImageUploadProps {
  entityType: 'product' | 'category' | 'company' | 'customer';
  entityId: string;
  multiple?: boolean;
  maxFiles?: number;
  onUploadComplete?: (results: ImageUploadResult[]) => void;
  onUploadError?: (error: string) => void;
  className?: string;
}

export interface ImageGalleryState {
  images: ImageMetadata[];
  loading: boolean;
  error: string | null;
  selectedImage: ImageMetadata | null;
  viewMode: 'grid' | 'list';
  sortBy: 'created_at' | 'sort_order' | 'name';
  sortOrder: 'asc' | 'desc';
}

export interface ImageViewerState {
  currentIndex: number;
  zoomLevel: number;
  isFullscreen: boolean;
  showMetadata: boolean;
  showThumbnails: boolean;
  isLoading: boolean;
}

export interface CategoryImageConfig {
  allowIcons: boolean;
  iconSizes: string[];
  maxIconSize: number;
  supportedFormats: string[];
  defaultIcon?: string;
}

export interface ImageStatistics {
  total_images: number;
  images_by_entity_type: Record<string, number>;
  total_storage_bytes: number;
  total_storage_mb: number;
  optimized_images: number;
  average_compression_ratio: number;
  optimization_percentage: number;
}

export interface ImageManagementError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// API Response Types
export interface GetEntityImagesResponse {
  message: string;
  data: ImageMetadata[];
}

export interface UploadImageResponse {
  message: string;
  data: ImageUploadResult;
}

export interface UpdateImageMetadataResponse {
  message: string;
  data: {
    success: boolean;
    image_id: string;
    updated_fields: string[];
  };
}

export interface DeleteImageResponse {
  message: string;
  data: {
    success: boolean;
    image_id: string;
    files_deleted: string[];
  };
}

export interface ImageStatisticsResponse {
  message: string;
  data: ImageStatistics;
}

// Utility Types
export type ImageSize = 'small' | 'medium' | 'large' | 'gallery' | 'original';
export type ViewMode = 'grid' | 'list';
export type SortBy = 'created_at' | 'sort_order' | 'name' | 'size';
export type SortOrder = 'asc' | 'desc';
export type EntityType = 'product' | 'category' | 'company' | 'customer';