from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from pydantic import BaseModel, Field
import json
import uuid
from database import get_db
from models import User
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chart-sharing", tags=["chart-sharing"])

# Pydantic models
class ChartConfig(BaseModel):
    type: str
    data: List[Dict[str, Any]]
    title: Optional[str] = None
    description: Optional[str] = None
    options: Optional[Dict[str, Any]] = None

class ShareOptions(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    is_public: bool = True
    allow_comments: bool = False
    expires_at: Optional[datetime] = None

class SharedChart(BaseModel):
    id: str
    config: ChartConfig
    metadata: ShareOptions
    created_at: datetime
    created_by: str
    view_count: int = 0
    last_viewed: Optional[datetime] = None

class Annotation(BaseModel):
    id: str
    chart_id: str
    x: float
    y: float
    text: str
    author: str
    author_avatar: Optional[str] = None
    type: str = "note"  # note, highlight, question
    color: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    is_pinned: bool = False
    is_resolved: bool = False
    replies: List[Dict[str, Any]] = Field(default_factory=list)

class AnnotationCreate(BaseModel):
    x: float
    y: float
    text: str
    type: str = "note"
    color: Optional[str] = None

class AnnotationUpdate(BaseModel):
    text: Optional[str] = None
    type: Optional[str] = None
    color: Optional[str] = None
    is_pinned: Optional[bool] = None
    is_resolved: Optional[bool] = None

class AnnotationReply(BaseModel):
    text: str

class EmbedOptions(BaseModel):
    width: int = 800
    height: int = 600
    theme: str = "light"
    interactive: bool = True
    show_controls: bool = True

# In-memory storage for demo purposes
# In production, these would be stored in a database
shared_charts: Dict[str, SharedChart] = {}
chart_annotations: Dict[str, List[Annotation]] = {}

def get_current_user() -> str:
    """Mock function to get current user. In production, this would use proper authentication."""
    return "demo_user"

@router.post("/share", response_model=Dict[str, str])
async def create_shared_chart(
    config: ChartConfig,
    options: ShareOptions,
    current_user: str = Depends(get_current_user)
):
    """Create a shareable chart link."""
    try:
        share_id = str(uuid.uuid4())
        
        shared_chart = SharedChart(
            id=share_id,
            config=config,
            metadata=options,
            created_at=datetime.utcnow(),
            created_by=current_user
        )
        
        shared_charts[share_id] = shared_chart
        
        logger.info(f"Created shared chart {share_id} by user {current_user}")
        
        return {
            "share_id": share_id,
            "share_url": f"/shared/chart/{share_id}"
        }
        
    except Exception as e:
        logger.error(f"Error creating shared chart: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create shared chart")

@router.get("/shared/{share_id}", response_model=SharedChart)
async def get_shared_chart(share_id: str):
    """Get a shared chart by ID."""
    if share_id not in shared_charts:
        raise HTTPException(status_code=404, detail="Shared chart not found")
    
    chart = shared_charts[share_id]
    
    # Update view count and last viewed
    chart.view_count += 1
    chart.last_viewed = datetime.utcnow()
    
    # Check if chart has expired
    if chart.metadata.expires_at and datetime.utcnow() > chart.metadata.expires_at:
        raise HTTPException(status_code=410, detail="Shared chart has expired")
    
    return chart

@router.get("/embed/{share_id}")
async def get_embed_chart(
    share_id: str,
    width: int = Query(800, ge=100, le=2000),
    height: int = Query(600, ge=100, le=1500),
    theme: str = Query("light", regex="^(light|dark)$"),
    interactive: bool = Query(True),
    controls: bool = Query(True)
):
    """Get chart data for embedding."""
    if share_id not in shared_charts:
        raise HTTPException(status_code=404, detail="Shared chart not found")
    
    chart = shared_charts[share_id]
    
    # Check if chart has expired
    if chart.metadata.expires_at and datetime.utcnow() > chart.metadata.expires_at:
        raise HTTPException(status_code=410, detail="Shared chart has expired")
    
    # Update view count
    chart.view_count += 1
    chart.last_viewed = datetime.utcnow()
    
    embed_config = {
        "config": chart.config.dict(),
        "metadata": chart.metadata.dict(),
        "embed_options": {
            "width": width,
            "height": height,
            "theme": theme,
            "interactive": interactive,
            "show_controls": controls
        }
    }
    
    return embed_config

@router.delete("/shared/{share_id}")
async def delete_shared_chart(
    share_id: str,
    current_user: str = Depends(get_current_user)
):
    """Delete a shared chart."""
    if share_id not in shared_charts:
        raise HTTPException(status_code=404, detail="Shared chart not found")
    
    chart = shared_charts[share_id]
    
    # Check if user owns the chart
    if chart.created_by != current_user:
        raise HTTPException(status_code=403, detail="Not authorized to delete this chart")
    
    del shared_charts[share_id]
    
    # Also delete associated annotations
    if share_id in chart_annotations:
        del chart_annotations[share_id]
    
    logger.info(f"Deleted shared chart {share_id} by user {current_user}")
    
    return {"message": "Shared chart deleted successfully"}

@router.get("/my-shares", response_model=List[SharedChart])
async def get_user_shared_charts(
    current_user: str = Depends(get_current_user),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """Get all charts shared by the current user."""
    user_charts = [
        chart for chart in shared_charts.values()
        if chart.created_by == current_user
    ]
    
    # Sort by creation date (newest first)
    user_charts.sort(key=lambda x: x.created_at, reverse=True)
    
    return user_charts[offset:offset + limit]

# Annotation endpoints
@router.post("/annotations/{chart_id}", response_model=Annotation)
async def create_annotation(
    chart_id: str,
    annotation_data: AnnotationCreate,
    current_user: str = Depends(get_current_user)
):
    """Create a new annotation for a chart."""
    try:
        annotation_id = str(uuid.uuid4())
        
        annotation = Annotation(
            id=annotation_id,
            chart_id=chart_id,
            x=annotation_data.x,
            y=annotation_data.y,
            text=annotation_data.text,
            author=current_user,
            type=annotation_data.type,
            color=annotation_data.color,
            created_at=datetime.utcnow()
        )
        
        if chart_id not in chart_annotations:
            chart_annotations[chart_id] = []
        
        chart_annotations[chart_id].append(annotation)
        
        logger.info(f"Created annotation {annotation_id} for chart {chart_id} by user {current_user}")
        
        return annotation
        
    except Exception as e:
        logger.error(f"Error creating annotation: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create annotation")

@router.get("/annotations/{chart_id}", response_model=List[Annotation])
async def get_chart_annotations(chart_id: str):
    """Get all annotations for a chart."""
    return chart_annotations.get(chart_id, [])

@router.put("/annotations/{chart_id}/{annotation_id}", response_model=Annotation)
async def update_annotation(
    chart_id: str,
    annotation_id: str,
    update_data: AnnotationUpdate,
    current_user: str = Depends(get_current_user)
):
    """Update an annotation."""
    if chart_id not in chart_annotations:
        raise HTTPException(status_code=404, detail="Chart not found")
    
    annotations = chart_annotations[chart_id]
    annotation = next((a for a in annotations if a.id == annotation_id), None)
    
    if not annotation:
        raise HTTPException(status_code=404, detail="Annotation not found")
    
    # Check if user owns the annotation
    if annotation.author != current_user:
        raise HTTPException(status_code=403, detail="Not authorized to update this annotation")
    
    # Update fields
    if update_data.text is not None:
        annotation.text = update_data.text
    if update_data.type is not None:
        annotation.type = update_data.type
    if update_data.color is not None:
        annotation.color = update_data.color
    if update_data.is_pinned is not None:
        annotation.is_pinned = update_data.is_pinned
    if update_data.is_resolved is not None:
        annotation.is_resolved = update_data.is_resolved
    
    annotation.updated_at = datetime.utcnow()
    
    logger.info(f"Updated annotation {annotation_id} by user {current_user}")
    
    return annotation

@router.delete("/annotations/{chart_id}/{annotation_id}")
async def delete_annotation(
    chart_id: str,
    annotation_id: str,
    current_user: str = Depends(get_current_user)
):
    """Delete an annotation."""
    if chart_id not in chart_annotations:
        raise HTTPException(status_code=404, detail="Chart not found")
    
    annotations = chart_annotations[chart_id]
    annotation = next((a for a in annotations if a.id == annotation_id), None)
    
    if not annotation:
        raise HTTPException(status_code=404, detail="Annotation not found")
    
    # Check if user owns the annotation
    if annotation.author != current_user:
        raise HTTPException(status_code=403, detail="Not authorized to delete this annotation")
    
    chart_annotations[chart_id] = [a for a in annotations if a.id != annotation_id]
    
    logger.info(f"Deleted annotation {annotation_id} by user {current_user}")
    
    return {"message": "Annotation deleted successfully"}

@router.post("/annotations/{chart_id}/{annotation_id}/replies", response_model=Annotation)
async def add_annotation_reply(
    chart_id: str,
    annotation_id: str,
    reply_data: AnnotationReply,
    current_user: str = Depends(get_current_user)
):
    """Add a reply to an annotation."""
    if chart_id not in chart_annotations:
        raise HTTPException(status_code=404, detail="Chart not found")
    
    annotations = chart_annotations[chart_id]
    annotation = next((a for a in annotations if a.id == annotation_id), None)
    
    if not annotation:
        raise HTTPException(status_code=404, detail="Annotation not found")
    
    reply = {
        "id": str(uuid.uuid4()),
        "text": reply_data.text,
        "author": current_user,
        "created_at": datetime.utcnow().isoformat()
    }
    
    annotation.replies.append(reply)
    annotation.updated_at = datetime.utcnow()
    
    logger.info(f"Added reply to annotation {annotation_id} by user {current_user}")
    
    return annotation

# Analytics endpoints
@router.get("/analytics/sharing-stats")
async def get_sharing_stats(
    current_user: str = Depends(get_current_user)
):
    """Get sharing analytics for the current user."""
    user_charts = [
        chart for chart in shared_charts.values()
        if chart.created_by == current_user
    ]
    
    total_shares = len(user_charts)
    total_views = sum(chart.view_count for chart in user_charts)
    
    # Calculate views by time period
    now = datetime.utcnow()
    last_7_days = now - timedelta(days=7)
    last_30_days = now - timedelta(days=30)
    
    recent_views_7d = sum(
        chart.view_count for chart in user_charts
        if chart.last_viewed and chart.last_viewed >= last_7_days
    )
    
    recent_views_30d = sum(
        chart.view_count for chart in user_charts
        if chart.last_viewed and chart.last_viewed >= last_30_days
    )
    
    # Most viewed charts
    top_charts = sorted(user_charts, key=lambda x: x.view_count, reverse=True)[:5]
    
    return {
        "total_shares": total_shares,
        "total_views": total_views,
        "views_last_7_days": recent_views_7d,
        "views_last_30_days": recent_views_30d,
        "top_charts": [
            {
                "id": chart.id,
                "title": chart.metadata.title or "Untitled Chart",
                "views": chart.view_count,
                "created_at": chart.created_at
            }
            for chart in top_charts
        ]
    }

@router.get("/analytics/annotation-stats/{chart_id}")
async def get_annotation_stats(chart_id: str):
    """Get annotation statistics for a chart."""
    annotations = chart_annotations.get(chart_id, [])
    
    total_annotations = len(annotations)
    total_replies = sum(len(ann.replies) for ann in annotations)
    
    # Count by type
    type_counts = {}
    for ann in annotations:
        type_counts[ann.type] = type_counts.get(ann.type, 0) + 1
    
    # Count resolved vs unresolved
    resolved_count = sum(1 for ann in annotations if ann.is_resolved)
    unresolved_count = total_annotations - resolved_count
    
    # Most active contributors
    author_counts = {}
    for ann in annotations:
        author_counts[ann.author] = author_counts.get(ann.author, 0) + 1
    
    top_contributors = sorted(
        author_counts.items(),
        key=lambda x: x[1],
        reverse=True
    )[:5]
    
    return {
        "total_annotations": total_annotations,
        "total_replies": total_replies,
        "by_type": type_counts,
        "resolved": resolved_count,
        "unresolved": unresolved_count,
        "top_contributors": [
            {"author": author, "count": count}
            for author, count in top_contributors
        ]
    }