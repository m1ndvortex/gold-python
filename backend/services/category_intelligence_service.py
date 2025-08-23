"""
Category Intelligence Service

Provides intelligent analysis of category performance, seasonal patterns,
and cross-selling opportunities for the gold shop management system.
"""

from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, desc, asc
from dataclasses import dataclass
import pandas as pd
import numpy as np
from scipy import stats
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

from models import Category, InventoryItem, Invoice, InvoiceItem, Customer
from database import get_db


@dataclass
class CategoryPerformance:
    """Category performance metrics"""
    category_id: str
    category_name: str
    total_revenue: Decimal
    total_quantity_sold: int
    avg_transaction_value: Decimal
    profit_margin: Decimal
    velocity_score: float
    performance_tier: str  # 'fast', 'medium', 'slow', 'dead'
    contribution_percentage: float
    trend_direction: str  # 'up', 'down', 'stable'
    trend_percentage: float


@dataclass
class SeasonalPattern:
    """Seasonal analysis results"""
    category_id: str
    category_name: str
    seasonal_index: Dict[str, float]  # month -> seasonal factor
    peak_months: List[str]
    low_months: List[str]
    seasonality_strength: float  # 0-1, how seasonal the category is
    forecast_next_month: float
    confidence_interval: Tuple[float, float]


@dataclass
class CrossSellingOpportunity:
    """Cross-selling recommendation"""
    primary_category_id: str
    primary_category_name: str
    recommended_category_id: str
    recommended_category_name: str
    confidence_score: float
    lift_ratio: float  # How much more likely together vs separate
    support: float  # How often they appear together
    expected_revenue_increase: Decimal


