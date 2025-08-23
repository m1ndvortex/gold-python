"""
KPI Dashboard API Endpoints
Provides comprehensive KPI tracking with real-time updates and WebSocket support
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from datetime import datetime, date, timedelta
from database import get_db
import models
import schemas
from auth import get_current_active_user, require_permission
from services.kpi_calculator_service import FinancialKPICalculator, OperationalKPICalculator, CustomerKPICalculator
import json
import asyncio
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/kpi", tags=["kpi-dashboard"])

# WebSocket connection manager for real-time updates
class KPIConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
    
    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
    
    async def send_kpi_update(self, data: dict):
        """Send KPI updates to all connected clients"""
        if self.active_connections:
            message = json.dumps(data)
            disconnected = []
            
            for connection in self.active_connections:
                try:
                    await connection.send_text(message)
                except Exception as e:
                    logger.error(f"Error sending WebSocket message: {e}")
                    disconnected.append(connection)
            
            # Remove disconnected clients
            for connection in disconnected:
                self.disconnect(connection)

# Global connection manager
kpi_manager = KPIConnectionManager()

@router.websocket("/ws")
async def kpi_websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time KPI updates"""
    await kpi_manager.connect(websocket)
    try:
        while True:
            # Keep connection alive and listen for client messages
            data = await websocket.receive_text()
            # Echo back for connection testing
            await websocket.send_text(f"KPI WebSocket connected: {data}")
    except WebSocketDisconnect:
        kpi_manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        kpi_manager.disconnect(websocket)

@router.get("/financial", response_model=Dict[str, Any])
async def get_financial_kpis(
    start_date: Optional[date] = Query(None, description="Start date for KPI calculation"),
    end_date: Optional[date] = Query(None, description="End date for KPI calculation"),
    targets: Optional[str] = Query(None, description="JSON string of targets (e.g., '{\"revenue\": 100000, \"profit_margin\": 25}'"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("view_reports"))
):
    """Get comprehensive financial KPIs with trend analysis"""
    
    # Default to last 30 days if no date range provided
    if not end_date:
        end_date = date.today()
    if not start_date:
        start_date = end_date - timedelta(days=30)
    
    # Parse targets if provided
    target_dict = {}
    if targets:
        try:
            target_dict = json.loads(targets)
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid targets JSON format"
            )
    
    try:
        calculator = FinancialKPICalculator(db)
        
        # Calculate all financial KPIs
        revenue_kpis = await calculator.calculate_revenue_kpis(start_date, end_date, target_dict)
        profit_kpis = await calculator.calculate_profit_margin_kpis(start_date, end_date, target_dict)
        
        # Calculate achievement rates if targets provided
        achievement_kpis = {}
        if target_dict:
            achievement_kpis = await calculator.calculate_achievement_rate_kpis(start_date, end_date, target_dict)
        
        result = {
            "revenue": revenue_kpis,
            "profit_margin": profit_kpis,
            "achievement": achievement_kpis,
            "period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "days": (end_date - start_date).days + 1
            },
            "targets": target_dict,
            "last_updated": datetime.utcnow().isoformat()
        }
        
        # Send real-time update to WebSocket clients
        await kpi_manager.send_kpi_update({
            "type": "financial_kpis",
            "data": result
        })
        
        return result
        
    except Exception as e:
        logger.error(f"Error calculating financial KPIs: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate financial KPIs: {str(e)}"
        )

