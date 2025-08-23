"""
Stock Optimization Recommendation Engine

This service provides stock optimization recommendations including:
- Safety stock calculations with service level optimization
- Reorder point determination algorithms with lead time considerations
- Economic order quantity optimization with cost minimization

Requirements covered: 4.1, 4.2, 4.3, 4.4, 4.5
"""

import math
import numpy as np
from datetime import datetime, timedelta, date
from typing import List, Dict, Optional, Tuple, Any
from decimal import Decimal
from dataclasses import dataclass
from sqlalchemy.orm import Session
from sqlalchemy import text
import logging

logger = logging.getLogger(__name__)

@dataclass
class StockOptimizationRecommendation:
    """Stock optimization recommendation result"""
    item_id: str
    item_name: str
    recommendation_type: str  # 'reorder', 'reduce', 'increase', 'discontinue'
    current_stock: int
    recommended_stock: Optional[int]
    reorder_point: Optional[int]
    reorder_quantity: Optional[int]
    safety_stock: Optional[int]
    max_stock_level: Optional[int]
    economic_order_quantity: Optional[int]
    lead_time_days: int
    holding_cost_per_unit: Decimal
    ordering_cost: Decimal
    stockout_cost: Decimal
    confidence_score: float
    reasoning: str
    priority_level: str  # 'high', 'medium', 'low'
    estimated_savings: Decimal
    implementation_date: date

@dataclass
class EOQCalculation:
    """Economic Order Quantity calculation result"""
    item_id: str
    economic_order_quantity: int
    annual_demand: float
    ordering_cost: Decimal
    holding_cost_per_unit: Decimal
    total_annual_cost: Decimal
    order_frequency: float  # Orders per year
    cycle_time_days: float  # Days between orders

@dataclass
class ReorderPointCalculation:
    """Reorder point calculation result"""
    item_id: str
    reorder_point: int
    lead_time_days: int
    average_daily_demand: float
    safety_stock: int
    service_level: float
    demand_variability: float
    stockout_probability: float

