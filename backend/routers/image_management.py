"""
Image Management API Router

Provides REST API endpoints for image upload, processing, optimization, and management
with drag-drop support and comprehensive thumbnail generation.
"""

from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional, Dict, Any
import logging
from pathlib import Path

from database import get_db
from services.image_management_service import ImageManagementService, ImageProcessingError
from auth import get_current_user
from models import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/images", tags=["Image Management"])

@router.post("/upload")
async def upload_image(
    file: UploadFile = File(...),
    entity_type: str = Form(...),
    entity_id: str = Form(...),
    alt_text: Optional[str] = Form(None),
    caption: Optional[str] = Form(None),
    is_primary: bool = Form(False),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload and process image with automatic optimization and thumbnail generation
    
    Supports drag-drop upload with multiple formats (WebP, JPEG, PNG)
    """
    try:
        service = ImageManagementService(db)
        result = await service.upload_image(
            file=file,
            entity_type=entity_type,
            entity_id=entity_id,
            alt_text=alt_text,
            caption=caption,
            is_primary=is_primary
        )
        
        return {
            "message": "Image uploaded successfully",
            "data": result
        }
        
    except ImageProcessingError as e:
        logger.error(f"Image processing error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error during image upload: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during image upload")

@router.post("/upload/multiple")
async def upload_multiple_images(
    files: List[UploadFile] = File(...),
    entity_type: str = Form(...),
    entity_id: str = Form(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload multiple images at once with batch processing
    """
    try:
        service = ImageManagementService(db)
        results = []
        
        for i, file in enumerate(files):
            try:
                result = await service.upload_image(
                    file=file,
                    entity_type=entity_type,
                    entity_id=entity_id,
                    is_primary=(i == 0)  # First image is primary by default
                )
                results.append({
                    "filename": file.filename,
                    "success": True,
                    "data": result
                })
            except Exception as e:
                results.append({
                    "filename": file.filename,
                    "success": False,
                    "error": str(e)
                })
        
        successful_uploads = sum(1 for r in results if r["success"])
        
        return {
            "message": f"Processed {len(files)} files, {successful_uploads} successful",
            "results": results,
            "summary": {
                "total_files": len(files),
                "successful": successful_uploads,
                "failed": len(files) - successful_uploads
            }
        }
        
    except Exception as e:
        logger.error(f"Unexpected error during multiple image upload: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during batch upload")

@router.get("/entity/{entity_type}/{entity_id}")
async def get_entity_images(
    entity_type: str,
    entity_id: str,
    include_thumbnails: bool = Query(True),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all images for a specific entity (product, category, etc.)
    """
    try:
        service = ImageManagementService(db)
        images = await service.get_entity_images(
            entity_type=entity_type,
            entity_id=entity_id,
            include_thumbnails=include_thumbnails
        )
        
        return {
            "message": f"Retrieved {len(images)} images for {entity_type} {entity_id}",
            "data": images
        }
        
    except ImageProcessingError as e:
        logger.error(f"Error retrieving entity images: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error retrieving entity images: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/file/{image_id}")
async def get_image_file(
    image_id: str,
    size: Optional[str] = Query(None, description="Thumbnail size: small, medium, large, gallery"),
    optimized: bool = Query(False, description="Return optimized version"),
    db: AsyncSession = Depends(get_db)
):
    """
    Serve image file with optional thumbnail size or optimized version
    """
    try:
        service = ImageManagementService(db)
        
        # Get image metadata
        images = await service.get_entity_images("", "", include_thumbnails=True)  # This needs to be fixed
        # For now, let's implement a direct file serving approach
        
        # This is a simplified implementation - in production, you'd want proper file serving
        # with caching, CDN integration, etc.
        
        return {"message": "File serving endpoint - implementation needed"}
        
    except Exception as e:
        logger.error(f"Error serving image file: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.put("/{image_id}/metadata")
async def update_image_metadata(
    image_id: str,
    alt_text: Optional[str] = None,
    caption: Optional[str] = None,
    is_primary: Optional[bool] = None,
    sort_order: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update image metadata (alt text, caption, primary status, sort order)
    """
    try:
        service = ImageManagementService(db)
        result = await service.update_image_metadata(
            image_id=image_id,
            alt_text=alt_text,
            caption=caption,
            is_primary=is_primary,
            sort_order=sort_order
        )
        
        return {
            "message": "Image metadata updated successfully",
            "data": result
        }
        
    except ImageProcessingError as e:
        logger.error(f"Error updating image metadata: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error updating image metadata: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.delete("/{image_id}")
async def delete_image(
    image_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete image and all associated files (original, optimized, thumbnails)
    """
    try:
        service = ImageManagementService(db)
        result = await service.delete_image(image_id)
        
        return {
            "message": "Image deleted successfully",
            "data": result
        }
        
    except ImageProcessingError as e:
        logger.error(f"Error deleting image: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error deleting image: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/statistics")
async def get_image_statistics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get comprehensive image management statistics
    """
    try:
        service = ImageManagementService(db)
        stats = await service.get_image_statistics()
        
        return {
            "message": "Image statistics retrieved successfully",
            "data": stats
        }
        
    except ImageProcessingError as e:
        logger.error(f"Error retrieving image statistics: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error retrieving image statistics: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/optimize/{image_id}")
async def reoptimize_image(
    image_id: str,
    quality: Optional[int] = Query(85, ge=10, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Re-optimize existing image with different quality settings
    """
    try:
        # This would require extending the service to support re-optimization
        return {
            "message": "Image re-optimization endpoint - implementation needed",
            "image_id": image_id,
            "quality": quality
        }
        
    except Exception as e:
        logger.error(f"Error re-optimizing image: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/regenerate-thumbnails/{image_id}")
async def regenerate_thumbnails(
    image_id: str,
    sizes: Optional[List[str]] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Regenerate thumbnails for existing image with optional size specification
    """
    try:
        # This would require extending the service to support thumbnail regeneration
        return {
            "message": "Thumbnail regeneration endpoint - implementation needed",
            "image_id": image_id,
            "sizes": sizes
        }
        
    except Exception as e:
        logger.error(f"Error regenerating thumbnails: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")