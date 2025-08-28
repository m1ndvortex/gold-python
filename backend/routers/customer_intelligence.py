from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func, text, desc
from datetime import datetime, timedelta, date
from database import get_db
import models
import schemas
from oauth2_middleware import get_current_user, require_permission
from decimal import Decimal
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/customer-intelligence", tags=["customer-intelligence"])

@router.get("/dashboard", response_model=schemas.CustomerIntelligenceDashboard)
async def get_customer_intelligence_dashboard(
    include_segments: bool = Query(True, description="Include segment analysis"),
    include_churn_analysis: bool = Query(True, description="Include churn analysis"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("view_customers"))
):
    """Get comprehensive customer intelligence dashboard"""
    
    try:
        # Total customers
        total_customers = db.query(models.Customer).count()
        
        # Active segments
        active_segments = []
        if include_segments:
            active_segments = db.query(models.CustomerSegment).filter(
                models.CustomerSegment.is_active == True
            ).all()
        
        # High value customers
        high_value_customers = await _get_high_value_customers(db, limit=10)
        
        # At-risk customers
        at_risk_customers = await _get_at_risk_customers(db, limit=10)
        
        # Customer distribution by segment
        customer_distribution = await _get_customer_distribution(db)
        
        # Lifetime value analytics
        lifetime_value_analytics = await _get_lifetime_value_analytics(db)
        
        # Churn analysis
        churn_analysis = {}
        if include_churn_analysis:
            churn_analysis = await _get_churn_analysis(db)
        
        # Loyalty metrics
        loyalty_metrics = await _get_loyalty_metrics(db)
        
        # Segment performance
        segment_performance = await _get_segment_performance(db)
        
        return schemas.CustomerIntelligenceDashboard(
            total_customers=total_customers,
            active_segments=active_segments,
            high_value_customers=high_value_customers,
            at_risk_customers=at_risk_customers,
            customer_distribution=customer_distribution,
            lifetime_value_analytics=lifetime_value_analytics,
            churn_analysis=churn_analysis,
            loyalty_metrics=loyalty_metrics,
            segment_performance=segment_performance,
            last_updated=datetime.now()
        )
        
    except Exception as e:
        logger.error(f"Error getting customer intelligence dashboard: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve customer intelligence dashboard: {str(e)}"
        )

async def _get_high_value_customers(db: Session, limit: int = 10) -> List[Dict[str, Any]]:
    """Get high value customers based on total purchases and recent activity"""
    
    query = text("""
        SELECT 
            c.id,
            c.name,
            c.total_purchases,
            c.current_debt,
            c.last_purchase_date,
            COUNT(i.id) as total_orders,
            AVG(i.total_amount) as average_order_value,
            MAX(i.created_at) as last_order_date,
            EXTRACT(DAYS FROM NOW() - MAX(i.created_at)) as days_since_last_order
        FROM customers c
        LEFT JOIN invoices i ON c.id = i.customer_id
        GROUP BY c.id, c.name, c.total_purchases, c.current_debt, c.last_purchase_date
        HAVING c.total_purchases > 0
        ORDER BY c.total_purchases DESC, COUNT(i.id) DESC
        LIMIT :limit
    """)
    
    results = db.execute(query, {"limit": limit}).fetchall()
    
    customers = []
    for row in results:
        customers.append({
            "customer_id": str(row.id),
            "name": row.name,
            "total_purchases": float(row.total_purchases or 0),
            "current_debt": float(row.current_debt or 0),
            "total_orders": row.total_orders or 0,
            "average_order_value": float(row.average_order_value or 0),
            "last_order_date": row.last_order_date,
            "days_since_last_order": row.days_since_last_order or 0,
            "customer_status": "high_value"
        })
    
    return customers