@router.get("/operational", response_model=Dict[str, Any])
async def get_operational_kpis(
    start_date: Optional[date] = Query(None, description="Start date for KPI calculation"),
    end_date: Optional[date] = Query(None, description="End date for KPI calculation"),
    targets: Optional[str] = Query(None, description="JSON string of targets"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("view_reports"))
):
    """Get comprehensive operational KPIs including inventory metrics"""
    
    # Default to last 30 days if no date range provided
    if not end_date:
        end_date = date.today()
    if not start_date:
        start_date = end_date - timedelta(days=30)
    
    # Parse targets if provided
    target_dict = {}
    if targets:
        try:
            target_dict = json.loads(targets)
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid targets JSON format"
            )
    
    try:
        calculator = OperationalKPICalculator(db)
        
        # Calculate operational KPIs
        inventory_kpis = await calculator.calculate_inventory_turnover_kpis(start_date, end_date, target_dict)
        stockout_kpis = await calculator.calculate_stockout_frequency_kpis(start_date, end_date, target_dict)
        carrying_cost_kpis = await calculator.calculate_carrying_cost_kpis(start_date, end_date, target_dict)
        dead_stock_kpis = await calculator.calculate_dead_stock_kpis(start_date, end_date, target_dict)
        
        result = {
            "inventory_turnover": inventory_kpis,
            "stockout_frequency": stockout_kpis,
            "carrying_costs": carrying_cost_kpis,
            "dead_stock": dead_stock_kpis,
            "period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "days": (end_date - start_date).days + 1
            },
            "targets": target_dict,
            "last_updated": datetime.utcnow().isoformat()
        }
        
        # Send real-time update to WebSocket clients
        await kpi_manager.send_kpi_update({
            "type": "operational_kpis",
            "data": result
        })
        
        return result
        
    except Exception as e:
        logger.error(f"Error calculating operational KPIs: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate operational KPIs: {str(e)}"
        )

@router.get("/customer", response_model=Dict[str, Any])
async def get_customer_kpis(
    start_date: Optional[date] = Query(None, description="Start date for KPI calculation"),
    end_date: Optional[date] = Query(None, description="End date for KPI calculation"),
    targets: Optional[str] = Query(None, description="JSON string of targets"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("view_reports"))
):
    """Get comprehensive customer KPIs including acquisition and retention metrics"""
    
    # Default to last 30 days if no date range provided
    if not end_date:
        end_date = date.today()
    if not start_date:
        start_date = end_date - timedelta(days=30)
    
    # Parse targets if provided
    target_dict = {}
    if targets:
        try:
            target_dict = json.loads(targets)
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid targets JSON format"
            )
    
    try:
        calculator = CustomerKPICalculator(db)
        
        # Calculate customer KPIs
        acquisition_kpis = await calculator.calculate_acquisition_rate_kpis(start_date, end_date, target_dict)
        retention_kpis = await calculator.calculate_retention_rate_kpis(start_date, end_date, target_dict)
        transaction_value_kpis = await calculator.calculate_avg_transaction_value_kpis(start_date, end_date, target_dict)
        lifetime_value_kpis = await calculator.calculate_customer_lifetime_value_kpis(start_date, end_date, target_dict)
        
        result = {
            "acquisition_rate": acquisition_kpis,
            "retention_rate": retention_kpis,
            "avg_transaction_value": transaction_value_kpis,
            "customer_lifetime_value": lifetime_value_kpis,
            "period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "days": (end_date - start_date).days + 1
            },
            "targets": target_dict,
            "last_updated": datetime.utcnow().isoformat()
        }
        
        # Send real-time update to WebSocket clients
        await kpi_manager.send_kpi_update({
            "type": "customer_kpis",
            "data": result
        })
        
        return result
        
    except Exception as e:
        logger.error(f"Error calculating customer KPIs: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate customer KPIs: {str(e)}"
        )