class CategoryIntelligenceService:
    """Service for category performance analysis and intelligence"""
    
    def __init__(self, db: Session):
        self.db = db
    
    async def analyze_category_performance(
        self, 
        start_date: datetime, 
        end_date: datetime,
        min_transactions: int = 5
    ) -> List[CategoryPerformance]:
        """
        Analyze category performance with fast/slow mover identification
        
        Args:
            start_date: Analysis period start
            end_date: Analysis period end  
            min_transactions: Minimum transactions to include category
            
        Returns:
            List of category performance metrics
        """
        # Get category sales data
        query = (
            self.db.query(
                Category.id,
                Category.name,
                func.sum(InvoiceItem.total_price).label('total_revenue'),
                func.sum(InvoiceItem.quantity).label('total_quantity'),
                func.count(Invoice.id).label('transaction_count'),
                func.avg(InvoiceItem.total_price).label('avg_item_value'),
                func.sum(InvoiceItem.total_price - (InvoiceItem.quantity * InventoryItem.purchase_price)).label('total_profit')
            )
            .join(InventoryItem, Category.id == InventoryItem.category_id)
            .join(InvoiceItem, InventoryItem.id == InvoiceItem.inventory_item_id)
            .join(Invoice, InvoiceItem.invoice_id == Invoice.id)
            .filter(
                and_(
                    Invoice.created_at >= start_date,
                    Invoice.created_at <= end_date,
                    Invoice.status == 'completed'
                )
            )
            .group_by(Category.id, Category.name)
            .having(func.count(Invoice.id) >= min_transactions)
        )
        
        results = query.all()
        
        if not results:
            return []
        
        # Calculate total revenue for contribution percentage
        total_revenue = sum(r.total_revenue for r in results)
        
        # Calculate velocity scores and performance tiers
        performances = []
        revenue_values = [float(r.total_revenue) for r in results]
        quantity_values = [r.total_quantity for r in results]
        
        # Use quartiles for performance tiers
        revenue_q75, revenue_q50, revenue_q25 = np.percentile(revenue_values, [75, 50, 25])
        quantity_q75, quantity_q50, quantity_q25 = np.percentile(quantity_values, [75, 50, 25])
        
        for result in results:
            # Calculate velocity score (combination of revenue and quantity)
            revenue_score = self._calculate_percentile_score(float(result.total_revenue), revenue_values)
            quantity_score = self._calculate_percentile_score(result.total_quantity, quantity_values)
            velocity_score = (revenue_score * 0.6 + quantity_score * 0.4)  # Weight revenue more
            
            # Determine performance tier
            if float(result.total_revenue) >= revenue_q75 and result.total_quantity >= quantity_q75:
                tier = 'fast'
            elif float(result.total_revenue) >= revenue_q50 and result.total_quantity >= quantity_q50:
                tier = 'medium'
            elif float(result.total_revenue) >= revenue_q25 or result.total_quantity >= quantity_q25:
                tier = 'slow'
            else:
                tier = 'dead'
            
            # Calculate trend (compare with previous period)
            trend_direction, trend_percentage = await self._calculate_category_trend(
                str(result.id), start_date, end_date
            )
            
            # Calculate profit margin
            profit_margin = (float(result.total_profit) / float(result.total_revenue) * 100) if result.total_revenue > 0 else 0
            
            performance = CategoryPerformance(
                category_id=str(result.id),
                category_name=result.name,
                total_revenue=result.total_revenue,
                total_quantity_sold=result.total_quantity,
                avg_transaction_value=result.avg_item_value or Decimal('0'),
                profit_margin=Decimal(str(profit_margin)),
                velocity_score=velocity_score,
                performance_tier=tier,
                contribution_percentage=float(result.total_revenue) / float(total_revenue) * 100,
                trend_direction=trend_direction,
                trend_percentage=trend_percentage
            )
            performances.append(performance)
        
        # Sort by velocity score descending
        performances.sort(key=lambda x: x.velocity_score, reverse=True)
        
        return performances
    
    async def analyze_seasonal_patterns(
        self,
        category_id: Optional[str] = None,
        months_back: int = 24
    ) -> List[SeasonalPattern]:
        """
        Analyze seasonal patterns for categories
        
        Args:
            category_id: Specific category to analyze (None for all)
            months_back: Number of months of historical data to analyze
            
        Returns:
            List of seasonal pattern analysis
        """
        end_date = datetime.now()
        start_date = end_date - timedelta(days=months_back * 30)
        
        # Build base query
        query = (
            self.db.query(
                Category.id,
                Category.name,
                func.extract('month', Invoice.created_at).label('month'),
                func.extract('year', Invoice.created_at).label('year'),
                func.sum(InvoiceItem.total_price).label('monthly_revenue'),
                func.sum(InvoiceItem.quantity).label('monthly_quantity')
            )
            .join(InventoryItem, Category.id == InventoryItem.category_id)
            .join(InvoiceItem, InventoryItem.id == InvoiceItem.inventory_item_id)
            .join(Invoice, InvoiceItem.invoice_id == Invoice.id)
            .filter(
                and_(
                    Invoice.created_at >= start_date,
                    Invoice.created_at <= end_date,
                    Invoice.status == 'completed'
                )
            )
        )
        
        if category_id:
            query = query.filter(Category.id == category_id)
        
        query = query.group_by(
            Category.id, Category.name,
            func.extract('month', Invoice.created_at),
            func.extract('year', Invoice.created_at)
        )
        
        results = query.all()
        
        if not results:
            return []
        
        # Group by category
        category_data = {}
        for result in results:
            cat_id = str(result.id)
            if cat_id not in category_data:
                category_data[cat_id] = {
                    'name': result.name,
                    'monthly_data': []
                }
            
            category_data[cat_id]['monthly_data'].append({
                'month': int(result.month),
                'year': int(result.year),
                'revenue': float(result.monthly_revenue),
                'quantity': result.monthly_quantity
            })
        
        # Analyze seasonality for each category
        seasonal_patterns = []
        
        for cat_id, data in category_data.items():
            if len(data['monthly_data']) < 12:  # Need at least 12 months
                continue
            
            # Convert to DataFrame for analysis
            df = pd.DataFrame(data['monthly_data'])
            
            # Calculate seasonal indices
            seasonal_index = self._calculate_seasonal_indices(df)
            
            # Identify peak and low months
            peak_months = [str(month) for month, index in seasonal_index.items() if index > 1.2]
            low_months = [str(month) for month, index in seasonal_index.items() if index < 0.8]
            
            # Calculate seasonality strength
            seasonality_strength = self._calculate_seasonality_strength(list(seasonal_index.values()))
            
            # Simple forecast for next month
            forecast, confidence_interval = self._forecast_next_month(df)
            
            pattern = SeasonalPattern(
                category_id=cat_id,
                category_name=data['name'],
                seasonal_index=seasonal_index,
                peak_months=peak_months,
                low_months=low_months,
                seasonality_strength=seasonality_strength,
                forecast_next_month=forecast,
                confidence_interval=confidence_interval
            )
            seasonal_patterns.append(pattern)
        
        return seasonal_patterns
    
    async def identify_cross_selling_opportunities(
        self,
        start_date: datetime,
        end_date: datetime,
        min_support: float = 0.01,
        min_confidence: float = 0.1
    ) -> List[CrossSellingOpportunity]:
        """
        Identify cross-selling opportunities using market basket analysis
        
        Args:
            start_date: Analysis period start
            end_date: Analysis period end
            min_support: Minimum support threshold
            min_confidence: Minimum confidence threshold
            
        Returns:
            List of cross-selling opportunities
        """
        # Get transaction data with categories
        query = (
            self.db.query(
                Invoice.id.label('transaction_id'),
                Category.id.label('category_id'),
                Category.name.label('category_name'),
                func.sum(InvoiceItem.total_price).label('category_revenue')
            )
            .join(InvoiceItem, Invoice.id == InvoiceItem.invoice_id)
            .join(InventoryItem, InvoiceItem.inventory_item_id == InventoryItem.id)
            .join(Category, InventoryItem.category_id == Category.id)
            .filter(
                and_(
                    Invoice.created_at >= start_date,
                    Invoice.created_at <= end_date,
                    Invoice.status == 'completed'
                )
            )
            .group_by(Invoice.id, Category.id, Category.name)
        )
        
        results = query.all()
        
        if not results:
            return []
        
        # Build transaction-category matrix
        transactions = {}
        category_names = {}
        
        for result in results:
            trans_id = str(result.transaction_id)
            cat_id = str(result.category_id)
            
            if trans_id not in transactions:
                transactions[trans_id] = set()
            
            transactions[trans_id].add(cat_id)
            category_names[cat_id] = result.category_name
        
        # Calculate association rules
        opportunities = []
        total_transactions = len(transactions)
        
        # Get all unique categories
        all_categories = set()
        for cats in transactions.values():
            all_categories.update(cats)
        
        all_categories = list(all_categories)
        
        # Calculate support for individual categories
        category_support = {}
        for cat in all_categories:
            count = sum(1 for trans_cats in transactions.values() if cat in trans_cats)
            category_support[cat] = count / total_transactions
        
        # Find category pairs and calculate metrics
        for i, cat_a in enumerate(all_categories):
            for cat_b in all_categories[i+1:]:
                if cat_a == cat_b:
                    continue
                
                # Count co-occurrences
                co_occurrence_count = sum(
                    1 for trans_cats in transactions.values() 
                    if cat_a in trans_cats and cat_b in trans_cats
                )
                
                if co_occurrence_count == 0:
                    continue
                
                # Calculate metrics
                support = co_occurrence_count / total_transactions
                
                if support < min_support:
                    continue
                
                # Confidence: P(B|A) = P(A,B) / P(A)
                confidence_a_to_b = support / category_support[cat_a]
                confidence_b_to_a = support / category_support[cat_b]
                
                # Lift: P(A,B) / (P(A) * P(B))
                lift = support / (category_support[cat_a] * category_support[cat_b])
                
                # Expected revenue increase (simplified calculation)
                expected_revenue = await self._calculate_expected_revenue_increase(
                    cat_a, cat_b, start_date, end_date
                )
                
                # Create opportunities for both directions if confidence is high enough
                if confidence_a_to_b >= min_confidence:
                    opportunity = CrossSellingOpportunity(
                        primary_category_id=cat_a,
                        primary_category_name=category_names[cat_a],
                        recommended_category_id=cat_b,
                        recommended_category_name=category_names[cat_b],
                        confidence_score=confidence_a_to_b,
                        lift_ratio=lift,
                        support=support,
                        expected_revenue_increase=expected_revenue
                    )
                    opportunities.append(opportunity)
                
                if confidence_b_to_a >= min_confidence:
                    opportunity = CrossSellingOpportunity(
                        primary_category_id=cat_b,
                        primary_category_name=category_names[cat_b],
                        recommended_category_id=cat_a,
                        recommended_category_name=category_names[cat_a],
                        confidence_score=confidence_b_to_a,
                        lift_ratio=lift,
                        support=support,
                        expected_revenue_increase=expected_revenue
                    )
                    opportunities.append(opportunity)
        
        # Sort by confidence score and lift ratio
        opportunities.sort(key=lambda x: (x.confidence_score * x.lift_ratio), reverse=True)
        
        return opportunities[:20]  # Return top 20 opportunities
    
    def _calculate_percentile_score(self, value: float, all_values: List[float]) -> float:
        """Calculate percentile score for a value within a list"""
        if not all_values:
            return 0.0
        
        return stats.percentileofscore(all_values, value) / 100.0
    
    async def _calculate_category_trend(
        self, 
        category_id: str, 
        current_start: datetime, 
        current_end: datetime
    ) -> Tuple[str, float]:
        """Calculate trend direction and percentage for a category"""
        # Calculate previous period
        period_length = current_end - current_start
        previous_start = current_start - period_length
        previous_end = current_start
        
        # Get current period revenue
        current_revenue = (
            self.db.query(func.sum(InvoiceItem.total_price))
            .join(InventoryItem, InvoiceItem.inventory_item_id == InventoryItem.id)
            .join(Invoice, InvoiceItem.invoice_id == Invoice.id)
            .filter(
                and_(
                    InventoryItem.category_id == category_id,
                    Invoice.created_at >= current_start,
                    Invoice.created_at <= current_end,
                    Invoice.status == 'completed'
                )
            )
            .scalar() or Decimal('0')
        )
        
        # Get previous period revenue
        previous_revenue = (
            self.db.query(func.sum(InvoiceItem.total_price))
            .join(InventoryItem, InvoiceItem.inventory_item_id == InventoryItem.id)
            .join(Invoice, InvoiceItem.invoice_id == Invoice.id)
            .filter(
                and_(
                    InventoryItem.category_id == category_id,
                    Invoice.created_at >= previous_start,
                    Invoice.created_at <= previous_end,
                    Invoice.status == 'completed'
                )
            )
            .scalar() or Decimal('0')
        )
        
        if previous_revenue == 0:
            return 'stable', 0.0
        
        # Calculate percentage change
        change_percentage = float((current_revenue - previous_revenue) / previous_revenue * 100)
        
        # Determine direction
        if abs(change_percentage) < 5:  # Less than 5% change is considered stable
            direction = 'stable'
        elif change_percentage > 0:
            direction = 'up'
        else:
            direction = 'down'
        
        return direction, abs(change_percentage)
    
    def _calculate_seasonal_indices(self, df: pd.DataFrame) -> Dict[str, float]:
        """Calculate seasonal indices for each month"""
        # Group by month and calculate average revenue
        monthly_avg = df.groupby('month')['revenue'].mean()
        overall_avg = df['revenue'].mean()
        
        # Calculate seasonal index for each month
        seasonal_index = {}
        for month in range(1, 13):
            if month in monthly_avg.index:
                seasonal_index[str(month)] = monthly_avg[month] / overall_avg
            else:
                seasonal_index[str(month)] = 1.0  # No data, assume average
        
        return seasonal_index
    
    def _calculate_seasonality_strength(self, seasonal_indices: List[float]) -> float:
        """Calculate how seasonal a category is (0-1 scale)"""
        if not seasonal_indices:
            return 0.0
        
        # Calculate coefficient of variation
        mean_index = np.mean(seasonal_indices)
        std_index = np.std(seasonal_indices)
        
        if mean_index == 0:
            return 0.0
        
        cv = std_index / mean_index
        
        # Normalize to 0-1 scale (higher CV = more seasonal)
        return min(cv / 0.5, 1.0)  # 0.5 CV = maximum seasonality score
    
    def _forecast_next_month(self, df: pd.DataFrame) -> Tuple[float, Tuple[float, float]]:
        """Simple forecast for next month with confidence interval"""
        if len(df) < 3:
            return 0.0, (0.0, 0.0)
        
        # Sort by year and month
        df_sorted = df.sort_values(['year', 'month'])
        recent_values = df_sorted['revenue'].tail(6).values  # Last 6 months
        
        # Simple moving average forecast
        forecast = np.mean(recent_values)
        
        # Calculate confidence interval based on standard deviation
        std_dev = np.std(recent_values)
        confidence_interval = (
            max(0, forecast - 1.96 * std_dev),  # 95% confidence interval
            forecast + 1.96 * std_dev
        )
        
        return forecast, confidence_interval
    
    async def _calculate_expected_revenue_increase(
        self,
        category_a_id: str,
        category_b_id: str,
        start_date: datetime,
        end_date: datetime
    ) -> Decimal:
        """Calculate expected revenue increase from cross-selling"""
        # Get average revenue for category B
        avg_revenue_b = (
            self.db.query(func.avg(InvoiceItem.total_price))
            .join(InventoryItem, InvoiceItem.inventory_item_id == InventoryItem.id)
            .join(Invoice, InvoiceItem.invoice_id == Invoice.id)
            .filter(
                and_(
                    InventoryItem.category_id == category_b_id,
                    Invoice.created_at >= start_date,
                    Invoice.created_at <= end_date,
                    Invoice.status == 'completed'
                )
            )
            .scalar() or Decimal('0')
        )
        
        # Simplified calculation: assume 20% of category A customers would buy category B
        return avg_revenue_b * Decimal('0.2')