async def _get_at_risk_customers(db: Session, limit: int = 10) -> List[Dict[str, Any]]:
    """Get customers at risk of churning based on purchase patterns"""
    
    # Customers who haven't purchased in 90+ days but were previously active
    query = text("""
        SELECT 
            c.id,
            c.name,
            c.total_purchases,
            c.current_debt,
            c.last_purchase_date,
            COUNT(i.id) as total_orders,
            MAX(i.created_at) as last_order_date,
            EXTRACT(DAYS FROM NOW() - MAX(i.created_at)) as days_since_last_order,
            AVG(i.total_amount) as average_order_value
        FROM customers c
        LEFT JOIN invoices i ON c.id = i.customer_id
        WHERE c.total_purchases > 0
        GROUP BY c.id, c.name, c.total_purchases, c.current_debt, c.last_purchase_date
        HAVING EXTRACT(DAYS FROM NOW() - MAX(i.created_at)) > 90
        AND COUNT(i.id) >= 2  -- Had at least 2 orders
        ORDER BY EXTRACT(DAYS FROM NOW() - MAX(i.created_at)) DESC, c.total_purchases DESC
        LIMIT :limit
    """)
    
    results = db.execute(query, {"limit": limit}).fetchall()
    
    customers = []
    for row in results:
        # Calculate risk score based on days since last order and purchase history
        days_since_last = row.days_since_last_order or 0
        risk_score = min(1.0, days_since_last / 180)  # Max risk at 180 days
        
        customers.append({
            "customer_id": str(row.id),
            "name": row.name,
            "total_purchases": float(row.total_purchases or 0),
            "current_debt": float(row.current_debt or 0),
            "total_orders": row.total_orders or 0,
            "average_order_value": float(row.average_order_value or 0),
            "last_order_date": row.last_order_date,
            "days_since_last_order": days_since_last,
            "risk_score": round(risk_score, 2),
            "customer_status": "at_risk"
        })
    
    return customers

async def _get_customer_distribution(db: Session) -> Dict[str, int]:
    """Get customer distribution by segments and other criteria"""
    
    # Distribution by purchase frequency
    frequency_query = text("""
        SELECT 
            CASE 
                WHEN order_count >= 10 THEN 'frequent'
                WHEN order_count >= 5 THEN 'regular'
                WHEN order_count >= 2 THEN 'occasional'
                ELSE 'one_time'
            END as frequency_segment,
            COUNT(*) as customer_count
        FROM (
            SELECT 
                c.id,
                COUNT(i.id) as order_count
            FROM customers c
            LEFT JOIN invoices i ON c.id = i.customer_id
            GROUP BY c.id
        ) customer_orders
        GROUP BY frequency_segment
    """)
    
    frequency_results = db.execute(frequency_query).fetchall()
    
    distribution = {}
    for row in frequency_results:
        distribution[row.frequency_segment] = row.customer_count
    
    # Distribution by value
    value_query = text("""
        SELECT 
            CASE 
                WHEN total_purchases >= 10000 THEN 'high_value'
                WHEN total_purchases >= 5000 THEN 'medium_value'
                WHEN total_purchases >= 1000 THEN 'low_value'
                ELSE 'minimal_value'
            END as value_segment,
            COUNT(*) as customer_count
        FROM customers
        GROUP BY value_segment
    """)
    
    value_results = db.execute(value_query).fetchall()
    
    for row in value_results:
        distribution[f"value_{row.value_segment}"] = row.customer_count
    
    return distribution

async def _get_lifetime_value_analytics(db: Session) -> Dict[str, float]:
    """Calculate customer lifetime value analytics"""
    
    query = text("""
        SELECT 
            AVG(c.total_purchases) as average_ltv,
            PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY c.total_purchases) as median_ltv,
            MAX(c.total_purchases) as max_ltv,
            MIN(c.total_purchases) as min_ltv,
            COUNT(*) as total_customers_with_purchases,
            SUM(c.total_purchases) as total_lifetime_value
        FROM customers c
        WHERE c.total_purchases > 0
    """)
    
    result = db.execute(query).fetchone()
    
    return {
        "average_ltv": float(result.average_ltv or 0),
        "median_ltv": float(result.median_ltv or 0),
        "max_ltv": float(result.max_ltv or 0),
        "min_ltv": float(result.min_ltv or 0),
        "total_customers_with_purchases": result.total_customers_with_purchases or 0,
        "total_lifetime_value": float(result.total_lifetime_value or 0)
    }