@router.get("/dashboard", response_model=Dict[str, Any])
async def get_kpi_dashboard(
    start_date: Optional[date] = Query(None, description="Start date for KPI calculation"),
    end_date: Optional[date] = Query(None, description="End date for KPI calculation"),
    targets: Optional[str] = Query(None, description="JSON string of targets"),
    include_trends: bool = Query(True, description="Include trend analysis"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("view_reports"))
):
    """Get comprehensive KPI dashboard with all metrics"""
    
    # Default to last 30 days if no date range provided
    if not end_date:
        end_date = date.today()
    if not start_date:
        start_date = end_date - timedelta(days=30)
    
    # Parse targets if provided
    target_dict = {}
    if targets:
        try:
            target_dict = json.loads(targets)
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid targets JSON format"
            )
    
    try:
        # Initialize calculators
        financial_calculator = FinancialKPICalculator(db)
        operational_calculator = OperationalKPICalculator(db)
        customer_calculator = CustomerKPICalculator(db)
        
        # Calculate all KPIs concurrently for better performance
        financial_task = asyncio.create_task(
            get_financial_kpis_data(financial_calculator, start_date, end_date, target_dict)
        )
        operational_task = asyncio.create_task(
            get_operational_kpis_data(operational_calculator, start_date, end_date, target_dict)
        )
        customer_task = asyncio.create_task(
            get_customer_kpis_data(customer_calculator, start_date, end_date, target_dict)
        )
        
        # Wait for all calculations to complete
        financial_data, operational_data, customer_data = await asyncio.gather(
            financial_task, operational_task, customer_task
        )
        
        # Calculate overall performance score
        overall_score = calculate_overall_performance_score(
            financial_data, operational_data, customer_data, target_dict
        )
        
        result = {
            "financial": financial_data,
            "operational": operational_data,
            "customer": customer_data,
            "overall_performance": overall_score,
            "period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "days": (end_date - start_date).days + 1
            },
            "targets": target_dict,
            "last_updated": datetime.utcnow().isoformat(),
            "include_trends": include_trends
        }
        
        # Send real-time update to WebSocket clients
        await kpi_manager.send_kpi_update({
            "type": "kpi_dashboard",
            "data": result
        })
        
        return result
        
    except Exception as e:
        logger.error(f"Error generating KPI dashboard: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate KPI dashboard: {str(e)}"
        )

@router.get("/compare", response_model=Dict[str, Any])
async def compare_kpi_periods(
    current_start: date = Query(..., description="Current period start date"),
    current_end: date = Query(..., description="Current period end date"),
    comparison_start: date = Query(..., description="Comparison period start date"),
    comparison_end: date = Query(..., description="Comparison period end date"),
    kpi_types: Optional[str] = Query("financial,operational,customer", description="Comma-separated KPI types to compare"),
    targets: Optional[str] = Query(None, description="JSON string of targets"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("view_reports"))
):
    """Compare KPIs between two time periods"""
    
    # Parse KPI types
    kpi_type_list = [t.strip() for t in kpi_types.split(",")]
    
    # Parse targets if provided
    target_dict = {}
    if targets:
        try:
            target_dict = json.loads(targets)
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid targets JSON format"
            )
    
    try:
        comparison_result = {}
        
        # Calculate KPIs for both periods
        if "financial" in kpi_type_list:
            financial_calculator = FinancialKPICalculator(db)
            current_financial = await get_financial_kpis_data(
                financial_calculator, current_start, current_end, target_dict
            )
            comparison_financial = await get_financial_kpis_data(
                financial_calculator, comparison_start, comparison_end, target_dict
            )
            
            comparison_result["financial"] = {
                "current": current_financial,
                "comparison": comparison_financial,
                "changes": calculate_kpi_changes(current_financial, comparison_financial)
            }
        
        if "operational" in kpi_type_list:
            operational_calculator = OperationalKPICalculator(db)
            current_operational = await get_operational_kpis_data(
                operational_calculator, current_start, current_end, target_dict
            )
            comparison_operational = await get_operational_kpis_data(
                operational_calculator, comparison_start, comparison_end, target_dict
            )
            
            comparison_result["operational"] = {
                "current": current_operational,
                "comparison": comparison_operational,
                "changes": calculate_kpi_changes(current_operational, comparison_operational)
            }
        
        if "customer" in kpi_type_list:
            customer_calculator = CustomerKPICalculator(db)
            current_customer = await get_customer_kpis_data(
                customer_calculator, current_start, current_end, target_dict
            )
            comparison_customer = await get_customer_kpis_data(
                customer_calculator, comparison_start, comparison_end, target_dict
            )
            
            comparison_result["customer"] = {
                "current": current_customer,
                "comparison": comparison_customer,
                "changes": calculate_kpi_changes(current_customer, comparison_customer)
            }
        
        result = {
            "comparison": comparison_result,
            "periods": {
                "current": {
                    "start_date": current_start.isoformat(),
                    "end_date": current_end.isoformat(),
                    "days": (current_end - current_start).days + 1
                },
                "comparison": {
                    "start_date": comparison_start.isoformat(),
                    "end_date": comparison_end.isoformat(),
                    "days": (comparison_end - comparison_start).days + 1
                }
            },
            "targets": target_dict,
            "calculated_at": datetime.utcnow().isoformat()
        }
        
        return result
        
    except Exception as e:
        logger.error(f"Error comparing KPI periods: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to compare KPI periods: {str(e)}"
        )

