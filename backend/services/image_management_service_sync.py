"""
Synchronous Image Management Service for Real Database Testing

This is a synchronous version of the ImageManagementService specifically designed
for integration testing with the real PostgreSQL database using sync SQLAlchemy.
"""

import os
import uuid
from typing import List, Dict, Optional, Tuple, Any
from pathlib import Path
from PIL import Image, ImageOps
from fastapi import UploadFile, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, update, delete, func
import logging
from datetime import datetime
import json

from models import ImageManagement

logger = logging.getLogger(__name__)

class ImageProcessingError(Exception):
    """Custom exception for image processing errors"""
    pass

class ImageManagementServiceSync:
    """
    Synchronous image management service for real database testing
    """
    
    # Supported image formats
    SUPPORTED_FORMATS = {
        'image/jpeg': '.jpg',
        'image/jpg': '.jpg', 
        'image/png': '.png',
        'image/webp': '.webp'
    }
    
    # Thumbnail sizes for different use cases
    THUMBNAIL_SIZES = {
        'small': (150, 150),
        'medium': (300, 300),
        'large': (600, 600),
        'gallery': (800, 600)
    }
    
    # Maximum file size (10MB)
    MAX_FILE_SIZE = 10 * 1024 * 1024
    
    # Upload directory
    UPLOAD_DIR = Path("uploads/images")
    
    def __init__(self, db_session: Session):
        self.db = db_session
        self._ensure_upload_directories()
    
    def _ensure_upload_directories(self):
        """Ensure all required upload directories exist"""
        try:
            # Create main upload directory
            self.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
            
            # Create subdirectories for different entity types
            for entity_type in ['products', 'categories', 'companies']:
                (self.UPLOAD_DIR / entity_type).mkdir(exist_ok=True)
                (self.UPLOAD_DIR / entity_type / 'thumbnails').mkdir(exist_ok=True)
                (self.UPLOAD_DIR / entity_type / 'optimized').mkdir(exist_ok=True)
                
            logger.info("Upload directories created successfully")
        except Exception as e:
            logger.error(f"Failed to create upload directories: {e}")
            raise ImageProcessingError(f"Failed to create upload directories: {e}")
    
    async def upload_image(
        self,
        file,  # MockUploadFile for testing
        entity_type: str,
        entity_id: str,
        alt_text: Optional[str] = None,
        caption: Optional[str] = None,
        is_primary: bool = False
    ) -> Dict[str, Any]:
        """
        Upload and process image with automatic optimization and thumbnail generation
        """
        try:
            # Validate file
            self._validate_upload_file(file)
            
            # Generate unique filename
            file_extension = self.SUPPORTED_FORMATS.get(file.content_type, '.jpg')
            stored_filename = f"{uuid.uuid4()}{file_extension}"
            
            # Determine file paths
            entity_dir_name = f"{entity_type}s" if entity_type != "category" else "categories"
            entity_dir = self.UPLOAD_DIR / entity_dir_name
            file_path = entity_dir / stored_filename
            
            # Save original file
            self._save_uploaded_file(file, file_path)
            
            # Get image dimensions and metadata
            image_metadata = self._get_image_metadata(file_path)
            
            # Optimize image
            optimization_result = self._optimize_image(file_path, entity_type)
            
            # Generate thumbnails
            thumbnails = self._generate_thumbnails(file_path, entity_type, stored_filename)
            
            # If this is set as primary, unset other primary images for this entity
            if is_primary:
                self._unset_primary_images(entity_type, entity_id)
            
            # Save to database
            image_record = ImageManagement(
                entity_type=entity_type,
                entity_id=uuid.UUID(entity_id),
                original_filename=file.filename,
                stored_filename=stored_filename,
                file_path=str(file_path),
                file_size_bytes=image_metadata['file_size'],
                mime_type=file.content_type,
                image_width=image_metadata['width'],
                image_height=image_metadata['height'],
                thumbnails=thumbnails,
                is_primary=is_primary,
                alt_text=alt_text,
                caption=caption,
                optimization_applied=optimization_result['applied'],
                compression_ratio=optimization_result['compression_ratio'],
                upload_metadata={
                    'upload_timestamp': datetime.utcnow().isoformat(),
                    'original_size': image_metadata['file_size'],
                    'optimized_size': optimization_result['optimized_size'],
                    'thumbnails_generated': len(thumbnails)
                }
            )
            
            self.db.add(image_record)
            self.db.commit()
            self.db.refresh(image_record)
            
            logger.info(f"Image uploaded successfully: {stored_filename} for {entity_type} {entity_id}")
            
            return {
                'success': True,
                'image_id': str(image_record.id),
                'stored_filename': stored_filename,
                'file_path': str(file_path),
                'thumbnails': thumbnails,
                'optimization': optimization_result,
                'metadata': image_metadata
            }
            
        except Exception as e:
            logger.error(f"Image upload failed: {e}")
            self.db.rollback()
            raise ImageProcessingError(f"Image upload failed: {e}")
    
    def _validate_upload_file(self, file):
        """Validate uploaded file format and size"""
        # Check content type
        if file.content_type not in self.SUPPORTED_FORMATS:
            raise ImageProcessingError(
                f"Unsupported file format: {file.content_type}. "
                f"Supported formats: {', '.join(self.SUPPORTED_FORMATS.keys())}"
            )
        
        # Check file size
        file.file.seek(0, 2)  # Seek to end
        file_size = file.file.tell()
        file.file.seek(0)  # Reset to beginning
        
        if file_size > self.MAX_FILE_SIZE:
            raise ImageProcessingError(
                f"File size ({file_size} bytes) exceeds maximum allowed size ({self.MAX_FILE_SIZE} bytes)"
            )
        
        # Check if file has content
        if file_size == 0:
            raise ImageProcessingError("Empty file uploaded")
    
    def _save_uploaded_file(self, file, file_path: Path):
        """Save uploaded file to disk"""
        try:
            with open(file_path, 'wb') as f:
                content = file.file.read()
                f.write(content)
        except Exception as e:
            raise ImageProcessingError(f"Failed to save file: {e}")
    
    def _get_image_metadata(self, file_path: Path) -> Dict[str, Any]:
        """Extract image metadata using PIL"""
        try:
            with Image.open(file_path) as img:
                return {
                    'width': img.width,
                    'height': img.height,
                    'format': img.format,
                    'mode': img.mode,
                    'file_size': file_path.stat().st_size
                }
        except Exception as e:
            raise ImageProcessingError(f"Failed to read image metadata: {e}")
    
    def _optimize_image(self, file_path: Path, entity_type: str) -> Dict[str, Any]:
        """
        Optimize image for web delivery with format conversion and compression
        """
        try:
            entity_dir_name = f"{entity_type}s" if entity_type != "category" else "categories"
            optimized_dir = self.UPLOAD_DIR / entity_dir_name / "optimized"
            optimized_path = optimized_dir / file_path.name
            
            original_size = file_path.stat().st_size
            
            with Image.open(file_path) as img:
                # Convert to RGB if necessary (for JPEG conversion)
                if img.mode in ('RGBA', 'LA', 'P'):
                    # Create white background for transparent images
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'P':
                        img = img.convert('RGBA')
                    background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                    img = background
                
                # Apply optimization based on image size
                quality = 85
                if original_size > 2 * 1024 * 1024:  # > 2MB
                    quality = 75
                elif original_size > 5 * 1024 * 1024:  # > 5MB
                    quality = 65
                
                # Save optimized version
                img.save(
                    optimized_path,
                    format='JPEG',
                    quality=quality,
                    optimize=True,
                    progressive=True
                )
            
            optimized_size = optimized_path.stat().st_size
            compression_ratio = optimized_size / original_size if original_size > 0 else 1.0
            
            return {
                'applied': True,
                'original_size': original_size,
                'optimized_size': optimized_size,
                'compression_ratio': compression_ratio,
                'optimized_path': str(optimized_path),
                'quality': quality
            }
            
        except Exception as e:
            logger.warning(f"Image optimization failed: {e}")
            return {
                'applied': False,
                'original_size': file_path.stat().st_size,
                'optimized_size': file_path.stat().st_size,
                'compression_ratio': 1.0,
                'error': str(e)
            }
    
    def _generate_thumbnails(
        self, 
        file_path: Path, 
        entity_type: str, 
        stored_filename: str
    ) -> Dict[str, Dict[str, Any]]:
        """
        Generate multiple thumbnail sizes with different compression levels
        """
        thumbnails = {}
        entity_dir_name = f"{entity_type}s" if entity_type != "category" else "categories"
        thumbnail_dir = self.UPLOAD_DIR / entity_dir_name / "thumbnails"
        
        try:
            with Image.open(file_path) as img:
                # Convert to RGB if necessary
                if img.mode in ('RGBA', 'LA', 'P'):
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'P':
                        img = img.convert('RGBA')
                    background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                    img = background
                
                for size_name, (width, height) in self.THUMBNAIL_SIZES.items():
                    try:
                        # Create thumbnail with proper aspect ratio
                        thumbnail = img.copy()
                        thumbnail.thumbnail((width, height), Image.Resampling.LANCZOS)
                        
                        # Create new image with exact dimensions and center the thumbnail
                        final_thumbnail = Image.new('RGB', (width, height), (255, 255, 255))
                        
                        # Calculate position to center the thumbnail
                        x = (width - thumbnail.width) // 2
                        y = (height - thumbnail.height) // 2
                        final_thumbnail.paste(thumbnail, (x, y))
                        
                        # Generate thumbnail filename
                        name_without_ext = Path(stored_filename).stem
                        thumbnail_filename = f"{name_without_ext}_{size_name}.jpg"
                        thumbnail_path = thumbnail_dir / thumbnail_filename
                        
                        # Save thumbnail with appropriate quality
                        quality = 90 if size_name in ['large', 'gallery'] else 80
                        final_thumbnail.save(
                            thumbnail_path,
                            format='JPEG',
                            quality=quality,
                            optimize=True
                        )
                        
                        thumbnails[size_name] = {
                            'filename': thumbnail_filename,
                            'path': str(thumbnail_path),
                            'width': width,
                            'height': height,
                            'file_size': thumbnail_path.stat().st_size,
                            'quality': quality
                        }
                        
                    except Exception as e:
                        logger.warning(f"Failed to generate {size_name} thumbnail: {e}")
                        continue
            
            logger.info(f"Generated {len(thumbnails)} thumbnails for {stored_filename}")
            return thumbnails
            
        except Exception as e:
            logger.error(f"Thumbnail generation failed: {e}")
            return {}
    
    def _unset_primary_images(self, entity_type: str, entity_id: str):
        """Unset primary flag for other images of the same entity"""
        try:
            self.db.execute(
                update(ImageManagement)
                .where(
                    ImageManagement.entity_type == entity_type,
                    ImageManagement.entity_id == uuid.UUID(entity_id),
                    ImageManagement.is_primary == True
                )
                .values(is_primary=False)
            )
        except Exception as e:
            logger.warning(f"Failed to unset primary images: {e}")
    
    async def get_entity_images(
        self, 
        entity_type: str, 
        entity_id: str,
        include_thumbnails: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Get all images for a specific entity
        """
        try:
            result = self.db.execute(
                select(ImageManagement)
                .where(
                    ImageManagement.entity_type == entity_type,
                    ImageManagement.entity_id == uuid.UUID(entity_id)
                )
                .order_by(ImageManagement.is_primary.desc(), ImageManagement.sort_order)
            )
            
            images = result.scalars().all()
            
            image_list = []
            for img in images:
                image_data = {
                    'id': str(img.id),
                    'original_filename': img.original_filename,
                    'stored_filename': img.stored_filename,
                    'file_path': img.file_path,
                    'file_size_bytes': img.file_size_bytes,
                    'mime_type': img.mime_type,
                    'image_width': img.image_width,
                    'image_height': img.image_height,
                    'is_primary': img.is_primary,
                    'alt_text': img.alt_text,
                    'caption': img.caption,
                    'sort_order': img.sort_order,
                    'optimization_applied': img.optimization_applied,
                    'compression_ratio': float(img.compression_ratio) if img.compression_ratio else None,
                    'created_at': img.created_at.isoformat() if img.created_at else None,
                    'updated_at': img.updated_at.isoformat() if img.updated_at else None
                }
                
                if include_thumbnails and img.thumbnails:
                    image_data['thumbnails'] = img.thumbnails
                
                image_list.append(image_data)
            
            return image_list
            
        except Exception as e:
            logger.error(f"Failed to get entity images: {e}")
            raise ImageProcessingError(f"Failed to get entity images: {e}")
    
    async def update_image_metadata(
        self,
        image_id: str,
        alt_text: Optional[str] = None,
        caption: Optional[str] = None,
        is_primary: Optional[bool] = None,
        sort_order: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Update image metadata
        """
        try:
            # Get image record
            result = self.db.execute(
                select(ImageManagement).where(ImageManagement.id == uuid.UUID(image_id))
            )
            image = result.scalar_one_or_none()
            
            if not image:
                raise ImageProcessingError(f"Image with ID {image_id} not found")
            
            # If setting as primary, unset other primary images
            if is_primary:
                self._unset_primary_images(image.entity_type, str(image.entity_id))
            
            # Update fields
            update_data = {}
            if alt_text is not None:
                update_data['alt_text'] = alt_text
            if caption is not None:
                update_data['caption'] = caption
            if is_primary is not None:
                update_data['is_primary'] = is_primary
            if sort_order is not None:
                update_data['sort_order'] = sort_order
            
            if update_data:
                update_data['updated_at'] = datetime.utcnow()
                
                self.db.execute(
                    update(ImageManagement)
                    .where(ImageManagement.id == uuid.UUID(image_id))
                    .values(**update_data)
                )
                self.db.commit()
            
            logger.info(f"Image metadata updated for {image_id}")
            
            return {
                'success': True,
                'image_id': image_id,
                'updated_fields': list(update_data.keys())
            }
            
        except Exception as e:
            logger.error(f"Failed to update image metadata: {e}")
            self.db.rollback()
            raise ImageProcessingError(f"Failed to update image metadata: {e}")
    
    async def delete_image(self, image_id: str) -> Dict[str, Any]:
        """
        Delete image and all associated files (original, optimized, thumbnails)
        """
        try:
            # Get image record
            result = self.db.execute(
                select(ImageManagement).where(ImageManagement.id == uuid.UUID(image_id))
            )
            image = result.scalar_one_or_none()
            
            if not image:
                raise ImageProcessingError(f"Image with ID {image_id} not found")
            
            files_deleted = []
            
            # Delete original file
            original_path = Path(image.file_path)
            if original_path.exists():
                original_path.unlink()
                files_deleted.append(str(original_path))
            
            # Delete optimized file
            entity_dir_name = f"{image.entity_type}s" if image.entity_type != "category" else "categories"
            optimized_dir = self.UPLOAD_DIR / entity_dir_name / "optimized"
            optimized_path = optimized_dir / image.stored_filename
            if optimized_path.exists():
                optimized_path.unlink()
                files_deleted.append(str(optimized_path))
            
            # Delete thumbnails
            if image.thumbnails:
                entity_dir_name = f"{image.entity_type}s" if image.entity_type != "category" else "categories"
                thumbnail_dir = self.UPLOAD_DIR / entity_dir_name / "thumbnails"
                for size_name, thumbnail_info in image.thumbnails.items():
                    thumbnail_path = thumbnail_dir / thumbnail_info['filename']
                    if thumbnail_path.exists():
                        thumbnail_path.unlink()
                        files_deleted.append(str(thumbnail_path))
            
            # Delete database record
            self.db.delete(image)
            self.db.commit()
            
            logger.info(f"Image {image_id} deleted successfully")
            
            return {
                'success': True,
                'image_id': image_id,
                'files_deleted': files_deleted
            }
            
        except Exception as e:
            logger.error(f"Failed to delete image: {e}")
            self.db.rollback()
            raise ImageProcessingError(f"Failed to delete image: {e}")
    
    async def get_image_statistics(self) -> Dict[str, Any]:
        """
        Get comprehensive image management statistics
        """
        try:
            # Total images count
            total_result = self.db.execute(
                select(func.count(ImageManagement.id))
            )
            total_images = total_result.scalar()
            
            # Images by entity type
            entity_result = self.db.execute(
                select(
                    ImageManagement.entity_type,
                    func.count(ImageManagement.id).label('count')
                )
                .group_by(ImageManagement.entity_type)
            )
            images_by_entity = {row.entity_type: row.count for row in entity_result}
            
            # Total storage used
            storage_result = self.db.execute(
                select(func.sum(ImageManagement.file_size_bytes))
            )
            total_storage_bytes = storage_result.scalar() or 0
            
            # Optimization statistics
            optimization_result = self.db.execute(
                select(
                    func.count(ImageManagement.id).filter(ImageManagement.optimization_applied == True).label('optimized'),
                    func.avg(ImageManagement.compression_ratio).label('avg_compression')
                )
            )
            optimization_stats = optimization_result.first()
            
            return {
                'total_images': total_images,
                'images_by_entity_type': images_by_entity,
                'total_storage_bytes': total_storage_bytes,
                'total_storage_mb': round(total_storage_bytes / (1024 * 1024), 2),
                'optimized_images': optimization_stats.optimized or 0,
                'average_compression_ratio': float(optimization_stats.avg_compression) if optimization_stats.avg_compression else None,
                'optimization_percentage': round((optimization_stats.optimized / total_images * 100), 2) if total_images > 0 else 0
            }
            
        except Exception as e:
            logger.error(f"Failed to get image statistics: {e}")
            raise ImageProcessingError(f"Failed to get image statistics: {e}")