async def _get_churn_analysis(db: Session) -> Dict[str, Any]:
    """Analyze customer churn patterns"""
    
    # Customers by recency of last purchase
    recency_query = text("""
        SELECT 
            CASE 
                WHEN EXTRACT(DAYS FROM NOW() - MAX(i.created_at)) <= 30 THEN 'active'
                WHEN EXTRACT(DAYS FROM NOW() - MAX(i.created_at)) <= 90 THEN 'at_risk'
                WHEN EXTRACT(DAYS FROM NOW() - MAX(i.created_at)) <= 180 THEN 'dormant'
                ELSE 'churned'
            END as churn_stage,
            COUNT(DISTINCT c.id) as customer_count,
            AVG(c.total_purchases) as avg_ltv
        FROM customers c
        LEFT JOIN invoices i ON c.id = i.customer_id
        WHERE c.total_purchases > 0
        GROUP BY churn_stage
    """)
    
    recency_results = db.execute(recency_query).fetchall()
    
    churn_stages = {}
    for row in recency_results:
        churn_stages[row.churn_stage] = {
            "count": row.customer_count,
            "average_ltv": float(row.avg_ltv or 0)
        }
    
    # Calculate churn rate (customers who haven't purchased in 180+ days)
    total_customers = sum(stage["count"] for stage in churn_stages.values())
    churned_count = churn_stages.get("churned", {}).get("count", 0)
    churn_rate = (churned_count / total_customers * 100) if total_customers > 0 else 0
    
    return {
        "churn_stages": churn_stages,
        "overall_churn_rate": round(churn_rate, 2),
        "total_analyzed_customers": total_customers,
        "retention_rate": round(100 - churn_rate, 2)
    }

async def _get_loyalty_metrics(db: Session) -> Dict[str, float]:
    """Calculate customer loyalty metrics"""
    
    query = text("""
        WITH customer_metrics AS (
            SELECT 
                c.id,
                c.total_purchases,
                COUNT(i.id) as order_count,
                AVG(i.total_amount) as avg_order_value,
                EXTRACT(DAYS FROM NOW() - MAX(i.created_at)) as days_since_last_order,
                EXTRACT(DAYS FROM MAX(i.created_at) - MIN(i.created_at)) as customer_lifespan_days
            FROM customers c
            LEFT JOIN invoices i ON c.id = i.customer_id
            WHERE c.total_purchases > 0
            GROUP BY c.id, c.total_purchases
        )
        SELECT 
            AVG(order_count) as avg_orders_per_customer,
            AVG(avg_order_value) as avg_order_value,
            AVG(CASE WHEN order_count > 1 THEN customer_lifespan_days ELSE NULL END) as avg_customer_lifespan,
            COUNT(CASE WHEN order_count > 1 THEN 1 END)::float / COUNT(*) * 100 as repeat_customer_rate,
            AVG(CASE WHEN days_since_last_order <= 90 THEN order_count ELSE NULL END) as avg_orders_active_customers
        FROM customer_metrics
    """)
    
    result = db.execute(query).fetchone()
    
    return {
        "average_orders_per_customer": float(result.avg_orders_per_customer or 0),
        "average_order_value": float(result.avg_order_value or 0),
        "average_customer_lifespan_days": float(result.avg_customer_lifespan or 0),
        "repeat_customer_rate": float(result.repeat_customer_rate or 0),
        "average_orders_active_customers": float(result.avg_orders_active_customers or 0)
    }

async def _get_segment_performance(db: Session) -> List[Dict[str, Any]]:
    """Get performance metrics for each customer segment"""
    
    segments = db.query(models.CustomerSegment).filter(
        models.CustomerSegment.is_active == True
    ).all()
    
    segment_performance = []
    
    for segment in segments:
        # Get customers in this segment
        segment_customers_query = text("""
            SELECT 
                COUNT(DISTINCT csa.customer_id) as customer_count,
                AVG(c.total_purchases) as avg_ltv,
                SUM(c.total_purchases) as total_ltv,
                AVG(c.current_debt) as avg_debt
            FROM customer_segment_assignments csa
            JOIN customers c ON csa.customer_id = c.id
            WHERE csa.segment_id = :segment_id
        """)
        
        result = db.execute(segment_customers_query, {
            "segment_id": str(segment.id)
        }).fetchone()
        
        segment_performance.append({
            "segment_id": str(segment.id),
            "segment_name": segment.segment_name,
            "segment_color": segment.segment_color,
            "customer_count": result.customer_count or 0,
            "average_ltv": float(result.avg_ltv or 0),
            "total_ltv": float(result.total_ltv or 0),
            "average_debt": float(result.avg_debt or 0),
            "performance_score": _calculate_segment_performance_score(result)
        })
    
    return segment_performance