@router.post("/refresh")
async def refresh_kpi_cache(
    kpi_types: Optional[str] = Query("all", description="Comma-separated KPI types to refresh (all, financial, operational, customer)"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("manage_settings"))
):
    """Manually refresh KPI cache and send updates to connected clients"""
    
    kpi_type_list = [t.strip() for t in kpi_types.split(",")]
    
    try:
        refreshed_types = []
        
        # Default date range (last 30 days)
        end_date = date.today()
        start_date = end_date - timedelta(days=30)
        
        if "all" in kpi_type_list or "financial" in kpi_type_list:
            financial_calculator = FinancialKPICalculator(db)
            # Clear cache and recalculate
            await financial_calculator.cache.clear_kpi_cache("financial")
            financial_data = await get_financial_kpis_data(financial_calculator, start_date, end_date, {})
            
            # Send update to WebSocket clients
            await kpi_manager.send_kpi_update({
                "type": "financial_kpis_refresh",
                "data": financial_data
            })
            refreshed_types.append("financial")
        
        if "all" in kpi_type_list or "operational" in kpi_type_list:
            operational_calculator = OperationalKPICalculator(db)
            await operational_calculator.cache.clear_kpi_cache("operational")
            operational_data = await get_operational_kpis_data(operational_calculator, start_date, end_date, {})
            
            await kpi_manager.send_kpi_update({
                "type": "operational_kpis_refresh",
                "data": operational_data
            })
            refreshed_types.append("operational")
        
        if "all" in kpi_type_list or "customer" in kpi_type_list:
            customer_calculator = CustomerKPICalculator(db)
            await customer_calculator.cache.clear_kpi_cache("customer")
            customer_data = await get_customer_kpis_data(customer_calculator, start_date, end_date, {})
            
            await kpi_manager.send_kpi_update({
                "type": "customer_kpis_refresh",
                "data": customer_data
            })
            refreshed_types.append("customer")
        
        return {
            "message": "KPI cache refreshed successfully",
            "refreshed_types": refreshed_types,
            "refreshed_at": datetime.utcnow().isoformat(),
            "connected_clients": len(kpi_manager.active_connections)
        }
        
    except Exception as e:
        logger.error(f"Error refreshing KPI cache: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to refresh KPI cache: {str(e)}"
        )

# Helper functions
async def get_financial_kpis_data(calculator, start_date: date, end_date: date, targets: dict) -> dict:
    """Get financial KPIs data"""
    revenue_kpis = await calculator.calculate_revenue_kpis(start_date, end_date, targets)
    profit_kpis = await calculator.calculate_profit_margin_kpis(start_date, end_date, targets)
    
    achievement_kpis = {}
    if targets:
        achievement_kpis = await calculator.calculate_achievement_rate_kpis(start_date, end_date, targets)
    
    return {
        "revenue": revenue_kpis,
        "profit_margin": profit_kpis,
        "achievement": achievement_kpis
    }

async def get_operational_kpis_data(calculator, start_date: date, end_date: date, targets: dict) -> dict:
    """Get operational KPIs data"""
    inventory_kpis = await calculator.calculate_inventory_turnover_kpis(start_date, end_date, targets)
    stockout_kpis = await calculator.calculate_stockout_frequency_kpis(start_date, end_date, targets)
    carrying_cost_kpis = await calculator.calculate_carrying_cost_kpis(start_date, end_date, targets)
    dead_stock_kpis = await calculator.calculate_dead_stock_kpis(start_date, end_date, targets)
    
    return {
        "inventory_turnover": inventory_kpis,
        "stockout_frequency": stockout_kpis,
        "carrying_costs": carrying_cost_kpis,
        "dead_stock": dead_stock_kpis
    }

