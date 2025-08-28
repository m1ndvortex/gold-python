/**
 * Image Management API Service
 * 
 * Provides API functions for image upload, management, and retrieval
 */

import { AuthenticatedApiClient } from './AuthenticatedApiClient';
import {
  ImageMetadata,
  ImageUploadResult,
  GetEntityImagesResponse,
  UploadImageResponse,
  UpdateImageMetadataResponse,
  DeleteImageResponse,
  ImageStatisticsResponse,
  EntityType
} from '../types/imageManagement';

class ImageManagementApiService extends AuthenticatedApiClient {
  constructor() {
    super({
      baseURL: '/api/images',
      timeout: 60000, // 60 second timeout for image uploads
      retryAttempts: 1, // Don't retry image uploads
    });
  }
  /**
   * Upload single image
   */
  async uploadImage(
    file: File,
    entityType: EntityType,
    entityId: string,
    options: {
      altText?: string;
      caption?: string;
      isPrimary?: boolean;
    } = {}
  ): Promise<ImageUploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entity_type', entityType);
    formData.append('entity_id', entityId);
    
    if (options.altText) {
      formData.append('alt_text', options.altText);
    }
    if (options.caption) {
      formData.append('caption', options.caption);
    }
    if (options.isPrimary !== undefined) {
      formData.append('is_primary', options.isPrimary.toString());
    }

    const response = await this.axiosInstance.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.data;
  }

  /**
   * Upload multiple images
   */
  async uploadMultipleImages(
    files: File[],
    entityType: EntityType,
    entityId: string
  ): Promise<{
    results: Array<{
      filename: string;
      success: boolean;
      data?: ImageUploadResult;
      error?: string;
    }>;
    summary: {
      total_files: number;
      successful: number;
      failed: number;
    };
  }> {
    const formData = new FormData();
    
    files.forEach((file) => {
      formData.append('files', file);
    });
    formData.append('entity_type', entityType);
    formData.append('entity_id', entityId);

    const response = await this.axiosInstance.post('/upload/multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  /**
   * Get all images for an entity
   */
  async getEntityImages(
    entityType: EntityType,
    entityId: string,
    includeThumbnails: boolean = true
  ): Promise<ImageMetadata[]> {
    const response = await this.axiosInstance.get(
      `/entity/${entityType}/${entityId}`,
      {
        params: {
          include_thumbnails: includeThumbnails,
        },
      }
    );

    return response.data.data;
  }

  /**
   * Get image file URL
   */
  getImageUrl(
    imageId: string,
    size?: 'small' | 'medium' | 'large' | 'gallery' | 'original',
    optimized: boolean = false
  ): string {
    const params = new URLSearchParams();
    if (size) {
      params.append('size', size);
    }
    if (optimized) {
      params.append('optimized', 'true');
    }

    const queryString = params.toString();
    return `/api/images/file/${imageId}${queryString ? `?${queryString}` : ''}`;
  }

  /**
   * Update image metadata
   */
  async updateImageMetadata(
    imageId: string,
    updates: {
      altText?: string;
      caption?: string;
      isPrimary?: boolean;
      sortOrder?: number;
    }
  ): Promise<{
    success: boolean;
    image_id: string;
    updated_fields: string[];
  }> {
    const payload: Record<string, any> = {};
    
    if (updates.altText !== undefined) {
      payload.alt_text = updates.altText;
    }
    if (updates.caption !== undefined) {
      payload.caption = updates.caption;
    }
    if (updates.isPrimary !== undefined) {
      payload.is_primary = updates.isPrimary;
    }
    if (updates.sortOrder !== undefined) {
      payload.sort_order = updates.sortOrder;
    }

    const response = await this.axiosInstance.put(
      `/${imageId}/metadata`,
      payload
    );

    return response.data.data;
  }

  /**
   * Delete image
   */
  async deleteImage(imageId: string): Promise<{
    success: boolean;
    image_id: string;
    files_deleted: string[];
  }> {
    const response = await this.axiosInstance.delete(`/${imageId}`);
    return response.data.data;
  }

  /**
   * Get image statistics
   */
  async getImageStatistics(): Promise<{
    total_images: number;
    images_by_entity_type: Record<string, number>;
    total_storage_bytes: number;
    total_storage_mb: number;
    optimized_images: number;
    average_compression_ratio: number;
    optimization_percentage: number;
  }> {
    const response = await this.axiosInstance.get('/statistics');
    return response.data.data;
  }

  /**
   * Re-optimize image
   */
  async reoptimizeImage(
    imageId: string,
    quality: number = 85
  ): Promise<any> {
    const response = await this.axiosInstance.post(`/optimize/${imageId}`, null, {
      params: { quality },
    });
    return response.data;
  }

  /**
   * Regenerate thumbnails
   */
  async regenerateThumbnails(
    imageId: string,
    sizes?: string[]
  ): Promise<any> {
    const response = await this.axiosInstance.post(`/regenerate-thumbnails/${imageId}`, null, {
      params: sizes ? { sizes } : {},
    });
    return response.data;
  }
}

// Create singleton instance
const imageManagementApiService = new ImageManagementApiService();

// Export the service instance
export const imageManagementApi = imageManagementApiService;

// Export the class for backward compatibility
export class ImageManagementAPI {
  static uploadImage = (
    file: File,
    entityType: EntityType,
    entityId: string,
    options: {
      altText?: string;
      caption?: string;
      isPrimary?: boolean;
    } = {}
  ) => imageManagementApiService.uploadImage(file, entityType, entityId, options);

  static uploadMultipleImages = (
    files: File[],
    entityType: EntityType,
    entityId: string
  ) => imageManagementApiService.uploadMultipleImages(files, entityType, entityId);

  static getEntityImages = (
    entityType: EntityType,
    entityId: string,
    includeThumbnails: boolean = true
  ) => imageManagementApiService.getEntityImages(entityType, entityId, includeThumbnails);

  static getImageUrl = (
    imageId: string,
    size?: 'small' | 'medium' | 'large' | 'gallery' | 'original',
    optimized: boolean = false
  ) => imageManagementApiService.getImageUrl(imageId, size, optimized);

  static updateImageMetadata = (
    imageId: string,
    updates: {
      altText?: string;
      caption?: string;
      isPrimary?: boolean;
      sortOrder?: number;
    }
  ) => imageManagementApiService.updateImageMetadata(imageId, updates);

  static deleteImage = (imageId: string) => imageManagementApiService.deleteImage(imageId);

  static getImageStatistics = () => imageManagementApiService.getImageStatistics();

  static reoptimizeImage = (imageId: string, quality: number = 85) => 
    imageManagementApiService.reoptimizeImage(imageId, quality);

  static regenerateThumbnails = (imageId: string, sizes?: string[]) => 
    imageManagementApiService.regenerateThumbnails(imageId, sizes);
}

export default ImageManagementAPI;