def _calculate_segment_performance_score(segment_data) -> float:
    """Calculate a performance score for a segment (0-100)"""
    if not segment_data.customer_count:
        return 0
    
    # Simple scoring based on average LTV and customer count
    avg_ltv = float(segment_data.avg_ltv or 0)
    customer_count = segment_data.customer_count or 0
    
    # Normalize scores (this would be more sophisticated in practice)
    ltv_score = min(100, avg_ltv / 100)  # Score out of 100 based on LTV
    size_score = min(50, customer_count * 2)  # Bonus for segment size
    
    return round(ltv_score + size_score, 1)

# Customer Segmentation Endpoints
@router.post("/segments", response_model=schemas.CustomerSegment)
async def create_customer_segment(
    segment: schemas.CustomerSegmentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("manage_customers"))
):
    """Create a new customer segment"""
    
    db_segment = models.CustomerSegment(
        **segment.dict(),
        created_by=current_user.id
    )
    
    db.add(db_segment)
    db.commit()
    db.refresh(db_segment)
    
    return db_segment

@router.get("/segments", response_model=List[schemas.CustomerSegmentWithCreator])
async def get_customer_segments(
    is_active: bool = Query(True, description="Filter by active status"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("view_customers"))
):
    """Get all customer segments"""
    
    query = db.query(models.CustomerSegment).options(
        joinedload(models.CustomerSegment.creator)
    )
    
    if is_active is not None:
        query = query.filter(models.CustomerSegment.is_active == is_active)
    
    return query.all()

@router.put("/segments/{segment_id}", response_model=schemas.CustomerSegment)
async def update_customer_segment(
    segment_id: str,
    segment_update: schemas.CustomerSegmentUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("manage_customers"))
):
    """Update a customer segment"""
    
    db_segment = db.query(models.CustomerSegment).filter(
        models.CustomerSegment.id == segment_id
    ).first()
    
    if not db_segment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer segment not found"
        )
    
    update_data = segment_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_segment, field, value)
    
    db.commit()
    db.refresh(db_segment)
    
    return db_segment

@router.post("/segments/{segment_id}/assign", response_model=List[schemas.CustomerSegmentAssignment])
async def assign_customers_to_segment(
    segment_id: str,
    customer_ids: List[str],
    auto_calculate_score: bool = Query(True, description="Auto-calculate assignment scores"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("manage_customers"))
):
    """Assign customers to a segment"""
    
    segment = db.query(models.CustomerSegment).filter(
        models.CustomerSegment.id == segment_id
    ).first()
    
    if not segment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer segment not found"
        )
    
    assignments = []
    for customer_id in customer_ids:
        # Check if assignment already exists
        existing = db.query(models.CustomerSegmentAssignment).filter(
            models.CustomerSegmentAssignment.customer_id == customer_id,
            models.CustomerSegmentAssignment.segment_id == segment_id
        ).first()
        
        if not existing:
            assignment_score = None
            if auto_calculate_score:
                assignment_score = await _calculate_assignment_score(
                    db, customer_id, segment.segment_criteria
                )
            
            assignment = models.CustomerSegmentAssignment(
                customer_id=customer_id,
                segment_id=segment_id,
                assignment_score=assignment_score
            )
            
            db.add(assignment)
            assignments.append(assignment)
    
    db.commit()
    
    for assignment in assignments:
        db.refresh(assignment)
    
    return assignments

async def _calculate_assignment_score(db: Session, customer_id: str, criteria: Dict[str, Any]) -> float:
    """Calculate how well a customer fits segment criteria"""
    
    # Get customer data
    customer_query = text("""
        SELECT 
            c.total_purchases,
            c.current_debt,
            COUNT(i.id) as order_count,
            AVG(i.total_amount) as avg_order_value,
            EXTRACT(DAYS FROM NOW() - MAX(i.created_at)) as days_since_last_order
        FROM customers c
        LEFT JOIN invoices i ON c.id = i.customer_id
        WHERE c.id = :customer_id
        GROUP BY c.id, c.total_purchases, c.current_debt
    """)
    
    result = db.execute(customer_query, {"customer_id": customer_id}).fetchone()
    
    if not result:
        return 0.0
    
    # Simple scoring logic (would be more sophisticated in practice)
    score = 50.0  # Base score
    
    # Check LTV criteria
    if "min_ltv" in criteria:
        if result.total_purchases >= criteria["min_ltv"]:
            score += 20
        else:
            score -= 10
    
    # Check order frequency
    if "min_orders" in criteria:
        if result.order_count >= criteria["min_orders"]:
            score += 15
        else:
            score -= 5
    
    # Check recency
    if "max_days_since_purchase" in criteria:
        if result.days_since_last_order <= criteria["max_days_since_purchase"]:
            score += 15
        else:
            score -= 15
    
    return max(0.0, min(100.0, score))

