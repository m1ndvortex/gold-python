"""
Cost Analysis Service for Advanced Analytics

This service provides comprehensive cost optimization analysis including:
- Carrying costs, ordering costs, and stockout costs calculations
- Cost reduction strategy recommendations
- Inventory value monitoring and optimization
- Cost trend analysis and ROI calculations
"""

from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, text
import pandas as pd
import numpy as np
from dataclasses import dataclass

from models import Invoice, InvoiceItem, Category
from database import get_db


@dataclass
class CostBreakdown:
    """Detailed cost breakdown structure"""
    carrying_costs: Decimal
    ordering_costs: Decimal
    stockout_costs: Decimal
    total_costs: Decimal
    cost_per_unit: Decimal
    cost_percentage: float


@dataclass
class OptimizationRecommendation:
    """Cost optimization recommendation"""
    category: str
    current_cost: Decimal
    potential_savings: Decimal
    savings_percentage: float
    recommendation: str
    implementation_effort: str
    expected_roi: float
    timeline: str


@dataclass
class CostTrend:
    """Cost trend analysis data"""
    period: str
    total_cost: Decimal
    carrying_cost: Decimal
    ordering_cost: Decimal
    stockout_cost: Decimal
    trend_direction: str
    variance_percentage: float


class CostAnalysisService:
    """Service for comprehensive cost analysis and optimization"""
    
    def __init__(self, db_session: Session):
        self.db = db_session
        
    async def calculate_cost_breakdown(
        self, 
        category_id: Optional[str] = None,
        time_range: Optional[Tuple[datetime, datetime]] = None
    ) -> CostBreakdown:
        """
        Calculate detailed cost breakdown for inventory management
        
        Args:
            category_id: Optional category filter
            time_range: Optional time period filter
            
        Returns:
            CostBreakdown with detailed cost analysis
        """
        if not time_range:
            end_date = datetime.now()
            start_date = end_date - timedelta(days=30)
            time_range = (start_date, end_date)
        
        # Calculate carrying costs (storage, insurance, depreciation)
        carrying_costs = await self._calculate_carrying_costs(category_id, time_range)
        
        # Calculate ordering costs (procurement, processing, receiving)
        ordering_costs = await self._calculate_ordering_costs(category_id, time_range)
        
        # Calculate stockout costs (lost sales, customer dissatisfaction)
        stockout_costs = await self._calculate_stockout_costs(category_id, time_range)
        
        total_costs = carrying_costs + ordering_costs + stockout_costs
        
        # Calculate cost per unit
        total_units = await self._get_total_units_handled(category_id, time_range)
        cost_per_unit = total_costs / max(total_units, 1)
        
        # Calculate cost as percentage of revenue
        total_revenue = await self._get_total_revenue(category_id, time_range)
        cost_percentage = float(total_costs / max(total_revenue, 1) * 100)
        
        return CostBreakdown(
            carrying_costs=carrying_costs,
            ordering_costs=ordering_costs,
            stockout_costs=stockout_costs,
            total_costs=total_costs,
            cost_per_unit=cost_per_unit,
            cost_percentage=cost_percentage
        )
    
    async def generate_optimization_recommendations(
        self,
        category_id: Optional[str] = None
    ) -> List[OptimizationRecommendation]:
        """
        Generate cost optimization recommendations with quantified savings potential
        
        Args:
            category_id: Optional category filter
            
        Returns:
            List of optimization recommendations
        """
        recommendations = []
        
        # Analyze inventory turnover for carrying cost optimization
        turnover_rec = await self._analyze_inventory_turnover_optimization(category_id)
        if turnover_rec:
            recommendations.append(turnover_rec)
        
        # Analyze ordering patterns for ordering cost optimization
        ordering_rec = await self._analyze_ordering_optimization(category_id)
        if ordering_rec:
            recommendations.append(ordering_rec)
        
        # Analyze stockout patterns for service level optimization
        stockout_rec = await self._analyze_stockout_optimization(category_id)
        if stockout_rec:
            recommendations.append(stockout_rec)
        
        # Analyze dead stock for carrying cost reduction
        dead_stock_rec = await self._analyze_dead_stock_optimization(category_id)
        if dead_stock_rec:
            recommendations.append(dead_stock_rec)
        
        return sorted(recommendations, key=lambda x: x.potential_savings, reverse=True)
    
    async def analyze_cost_trends(
        self,
        periods: int = 12,
        category_id: Optional[str] = None
    ) -> List[CostTrend]:
        """
        Analyze cost trends over time to identify cost drivers
        
        Args:
            periods: Number of periods to analyze
            category_id: Optional category filter
            
        Returns:
            List of cost trends by period
        """
        trends = []
        end_date = datetime.now()
        
        for i in range(periods):
            period_end = end_date - timedelta(days=i * 30)
            period_start = period_end - timedelta(days=30)
            
            cost_breakdown = await self.calculate_cost_breakdown(
                category_id, (period_start, period_end)
            )
            
            # Calculate trend direction
            if i < periods - 1:
                prev_period_end = end_date - timedelta(days=(i + 1) * 30)
                prev_period_start = prev_period_end - timedelta(days=30)
                prev_breakdown = await self.calculate_cost_breakdown(
                    category_id, (prev_period_start, prev_period_end)
                )
                
                variance = float(
                    (cost_breakdown.total_costs - prev_breakdown.total_costs) / 
                    max(prev_breakdown.total_costs, 1) * 100
                )
                
                if variance > 5:
                    trend_direction = "increasing"
                elif variance < -5:
                    trend_direction = "decreasing"
                else:
                    trend_direction = "stable"
            else:
                variance = 0.0
                trend_direction = "stable"
            
            trends.append(CostTrend(
                period=period_start.strftime("%Y-%m"),
                total_cost=cost_breakdown.total_costs,
                carrying_cost=cost_breakdown.carrying_costs,
                ordering_cost=cost_breakdown.ordering_costs,
                stockout_cost=cost_breakdown.stockout_costs,
                trend_direction=trend_direction,
                variance_percentage=variance
            ))
        
        return list(reversed(trends))
    
    async def calculate_roi_analysis(
        self,
        investment_amount: Decimal,
        category_id: Optional[str] = None,
        time_horizon_months: int = 12
    ) -> Dict:
        """
        Calculate ROI analysis for different business decisions
        
        Args:
            investment_amount: Investment amount to analyze
            category_id: Optional category filter
            time_horizon_months: Analysis time horizon
            
        Returns:
            ROI analysis results
        """
        # Get current cost baseline
        current_costs = await self.calculate_cost_breakdown(category_id)
        
        # Project cost savings based on optimization recommendations
        recommendations = await self.generate_optimization_recommendations(category_id)
        total_potential_savings = sum(rec.potential_savings for rec in recommendations)
        
        # Calculate monthly savings
        monthly_savings = total_potential_savings / 12
        
        # Calculate ROI over time horizon
        total_savings = monthly_savings * time_horizon_months
        roi_percentage = float((total_savings - investment_amount) / max(investment_amount, 1) * 100)
        
        # Calculate payback period
        payback_months = float(investment_amount / max(monthly_savings, 1))
        
        return {
            "investment_amount": investment_amount,
            "monthly_savings": monthly_savings,
            "total_savings": total_savings,
            "roi_percentage": roi_percentage,
            "payback_months": payback_months,
            "net_present_value": total_savings - investment_amount,
            "recommendations_count": len(recommendations),
            "high_impact_recommendations": [
                rec for rec in recommendations if rec.potential_savings > total_potential_savings * 0.2
            ]
        }
    
    # Private helper methods
    
    async def _calculate_carrying_costs(
        self, 
        category_id: Optional[str], 
        time_range: Tuple[datetime, datetime]
    ) -> Decimal:
        """Calculate carrying costs including storage, insurance, depreciation"""
        # Use raw SQL to avoid model issues
        sql = """
        SELECT COALESCE(SUM(stock_quantity * purchase_price), 0) as total_value
        FROM inventory_items 
        WHERE is_active = true
        """
        
        params = {}
        if category_id:
            sql += " AND category_id = :category_id"
            params['category_id'] = category_id
            
        result = self.db.execute(text(sql), params).fetchone()
        total_inventory_value = Decimal(str(result[0] or 0))
        
        # Carrying cost rate (typically 20-30% annually)
        carrying_rate = Decimal('0.25')  # 25% annual carrying cost
        
        # Calculate carrying cost for the period
        days_in_period = (time_range[1] - time_range[0]).days
        carrying_cost = total_inventory_value * carrying_rate * (Decimal(str(days_in_period)) / Decimal('365'))
        
        return carrying_cost
    
    async def _calculate_ordering_costs(
        self, 
        category_id: Optional[str], 
        time_range: Tuple[datetime, datetime]
    ) -> Decimal:
        """Calculate ordering costs including procurement and processing"""
        # Use raw SQL to count orders (since we don't have purchase orders, use all invoices)
        sql = """
        SELECT COUNT(*) as order_count
        FROM invoices 
        WHERE created_at >= :start_date 
        AND created_at <= :end_date
        AND status = 'completed'
        """
        
        params = {
            'start_date': time_range[0],
            'end_date': time_range[1]
        }
        
        if category_id:
            sql += """
            AND EXISTS (
                SELECT 1 FROM invoice_items ii 
                JOIN inventory_items inv ON ii.inventory_item_id = inv.id
                WHERE ii.invoice_id = invoices.id AND inv.category_id = :category_id
            )
            """
            params['category_id'] = category_id
            
        result = self.db.execute(text(sql), params).fetchone()
        order_count = result[0] or 0
        
        # Estimated cost per order (processing, receiving, etc.)
        # Use a smaller amount since these are sales orders, not purchase orders
        cost_per_order = Decimal('25.00')
        
        return order_count * cost_per_order
    
    async def _calculate_stockout_costs(
        self, 
        category_id: Optional[str], 
        time_range: Tuple[datetime, datetime]
    ) -> Decimal:
        """Calculate stockout costs from lost sales"""
        # Use raw SQL to count out of stock items
        sql = """
        SELECT COUNT(*) as out_of_stock_count
        FROM inventory_items 
        WHERE stock_quantity = 0 AND is_active = true
        """
        
        params = {}
        if category_id:
            sql += " AND category_id = :category_id"
            params['category_id'] = category_id
            
        result = self.db.execute(text(sql), params).fetchone()
        out_of_stock_count = result[0] or 0
        
        # Estimate stockout cost based on average item value
        if out_of_stock_count > 0:
            avg_item_sql = """
            SELECT COALESCE(AVG(purchase_price), 0) as avg_price
            FROM inventory_items 
            WHERE is_active = true
            """
            if category_id:
                avg_item_sql += " AND category_id = :category_id"
                
            avg_result = self.db.execute(text(avg_item_sql), params).fetchone()
            avg_price = Decimal(str(avg_result[0] or 0))
            
            # Estimate lost sales: out of stock items * average price * profit margin * days
            stockout_days = 3  # Average stockout duration
            profit_margin = Decimal('0.25')  # 25% profit margin
            
            total_stockout_cost = out_of_stock_count * avg_price * profit_margin * stockout_days
            return total_stockout_cost
        
        return Decimal('0')
    
    async def _get_total_units_handled(
        self, 
        category_id: Optional[str], 
        time_range: Tuple[datetime, datetime]
    ) -> int:
        """Get total units sold/handled during period"""
        sql = """
        SELECT COALESCE(SUM(ii.quantity), 0) as total_units
        FROM invoice_items ii
        JOIN invoices i ON ii.invoice_id = i.id
        WHERE i.created_at >= :start_date 
        AND i.created_at <= :end_date
        AND i.status = 'completed'
        """
        
        params = {
            'start_date': time_range[0],
            'end_date': time_range[1]
        }
        
        if category_id:
            sql += """
            AND ii.inventory_item_id IN (
                SELECT id FROM inventory_items WHERE category_id = :category_id
            )
            """
            params['category_id'] = category_id
            
        result = self.db.execute(text(sql), params).fetchone()
        return int(result[0] or 0)
    
    async def _get_total_revenue(
        self, 
        category_id: Optional[str], 
        time_range: Tuple[datetime, datetime]
    ) -> Decimal:
        """Get total revenue during period"""
        sql = """
        SELECT COALESCE(SUM(i.total_amount), 0) as total_revenue
        FROM invoices i
        WHERE i.created_at >= :start_date 
        AND i.created_at <= :end_date
        AND i.status = 'completed'
        """
        
        params = {
            'start_date': time_range[0],
            'end_date': time_range[1]
        }
        
        if category_id:
            sql += """
            AND EXISTS (
                SELECT 1 FROM invoice_items ii 
                JOIN inventory_items inv ON ii.inventory_item_id = inv.id
                WHERE ii.invoice_id = i.id AND inv.category_id = :category_id
            )
            """
            params['category_id'] = category_id
            
        result = self.db.execute(text(sql), params).fetchone()
        return Decimal(str(result[0] or 0))
    

    
    async def _analyze_inventory_turnover_optimization(
        self, 
        category_id: Optional[str]
    ) -> Optional[OptimizationRecommendation]:
        """Analyze inventory turnover for optimization opportunities"""
        # Use raw SQL to get inventory value
        sql = """
        SELECT COALESCE(SUM(stock_quantity * purchase_price), 0) as total_value,
               COUNT(*) as item_count
        FROM inventory_items 
        WHERE is_active = true AND stock_quantity > 0
        """
        
        params = {}
        if category_id:
            sql += " AND category_id = :category_id"
            params['category_id'] = category_id
            
        result = self.db.execute(text(sql), params).fetchone()
        total_inventory_value = Decimal(str(result[0] or 0))
        item_count = result[1] or 0
        
        if total_inventory_value > 0 and item_count > 0:
            # Assume 30% of inventory is slow-moving
            slow_moving_value = total_inventory_value * Decimal('0.3')
            potential_savings = slow_moving_value * Decimal('0.15')  # 15% carrying cost savings
            
            return OptimizationRecommendation(
                category="Inventory Turnover",
                current_cost=slow_moving_value,
                potential_savings=potential_savings,
                savings_percentage=15.0,
                recommendation="Reduce slow-moving inventory through promotions or liquidation",
                implementation_effort="Medium",
                expected_roi=2.5,
                timeline="3-6 months"
            )
        
        return None
    
    async def _analyze_ordering_optimization(
        self, 
        category_id: Optional[str]
    ) -> Optional[OptimizationRecommendation]:
        """Analyze ordering patterns for cost optimization"""
        # This would analyze order frequency and quantities
        # For now, return a generic recommendation
        
        return OptimizationRecommendation(
            category="Ordering Optimization",
            current_cost=Decimal('5000'),
            potential_savings=Decimal('750'),
            savings_percentage=15.0,
            recommendation="Consolidate orders and negotiate volume discounts",
            implementation_effort="Low",
            expected_roi=3.0,
            timeline="1-3 months"
        )
    
    async def _analyze_stockout_optimization(
        self, 
        category_id: Optional[str]
    ) -> Optional[OptimizationRecommendation]:
        """Analyze stockout patterns for optimization"""
        # Use raw SQL to count stockouts
        sql = """
        SELECT COUNT(*) as stockout_count
        FROM inventory_items 
        WHERE stock_quantity = 0 AND is_active = true
        """
        
        params = {}
        if category_id:
            sql += " AND category_id = :category_id"
            params['category_id'] = category_id
            
        result = self.db.execute(text(sql), params).fetchone()
        stockout_count = result[0] or 0
        
        if stockout_count > 0:
            estimated_lost_sales = stockout_count * Decimal('500')  # Estimated lost sales per stockout
            
            return OptimizationRecommendation(
                category="Stockout Prevention",
                current_cost=estimated_lost_sales,
                potential_savings=estimated_lost_sales * Decimal('0.8'),
                savings_percentage=80.0,
                recommendation="Implement better demand forecasting and safety stock levels",
                implementation_effort="High",
                expected_roi=4.0,
                timeline="6-12 months"
            )
        
        return None
    
    async def _analyze_dead_stock_optimization(
        self, 
        category_id: Optional[str]
    ) -> Optional[OptimizationRecommendation]:
        """Analyze dead stock for carrying cost reduction"""
        # Use raw SQL to estimate dead stock value
        sql = """
        SELECT COALESCE(SUM(stock_quantity * purchase_price), 0) as total_value
        FROM inventory_items 
        WHERE stock_quantity > 0 AND is_active = true
        """
        
        params = {}
        if category_id:
            sql += " AND category_id = :category_id"
            params['category_id'] = category_id
            
        result = self.db.execute(text(sql), params).fetchone()
        total_inventory_value = Decimal(str(result[0] or 0))
        
        if total_inventory_value > 0:
            # Assume 20% of inventory is dead stock
            dead_stock_value = total_inventory_value * Decimal('0.2')
            potential_savings = dead_stock_value * Decimal('0.25')  # 25% carrying cost
            
            return OptimizationRecommendation(
                category="Dead Stock Reduction",
                current_cost=dead_stock_value,
                potential_savings=potential_savings,
                savings_percentage=25.0,
                recommendation="Liquidate dead stock through clearance sales or returns",
                implementation_effort="Medium",
                expected_roi=1.5,
                timeline="2-4 months"
            )
        
        return None