class StockOptimizationService:
    """
    Advanced stock optimization service with multiple algorithms
    """
    
    def __init__(self, db_session: Session):
        self.db = db_session
        
        # Default cost parameters (can be configured per item)
        self.default_holding_cost_rate = 0.25  # 25% of item value per year
        self.default_ordering_cost = Decimal('50.00')  # Fixed cost per order
        self.default_stockout_cost_multiplier = 2.0  # 2x profit margin
        self.default_lead_time_days = 7
        self.default_service_level = 0.95  # 95% service level
    
    async def generate_stock_recommendations(
        self,
        item_ids: Optional[List[str]] = None,
        category_ids: Optional[List[str]] = None,
        priority_filter: Optional[str] = None
    ) -> List[StockOptimizationRecommendation]:
        """
        Generate stock optimization recommendations for items
        
        Args:
            item_ids: Specific item IDs to analyze (optional)
            category_ids: Category IDs to analyze (optional)
            priority_filter: Filter by priority level ('high', 'medium', 'low')
            
        Returns:
            List of stock optimization recommendations
        """
        try:
            # Get items to analyze
            items_data = self._get_items_for_analysis(item_ids, category_ids)
            
            recommendations = []
            
            for item_data in items_data:
                try:
                    # Get historical sales data
                    sales_data = self._get_item_sales_data(item_data['id'])
                    
                    if len(sales_data) < 5:  # Need minimum data for analysis
                        continue
                    
                    # Calculate demand statistics
                    demand_stats = self._calculate_demand_statistics(sales_data)
                    
                    # Calculate EOQ
                    eoq_result = await self._calculate_economic_order_quantity(
                        item_data, demand_stats
                    )
                    
                    # Calculate reorder point
                    reorder_result = await self._calculate_reorder_point(
                        item_data, demand_stats
                    )
                    
                    # Generate recommendation
                    recommendation = await self._generate_item_recommendation(
                        item_data, demand_stats, eoq_result, reorder_result
                    )
                    
                    if recommendation and (not priority_filter or recommendation.priority_level == priority_filter):
                        recommendations.append(recommendation)
                        
                except Exception as e:
                    logger.warning(f"Error analyzing item {item_data['id']}: {str(e)}")
                    continue
            
            # Sort by priority and estimated savings
            recommendations.sort(
                key=lambda x: (
                    {'high': 0, 'medium': 1, 'low': 2}[x.priority_level],
                    -float(x.estimated_savings)
                )
            )
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error generating stock recommendations: {str(e)}")
            raise
    
    async def calculate_safety_stock_optimization(
        self,
        item_id: str,
        target_service_levels: List[float] = [0.90, 0.95, 0.99]
    ) -> List[Dict[str, Any]]:
        """
        Calculate safety stock for different service levels with cost analysis
        
        Args:
            item_id: UUID of the inventory item
            target_service_levels: List of service levels to analyze
            
        Returns:
            List of safety stock calculations with cost analysis
        """
        try:
            # Get item data and sales history
            item_data = await self._get_item_data(item_id)
            sales_data = await self._get_item_sales_data(item_id)
            
            if len(sales_data) < 5:
                raise ValueError(f"Insufficient sales data for item {item_id}")
            
            demand_stats = self._calculate_demand_statistics(sales_data)
            
            results = []
            
            for service_level in target_service_levels:
                # Calculate safety stock using normal distribution
                from scipy.stats import norm
                z_score = norm.ppf(service_level)
                
                lead_time_days = item_data.get('lead_time_days', self.default_lead_time_days)
                safety_stock = max(0, int(z_score * math.sqrt(lead_time_days) * demand_stats['std_dev']))
                
                # Calculate costs
                holding_cost_per_unit = Decimal(str(item_data['purchase_price'])) * Decimal(str(self.default_holding_cost_rate))
                annual_holding_cost = safety_stock * holding_cost_per_unit
                
                # Estimate stockout cost (simplified)
                stockout_probability = 1 - service_level
                profit_per_unit = Decimal(str(item_data.get('sell_price', item_data['purchase_price'] * 1.5))) - Decimal(str(item_data['purchase_price']))
                annual_stockout_cost = (
                    stockout_probability * 
                    demand_stats['annual_demand'] * 
                    profit_per_unit * 
                    Decimal(str(self.default_stockout_cost_multiplier))
                )
                
                total_cost = annual_holding_cost + annual_stockout_cost
                
                results.append({
                    'service_level': service_level,
                    'safety_stock': safety_stock,
                    'annual_holding_cost': float(annual_holding_cost),
                    'annual_stockout_cost': float(annual_stockout_cost),
                    'total_annual_cost': float(total_cost),
                    'stockout_probability': stockout_probability
                })
            
            return results
            
        except Exception as e:
            logger.error(f"Error calculating safety stock optimization for item {item_id}: {str(e)}")
            raise
    
    async def calculate_economic_order_quantity(
        self,
        item_id: str,
        ordering_cost: Optional[Decimal] = None,
        holding_cost_rate: Optional[float] = None
    ) -> EOQCalculation:
        """
        Calculate Economic Order Quantity with cost minimization
        
        Args:
            item_id: UUID of the inventory item
            ordering_cost: Cost per order (optional)
            holding_cost_rate: Annual holding cost as percentage of item value (optional)
            
        Returns:
            EOQ calculation result
        """
        try:
            # Get item data and sales history
            item_data = await self._get_item_data(item_id)
            sales_data = await self._get_item_sales_data(item_id)
            
            if len(sales_data) < 5:
                raise ValueError(f"Insufficient sales data for item {item_id}")
            
            demand_stats = self._calculate_demand_statistics(sales_data)
            
            # Use provided costs or defaults
            ordering_cost = ordering_cost or self.default_ordering_cost
            holding_cost_rate = holding_cost_rate or self.default_holding_cost_rate
            
            # Calculate holding cost per unit per year
            item_value = Decimal(str(item_data['purchase_price']))
            holding_cost_per_unit = item_value * Decimal(str(holding_cost_rate))
            
            # EOQ formula: sqrt(2 * D * S / H)
            # D = annual demand, S = ordering cost, H = holding cost per unit per year
            annual_demand = demand_stats['annual_demand']
            
            if holding_cost_per_unit <= 0:
                raise ValueError("Holding cost per unit must be positive")
            
            eoq = math.sqrt(
                (2 * annual_demand * float(ordering_cost)) / float(holding_cost_per_unit)
            )
            eoq = max(1, int(round(eoq)))
            
            # Calculate total annual cost
            annual_ordering_cost = (annual_demand / eoq) * ordering_cost
            annual_holding_cost = (eoq / 2) * holding_cost_per_unit
            total_annual_cost = annual_ordering_cost + annual_holding_cost
            
            # Calculate order frequency and cycle time
            order_frequency = annual_demand / eoq  # Orders per year
            cycle_time_days = 365 / order_frequency  # Days between orders
            
            return EOQCalculation(
                item_id=item_id,
                economic_order_quantity=eoq,
                annual_demand=annual_demand,
                ordering_cost=ordering_cost,
                holding_cost_per_unit=holding_cost_per_unit,
                total_annual_cost=total_annual_cost,
                order_frequency=order_frequency,
                cycle_time_days=cycle_time_days
            )
            
        except Exception as e:
            logger.error(f"Error calculating EOQ for item {item_id}: {str(e)}")
            raise
    
    async def calculate_reorder_point_with_lead_time(
        self,
        item_id: str,
        lead_time_days: Optional[int] = None,
        service_level: Optional[float] = None
    ) -> ReorderPointCalculation:
        """
        Calculate reorder point with lead time considerations
        
        Args:
            item_id: UUID of the inventory item
            lead_time_days: Lead time in days (optional)
            service_level: Desired service level (optional)
            
        Returns:
            Reorder point calculation result
        """
        try:
            # Get item data and sales history
            item_data = await self._get_item_data(item_id)
            sales_data = await self._get_item_sales_data(item_id)
            
            if len(sales_data) < 5:
                raise ValueError(f"Insufficient sales data for item {item_id}")
            
            demand_stats = self._calculate_demand_statistics(sales_data)
            
            # Use provided parameters or defaults
            lead_time_days = lead_time_days or item_data.get('lead_time_days', self.default_lead_time_days)
            service_level = service_level or self.default_service_level
            
            # Calculate average demand during lead time
            average_daily_demand = demand_stats['avg_daily_demand']
            lead_time_demand = average_daily_demand * lead_time_days
            
            # Calculate safety stock
            from scipy.stats import norm
            z_score = norm.ppf(service_level)
            demand_std_dev = demand_stats['std_dev']
            safety_stock = max(0, int(z_score * math.sqrt(lead_time_days) * demand_std_dev))
            
            # Reorder point = Lead time demand + Safety stock
            reorder_point = max(1, int(lead_time_demand + safety_stock))
            
            # Calculate stockout probability
            if demand_std_dev > 0:
                current_z = safety_stock / (math.sqrt(lead_time_days) * demand_std_dev)
                stockout_probability = 1 - norm.cdf(current_z)
            else:
                stockout_probability = 0.0
            
            return ReorderPointCalculation(
                item_id=item_id,
                reorder_point=reorder_point,
                lead_time_days=lead_time_days,
                average_daily_demand=average_daily_demand,
                safety_stock=safety_stock,
                service_level=service_level,
                demand_variability=demand_std_dev,
                stockout_probability=stockout_probability
            )
            
        except Exception as e:
            logger.error(f"Error calculating reorder point for item {item_id}: {str(e)}")
            raise
    
    def _get_items_for_analysis(
        self,
        item_ids: Optional[List[str]] = None,
        category_ids: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """Get items for stock optimization analysis"""
        
        base_query = """
            SELECT 
                i.id,
                i.name,
                i.stock_quantity,
                i.purchase_price,
                c.name as category_name
            FROM inventory_items i
            LEFT JOIN categories c ON i.category_id = c.id
            WHERE i.is_active = true
        """
        
        params = {}
        conditions = []
        
        if item_ids:
            conditions.append("i.id = ANY(:item_ids)")
            params['item_ids'] = item_ids
        
        if category_ids:
            conditions.append("i.category_id = ANY(:category_ids)")
            params['category_ids'] = category_ids
        
        if conditions:
            base_query += " AND " + " AND ".join(conditions)
        
        base_query += " ORDER BY i.name"
        
        query = text(base_query)
        result = self.db.execute(query, params)
        
        return [
            {
                'id': str(row.id),
                'name': row.name,
                'stock_quantity': row.stock_quantity,
                'purchase_price': float(row.purchase_price),
                'category_name': row.category_name,
                'sell_price': float(row.purchase_price) * 1.5  # Default markup
            }
            for row in result
        ]
    
    def _get_item_data(self, item_id: str) -> Dict[str, Any]:
        """Get individual item data"""
        query = text("""
            SELECT 
                i.id,
                i.name,
                i.stock_quantity,
                i.purchase_price,
                c.name as category_name
            FROM inventory_items i
            LEFT JOIN categories c ON i.category_id = c.id
            WHERE i.id = :item_id AND i.is_active = true
        """)
        
        result = self.db.execute(query, {'item_id': item_id}).first()
        
        if not result:
            raise ValueError(f"Item {item_id} not found")
        
        return {
            'id': str(result.id),
            'name': result.name,
            'stock_quantity': result.stock_quantity,
            'purchase_price': float(result.purchase_price),
            'category_name': result.category_name,
            'sell_price': float(result.purchase_price) * 1.5  # Default markup
        }
    
    def _get_item_sales_data(self, item_id: str) -> List[Dict[str, Any]]:
        """Get historical sales data for an item"""
        query = text("""
            SELECT 
                DATE(i.created_at) as sale_date,
                SUM(ii.quantity) as quantity,
                SUM(ii.total_price) as total_value,
                AVG(ii.unit_price) as avg_price
            FROM invoice_items ii
            JOIN invoices i ON ii.invoice_id = i.id
            WHERE ii.inventory_item_id = :item_id
                AND i.status = 'completed'
                AND i.created_at >= CURRENT_DATE - INTERVAL '365 days'
            GROUP BY DATE(i.created_at)
            ORDER BY sale_date ASC
        """)
        
        result = self.db.execute(query, {'item_id': item_id})
        
        return [
            {
                'sale_date': row.sale_date,
                'quantity': float(row.quantity),
                'total_value': float(row.total_value),
                'avg_price': float(row.avg_price)
            }
            for row in result
        ]
    
    def _calculate_demand_statistics(self, sales_data: List[Dict[str, Any]]) -> Dict[str, float]:
        """Calculate demand statistics from sales data"""
        if not sales_data:
            return {
                'avg_daily_demand': 0.0,
                'std_dev': 0.0,
                'annual_demand': 0.0,
                'total_sales': 0.0
            }
        
        quantities = [record['quantity'] for record in sales_data]
        
        # Calculate statistics
        avg_daily_demand = np.mean(quantities)
        std_dev = np.std(quantities)
        total_sales = sum(quantities)
        
        # Estimate annual demand based on available data
        days_of_data = len(sales_data)
        if days_of_data > 0:
            annual_demand = (total_sales / days_of_data) * 365
        else:
            annual_demand = 0.0
        
        return {
            'avg_daily_demand': float(avg_daily_demand),
            'std_dev': float(std_dev),
            'annual_demand': float(annual_demand),
            'total_sales': float(total_sales)
        }
    
    async def _calculate_economic_order_quantity(
        self,
        item_data: Dict[str, Any],
        demand_stats: Dict[str, float]
    ) -> EOQCalculation:
        """Calculate EOQ for an item"""
        return await self.calculate_economic_order_quantity(item_data['id'])
    
    async def _calculate_reorder_point(
        self,
        item_data: Dict[str, Any],
        demand_stats: Dict[str, float]
    ) -> ReorderPointCalculation:
        """Calculate reorder point for an item"""
        return await self.calculate_reorder_point_with_lead_time(item_data['id'])
    
    async def _generate_item_recommendation(
        self,
        item_data: Dict[str, Any],
        demand_stats: Dict[str, float],
        eoq_result: EOQCalculation,
        reorder_result: ReorderPointCalculation
    ) -> Optional[StockOptimizationRecommendation]:
        """Generate stock optimization recommendation for an item"""
        
        current_stock = item_data['stock_quantity']
        item_name = item_data['name']
        
        # Determine recommendation type and priority
        recommendation_type = 'maintain'
        priority_level = 'low'
        reasoning = "Current stock levels are optimal."
        estimated_savings = Decimal('0.00')
        
        # Check if reorder is needed
        if current_stock <= reorder_result.reorder_point:
            recommendation_type = 'reorder'
            priority_level = 'high'
            reasoning = f"Stock level ({current_stock}) is at or below reorder point ({reorder_result.reorder_point}). Immediate reorder recommended."
            
            # Estimate savings from avoiding stockout
            profit_per_unit = Decimal(str(item_data.get('sell_price', item_data['purchase_price'] * 1.5))) - Decimal(str(item_data['purchase_price']))
            estimated_savings = profit_per_unit * Decimal(str(demand_stats['avg_daily_demand'] * 7))  # Weekly demand
        
        # Check if stock is too high
        elif current_stock > eoq_result.economic_order_quantity * 2:
            recommendation_type = 'reduce'
            priority_level = 'medium'
            excess_stock = current_stock - eoq_result.economic_order_quantity
            reasoning = f"Stock level ({current_stock}) is significantly higher than optimal ({eoq_result.economic_order_quantity}). Consider reducing by {excess_stock} units."
            
            # Estimate savings from reduced holding costs
            holding_cost_per_unit = Decimal(str(item_data['purchase_price'])) * Decimal(str(self.default_holding_cost_rate))
            estimated_savings = holding_cost_per_unit * Decimal(str(excess_stock))
        
        # Check for slow-moving items
        elif demand_stats['avg_daily_demand'] < 0.1:  # Less than 1 unit per 10 days
            recommendation_type = 'discontinue'
            priority_level = 'low'
            reasoning = f"Very low demand ({demand_stats['avg_daily_demand']:.2f} units/day). Consider discontinuing or reducing stock."
            
            # Estimate savings from reduced holding costs
            holding_cost_per_unit = Decimal(str(item_data['purchase_price'])) * Decimal(str(self.default_holding_cost_rate))
            estimated_savings = holding_cost_per_unit * Decimal(str(current_stock * 0.5))  # Assume 50% reduction
        
        # Skip if no action needed
        if recommendation_type == 'maintain':
            return None
        
        # Calculate confidence score based on data quality
        confidence_score = min(1.0, len(demand_stats) / 30)  # Higher confidence with more data
        if demand_stats['std_dev'] > 0:
            cv = demand_stats['std_dev'] / max(demand_stats['avg_daily_demand'], 0.1)  # Coefficient of variation
            confidence_score *= max(0.3, 1 - cv)  # Lower confidence with high variability
        
        return StockOptimizationRecommendation(
            item_id=item_data['id'],
            item_name=item_name,
            recommendation_type=recommendation_type,
            current_stock=current_stock,
            recommended_stock=eoq_result.economic_order_quantity if recommendation_type != 'discontinue' else 0,
            reorder_point=reorder_result.reorder_point,
            reorder_quantity=eoq_result.economic_order_quantity,
            safety_stock=reorder_result.safety_stock,
            max_stock_level=eoq_result.economic_order_quantity * 2,
            economic_order_quantity=eoq_result.economic_order_quantity,
            lead_time_days=reorder_result.lead_time_days,
            holding_cost_per_unit=eoq_result.holding_cost_per_unit,
            ordering_cost=eoq_result.ordering_cost,
            stockout_cost=Decimal(str(item_data.get('sell_price', item_data['purchase_price'] * 1.5))) * Decimal(str(self.default_stockout_cost_multiplier)),
            confidence_score=confidence_score,
            reasoning=reasoning,
            priority_level=priority_level,
            estimated_savings=estimated_savings,
            implementation_date=datetime.now().date() + timedelta(days=1)
        )