# Customer Behavior Analysis Endpoints
@router.get("/behavior/{customer_id}", response_model=schemas.CustomerBehaviorAnalysisWithCustomer)
async def get_customer_behavior_analysis(
    customer_id: str,
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("view_customers"))
):
    """Get detailed behavior analysis for a specific customer"""
    
    if not end_date:
        end_date = datetime.now()
    if not start_date:
        start_date = end_date - timedelta(days=365)  # Last year
    
    # Get or create behavior analysis
    analysis = db.query(models.CustomerBehaviorAnalysis).filter(
        models.CustomerBehaviorAnalysis.customer_id == customer_id,
        models.CustomerBehaviorAnalysis.analysis_period_start >= start_date,
        models.CustomerBehaviorAnalysis.analysis_period_end <= end_date
    ).first()
    
    if not analysis:
        # Generate new analysis
        analysis = await _generate_customer_behavior_analysis(db, customer_id, start_date, end_date)
    
    return analysis

async def _generate_customer_behavior_analysis(db: Session, customer_id: str, start_date: datetime, end_date: datetime) -> models.CustomerBehaviorAnalysis:
    """Generate behavior analysis for a customer"""
    
    # Calculate customer metrics
    customer_query = text("""
        SELECT 
            c.id,
            c.total_purchases,
            c.current_debt,
            COUNT(i.id) as total_orders,
            AVG(i.total_amount) as avg_order_value,
            SUM(i.total_amount) as total_spent,
            MAX(i.created_at) as last_purchase_date,
            EXTRACT(DAYS FROM NOW() - MAX(i.created_at)) as days_since_last_purchase,
            EXTRACT(DAYS FROM :end_date - :start_date) / NULLIF(COUNT(i.id), 0) as days_between_orders
        FROM customers c
        LEFT JOIN invoices i ON c.id = i.customer_id
        WHERE c.id = :customer_id
        AND (i.created_at IS NULL OR (i.created_at >= :start_date AND i.created_at <= :end_date))
        GROUP BY c.id, c.total_purchases, c.current_debt
    """)
    
    result = db.execute(customer_query, {
        "customer_id": customer_id,
        "start_date": start_date,
        "end_date": end_date
    }).fetchone()
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
    
    # Calculate purchase frequency (purchases per month)
    days_in_period = (end_date - start_date).days
    purchase_frequency = (result.total_orders / (days_in_period / 30.0)) if days_in_period > 0 else 0
    
    # Calculate scores (simplified)
    loyalty_score = min(1.0, result.total_orders / 10.0)  # Loyal if 10+ orders
    engagement_score = min(1.0, purchase_frequency / 2.0)  # Engaged if 2+ orders per month
    
    # Calculate churn probability based on days since last purchase
    days_since_last = result.days_since_last_purchase or 0
    churn_probability = min(1.0, days_since_last / 180.0)  # Max churn prob at 180 days
    
    # Risk score (debt vs purchases)
    debt_ratio = (result.current_debt / result.total_purchases) if result.total_purchases > 0 else 0
    risk_score = min(1.0, debt_ratio)
    
    # Create behavior analysis record
    analysis = models.CustomerBehaviorAnalysis(
        customer_id=customer_id,
        analysis_period_start=start_date,
        analysis_period_end=end_date,
        purchase_frequency=round(purchase_frequency, 2),
        average_order_value=float(result.avg_order_value or 0),
        total_spent=float(result.total_spent or 0),
        customer_lifetime_value=float(result.total_purchases or 0),
        last_purchase_date=result.last_purchase_date,
        days_since_last_purchase=days_since_last,
        risk_score=round(risk_score, 2),
        loyalty_score=round(loyalty_score, 2),
        engagement_score=round(engagement_score, 2),
        churn_probability=round(churn_probability, 2)
    )
    
    db.add(analysis)
    db.commit()
    db.refresh(analysis)
    
    return analysis