async def get_customer_kpis_data(calculator, start_date: date, end_date: date, targets: dict) -> dict:
    """Get customer KPIs data"""
    acquisition_kpis = await calculator.calculate_acquisition_rate_kpis(start_date, end_date, targets)
    retention_kpis = await calculator.calculate_retention_rate_kpis(start_date, end_date, targets)
    transaction_value_kpis = await calculator.calculate_avg_transaction_value_kpis(start_date, end_date, targets)
    lifetime_value_kpis = await calculator.calculate_customer_lifetime_value_kpis(start_date, end_date, targets)
    
    return {
        "acquisition_rate": acquisition_kpis,
        "retention_rate": retention_kpis,
        "avg_transaction_value": transaction_value_kpis,
        "customer_lifetime_value": lifetime_value_kpis
    }

def calculate_overall_performance_score(financial_data: dict, operational_data: dict, customer_data: dict, targets: dict) -> dict:
    """Calculate overall performance score based on all KPIs"""
    
    scores = []
    weights = {"financial": 0.4, "operational": 0.3, "customer": 0.3}
    
    # Financial score
    if financial_data.get("achievement") and targets:
        financial_score = financial_data["achievement"].get("overall_achievement_rate", 0)
        scores.append(("financial", financial_score, weights["financial"]))
    
    # Operational score (based on efficiency metrics)
    operational_score = 0
    if operational_data.get("inventory_turnover"):
        turnover_rate = operational_data["inventory_turnover"].get("turnover_rate", 0)
        # Normalize turnover rate to 0-100 scale (assuming good turnover is 4-12 times per year)
        operational_score = min(100, max(0, (turnover_rate / 8) * 100))
    scores.append(("operational", operational_score, weights["operational"]))
    
    # Customer score (based on retention and growth)
    customer_score = 0
    if customer_data.get("retention_rate"):
        retention_rate = customer_data["retention_rate"].get("retention_rate", 0)
        customer_score = retention_rate  # Already in percentage
    scores.append(("customer", customer_score, weights["customer"]))
    
    # Calculate weighted average
    total_weighted_score = sum(score * weight for _, score, weight in scores)
    total_weight = sum(weight for _, _, weight in scores)
    overall_score = total_weighted_score / total_weight if total_weight > 0 else 0
    
    # Determine performance level
    if overall_score >= 90:
        performance_level = "excellent"
    elif overall_score >= 75:
        performance_level = "good"
    elif overall_score >= 60:
        performance_level = "average"
    elif overall_score >= 40:
        performance_level = "below_average"
    else:
        performance_level = "poor"
    
    return {
        "overall_score": round(overall_score, 2),
        "performance_level": performance_level,
        "component_scores": {name: round(score, 2) for name, score, _ in scores},
        "weights": weights
    }

def calculate_kpi_changes(current_data: dict, comparison_data: dict) -> dict:
    """Calculate changes between two KPI datasets"""
    
    changes = {}
    
    def extract_numeric_values(data, prefix=""):
        """Recursively extract numeric values from nested dict"""
        values = {}
        for key, value in data.items():
            full_key = f"{prefix}.{key}" if prefix else key
            if isinstance(value, (int, float)):
                values[full_key] = value
            elif isinstance(value, dict):
                values.update(extract_numeric_values(value, full_key))
        return values
    
    current_values = extract_numeric_values(current_data)
    comparison_values = extract_numeric_values(comparison_data)
    
    for key in current_values:
        if key in comparison_values:
            current_val = current_values[key]
            comparison_val = comparison_values[key]
            
            if comparison_val != 0:
                change_percent = ((current_val - comparison_val) / comparison_val) * 100
                change_absolute = current_val - comparison_val
                
                changes[key] = {
                    "current": current_val,
                    "comparison": comparison_val,
                    "change_absolute": round(change_absolute, 2),
                    "change_percent": round(change_percent, 2),
                    "direction": "up" if change_percent > 0 else "down" if change_percent < 0 else "stable"
                }
    
    return changes