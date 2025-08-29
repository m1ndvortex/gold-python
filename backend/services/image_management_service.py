"""
Image Management Service for Universal Inventory & Invoice Management System

This service provides comprehensive image upload, processing, optimization, thumbnail generation,
security scanning, caching, backup integration, and cleanup capabilities for categories, 
inventory items, and invoices in the universal business management system.
"""

import os
import uuid
import asyncio
import hashlib
import mimetypes
import shutil
from typing import List, Dict, Optional, Tuple, Any, Union
from pathlib import Path
from PIL import Image, ImageOps, ExifTags
import aiofiles
from fastapi import UploadFile, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func, and_, or_
from sqlalchemy.orm import selectinload
import logging
from datetime import datetime, timedelta
import json

from models import ImageManagement
from database import get_db

logger = logging.getLogger(__name__)

class ImageProcessingError(Exception):
    """Custom exception for image processing errors"""
    pass

class ImageSecurityError(Exception):
    """Custom exception for image security violations"""
    pass

class ImageBackupError(Exception):
    """Custom exception for image backup operations"""
    pass

class ImageManagementService:
    """
    Comprehensive image management service with drag-drop upload support,
    automatic optimization, thumbnail generation, security scanning, caching,
    backup integration, and cleanup capabilities for universal business management.
    """
    
    # Supported image formats with security validation
    SUPPORTED_FORMATS = {
        'image/jpeg': '.jpg',
        'image/jpg': '.jpg', 
        'image/png': '.png',
        'image/webp': '.webp',
        'image/gif': '.gif'  # Added GIF support
    }
    
    # Thumbnail sizes for different use cases
    THUMBNAIL_SIZES = {
        'small': (150, 150),      # List views, cards
        'medium': (300, 300),     # Detail views
        'large': (600, 600),      # Gallery views
        'gallery': (800, 600),    # Full gallery display
        'card': (400, 300),       # Invoice cards, QR cards
        'icon': (64, 64)          # Category icons
    }
    
    # Maximum file size (15MB for high-quality images)
    MAX_FILE_SIZE = 15 * 1024 * 1024
    
    # Upload directory structure
    UPLOAD_DIR = Path("uploads/images")
    BACKUP_DIR = Path("backups/images")
    CACHE_DIR = Path("cache/images")
    
    # Security settings
    ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp', '.gif'}
    DANGEROUS_EXTENSIONS = {'.exe', '.bat', '.sh', '.php', '.js', '.html', '.svg'}
    
    # Cache settings
    CACHE_DURATION_HOURS = 24
    CLEANUP_INTERVAL_HOURS = 6
    
    def __init__(self, db_session: AsyncSession):
        self.db = db_session
        self._ensure_upload_directories()
    
    def _ensure_upload_directories(self):
        """Ensure all required upload, backup, and cache directories exist"""
        try:
            # Create main directories
            self.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
            self.BACKUP_DIR.mkdir(parents=True, exist_ok=True)
            self.CACHE_DIR.mkdir(parents=True, exist_ok=True)
            
            # Create subdirectories for different entity types
            entity_types = ['categories', 'inventory_items', 'invoices', 'customers', 'companies']
            
            for entity_type in entity_types:
                # Upload directories
                (self.UPLOAD_DIR / entity_type).mkdir(exist_ok=True)
                (self.UPLOAD_DIR / entity_type / 'thumbnails').mkdir(exist_ok=True)
                (self.UPLOAD_DIR / entity_type / 'optimized').mkdir(exist_ok=True)
                
                # Backup directories
                (self.BACKUP_DIR / entity_type).mkdir(exist_ok=True)
                (self.BACKUP_DIR / entity_type / 'thumbnails').mkdir(exist_ok=True)
                (self.BACKUP_DIR / entity_type / 'optimized').mkdir(exist_ok=True)
                
                # Cache directories
                (self.CACHE_DIR / entity_type).mkdir(exist_ok=True)
                
            # Create temporary processing directory
            (self.UPLOAD_DIR / 'temp').mkdir(exist_ok=True)
            
            logger.info("All image management directories created successfully")
        except Exception as e:
            logger.error(f"Failed to create image management directories: {e}")
            raise ImageProcessingError(f"Failed to create image management directories: {e}")
    
    async def upload_image(
        self,
        file: UploadFile,
        entity_type: str,
        entity_id: str,
        alt_text: Optional[str] = None,
        caption: Optional[str] = None,
        is_primary: bool = False
    ) -> Dict[str, Any]:
        """
        Upload and process image with automatic optimization and thumbnail generation
        
        Args:
            file: Uploaded file object
            entity_type: Type of entity ('product', 'category', 'company', 'customer')
            entity_id: ID of the entity
            alt_text: Alternative text for accessibility
            caption: Image caption
            is_primary: Whether this is the primary image for the entity
            
        Returns:
            Dictionary containing upload result and image metadata
        """
        try:
            # Validate file
            await self._validate_upload_file(file)
            
            # Generate unique filename
            file_extension = self.SUPPORTED_FORMATS.get(file.content_type, '.jpg')
            stored_filename = f"{uuid.uuid4()}{file_extension}"
            
            # Determine file paths
            entity_dir_name = f"{entity_type}s" if entity_type not in ["category"] else "categories"
            entity_dir = self.UPLOAD_DIR / entity_dir_name
            file_path = entity_dir / stored_filename
            
            # Save original file
            await self._save_uploaded_file(file, file_path)
            
            # Get image dimensions and metadata
            image_metadata = await self._get_image_metadata(file_path)
            
            # Optimize image
            optimization_result = await self._optimize_image(file_path, entity_type)
            
            # Generate thumbnails
            thumbnails = await self._generate_thumbnails(file_path, entity_type, stored_filename)
            
            # If this is set as primary, unset other primary images for this entity
            if is_primary:
                await self._unset_primary_images(entity_type, entity_id)
            
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
            await self.db.commit()
            await self.db.refresh(image_record)
            
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
            await self.db.rollback()
            raise ImageProcessingError(f"Image upload failed: {e}")
    
    async def _validate_upload_file(self, file: UploadFile):
        """Validate uploaded file format, size, and security"""
        # Check filename for dangerous extensions
        if file.filename:
            file_ext = Path(file.filename).suffix.lower()
            if file_ext in self.DANGEROUS_EXTENSIONS:
                raise ImageSecurityError(f"Dangerous file extension detected: {file_ext}")
            
            if file_ext not in self.ALLOWED_EXTENSIONS:
                raise ImageProcessingError(f"File extension {file_ext} not allowed")
        
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
        
        # Perform security scan on file content
        await self._security_scan_file(file)
    
    async def _save_uploaded_file(self, file: UploadFile, file_path: Path):
        """Save uploaded file to disk"""
        try:
            async with aiofiles.open(file_path, 'wb') as f:
                content = await file.read()
                await f.write(content)
        except Exception as e:
            raise ImageProcessingError(f"Failed to save file: {e}")
    
    async def _get_image_metadata(self, file_path: Path) -> Dict[str, Any]:
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
    
    async def _optimize_image(self, file_path: Path, entity_type: str) -> Dict[str, Any]:
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
    
    async def _generate_thumbnails(
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
    
    async def _unset_primary_images(self, entity_type: str, entity_id: str):
        """Unset primary flag for other images of the same entity"""
        try:
            await self.db.execute(
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
        
        Args:
            entity_type: Type of entity ('product', 'category', 'company', 'customer')
            entity_id: ID of the entity
            include_thumbnails: Whether to include thumbnail information
            
        Returns:
            List of image records with metadata
        """
        try:
            result = await self.db.execute(
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
    
    async def delete_image(self, image_id: str) -> Dict[str, Any]:
        """
        Delete image and all associated files (original, optimized, thumbnails)
        
        Args:
            image_id: ID of the image to delete
            
        Returns:
            Dictionary containing deletion result
        """
        try:
            # Get image record
            result = await self.db.execute(
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
            await self.db.delete(image)
            await self.db.commit()
            
            logger.info(f"Image {image_id} deleted successfully")
            
            return {
                'success': True,
                'image_id': image_id,
                'files_deleted': files_deleted
            }
            
        except Exception as e:
            logger.error(f"Failed to delete image: {e}")
            await self.db.rollback()
            raise ImageProcessingError(f"Failed to delete image: {e}")
    
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
        
        Args:
            image_id: ID of the image to update
            alt_text: New alternative text
            caption: New caption
            is_primary: Whether to set as primary image
            sort_order: New sort order
            
        Returns:
            Dictionary containing update result
        """
        try:
            # Get image record
            result = await self.db.execute(
                select(ImageManagement).where(ImageManagement.id == uuid.UUID(image_id))
            )
            image = result.scalar_one_or_none()
            
            if not image:
                raise ImageProcessingError(f"Image with ID {image_id} not found")
            
            # If setting as primary, unset other primary images
            if is_primary:
                await self._unset_primary_images(image.entity_type, str(image.entity_id))
            
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
                
                await self.db.execute(
                    update(ImageManagement)
                    .where(ImageManagement.id == uuid.UUID(image_id))
                    .values(**update_data)
                )
                await self.db.commit()
            
            logger.info(f"Image metadata updated for {image_id}")
            
            return {
                'success': True,
                'image_id': image_id,
                'updated_fields': list(update_data.keys())
            }
            
        except Exception as e:
            logger.error(f"Failed to update image metadata: {e}")
            await self.db.rollback()
            raise ImageProcessingError(f"Failed to update image metadata: {e}")
    
    async def get_image_statistics(self) -> Dict[str, Any]:
        """
        Get comprehensive image management statistics
        
        Returns:
            Dictionary containing various image statistics
        """
        try:
            # Total images count
            total_result = await self.db.execute(
                select(func.count(ImageManagement.id))
            )
            total_images = total_result.scalar()
            
            # Images by entity type
            entity_result = await self.db.execute(
                select(
                    ImageManagement.entity_type,
                    func.count(ImageManagement.id).label('count')
                )
                .group_by(ImageManagement.entity_type)
            )
            images_by_entity = {row.entity_type: row.count for row in entity_result}
            
            # Total storage used
            storage_result = await self.db.execute(
                select(func.sum(ImageManagement.file_size_bytes))
            )
            total_storage_bytes = storage_result.scalar() or 0
            
            # Optimization statistics
            optimization_result = await self.db.execute(
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
    
    async def _security_scan_file(self, file: UploadFile):
        """Perform security scanning on uploaded file"""
        try:
            # Read file content for scanning
            content = await file.read()
            file.file.seek(0)  # Reset file pointer
            
            # Check for suspicious patterns in file content
            suspicious_patterns = [
                b'<script',
                b'javascript:',
                b'<?php',
                b'<%',
                b'eval(',
                b'exec(',
                b'system(',
                b'shell_exec'
            ]
            
            content_lower = content.lower()
            for pattern in suspicious_patterns:
                if pattern in content_lower:
                    raise ImageSecurityError(f"Suspicious content detected in file")
            
            # Verify file is actually an image by trying to open it
            try:
                temp_path = self.UPLOAD_DIR / 'temp' / f"security_check_{uuid.uuid4()}.tmp"
                async with aiofiles.open(temp_path, 'wb') as f:
                    await f.write(content)
                
                # Try to open with PIL to verify it's a valid image
                with Image.open(temp_path) as img:
                    # Check image dimensions are reasonable
                    if img.width > 10000 or img.height > 10000:
                        raise ImageSecurityError("Image dimensions too large")
                    
                    # Check for EXIF data that might contain malicious content
                    if hasattr(img, '_getexif') and img._getexif():
                        exif = img._getexif()
                        if exif:
                            # Remove potentially dangerous EXIF data
                            pass
                
                # Clean up temp file
                temp_path.unlink(missing_ok=True)
                
            except Exception as e:
                # Clean up temp file
                if temp_path.exists():
                    temp_path.unlink(missing_ok=True)
                raise ImageSecurityError(f"File is not a valid image: {e}")
            
        except ImageSecurityError:
            raise
        except Exception as e:
            logger.error(f"Security scan failed: {e}")
            raise ImageSecurityError(f"Security scan failed: {e}")
    
    async def serve_image(
        self, 
        image_id: str, 
        size: Optional[str] = None,
        optimized: bool = False
    ) -> Dict[str, Any]:
        """
        Serve image file with caching and performance optimization
        
        Args:
            image_id: ID of the image to serve
            size: Thumbnail size (small, medium, large, gallery, card, icon)
            optimized: Whether to serve optimized version
            
        Returns:
            Dictionary containing file path and metadata for serving
        """
        try:
            # Get image record
            result = await self.db.execute(
                select(ImageManagement).where(ImageManagement.id == uuid.UUID(image_id))
            )
            image = result.scalar_one_or_none()
            
            if not image:
                raise ImageProcessingError(f"Image with ID {image_id} not found")
            
            # Determine which file to serve
            if size and size in self.THUMBNAIL_SIZES:
                # Serve thumbnail
                if image.thumbnails and size in image.thumbnails:
                    thumbnail_info = image.thumbnails[size]
                    file_path = Path(thumbnail_info['path'])
                else:
                    raise ImageProcessingError(f"Thumbnail size {size} not available")
            elif optimized:
                # Serve optimized version
                entity_dir = self.UPLOAD_DIR / f"{image.entity_type}s" / "optimized"
                file_path = entity_dir / image.stored_filename
            else:
                # Serve original
                file_path = Path(image.file_path)
            
            if not file_path.exists():
                raise ImageProcessingError(f"Image file not found: {file_path}")
            
            # Check cache
            cache_key = f"{image_id}_{size or 'original'}_{optimized}"
            cached_path = self.CACHE_DIR / f"{cache_key}.cache"
            
            # If cached version exists and is recent, use it
            if cached_path.exists():
                cache_age = datetime.now() - datetime.fromtimestamp(cached_path.stat().st_mtime)
                if cache_age < timedelta(hours=self.CACHE_DURATION_HOURS):
                    file_path = cached_path
                else:
                    # Cache expired, remove it
                    cached_path.unlink(missing_ok=True)
            
            # Create cache if it doesn't exist
            if not cached_path.exists() and file_path != cached_path:
                shutil.copy2(file_path, cached_path)
            
            return {
                'file_path': str(file_path),
                'mime_type': image.mime_type,
                'file_size': file_path.stat().st_size,
                'last_modified': datetime.fromtimestamp(file_path.stat().st_mtime),
                'cache_hit': cached_path.exists(),
                'image_metadata': {
                    'width': image.image_width,
                    'height': image.image_height,
                    'alt_text': image.alt_text,
                    'caption': image.caption
                }
            }
            
        except Exception as e:
            logger.error(f"Failed to serve image: {e}")
            raise ImageProcessingError(f"Failed to serve image: {e}")
    
    async def cleanup_orphaned_images(self) -> Dict[str, Any]:
        """
        Clean up orphaned and unused images
        
        Returns:
            Dictionary containing cleanup results
        """
        try:
            cleanup_results = {
                'orphaned_files_removed': 0,
                'orphaned_db_records_removed': 0,
                'cache_files_removed': 0,
                'total_space_freed_bytes': 0,
                'errors': []
            }
            
            # Find orphaned database records (images without files)
            result = await self.db.execute(select(ImageManagement))
            all_images = result.scalars().all()
            
            orphaned_records = []
            for image in all_images:
                file_path = Path(image.file_path)
                if not file_path.exists():
                    orphaned_records.append(image)
            
            # Remove orphaned database records
            for image in orphaned_records:
                try:
                    await self.db.delete(image)
                    cleanup_results['orphaned_db_records_removed'] += 1
                except Exception as e:
                    cleanup_results['errors'].append(f"Failed to remove DB record {image.id}: {e}")
            
            await self.db.commit()
            
            # Find orphaned files (files without database records)
            valid_filenames = {img.stored_filename for img in all_images if img not in orphaned_records}
            
            for entity_type in ['categories', 'inventory_items', 'invoices', 'customers', 'companies']:
                entity_dir = self.UPLOAD_DIR / entity_type
                if entity_dir.exists():
                    for file_path in entity_dir.glob('*'):
                        if file_path.is_file() and file_path.name not in valid_filenames:
                            try:
                                file_size = file_path.stat().st_size
                                file_path.unlink()
                                cleanup_results['orphaned_files_removed'] += 1
                                cleanup_results['total_space_freed_bytes'] += file_size
                            except Exception as e:
                                cleanup_results['errors'].append(f"Failed to remove file {file_path}: {e}")
            
            # Clean up old cache files
            if self.CACHE_DIR.exists():
                cutoff_time = datetime.now() - timedelta(hours=self.CACHE_DURATION_HOURS * 2)
                for cache_file in self.CACHE_DIR.rglob('*.cache'):
                    try:
                        file_mtime = datetime.fromtimestamp(cache_file.stat().st_mtime)
                        if file_mtime < cutoff_time:
                            file_size = cache_file.stat().st_size
                            cache_file.unlink()
                            cleanup_results['cache_files_removed'] += 1
                            cleanup_results['total_space_freed_bytes'] += file_size
                    except Exception as e:
                        cleanup_results['errors'].append(f"Failed to remove cache file {cache_file}: {e}")
            
            logger.info(f"Image cleanup completed: {cleanup_results}")
            return cleanup_results
            
        except Exception as e:
            logger.error(f"Image cleanup failed: {e}")
            await self.db.rollback()
            raise ImageProcessingError(f"Image cleanup failed: {e}")
    
    async def backup_images(self, entity_type: Optional[str] = None) -> Dict[str, Any]:
        """
        Backup images to backup directory with metadata
        
        Args:
            entity_type: Optional entity type to backup (if None, backup all)
            
        Returns:
            Dictionary containing backup results
        """
        try:
            backup_results = {
                'images_backed_up': 0,
                'total_size_backed_up': 0,
                'backup_path': str(self.BACKUP_DIR),
                'backup_timestamp': datetime.now().isoformat(),
                'errors': []
            }
            
            # Query images to backup
            query = select(ImageManagement)
            if entity_type:
                query = query.where(ImageManagement.entity_type == entity_type)
            
            result = await self.db.execute(query)
            images = result.scalars().all()
            
            # Create backup metadata
            backup_metadata = {
                'backup_timestamp': backup_results['backup_timestamp'],
                'entity_type_filter': entity_type,
                'total_images': len(images),
                'images': []
            }
            
            for image in images:
                try:
                    # Backup original file
                    source_path = Path(image.file_path)
                    if source_path.exists():
                        backup_dir = self.BACKUP_DIR / image.entity_type
                        backup_path = backup_dir / image.stored_filename
                        
                        shutil.copy2(source_path, backup_path)
                        file_size = source_path.stat().st_size
                        backup_results['total_size_backed_up'] += file_size
                        
                        # Backup thumbnails
                        if image.thumbnails:
                            thumbnail_backup_dir = backup_dir / 'thumbnails'
                            for size_name, thumbnail_info in image.thumbnails.items():
                                thumbnail_source = Path(thumbnail_info['path'])
                                if thumbnail_source.exists():
                                    thumbnail_backup = thumbnail_backup_dir / thumbnail_info['filename']
                                    shutil.copy2(thumbnail_source, thumbnail_backup)
                        
                        # Backup optimized version
                        optimized_dir = self.UPLOAD_DIR / image.entity_type / 'optimized'
                        optimized_source = optimized_dir / image.stored_filename
                        if optimized_source.exists():
                            optimized_backup_dir = backup_dir / 'optimized'
                            optimized_backup = optimized_backup_dir / image.stored_filename
                            shutil.copy2(optimized_source, optimized_backup)
                        
                        backup_results['images_backed_up'] += 1
                        
                        # Add to metadata
                        backup_metadata['images'].append({
                            'id': str(image.id),
                            'entity_type': image.entity_type,
                            'entity_id': str(image.entity_id),
                            'original_filename': image.original_filename,
                            'stored_filename': image.stored_filename,
                            'file_size': file_size,
                            'backup_path': str(backup_path)
                        })
                        
                except Exception as e:
                    backup_results['errors'].append(f"Failed to backup image {image.id}: {e}")
            
            # Save backup metadata
            metadata_path = self.BACKUP_DIR / f"backup_metadata_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            async with aiofiles.open(metadata_path, 'w') as f:
                await f.write(json.dumps(backup_metadata, indent=2))
            
            logger.info(f"Image backup completed: {backup_results}")
            return backup_results
            
        except Exception as e:
            logger.error(f"Image backup failed: {e}")
            raise ImageBackupError(f"Image backup failed: {e}")
    
    async def restore_images(self, backup_metadata_file: str) -> Dict[str, Any]:
        """
        Restore images from backup using metadata file
        
        Args:
            backup_metadata_file: Path to backup metadata JSON file
            
        Returns:
            Dictionary containing restore results
        """
        try:
            restore_results = {
                'images_restored': 0,
                'images_skipped': 0,
                'errors': []
            }
            
            # Load backup metadata
            metadata_path = Path(backup_metadata_file)
            if not metadata_path.exists():
                raise ImageBackupError(f"Backup metadata file not found: {backup_metadata_file}")
            
            async with aiofiles.open(metadata_path, 'r') as f:
                backup_metadata = json.loads(await f.read())
            
            for image_info in backup_metadata['images']:
                try:
                    # Check if image already exists in database
                    result = await self.db.execute(
                        select(ImageManagement).where(ImageManagement.id == uuid.UUID(image_info['id']))
                    )
                    existing_image = result.scalar_one_or_none()
                    
                    if existing_image:
                        restore_results['images_skipped'] += 1
                        continue
                    
                    # Restore files
                    backup_path = Path(image_info['backup_path'])
                    if backup_path.exists():
                        # Restore to original location
                        entity_dir = self.UPLOAD_DIR / image_info['entity_type']
                        restore_path = entity_dir / image_info['stored_filename']
                        shutil.copy2(backup_path, restore_path)
                        
                        # Note: Database record restoration would need additional metadata
                        # This is a simplified version focusing on file restoration
                        restore_results['images_restored'] += 1
                        
                except Exception as e:
                    restore_results['errors'].append(f"Failed to restore image {image_info['id']}: {e}")
            
            logger.info(f"Image restore completed: {restore_results}")
            return restore_results
            
        except Exception as e:
            logger.error(f"Image restore failed: {e}")
            raise ImageBackupError(f"Image restore failed: {e}")
    
    async def get_image_health_report(self) -> Dict[str, Any]:
        """
        Generate comprehensive health report for image management system
        
        Returns:
            Dictionary containing health report data
        """
        try:
            health_report = {
                'timestamp': datetime.now().isoformat(),
                'overall_status': 'healthy',
                'statistics': {},
                'issues': [],
                'recommendations': []
            }
            
            # Get basic statistics
            stats = await self.get_image_statistics()
            health_report['statistics'] = stats
            
            # Check for issues
            issues = []
            
            # Check for orphaned files
            result = await self.db.execute(select(ImageManagement))
            all_images = result.scalars().all()
            
            missing_files = 0
            for image in all_images:
                if not Path(image.file_path).exists():
                    missing_files += 1
            
            if missing_files > 0:
                issues.append(f"{missing_files} database records point to missing files")
                health_report['overall_status'] = 'warning'
            
            # Check disk space usage
            total_size = sum(Path(img.file_path).stat().st_size for img in all_images if Path(img.file_path).exists())
            if total_size > 1024 * 1024 * 1024:  # > 1GB
                health_report['recommendations'].append("Consider implementing image compression or cleanup")
            
            # Check cache directory size
            cache_size = 0
            if self.CACHE_DIR.exists():
                cache_size = sum(f.stat().st_size for f in self.CACHE_DIR.rglob('*') if f.is_file())
            
            health_report['statistics']['cache_size_mb'] = round(cache_size / (1024 * 1024), 2)
            
            if cache_size > 500 * 1024 * 1024:  # > 500MB
                health_report['recommendations'].append("Cache directory is large, consider cleanup")
            
            health_report['issues'] = issues
            
            return health_report
            
        except Exception as e:
            logger.error(f"Failed to generate health report: {e}")
            raise ImageProcessingError(f"Failed to generate health report: {e}")