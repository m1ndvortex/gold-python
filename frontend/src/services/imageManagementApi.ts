/**
 * Image Management API Service
 * 
 * Provides API functions for image upload, management, and retrieval
 */

import axios from 'axios';
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

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/images`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token') || localStorage.getItem('token');
  if (token) {
    if (!config.headers) {
      config.headers = {};
    }
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export class ImageManagementAPI {
  /**
   * Upload single image
   */
  static async uploadImage(
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

    const response = await apiClient.post<UploadImageResponse>('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.data;
  }

  /**
   * Upload multiple images
   */
  static async uploadMultipleImages(
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

    const response = await apiClient.post<{
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
    }>('/upload/multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  /**
   * Get all images for an entity
   */
  static async getEntityImages(
    entityType: EntityType,
    entityId: string,
    includeThumbnails: boolean = true
  ): Promise<ImageMetadata[]> {
    const response = await apiClient.get<GetEntityImagesResponse>(
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
  static getImageUrl(
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
    return `${API_BASE_URL}/api/images/file/${imageId}${queryString ? `?${queryString}` : ''}`;
  }

  /**
   * Update image metadata
   */
  static async updateImageMetadata(
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

    const response = await apiClient.put<UpdateImageMetadataResponse>(
      `/${imageId}/metadata`,
      payload
    );

    return response.data.data;
  }

  /**
   * Delete image
   */
  static async deleteImage(imageId: string): Promise<{
    success: boolean;
    image_id: string;
    files_deleted: string[];
  }> {
    const response = await apiClient.delete<DeleteImageResponse>(`/${imageId}`);
    return response.data.data;
  }

  /**
   * Get image statistics
   */
  static async getImageStatistics(): Promise<{
    total_images: number;
    images_by_entity_type: Record<string, number>;
    total_storage_bytes: number;
    total_storage_mb: number;
    optimized_images: number;
    average_compression_ratio: number;
    optimization_percentage: number;
  }> {
    const response = await apiClient.get<ImageStatisticsResponse>('/statistics');
    return response.data.data;
  }

  /**
   * Re-optimize image
   */
  static async reoptimizeImage(
    imageId: string,
    quality: number = 85
  ): Promise<any> {
    const response = await apiClient.post(`/optimize/${imageId}`, null, {
      params: { quality },
    });
    return response.data;
  }

  /**
   * Regenerate thumbnails
   */
  static async regenerateThumbnails(
    imageId: string,
    sizes?: string[]
  ): Promise<any> {
    const response = await apiClient.post(`/regenerate-thumbnails/${imageId}`, null, {
      params: sizes ? { sizes } : {},
    });
    return response.data;
  }
}

export default ImageManagementAPI;