@router.post("/segmentation/auto", response_model=schemas.CustomerSegmentationResponse)
async def auto_segment_customers(
    request: schemas.CustomerSegmentationRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("manage_customers"))
):
    """Automatically segment customers based on criteria"""
    
    try:
        # Create the segment
        segment = models.CustomerSegment(
            segment_name=request.segment_name,
            segment_criteria=request.criteria,
            created_by=current_user.id
        )
        
        db.add(segment)
        db.commit()
        db.refresh(segment)
        
        # Find customers matching criteria
        matching_customers = await _find_customers_matching_criteria(db, request.criteria)
        
        # Assign customers if requested
        assigned_customers = []
        if request.auto_assign:
            for customer_id in matching_customers:
                assignment = models.CustomerSegmentAssignment(
                    customer_id=customer_id,
                    segment_id=segment.id,
                    assignment_score=await _calculate_assignment_score(db, customer_id, request.criteria)
                )
                db.add(assignment)
                assigned_customers.append(customer_id)
        
        db.commit()
        
        # Generate statistics
        segment_statistics = await _calculate_segment_statistics(db, assigned_customers)
        
        assignment_summary = {
            "total_assigned": len(assigned_customers),
            "criteria_matches": len(matching_customers),
            "assignment_rate": (len(assigned_customers) / len(matching_customers) * 100) if matching_customers else 0
        }
        
        return schemas.CustomerSegmentationResponse(
            segment=segment,
            assigned_customers=assigned_customers,
            segment_statistics=segment_statistics,
            assignment_summary=assignment_summary
        )
        
    except Exception as e:
        logger.error(f"Error in auto segmentation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to auto-segment customers: {str(e)}"
        )

async def _find_customers_matching_criteria(db: Session, criteria: Dict[str, Any]) -> List[str]:
    """Find customers matching the given criteria"""
    
    # Build dynamic query based on criteria
    base_query = """
        SELECT DISTINCT c.id
        FROM customers c
        LEFT JOIN invoices i ON c.id = i.customer_id
        WHERE 1=1
    """
    
    params = {}
    conditions = []
    
    if "min_ltv" in criteria:
        conditions.append("c.total_purchases >= :min_ltv")
        params["min_ltv"] = criteria["min_ltv"]
    
    if "max_ltv" in criteria:
        conditions.append("c.total_purchases <= :max_ltv")
        params["max_ltv"] = criteria["max_ltv"]
    
    if "min_orders" in criteria:
        base_query += " GROUP BY c.id HAVING COUNT(i.id) >= :min_orders"
        params["min_orders"] = criteria["min_orders"]
    
    if conditions:
        base_query += " AND " + " AND ".join(conditions)
    
    if "min_orders" not in criteria:
        base_query += " GROUP BY c.id"
    
    results = db.execute(text(base_query), params).fetchall()
    
    return [str(row.id) for row in results]

async def _calculate_segment_statistics(db: Session, customer_ids: List[str]) -> Dict[str, Any]:
    """Calculate statistics for a customer segment"""
    
    if not customer_ids:
        return {"total_customers": 0}
    
    placeholders = ",".join([f":customer_{i}" for i in range(len(customer_ids))])
    params = {f"customer_{i}": customer_id for i, customer_id in enumerate(customer_ids)}
    
    query = text(f"""
        SELECT 
            COUNT(*) as total_customers,
            AVG(c.total_purchases) as avg_ltv,
            SUM(c.total_purchases) as total_ltv,
            AVG(c.current_debt) as avg_debt,
            MAX(c.total_purchases) as max_ltv,
            MIN(c.total_purchases) as min_ltv
        FROM customers c
        WHERE c.id IN ({placeholders})
    """)
    
    result = db.execute(query, params).fetchone()
    
    return {
        "total_customers": result.total_customers or 0,
        "average_ltv": float(result.avg_ltv or 0),
        "total_ltv": float(result.total_ltv or 0),
        "average_debt": float(result.avg_debt or 0),
        "max_ltv": float(result.max_ltv or 0),
        "min_ltv": float(result.min_ltv or 0)
    }
