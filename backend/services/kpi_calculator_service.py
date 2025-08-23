"""
Financial KPI Calculator Service
Provides comprehensive financial KPI calculations with trend analysis and statistical significance testing
"""

import asyncio
from datetime import date, datetime, timedelta
from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, List, Optional, Tuple, Any, Union
from sqlalchemy.orm import Session
from sqlalchemy import text, func, and_, or_
import statistics
import math
from scipy import stats
import numpy as np

from models import (
    Invoice, InvoiceItem, InventoryItem, Customer, Payment, 
    KPISnapshot, AccountingEntry, Category
)
from redis_config import get_analytics_cache


class FinancialKPICalculator:
    """Financial KPI calculator with advanced analytics capabilities"""
    
    def __init__(self, db: Session):
        self.db = db
        self.cache = get_analytics_cache()
        self.cache_ttl = 300  # 5 minutes default TTL
    
    async def calculate_revenue_kpis(
        self, 
        start_date: date, 
        end_date: date,
        targets: Optional[Dict[str, float]] = None
    ) -> Dict[str, Any]:
        """Calculate comprehensive revenue KPIs with trend analysis"""
        
        # Check cache first
        cache_key = f"revenue_kpis_{start_date}_{end_date}"
        cached_data = await self.cache.get_kpi_data("financial", "revenue", period=cache_key)
        
        if cached_data:
            return cached_data["data"]
        
        try:
            # Calculate current period revenue
            current_revenue = await self._calculate_period_revenue(start_date, end_date)
            
            # Calculate previous period for comparison
            period_days = (end_date - start_date).days
            prev_start = start_date - timedelta(days=period_days)
            prev_end = start_date - timedelta(days=1)
            previous_revenue = await self._calculate_period_revenue(prev_start, prev_end)
            
            # Calculate growth rate
            growth_rate = 0.0
            if previous_revenue > 0:
                growth_rate = ((current_revenue - previous_revenue) / previous_revenue) * 100
            
            # Get trend analysis
            trend_data = await self._calculate_revenue_trend(start_date, end_date)
            
            # Statistical significance testing
            significance_test = await self._test_revenue_significance(
                start_date, end_date, prev_start, prev_end
            )
            
            # Calculate achievement rate if targets provided
            achievement_data = {}
            if targets and "revenue" in targets:
                target_revenue = targets["revenue"]
                achievement_rate = (current_revenue / target_revenue * 100) if target_revenue > 0 else 0
                variance = current_revenue - target_revenue
                variance_percent = (variance / target_revenue * 100) if target_revenue > 0 else 0
                
                achievement_data = {
                    "revenue_target": target_revenue,
                    "revenue_achievement_rate": round(achievement_rate, 2),
                    "revenue_variance": round(variance, 2),
                    "revenue_variance_percent": round(variance_percent, 2),
                    "target_status": "exceeded" if achievement_rate > 100 else "met" if achievement_rate >= 95 else "below"
                }
            
            result = {
                "current_revenue": float(current_revenue),
                "previous_revenue": float(previous_revenue),
                "growth_rate": round(growth_rate, 2),
                "trend_direction": "up" if growth_rate > 5 else "down" if growth_rate < -5 else "stable",
                "trend_data": trend_data,
                "significance_test": significance_test,
                "period_start": start_date.isoformat(),
                "period_end": end_date.isoformat(),
                "calculated_at": datetime.utcnow().isoformat(),
                **achievement_data
            }
            
            # Cache the results
            await self.cache.set_kpi_data("financial", "revenue", result, ttl=self.cache_ttl, period=cache_key)
            
            return result
            
        except Exception as e:
            print(f"Error calculating revenue KPIs: {e}")
            return {
                "error": str(e),
                "current_revenue": 0.0,
                "previous_revenue": 0.0,
                "growth_rate": 0.0,
                "trend_direction": "stable"
            }
    
    async def calculate_profit_margin_kpis(
        self, 
        start_date: date, 
        end_date: date,
        targets: Optional[Dict[str, float]] = None
    ) -> Dict[str, Any]:
        """Calculate comprehensive profit margin KPIs with trend analysis"""
        
        cache_key = f"profit_margin_kpis_{start_date}_{end_date}"
        cached_data = await self.cache.get_kpi_data("financial", "profit_margin", period=cache_key)
        
        if cached_data:
            return cached_data["data"]
        
        try:
            # Calculate current period profit metrics
            current_metrics = await self._calculate_period_profit_metrics(start_date, end_date)
            
            # Calculate previous period for comparison
            period_days = (end_date - start_date).days
            prev_start = start_date - timedelta(days=period_days)
            prev_end = start_date - timedelta(days=1)
            previous_metrics = await self._calculate_period_profit_metrics(prev_start, prev_end)
            
            # Calculate margin changes
            margin_change = current_metrics["gross_margin"] - previous_metrics["gross_margin"]
            net_margin_change = current_metrics["net_margin"] - previous_metrics["net_margin"]
            
            # Get profit trend analysis
            trend_data = await self._calculate_profit_trend(start_date, end_date)
            
            # Statistical significance testing for margins
            significance_test = await self._test_margin_significance(
                start_date, end_date, prev_start, prev_end
            )
            
            # Calculate achievement rate if targets provided
            achievement_data = {}
            if targets and "profit_margin" in targets:
                target_margin = targets["profit_margin"]
                achievement_rate = (current_metrics["gross_margin"] / target_margin * 100) if target_margin > 0 else 0
                variance = current_metrics["gross_margin"] - target_margin
                
                achievement_data = {
                    "margin_target": target_margin,
                    "margin_achievement_rate": round(achievement_rate, 2),
                    "margin_variance": round(variance, 2),
                    "target_status": "exceeded" if achievement_rate > 100 else "met" if achievement_rate >= 95 else "below"
                }
            
            result = {
                **current_metrics,
                "previous_gross_margin": round(previous_metrics["gross_margin"], 2),
                "previous_net_margin": round(previous_metrics["net_margin"], 2),
                "margin_change": round(margin_change, 2),
                "net_margin_change": round(net_margin_change, 2),
                "trend_direction": "up" if margin_change > 1 else "down" if margin_change < -1 else "stable",
                "trend_data": trend_data,
                "significance_test": significance_test,
                "period_start": start_date.isoformat(),
                "period_end": end_date.isoformat(),
                "calculated_at": datetime.utcnow().isoformat(),
                **achievement_data
            }
            
            # Cache the results
            await self.cache.set_kpi_data("financial", "profit_margin", result, ttl=self.cache_ttl, period=cache_key)
            
            return result
            
        except Exception as e:
            print(f"Error calculating profit margin KPIs: {e}")
            return {
                "error": str(e),
                "gross_margin": 0.0,
                "net_margin": 0.0,
                "margin_change": 0.0,
                "trend_direction": "stable"
            }
    
    async def calculate_achievement_rate_kpis(
        self, 
        start_date: date, 
        end_date: date,
        targets: Dict[str, float]
    ) -> Dict[str, Any]:
        """Calculate achievement rates against targets with detailed analysis"""
        
        cache_key = f"achievement_rate_kpis_{start_date}_{end_date}_{hash(str(targets))}"
        cached_data = await self.cache.get_kpi_data("financial", "achievement", period=cache_key)
        
        if cached_data:
            return cached_data["data"]
        
        try:
            # Get current period metrics
            revenue_data = await self.calculate_revenue_kpis(start_date, end_date, targets)
            profit_data = await self.calculate_profit_margin_kpis(start_date, end_date, targets)
            
            # Calculate transaction metrics
            transaction_metrics = await self._calculate_transaction_metrics(start_date, end_date)
            
            # Calculate achievement rates for all targets
            achievements = {}
            overall_score = 0
            target_count = 0
            
            # Revenue achievement
            if "revenue" in targets:
                revenue_achievement = (revenue_data["current_revenue"] / targets["revenue"] * 100) if targets["revenue"] > 0 else 0
                achievements["revenue"] = {
                    "target": targets["revenue"],
                    "actual": revenue_data["current_revenue"],
                    "achievement_rate": round(revenue_achievement, 2),
                    "variance": round(revenue_data["current_revenue"] - targets["revenue"], 2),
                    "status": self._get_achievement_status(revenue_achievement)
                }
                overall_score += min(revenue_achievement, 150)  # Cap at 150% for overall score
                target_count += 1
            
            # Profit margin achievement
            if "profit_margin" in targets:
                margin_achievement = (profit_data["gross_margin"] / targets["profit_margin"] * 100) if targets["profit_margin"] > 0 else 0
                achievements["profit_margin"] = {
                    "target": targets["profit_margin"],
                    "actual": profit_data["gross_margin"],
                    "achievement_rate": round(margin_achievement, 2),
                    "variance": round(profit_data["gross_margin"] - targets["profit_margin"], 2),
                    "status": self._get_achievement_status(margin_achievement)
                }
                overall_score += min(margin_achievement, 150)
                target_count += 1
            
            # Transaction count achievement
            if "transaction_count" in targets:
                transaction_achievement = (transaction_metrics["transaction_count"] / targets["transaction_count"] * 100) if targets["transaction_count"] > 0 else 0
                achievements["transaction_count"] = {
                    "target": targets["transaction_count"],
                    "actual": transaction_metrics["transaction_count"],
                    "achievement_rate": round(transaction_achievement, 2),
                    "variance": transaction_metrics["transaction_count"] - targets["transaction_count"],
                    "status": self._get_achievement_status(transaction_achievement)
                }
                overall_score += min(transaction_achievement, 150)
                target_count += 1
            
            # Calculate overall achievement score
            overall_achievement = (overall_score / target_count) if target_count > 0 else 0
            
            # Determine performance level
            performance_level = self._get_performance_level(overall_achievement)
            
            # Generate recommendations
            recommendations = await self._generate_achievement_recommendations(achievements, targets)
            
            result = {
                "achievements": achievements,
                "overall_achievement_rate": round(overall_achievement, 2),
                "performance_level": performance_level,
                "targets_met": sum(1 for a in achievements.values() if a["achievement_rate"] >= 95),
                "total_targets": len(achievements),
                "recommendations": recommendations,
                "period_start": start_date.isoformat(),
                "period_end": end_date.isoformat(),
                "calculated_at": datetime.utcnow().isoformat()
            }
            
            # Cache the results
            await self.cache.set_kpi_data("financial", "achievement", result, ttl=self.cache_ttl, period=cache_key)
            
            return result
            
        except Exception as e:
            print(f"Error calculating achievement rate KPIs: {e}")
            return {
                "error": str(e),
                "overall_achievement_rate": 0.0,
                "performance_level": "unknown",
                "targets_met": 0,
                "total_targets": len(targets)
            }
    
    async def _calculate_period_revenue(self, start_date: date, end_date: date) -> float:
        """Calculate total revenue for a specific period"""
        
        try:
            revenue_query = text("""
                SELECT COALESCE(SUM(total_amount), 0) as total_revenue
                FROM invoices 
                WHERE DATE(created_at) BETWEEN :start_date AND :end_date
                AND status IN ('completed', 'paid', 'partially_paid')
            """)
            
            result = self.db.execute(revenue_query, {
                "start_date": start_date,
                "end_date": end_date
            }).fetchone()
            
            return float(result.total_revenue or 0)
            
        except Exception as e:
            print(f"Error calculating period revenue: {e}")
            return 0.0
    
    async def _calculate_period_profit_metrics(self, start_date: date, end_date: date) -> Dict[str, float]:
        """Calculate comprehensive profit metrics for a period"""
        
        try:
            # Calculate sales and cost data
            profit_query = text("""
                SELECT 
                    COALESCE(SUM(ii.total_price), 0) as total_sales,
                    COALESCE(SUM(ii.quantity * item.purchase_price), 0) as total_cost,
                    COALESCE(SUM(i.total_amount * i.labor_cost_percentage / 100), 0) as labor_costs,
                    COALESCE(SUM(i.total_amount * i.vat_percentage / 100), 0) as tax_costs,
                    COUNT(DISTINCT i.id) as invoice_count,
                    COALESCE(SUM(ii.quantity), 0) as total_units
                FROM invoice_items ii
                JOIN invoices i ON ii.invoice_id = i.id
                JOIN inventory_items item ON ii.inventory_item_id = item.id
                WHERE DATE(i.created_at) BETWEEN :start_date AND :end_date
                AND i.status IN ('completed', 'paid', 'partially_paid')
            """)
            
            result = self.db.execute(profit_query, {
                "start_date": start_date,
                "end_date": end_date
            }).fetchone()
            
            total_sales = float(result.total_sales or 0)
            total_cost = float(result.total_cost or 0)
            labor_costs = float(result.labor_costs or 0)
            tax_costs = float(result.tax_costs or 0)
            total_units = float(result.total_units or 0)
            
            # Calculate profit metrics
            gross_profit = total_sales - total_cost
            net_profit = gross_profit - labor_costs - tax_costs
            
            # Calculate margins
            gross_margin = (gross_profit / total_sales * 100) if total_sales > 0 else 0
            net_margin = (net_profit / total_sales * 100) if total_sales > 0 else 0
            
            # Calculate markup
            markup_percentage = (gross_profit / total_cost * 100) if total_cost > 0 else 0
            
            # Calculate per-unit metrics
            profit_per_unit = (gross_profit / total_units) if total_units > 0 else 0
            cost_per_unit = (total_cost / total_units) if total_units > 0 else 0
            
            return {
                "total_sales": round(total_sales, 2),
                "total_cost": round(total_cost, 2),
                "gross_profit": round(gross_profit, 2),
                "net_profit": round(net_profit, 2),
                "gross_margin": round(gross_margin, 2),
                "net_margin": round(net_margin, 2),
                "markup_percentage": round(markup_percentage, 2),
                "labor_costs": round(labor_costs, 2),
                "tax_costs": round(tax_costs, 2),
                "profit_per_unit": round(profit_per_unit, 2),
                "cost_per_unit": round(cost_per_unit, 2),
                "cost_ratio": round((total_cost / total_sales * 100) if total_sales > 0 else 0, 2)
            }
            
        except Exception as e:
            print(f"Error calculating profit metrics: {e}")
            return {
                "total_sales": 0.0, "total_cost": 0.0, "gross_profit": 0.0,
                "net_profit": 0.0, "gross_margin": 0.0, "net_margin": 0.0,
                "markup_percentage": 0.0, "labor_costs": 0.0, "tax_costs": 0.0,
                "profit_per_unit": 0.0, "cost_per_unit": 0.0, "cost_ratio": 0.0
            }
    
    async def _calculate_transaction_metrics(self, start_date: date, end_date: date) -> Dict[str, Any]:
        """Calculate transaction-related metrics"""
        
        try:
            transaction_query = text("""
                SELECT 
                    COUNT(*) as transaction_count,
                    COUNT(DISTINCT customer_id) as unique_customers,
                    COALESCE(AVG(total_amount), 0) as avg_transaction_value,
                    COALESCE(SUM(total_amount), 0) as total_revenue,
                    COALESCE(SUM(paid_amount), 0) as total_paid,
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_transactions,
                    COUNT(CASE WHEN remaining_amount > 0 THEN 1 END) as outstanding_transactions
                FROM invoices 
                WHERE DATE(created_at) BETWEEN :start_date AND :end_date
                AND status != 'cancelled'
            """)
            
            result = self.db.execute(transaction_query, {
                "start_date": start_date,
                "end_date": end_date
            }).fetchone()
            
            transaction_count = result.transaction_count or 0
            unique_customers = result.unique_customers or 0
            total_revenue = float(result.total_revenue or 0)
            total_paid = float(result.total_paid or 0)
            completed_transactions = result.completed_transactions or 0
            
            # Calculate derived metrics
            avg_transactions_per_customer = (transaction_count / unique_customers) if unique_customers > 0 else 0
            completion_rate = (completed_transactions / transaction_count * 100) if transaction_count > 0 else 0
            collection_rate = (total_paid / total_revenue * 100) if total_revenue > 0 else 0
            
            return {
                "transaction_count": transaction_count,
                "unique_customers": unique_customers,
                "avg_transaction_value": round(float(result.avg_transaction_value or 0), 2),
                "avg_transactions_per_customer": round(avg_transactions_per_customer, 2),
                "completion_rate": round(completion_rate, 2),
                "collection_rate": round(collection_rate, 2),
                "completed_transactions": completed_transactions,
                "outstanding_transactions": result.outstanding_transactions or 0
            }
            
        except Exception as e:
            print(f"Error calculating transaction metrics: {e}")
            return {
                "transaction_count": 0, "unique_customers": 0, "avg_transaction_value": 0.0,
                "avg_transactions_per_customer": 0.0, "completion_rate": 0.0,
                "collection_rate": 0.0, "completed_transactions": 0, "outstanding_transactions": 0
            }
    
    async def _calculate_revenue_trend(self, start_date: date, end_date: date) -> Dict[str, Any]:
        """Calculate revenue trend analysis with statistical methods"""
        
        try:
            # Get daily revenue data
            daily_data = await self._get_daily_revenue_data(start_date, end_date)
            
            if len(daily_data) < 3:
                return {
                    "trend": "insufficient_data",
                    "slope": 0,
                    "r_squared": 0,
                    "data_points": len(daily_data)
                }
            
            # Extract values for trend analysis
            revenues = [d["revenue"] for d in daily_data]
            days = list(range(len(revenues)))
            
            # Calculate linear regression
            if len(revenues) > 1:
                slope, intercept, r_value, p_value, std_err = stats.linregress(days, revenues)
                r_squared = r_value ** 2
                
                # Determine trend direction
                if slope > 0 and p_value < 0.05:
                    trend = "increasing"
                elif slope < 0 and p_value < 0.05:
                    trend = "decreasing"
                else:
                    trend = "stable"
                
                return {
                    "trend": trend,
                    "slope": round(slope, 2),
                    "r_squared": round(r_squared, 4),
                    "p_value": round(p_value, 4),
                    "data_points": len(daily_data),
                    "trend_strength": "strong" if r_squared > 0.7 else "moderate" if r_squared > 0.4 else "weak"
                }
            else:
                return {
                    "trend": "stable",
                    "slope": 0,
                    "r_squared": 0,
                    "data_points": len(daily_data)
                }
                
        except Exception as e:
            print(f"Error calculating revenue trend: {e}")
            return {
                "trend": "calculation_error",
                "slope": 0,
                "r_squared": 0,
                "data_points": 0,
                "error": str(e)
            }
    
    async def _calculate_profit_trend(self, start_date: date, end_date: date) -> Dict[str, Any]:
        """Calculate profit margin trend analysis"""
        
        try:
            # Get daily profit data
            daily_data = await self._get_daily_profit_data(start_date, end_date)
            
            if len(daily_data) < 3:
                return {
                    "trend": "insufficient_data",
                    "slope": 0,
                    "r_squared": 0,
                    "data_points": len(daily_data)
                }
            
            # Extract margin values for trend analysis
            margins = [d["margin"] for d in daily_data]
            days = list(range(len(margins)))
            
            # Calculate linear regression
            if len(margins) > 1:
                slope, intercept, r_value, p_value, std_err = stats.linregress(days, margins)
                r_squared = r_value ** 2
                
                # Determine trend direction
                if slope > 0.1 and p_value < 0.05:
                    trend = "improving"
                elif slope < -0.1 and p_value < 0.05:
                    trend = "declining"
                else:
                    trend = "stable"
                
                return {
                    "trend": trend,
                    "slope": round(slope, 4),
                    "r_squared": round(r_squared, 4),
                    "p_value": round(p_value, 4),
                    "data_points": len(daily_data),
                    "trend_strength": "strong" if r_squared > 0.7 else "moderate" if r_squared > 0.4 else "weak"
                }
            else:
                return {
                    "trend": "stable",
                    "slope": 0,
                    "r_squared": 0,
                    "data_points": len(daily_data)
                }
                
        except Exception as e:
            print(f"Error calculating profit trend: {e}")
            return {
                "trend": "calculation_error",
                "slope": 0,
                "r_squared": 0,
                "data_points": 0,
                "error": str(e)
            }
    
    async def _test_revenue_significance(
        self, 
        current_start: date, 
        current_end: date,
        previous_start: date, 
        previous_end: date
    ) -> Dict[str, Any]:
        """Test statistical significance of revenue changes"""
        
        try:
            # Get daily revenue data for both periods
            current_data = await self._get_daily_revenue_data(current_start, current_end)
            previous_data = await self._get_daily_revenue_data(previous_start, previous_end)
            
            if len(current_data) < 2 or len(previous_data) < 2:
                return {
                    "significant": False,
                    "p_value": 1.0,
                    "change_percent": 0.0,
                    "interpretation": "Insufficient data for significance testing",
                    "test": "insufficient_data"
                }
            
            current_revenues = [d["revenue"] for d in current_data]
            previous_revenues = [d["revenue"] for d in previous_data]
            
            # Calculate means
            current_mean = statistics.mean(current_revenues)
            previous_mean = statistics.mean(previous_revenues)
            
            # Calculate change percentage
            change_percent = ((current_mean - previous_mean) / previous_mean * 100) if previous_mean > 0 else 0
            
            # Perform t-test if we have enough data
            if len(current_revenues) >= 3 and len(previous_revenues) >= 3:
                try:
                    t_stat, p_value = stats.ttest_ind(current_revenues, previous_revenues)
                    
                    # Determine significance level
                    if p_value < 0.01:
                        significance = "highly_significant"
                        interpretation = f"Highly significant {'increase' if change_percent > 0 else 'decrease'} in revenue"
                    elif p_value < 0.05:
                        significance = "significant"
                        interpretation = f"Significant {'increase' if change_percent > 0 else 'decrease'} in revenue"
                    elif p_value < 0.1:
                        significance = "marginally_significant"
                        interpretation = f"Marginally significant {'increase' if change_percent > 0 else 'decrease'} in revenue"
                    else:
                        significance = "not_significant"
                        interpretation = "No significant change in revenue"
                    
                    return {
                        "significant": p_value < 0.05,
                        "p_value": round(p_value, 4),
                        "change_percent": round(change_percent, 2),
                        "interpretation": interpretation,
                        "test": "t_test",
                        "significance_level": significance
                    }
                    
                except Exception as e:
                    print(f"Error in t-test: {e}")
                    # Fall back to simple threshold test
                    pass
            
            # Simple threshold-based significance test
            significant = abs(change_percent) > 10  # 10% threshold
            interpretation = f"{'Significant' if significant else 'Not significant'} {'increase' if change_percent > 0 else 'decrease'} based on threshold"
            
            return {
                "significant": significant,
                "p_value": 0.05 if significant else 0.5,  # Estimated
                "change_percent": round(change_percent, 2),
                "interpretation": interpretation,
                "test": "simple_threshold"
            }
            
        except Exception as e:
            print(f"Error testing revenue significance: {e}")
            return {
                "significant": False,
                "p_value": 1.0,
                "change_percent": 0.0,
                "interpretation": f"Error in significance testing: {str(e)}",
                "test": "error"
            }
    
    async def _test_margin_significance(
        self, 
        current_start: date, 
        current_end: date,
        previous_start: date, 
        previous_end: date
    ) -> Dict[str, Any]:
        """Test statistical significance of margin changes"""
        
        try:
            # Get daily margin data for both periods
            current_data = await self._get_daily_profit_data(current_start, current_end)
            previous_data = await self._get_daily_profit_data(previous_start, previous_end)
            
            if len(current_data) < 2 or len(previous_data) < 2:
                return {
                    "significant": False,
                    "p_value": 1.0,
                    "change_percent": 0.0,
                    "interpretation": "Insufficient data for margin significance testing",
                    "test": "insufficient_data"
                }
            
            current_margins = [d["margin"] for d in current_data]
            previous_margins = [d["margin"] for d in previous_data]
            
            # Calculate means
            current_mean = statistics.mean(current_margins)
            previous_mean = statistics.mean(previous_margins)
            
            # Calculate change in percentage points
            change_points = current_mean - previous_mean
            
            # Perform t-test if we have enough data
            if len(current_margins) >= 3 and len(previous_margins) >= 3:
                try:
                    t_stat, p_value = stats.ttest_ind(current_margins, previous_margins)
                    
                    # Determine significance level
                    if p_value < 0.01:
                        significance = "highly_significant"
                        interpretation = f"Highly significant {'improvement' if change_points > 0 else 'decline'} in profit margin"
                    elif p_value < 0.05:
                        significance = "significant"
                        interpretation = f"Significant {'improvement' if change_points > 0 else 'decline'} in profit margin"
                    elif p_value < 0.1:
                        significance = "marginally_significant"
                        interpretation = f"Marginally significant {'improvement' if change_points > 0 else 'decline'} in profit margin"
                    else:
                        significance = "not_significant"
                        interpretation = "No significant change in profit margin"
                    
                    return {
                        "significant": p_value < 0.05,
                        "p_value": round(p_value, 4),
                        "change_points": round(change_points, 2),
                        "interpretation": interpretation,
                        "test": "t_test",
                        "significance_level": significance
                    }
                    
                except Exception as e:
                    print(f"Error in margin t-test: {e}")
                    # Fall back to simple threshold test
                    pass
            
            # Simple threshold-based significance test (2 percentage points)
            significant = abs(change_points) > 2
            interpretation = f"{'Significant' if significant else 'Not significant'} {'improvement' if change_points > 0 else 'decline'} in margin"
            
            return {
                "significant": significant,
                "p_value": 0.05 if significant else 0.5,  # Estimated
                "change_points": round(change_points, 2),
                "interpretation": interpretation,
                "test": "simple_threshold"
            }
            
        except Exception as e:
            print(f"Error testing margin significance: {e}")
            return {
                "significant": False,
                "p_value": 1.0,
                "change_points": 0.0,
                "interpretation": f"Error in margin significance testing: {str(e)}",
                "test": "error"
            }
    
    async def _get_daily_revenue_data(self, start_date: date, end_date: date) -> List[Dict[str, Any]]:
        """Get daily revenue data for trend analysis"""
        
        try:
            daily_query = text("""
                SELECT 
                    DATE(created_at) as date,
                    COALESCE(SUM(total_amount), 0) as revenue,
                    COUNT(*) as transaction_count
                FROM invoices 
                WHERE DATE(created_at) BETWEEN :start_date AND :end_date
                AND status IN ('completed', 'paid', 'partially_paid')
                GROUP BY DATE(created_at)
                ORDER BY DATE(created_at)
            """)
            
            results = self.db.execute(daily_query, {
                "start_date": start_date,
                "end_date": end_date
            }).fetchall()
            
            return [
                {
                    "date": result.date.isoformat(),
                    "revenue": float(result.revenue),
                    "transaction_count": result.transaction_count
                }
                for result in results
            ]
            
        except Exception as e:
            print(f"Error getting daily revenue data: {e}")
            return []
    
    async def _get_daily_profit_data(self, start_date: date, end_date: date) -> List[Dict[str, Any]]:
        """Get daily profit margin data for trend analysis"""
        
        try:
            daily_query = text("""
                SELECT 
                    DATE(i.created_at) as date,
                    COALESCE(SUM(ii.total_price), 0) as sales,
                    COALESCE(SUM(ii.quantity * item.purchase_price), 0) as cost
                FROM invoice_items ii
                JOIN invoices i ON ii.invoice_id = i.id
                JOIN inventory_items item ON ii.inventory_item_id = item.id
                WHERE DATE(i.created_at) BETWEEN :start_date AND :end_date
                AND i.status IN ('completed', 'paid', 'partially_paid')
                GROUP BY DATE(i.created_at)
                ORDER BY DATE(i.created_at)
            """)
            
            results = self.db.execute(daily_query, {
                "start_date": start_date,
                "end_date": end_date
            }).fetchall()
            
            daily_data = []
            for result in results:
                sales = float(result.sales)
                cost = float(result.cost)
                profit = sales - cost
                margin = (profit / sales * 100) if sales > 0 else 0
                
                daily_data.append({
                    "date": result.date.isoformat(),
                    "sales": sales,
                    "cost": cost,
                    "profit": profit,
                    "margin": margin
                })
            
            return daily_data
            
        except Exception as e:
            print(f"Error getting daily profit data: {e}")
            return []
    
    def _get_achievement_status(self, achievement_rate: float) -> str:
        """Get achievement status based on rate"""
        if achievement_rate >= 100:
            return "exceeded"
        elif achievement_rate >= 95:
            return "met"
        elif achievement_rate >= 80:
            return "close"
        else:
            return "below"
    
    def _get_performance_level(self, overall_achievement: float) -> str:
        """Get performance level based on overall achievement"""
        if overall_achievement >= 110:
            return "exceptional"
        elif overall_achievement >= 100:
            return "excellent"
        elif overall_achievement >= 90:
            return "good"
        elif overall_achievement >= 80:
            return "satisfactory"
        elif overall_achievement >= 70:
            return "needs_improvement"
        else:
            return "poor"
    
    async def _generate_achievement_recommendations(
        self, 
        achievements: Dict[str, Dict], 
        targets: Dict[str, float]
    ) -> List[str]:
        """Generate recommendations based on achievement analysis"""
        
        recommendations = []
        
        # Revenue recommendations
        if "revenue" in achievements:
            revenue_data = achievements["revenue"]
            if revenue_data["achievement_rate"] < 95:
                gap = revenue_data["target"] - revenue_data["actual"]
                recommendations.append(f"Revenue is ${gap:,.2f} below target. Consider increasing marketing efforts or expanding product offerings.")
            elif revenue_data["achievement_rate"] > 110:
                recommendations.append("Revenue significantly exceeds target. Consider raising targets or investing in growth opportunities.")
        
        # Profit margin recommendations
        if "profit_margin" in achievements:
            margin_data = achievements["profit_margin"]
            if margin_data["achievement_rate"] < 95:
                recommendations.append("Profit margin is below target. Review pricing strategy and cost management.")
            elif margin_data["achievement_rate"] > 110:
                recommendations.append("Profit margin exceeds target. Consider competitive pricing or reinvestment opportunities.")
        
        # Transaction count recommendations
        if "transaction_count" in achievements:
            transaction_data = achievements["transaction_count"]
            if transaction_data["achievement_rate"] < 95:
                recommendations.append("Transaction count is below target. Focus on customer acquisition and retention strategies.")
        
        # General recommendations
        met_targets = sum(1 for a in achievements.values() if a["achievement_rate"] >= 95)
        total_targets = len(achievements)
        
        if met_targets == total_targets:
            recommendations.append("All targets met! Consider setting more ambitious goals for continued growth.")
        elif met_targets < total_targets / 2:
            recommendations.append("Multiple targets missed. Conduct comprehensive business review and adjust strategies.")
        
        return recommendations


class KPICalculatorService:
    """Main KPI Calculator Service that orchestrates all financial KPI calculations"""
    
    def __init__(self, db: Session):
        self.db = db
        self.cache = get_analytics_cache()
        self.cache_ttl = 300  # 5 minutes default TTL
        self.financial_calculator = FinancialKPICalculator(db)
    
    async def calculate_financial_kpis(
        self, 
        time_range: Tuple[date, date],
        targets: Optional[Dict[str, float]] = None
    ) -> Dict[str, Any]:
        """Calculate comprehensive financial KPIs for the specified time range"""
        
        start_date, end_date = time_range
        
        # Validate date range
        if start_date > end_date:
            return {
                "error": "Invalid date range: start_date must be before end_date",
                "total_revenue": 0,
                "gross_profit": 0,
                "gross_margin": 0,
                "transaction_count": 0
            }
        
        try:
            # Calculate all financial KPIs
            revenue_kpis = await self.financial_calculator.calculate_revenue_kpis(
                start_date, end_date, targets
            )
            
            profit_kpis = await self.financial_calculator.calculate_profit_margin_kpis(
                start_date, end_date, targets
            )
            
            transaction_metrics = await self.financial_calculator._calculate_transaction_metrics(
                start_date, end_date
            )
            
            # Calculate achievement rates if targets provided
            achievement_kpis = {}
            if targets:
                achievement_kpis = await self.financial_calculator.calculate_achievement_rate_kpis(
                    start_date, end_date, targets
                )
            
            # Combine all KPIs
            combined_kpis = {
                # Revenue metrics
                "total_revenue": revenue_kpis.get("current_revenue", 0),
                "previous_revenue": revenue_kpis.get("previous_revenue", 0),
                "revenue_growth_rate": revenue_kpis.get("growth_rate", 0),
                "revenue_trend": revenue_kpis.get("trend_data", {}),
                
                # Profit metrics
                "total_sales": profit_kpis.get("total_sales", 0),
                "total_cost": profit_kpis.get("total_cost", 0),
                "gross_profit": profit_kpis.get("gross_profit", 0),
                "net_profit": profit_kpis.get("net_profit", 0),
                "gross_margin": profit_kpis.get("gross_margin", 0),
                "net_margin": profit_kpis.get("net_margin", 0),
                "markup_percentage": profit_kpis.get("markup_percentage", 0),
                "cost_ratio": profit_kpis.get("cost_ratio", 0),
                "profit_trend": profit_kpis.get("trend_data", {}),
                
                # Transaction metrics
                "transaction_count": transaction_metrics.get("transaction_count", 0),
                "unique_customers": transaction_metrics.get("unique_customers", 0),
                "avg_transaction_value": transaction_metrics.get("avg_transaction_value", 0),
                "completion_rate": transaction_metrics.get("completion_rate", 0),
                "collection_rate": transaction_metrics.get("collection_rate", 0),
                
                # Achievement metrics (if targets provided)
                **achievement_kpis,
                
                # Metadata
                "period_start": start_date.isoformat(),
                "period_end": end_date.isoformat(),
                "calculated_at": datetime.utcnow().isoformat(),
                "targets": targets or {}
            }
            
            # Save KPI snapshots for historical tracking
            await self._save_kpi_snapshots(combined_kpis, start_date, end_date)
            
            return combined_kpis
            
        except Exception as e:
            print(f"Error calculating financial KPIs: {e}")
            return {
                "error": str(e),
                "total_revenue": 0,
                "gross_profit": 0,
                "gross_margin": 0,
                "transaction_count": 0,
                "period_start": start_date.isoformat(),
                "period_end": end_date.isoformat(),
                "calculated_at": datetime.utcnow().isoformat()
            }
    
    async def get_kpi_trends(
        self, 
        kpi_type: str, 
        kpi_name: str, 
        periods: int = 6
    ) -> Dict[str, Any]:
        """Get KPI trend analysis over multiple periods"""
        
        try:
            # Get historical KPI snapshots
            end_date = date.today()
            start_date = end_date - timedelta(days=periods * 30)  # Approximate monthly periods
            
            snapshots = self.db.query(KPISnapshot).filter(
                KPISnapshot.kpi_type == kpi_type,
                KPISnapshot.kpi_name == kpi_name,
                KPISnapshot.period_start >= start_date
            ).order_by(KPISnapshot.period_start).all()
            
            if len(snapshots) < 2:
                return {
                    "kpi_type": kpi_type,
                    "kpi_name": kpi_name,
                    "periods_analyzed": 0,
                    "trend_data": [],
                    "trend_analysis": {"overall_direction": "insufficient_data"},
                    "summary_statistics": {}
                }
            
            # Extract trend data
            trend_data = []
            values = []
            
            for snapshot in snapshots:
                data_point = {
                    "period_start": snapshot.period_start.isoformat(),
                    "period_end": snapshot.period_end.isoformat(),
                    "value": float(snapshot.value),
                    "target_value": float(snapshot.target_value) if snapshot.target_value else None,
                    "achievement_rate": float(snapshot.achievement_rate) if snapshot.achievement_rate else None,
                    "trend_direction": snapshot.trend_direction
                }
                trend_data.append(data_point)
                values.append(float(snapshot.value))
            
            # Calculate trend analysis
            if len(values) >= 3:
                periods_range = list(range(len(values)))
                slope, intercept, r_value, p_value, std_err = stats.linregress(periods_range, values)
                r_squared = r_value ** 2
                
                # Determine overall direction
                if slope > 0 and p_value < 0.05:
                    overall_direction = "increasing"
                elif slope < 0 and p_value < 0.05:
                    overall_direction = "decreasing"
                else:
                    overall_direction = "stable"
                
                trend_analysis = {
                    "overall_direction": overall_direction,
                    "slope": round(slope, 4),
                    "r_squared": round(r_squared, 4),
                    "p_value": round(p_value, 4),
                    "trend_strength": "strong" if r_squared > 0.7 else "moderate" if r_squared > 0.4 else "weak"
                }
            else:
                trend_analysis = {
                    "overall_direction": "insufficient_data",
                    "slope": 0,
                    "r_squared": 0,
                    "trend_strength": "unknown"
                }
            
            # Calculate summary statistics
            summary_statistics = {
                "mean": round(statistics.mean(values), 2),
                "median": round(statistics.median(values), 2),
                "std_dev": round(statistics.stdev(values), 2) if len(values) > 1 else 0,
                "min_value": round(min(values), 2),
                "max_value": round(max(values), 2),
                "latest_value": round(values[-1], 2),
                "change_from_first": round(values[-1] - values[0], 2),
                "percent_change": round(((values[-1] - values[0]) / values[0] * 100) if values[0] != 0 else 0, 2)
            }
            
            return {
                "kpi_type": kpi_type,
                "kpi_name": kpi_name,
                "periods_analyzed": len(snapshots),
                "trend_data": trend_data,
                "trend_analysis": trend_analysis,
                "summary_statistics": summary_statistics,
                "analysis_date": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            print(f"Error getting KPI trends: {e}")
            return {
                "error": str(e),
                "kpi_type": kpi_type,
                "kpi_name": kpi_name,
                "periods_analyzed": 0,
                "trend_data": [],
                "trend_analysis": {"overall_direction": "error"},
                "summary_statistics": {}
            }
    
    async def _save_kpi_snapshots(
        self, 
        kpis: Dict[str, Any], 
        start_date: date, 
        end_date: date
    ):
        """Save KPI snapshots for historical tracking"""
        
        try:
            # Define KPIs to save as snapshots
            kpi_mappings = {
                "revenue": {
                    "value": kpis.get("total_revenue", 0),
                    "target": kpis.get("targets", {}).get("revenue")
                },
                "gross_profit": {
                    "value": kpis.get("gross_profit", 0),
                    "target": None
                },
                "gross_margin": {
                    "value": kpis.get("gross_margin", 0),
                    "target": kpis.get("targets", {}).get("profit_margin")
                },
                "transaction_count": {
                    "value": kpis.get("transaction_count", 0),
                    "target": kpis.get("targets", {}).get("transaction_count")
                }
            }
            
            for kpi_name, kpi_data in kpi_mappings.items():
                value = kpi_data["value"]
                target_value = kpi_data["target"]
                
                # Calculate achievement rate
                achievement_rate = None
                if target_value and target_value > 0:
                    achievement_rate = (value / target_value) * 100
                
                # Determine trend direction (simplified)
                trend_direction = "stable"
                if kpi_name == "revenue" and "revenue_growth_rate" in kpis:
                    growth_rate = kpis["revenue_growth_rate"]
                    trend_direction = "up" if growth_rate > 5 else "down" if growth_rate < -5 else "stable"
                
                # Create snapshot
                snapshot = KPISnapshot(
                    kpi_type="financial",
                    kpi_name=kpi_name,
                    value=Decimal(str(value)),
                    target_value=Decimal(str(target_value)) if target_value else None,
                    achievement_rate=Decimal(str(achievement_rate)) if achievement_rate else None,
                    trend_direction=trend_direction,
                    period_start=start_date,
                    period_end=end_date,
                    metadata={
                        "calculation_method": "kpi_calculator_service",
                        "data_points": kpis.get("transaction_count", 0),
                        "cache_used": False
                    }
                )
                
                self.db.add(snapshot)
            
            self.db.commit()
            
        except Exception as e:
            print(f"Error saving KPI snapshots: {e}")
            self.db.rollback()
    
    async def _calculate_statistical_significance(
        self, 
        current_data: List[float], 
        previous_data: List[float]
    ) -> str:
        """Calculate statistical significance between two data sets"""
        
        try:
            if len(current_data) < 2 or len(previous_data) < 2:
                return "insufficient_data"
            
            # Perform t-test
            t_stat, p_value = stats.ttest_ind(current_data, previous_data)
            
            # Determine significance level
            if p_value < 0.01:
                return "highly_significant"
            elif p_value < 0.05:
                return "significant"
            elif p_value < 0.1:
                return "marginally_significant"
            else:
                return "not_significant"
                
        except Exception as e:
            print(f"Error calculating statistical significance: {e}")
            return "calculation_error"
    
    async def _get_daily_financial_data(
        self, 
        start_date: date, 
        end_date: date
    ) -> List[Dict[str, Any]]:
        """Get daily financial data for trend analysis"""
        
        try:
            daily_query = text("""
                SELECT 
                    DATE(created_at) as date,
                    COALESCE(SUM(total_amount), 0) as revenue,
                    COUNT(*) as transaction_count,
                    COALESCE(AVG(total_amount), 0) as avg_transaction
                FROM invoices 
                WHERE DATE(created_at) BETWEEN :start_date AND :end_date
                AND status IN ('completed', 'paid', 'partially_paid')
                GROUP BY DATE(created_at)
                ORDER BY DATE(created_at)
            """)
            
            results = self.db.execute(daily_query, {
                "start_date": start_date,
                "end_date": end_date
            }).fetchall()
            
            return [
                {
                    "date": result.date.isoformat(),
                    "revenue": float(result.revenue),
                    "transaction_count": result.transaction_count,
                    "avg_transaction": float(result.avg_transaction)
                }
                for result in results
            ]
            
        except Exception as e:
            print(f"Error getting daily financial data: {e}")
            return []
    
    async def invalidate_financial_cache(self, time_range: Optional[Tuple[date, date]] = None):
        """Invalidate financial KPI cache"""
        
        try:
            if time_range:
                start_date, end_date = time_range
                pattern = f"financial_kpis_{start_date}_{end_date}"
            else:
                pattern = "kpi:financial"
            
            await self.cache.invalidate_cache(pattern)
            
        except Exception as e:
            print(f"Error invalidating financial cache: {e}")
    
    async def get_cache_statistics(self) -> Dict[str, Any]:
        """Get cache and service statistics"""
        
        try:
            # Get cache statistics
            cache_stats = self.cache.get_cache_stats()
            
            # Get KPI statistics from database
            kpi_stats_query = text("""
                SELECT 
                    kpi_type,
                    COUNT(*) as total_snapshots,
                    COUNT(DISTINCT kpi_name) as unique_kpis,
                    MAX(created_at) as latest_snapshot
                FROM kpi_snapshots
                GROUP BY kpi_type
            """)
            
            kpi_results = self.db.execute(kpi_stats_query).fetchall()
            
            kpi_statistics = {}
            for result in kpi_results:
                kpi_statistics[result.kpi_type] = {
                    "total_snapshots": result.total_snapshots,
                    "unique_kpis": result.unique_kpis,
                    "latest_snapshot": result.latest_snapshot.isoformat() if result.latest_snapshot else None
                }
            
            return {
                "cache_stats": cache_stats,
                "kpi_statistics": kpi_statistics,
                "service_info": {
                    "cache_ttl": self.cache_ttl,
                    "statistical_methods": ["t_test", "linear_regression", "threshold_based"],
                    "supported_kpi_types": ["financial", "operational", "customer"],
                    "version": "1.0.0"
                },
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            print(f"Error getting cache statistics: {e}")
            return {
                "error": str(e),
                "cache_stats": {"status": "error"},
                "kpi_statistics": {},
                "service_info": {}
            }

class OperationalKPICalculator:
    """Operational KPI calculator for inventory and operational metrics"""
    
    def __init__(self, db: Session):
        self.db = db
        self.cache = get_analytics_cache()
        self.cache_ttl = 300  # 5 minutes default TTL
    
    async def calculate_inventory_turnover_kpis(
        self, 
        start_date: date, 
        end_date: date,
        category_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Calculate comprehensive inventory turnover KPIs with proper time-period handling"""
        
        # Check cache first
        cache_key = f"inventory_turnover_kpis_{start_date}_{end_date}_{category_id or 'all'}"
        cached_data = await self.cache.get_kpi_data("operational", "inventory_turnover", period=cache_key)
        
        if cached_data:
            return cached_data["data"]
        
        try:
            # Calculate current period turnover metrics
            current_metrics = await self._calculate_period_turnover_metrics(start_date, end_date, category_id)
            
            # Calculate previous period for comparison
            period_days = (end_date - start_date).days
            prev_start = start_date - timedelta(days=period_days)
            prev_end = start_date - timedelta(days=1)
            previous_metrics = await self._calculate_period_turnover_metrics(prev_start, prev_end, category_id)
            
            # Calculate turnover changes
            turnover_change = current_metrics["average_turnover_ratio"] - previous_metrics["average_turnover_ratio"]
            velocity_change = current_metrics["average_velocity_score"] - previous_metrics["average_velocity_score"]
            
            # Get turnover trend analysis
            trend_data = await self._calculate_turnover_trend(start_date, end_date, category_id)
            
            # Identify fast/slow moving items
            movement_analysis = await self._analyze_item_movement(start_date, end_date, category_id)
            
            # Calculate inventory health score
            health_score = await self._calculate_inventory_health_score(current_metrics, movement_analysis)
            
            result = {
                **current_metrics,
                "previous_turnover_ratio": round(previous_metrics["average_turnover_ratio"], 2),
                "previous_velocity_score": round(previous_metrics["average_velocity_score"], 2),
                "turnover_change": round(turnover_change, 2),
                "velocity_change": round(velocity_change, 2),
                "trend_direction": "up" if turnover_change > 0.1 else "down" if turnover_change < -0.1 else "stable",
                "trend_data": trend_data,
                "movement_analysis": movement_analysis,
                "inventory_health_score": health_score,
                "period_start": start_date.isoformat(),
                "period_end": end_date.isoformat(),
                "calculated_at": datetime.utcnow().isoformat()
            }
            
            # Cache the results
            await self.cache.set_kpi_data("operational", "inventory_turnover", result, ttl=self.cache_ttl, period=cache_key)
            
            return result
            
        except Exception as e:
            print(f"Error calculating inventory turnover KPIs: {e}")
            return {
                "error": str(e),
                "average_turnover_ratio": 0.0,
                "average_velocity_score": 0.0,
                "trend_direction": "stable"
            }
    
    async def calculate_stockout_frequency_kpis(
        self, 
        start_date: date, 
        end_date: date,
        alert_threshold: float = 0.1
    ) -> Dict[str, Any]:
        """Build stockout frequency monitoring with alert threshold configuration"""
        
        cache_key = f"stockout_frequency_kpis_{start_date}_{end_date}_{alert_threshold}"
        cached_data = await self.cache.get_kpi_data("operational", "stockout_frequency", period=cache_key)
        
        if cached_data:
            return cached_data["data"]
        
        try:
            # Calculate stockout metrics
            stockout_metrics = await self._calculate_stockout_metrics(start_date, end_date)
            
            # Calculate previous period for comparison
            period_days = (end_date - start_date).days
            prev_start = start_date - timedelta(days=period_days)
            prev_end = start_date - timedelta(days=1)
            previous_stockout_metrics = await self._calculate_stockout_metrics(prev_start, prev_end)
            
            # Calculate changes
            frequency_change = stockout_metrics["stockout_frequency"] - previous_stockout_metrics["stockout_frequency"]
            
            # Determine alert status
            alert_status = "critical" if stockout_metrics["stockout_frequency"] > alert_threshold else "normal"
            
            # Get items at risk of stockout
            at_risk_items_list = await self._get_items_at_risk_of_stockout()
            
            # Calculate stockout cost impact
            cost_impact = await self._calculate_stockout_cost_impact(start_date, end_date)
            
            # Generate recommendations
            recommendations = await self._generate_stockout_recommendations(stockout_metrics, at_risk_items_list)
            
            # Store the at_risk_items count before it gets overridden
            at_risk_items_count = stockout_metrics["at_risk_items"]
            
            result = {
                **stockout_metrics,
                "previous_stockout_frequency": round(previous_stockout_metrics["stockout_frequency"], 4),
                "frequency_change": round(frequency_change, 4),
                "alert_threshold": alert_threshold,
                "alert_status": alert_status,
                "trend_direction": "up" if frequency_change > 0.01 else "down" if frequency_change < -0.01 else "stable",
                "at_risk_items": at_risk_items_list,  # List of at-risk items (test expects this as list)
                "at_risk_items_count": at_risk_items_count,  # Keep count as separate field
                "cost_impact": cost_impact,
                "recommendations": recommendations,
                "period_start": start_date.isoformat(),
                "period_end": end_date.isoformat(),
                "calculated_at": datetime.utcnow().isoformat()
            }
            
            # Cache the results
            await self.cache.set_kpi_data("operational", "stockout_frequency", result, ttl=self.cache_ttl, period=cache_key)
            
            return result
            
        except Exception as e:
            print(f"Error calculating stockout frequency KPIs: {e}")
            import traceback
            traceback.print_exc()
            return {
                "error": str(e),
                "stockout_frequency": 0.0,
                "alert_status": "unknown",
                "trend_direction": "stable",
                "total_items": 0,
                "stockout_items": 0
            }
    
    async def calculate_carrying_cost_kpis(
        self, 
        start_date: date, 
        end_date: date,
        carrying_cost_rate: float = 0.25  # 25% annual carrying cost rate
    ) -> Dict[str, Any]:
        """Implement carrying cost calculations and dead stock percentage analysis"""
        
        cache_key = f"carrying_cost_kpis_{start_date}_{end_date}_{carrying_cost_rate}"
        cached_data = await self.cache.get_kpi_data("operational", "carrying_cost", period=cache_key)
        
        if cached_data:
            return cached_data["data"]
        
        try:
            # Calculate carrying cost metrics
            carrying_cost_metrics = await self._calculate_carrying_cost_metrics(
                start_date, end_date, carrying_cost_rate
            )
            
            # Calculate dead stock analysis
            dead_stock_analysis = await self._calculate_dead_stock_analysis(start_date, end_date)
            
            # Calculate previous period for comparison
            period_days = (end_date - start_date).days
            prev_start = start_date - timedelta(days=period_days)
            prev_end = start_date - timedelta(days=1)
            previous_carrying_metrics = await self._calculate_carrying_cost_metrics(
                prev_start, prev_end, carrying_cost_rate
            )
            
            # Calculate changes
            cost_change = carrying_cost_metrics["total_carrying_cost"] - previous_carrying_metrics["total_carrying_cost"]
            percentage_change = carrying_cost_metrics["carrying_cost_percentage"] - previous_carrying_metrics["carrying_cost_percentage"]
            
            # Calculate optimization potential
            optimization_potential = await self._calculate_cost_optimization_potential(carrying_cost_metrics, dead_stock_analysis)
            
            # Generate cost reduction recommendations
            recommendations = await self._generate_cost_reduction_recommendations(
                carrying_cost_metrics, dead_stock_analysis, optimization_potential
            )
            
            result = {
                **carrying_cost_metrics,
                **dead_stock_analysis,
                "previous_total_carrying_cost": round(previous_carrying_metrics["total_carrying_cost"], 2),
                "previous_carrying_cost_percentage": round(previous_carrying_metrics["carrying_cost_percentage"], 2),
                "cost_change": round(cost_change, 2),
                "percentage_change": round(percentage_change, 2),
                "trend_direction": "up" if cost_change > 0 else "down" if cost_change < 0 else "stable",
                "optimization_potential": optimization_potential,
                "recommendations": recommendations,
                "period_start": start_date.isoformat(),
                "period_end": end_date.isoformat(),
                "calculated_at": datetime.utcnow().isoformat()
            }
            
            # Cache the results
            await self.cache.set_kpi_data("operational", "carrying_cost", result, ttl=self.cache_ttl, period=cache_key)
            
            return result
            
        except Exception as e:
            print(f"Error calculating carrying cost KPIs: {e}")
            import traceback
            traceback.print_exc()
            return {
                "error": str(e),
                "total_carrying_cost": 0.0,
                "carrying_cost_percentage": 0.0,
                "dead_stock_percentage": 0.0,
                "trend_direction": "stable",
                "period_days": 0,
                "total_items": 0
            }
    
    async def _calculate_period_turnover_metrics(
        self, 
        start_date: date, 
        end_date: date, 
        category_id: Optional[str] = None
    ) -> Dict[str, float]:
        """Calculate comprehensive turnover metrics for a specific period"""
        
        try:
            # Build category filter
            category_filter = ""
            params = {"start_date": start_date, "end_date": end_date}
            
            if category_id:
                category_filter = "AND ii.category_id = :category_id"
                params["category_id"] = category_id
            
            # Calculate turnover metrics
            turnover_query = text(f"""
                WITH sales_data AS (
                    SELECT 
                        ii.id as item_id,
                        ii.name as item_name,
                        COALESCE(SUM(inv_items.quantity), 0) as units_sold,
                        -- Calculate average stock as (initial_stock + final_stock) / 2
                        -- For simplicity, use current stock + units_sold as approximation of average stock during period
                        CASE 
                            WHEN COALESCE(SUM(inv_items.quantity), 0) > 0 
                            THEN GREATEST(ii.stock_quantity + COALESCE(SUM(inv_items.quantity), 0) / 2.0, 1.0)
                            ELSE GREATEST(ii.stock_quantity, 1.0)
                        END as avg_stock,
                        COALESCE(SUM(inv_items.quantity * inv_items.unit_price), 0) as sales_value,
                        COUNT(DISTINCT inv.id) as transaction_count,
                        MAX(inv.created_at) as last_sale_date
                    FROM inventory_items ii
                    LEFT JOIN invoice_items inv_items ON ii.id = inv_items.inventory_item_id
                    LEFT JOIN invoices inv ON inv_items.invoice_id = inv.id 
                        AND DATE(inv.created_at) BETWEEN :start_date AND :end_date
                        AND inv.status IN ('completed', 'paid', 'partially_paid')
                    WHERE ii.is_active = true {category_filter}
                    GROUP BY ii.id, ii.name, ii.stock_quantity
                ),
                turnover_calculations AS (
                    SELECT 
                        item_id,
                        item_name,
                        units_sold,
                        avg_stock,
                        sales_value,
                        transaction_count,
                        last_sale_date,
                        CASE 
                            WHEN avg_stock > 0 THEN units_sold / avg_stock 
                            ELSE 0 
                        END as turnover_ratio,
                        CASE 
                            WHEN units_sold = 0 THEN 0
                            WHEN units_sold <= 5 THEN 0.2
                            WHEN units_sold <= 15 THEN 0.5
                            WHEN units_sold <= 30 THEN 0.8
                            ELSE 1.0
                        END as velocity_score,
                        CASE 
                            WHEN last_sale_date IS NULL THEN 'dead'
                            WHEN units_sold = 0 THEN 'dead'
                            WHEN units_sold <= 5 THEN 'slow'
                            WHEN units_sold <= 15 THEN 'normal'
                            ELSE 'fast'
                        END as movement_classification
                    FROM sales_data
                )
                SELECT 
                    COUNT(*) as total_items,
                    COALESCE(AVG(turnover_ratio), 0) as average_turnover_ratio,
                    COALESCE(AVG(velocity_score), 0) as average_velocity_score,
                    COALESCE(SUM(units_sold), 0) as total_units_sold,
                    COALESCE(SUM(sales_value), 0) as total_sales_value,
                    COALESCE(AVG(avg_stock), 0) as average_stock_level,
                    COUNT(CASE WHEN movement_classification = 'fast' THEN 1 END) as fast_moving_items,
                    COUNT(CASE WHEN movement_classification = 'normal' THEN 1 END) as normal_moving_items,
                    COUNT(CASE WHEN movement_classification = 'slow' THEN 1 END) as slow_moving_items,
                    COUNT(CASE WHEN movement_classification = 'dead' THEN 1 END) as dead_stock_items,
                    COALESCE(MAX(turnover_ratio), 0) as max_turnover_ratio,
                    COALESCE(MIN(turnover_ratio), 0) as min_turnover_ratio
                FROM turnover_calculations
            """)
            
            result = self.db.execute(turnover_query, params).fetchone()
            
            total_items = result.total_items or 0
            
            return {
                "total_items": total_items,
                "average_turnover_ratio": float(result.average_turnover_ratio or 0),
                "average_velocity_score": float(result.average_velocity_score or 0),
                "total_units_sold": int(result.total_units_sold or 0),
                "total_sales_value": float(result.total_sales_value or 0),
                "average_stock_level": float(result.average_stock_level or 0),
                "fast_moving_items": result.fast_moving_items or 0,
                "normal_moving_items": result.normal_moving_items or 0,
                "slow_moving_items": result.slow_moving_items or 0,
                "dead_stock_items": result.dead_stock_items or 0,
                "fast_moving_percentage": round((result.fast_moving_items or 0) / total_items * 100, 2) if total_items > 0 else 0,
                "slow_moving_percentage": round((result.slow_moving_items or 0) / total_items * 100, 2) if total_items > 0 else 0,
                "dead_stock_percentage": round((result.dead_stock_items or 0) / total_items * 100, 2) if total_items > 0 else 0,
                "max_turnover_ratio": float(result.max_turnover_ratio or 0),
                "min_turnover_ratio": float(result.min_turnover_ratio or 0)
            }
            
        except Exception as e:
            print(f"Error calculating turnover metrics: {e}")
            return {
                "total_items": 0, "average_turnover_ratio": 0.0, "average_velocity_score": 0.0,
                "total_units_sold": 0, "total_sales_value": 0.0, "average_stock_level": 0.0,
                "fast_moving_items": 0, "normal_moving_items": 0, "slow_moving_items": 0,
                "dead_stock_items": 0, "fast_moving_percentage": 0.0, "slow_moving_percentage": 0.0,
                "dead_stock_percentage": 0.0, "max_turnover_ratio": 0.0, "min_turnover_ratio": 0.0
            }
    
    async def _calculate_stockout_metrics(self, start_date: date, end_date: date) -> Dict[str, Any]:
        """Calculate stockout frequency and related metrics"""
        
        try:
            # Rollback any failed transaction first
            try:
                self.db.rollback()
            except:
                pass
                
            stockout_query = text("""
                WITH stockout_analysis AS (
                    SELECT 
                        ii.id as item_id,
                        ii.name as item_name,
                        ii.stock_quantity,
                        5 as min_stock_level,  -- Default minimum stock level
                        CASE 
                            WHEN ii.stock_quantity <= 0 THEN 1 
                            ELSE 0 
                        END as is_stockout,
                        CASE 
                            WHEN ii.stock_quantity <= 5 THEN 1  -- Use default minimum
                            ELSE 0 
                        END as is_below_min,
                        CASE 
                            WHEN ii.stock_quantity <= 7 THEN 1  -- 1.5 * 5 = 7.5, rounded down
                            ELSE 0 
                        END as is_at_risk,
                        COALESCE(SUM(inv_items.quantity), 0) as demand_during_period
                    FROM inventory_items ii
                    LEFT JOIN invoice_items inv_items ON ii.id = inv_items.inventory_item_id
                    LEFT JOIN invoices inv ON inv_items.invoice_id = inv.id 
                        AND DATE(inv.created_at) BETWEEN :start_date AND :end_date
                        AND inv.status IN ('completed', 'paid', 'partially_paid')
                    WHERE ii.is_active = true
                    GROUP BY ii.id, ii.name, ii.stock_quantity
                )
                SELECT 
                    COUNT(*) as total_items,
                    SUM(is_stockout) as stockout_items,
                    SUM(is_below_min) as below_min_items,
                    SUM(is_at_risk) as at_risk_items,
                    COALESCE(AVG(CASE WHEN is_stockout = 1 THEN demand_during_period ELSE NULL END), 0) as avg_lost_sales,
                    COALESCE(SUM(CASE WHEN is_stockout = 1 THEN demand_during_period ELSE 0 END), 0) as total_lost_sales
                FROM stockout_analysis
            """)
            
            result = self.db.execute(stockout_query, {
                "start_date": start_date,
                "end_date": end_date
            }).fetchone()
            
            total_items = result.total_items or 0
            stockout_items = result.stockout_items or 0
            
            return {
                "total_items": total_items,
                "stockout_items": stockout_items,
                "below_min_items": result.below_min_items or 0,
                "at_risk_items": result.at_risk_items or 0,
                "stockout_frequency": round(stockout_items / total_items, 4) if total_items > 0 else 0,
                "below_min_percentage": round((result.below_min_items or 0) / total_items * 100, 2) if total_items > 0 else 0,
                "at_risk_percentage": round((result.at_risk_items or 0) / total_items * 100, 2) if total_items > 0 else 0,
                "avg_lost_sales": float(result.avg_lost_sales or 0),
                "total_lost_sales": int(result.total_lost_sales or 0)
            }
            
        except Exception as e:
            print(f"Error calculating stockout metrics: {e}")
            # Rollback failed transaction
            try:
                self.db.rollback()
            except:
                pass
            return {
                "total_items": 0, "stockout_items": 0, "below_min_items": 0,
                "at_risk_items": 0, "stockout_frequency": 0.0, "below_min_percentage": 0.0,
                "at_risk_percentage": 0.0, "avg_lost_sales": 0.0, "total_lost_sales": 0
            }
    
    async def _calculate_carrying_cost_metrics(
        self, 
        start_date: date, 
        end_date: date, 
        carrying_cost_rate: float
    ) -> Dict[str, float]:
        """Calculate carrying cost metrics"""
        
        try:
            # Rollback any failed transaction first
            try:
                self.db.rollback()
            except:
                pass
            
            carrying_cost_query = text("""
                WITH inventory_value AS (
                    SELECT 
                        ii.id as item_id,
                        ii.name as item_name,
                        ii.stock_quantity,
                        ii.purchase_price,
                        (ii.stock_quantity * ii.purchase_price) as inventory_value,
                        COALESCE(SUM(inv_items.quantity), 0) as units_sold_period
                    FROM inventory_items ii
                    LEFT JOIN invoice_items inv_items ON ii.id = inv_items.inventory_item_id
                    LEFT JOIN invoices inv ON inv_items.invoice_id = inv.id 
                        AND DATE(inv.created_at) BETWEEN :start_date AND :end_date
                        AND inv.status IN ('completed', 'paid', 'partially_paid')
                    WHERE ii.is_active = true
                    GROUP BY ii.id, ii.name, ii.stock_quantity, ii.purchase_price
                )
                SELECT 
                    COUNT(*) as total_items,
                    COALESCE(SUM(inventory_value), 0) as total_inventory_value,
                    COALESCE(AVG(inventory_value), 0) as avg_item_value,
                    COALESCE(SUM(CASE WHEN units_sold_period = 0 THEN inventory_value ELSE 0 END), 0) as dead_stock_value,
                    COALESCE(SUM(CASE WHEN units_sold_period <= 2 THEN inventory_value ELSE 0 END), 0) as slow_moving_value
                FROM inventory_value
            """)
            
            result = self.db.execute(carrying_cost_query, {
                "start_date": start_date,
                "end_date": end_date
            }).fetchone()
            
            total_inventory_value = float(result.total_inventory_value or 0)
            dead_stock_value = float(result.dead_stock_value or 0)
            slow_moving_value = float(result.slow_moving_value or 0)
            
            # Calculate period-adjusted carrying cost (annual rate adjusted for period)
            period_days = (end_date - start_date).days
            period_factor = period_days / 365.0
            
            total_carrying_cost = total_inventory_value * carrying_cost_rate * period_factor
            dead_stock_carrying_cost = dead_stock_value * carrying_cost_rate * period_factor
            
            return {
                "total_items": result.total_items or 0,
                "total_inventory_value": round(total_inventory_value, 2),
                "avg_item_value": round(float(result.avg_item_value or 0), 2),
                "dead_stock_value": round(dead_stock_value, 2),
                "slow_moving_value": round(slow_moving_value, 2),
                "total_carrying_cost": round(total_carrying_cost, 2),
                "dead_stock_carrying_cost": round(dead_stock_carrying_cost, 2),
                "carrying_cost_percentage": round((total_carrying_cost / total_inventory_value * 100) if total_inventory_value > 0 else 0, 2),
                "carrying_cost_rate": carrying_cost_rate,
                "period_days": period_days
            }
            
        except Exception as e:
            print(f"Error calculating carrying cost metrics: {e}")
            # Rollback failed transaction
            try:
                self.db.rollback()
            except:
                pass
            return {
                "total_items": 0, "total_inventory_value": 0.0, "avg_item_value": 0.0,
                "dead_stock_value": 0.0, "slow_moving_value": 0.0, "total_carrying_cost": 0.0,
                "dead_stock_carrying_cost": 0.0, "carrying_cost_percentage": 0.0,
                "carrying_cost_rate": carrying_cost_rate, "period_days": 0
            }
    
    async def _calculate_dead_stock_analysis(self, start_date: date, end_date: date) -> Dict[str, Any]:
        """Calculate dead stock percentage analysis"""
        
        try:
            # Rollback any failed transaction first
            try:
                self.db.rollback()
            except:
                pass
                
            dead_stock_query = text("""
                WITH stock_analysis AS (
                    SELECT 
                        ii.id as item_id,
                        ii.name as item_name,
                        ii.stock_quantity,
                        ii.purchase_price,
                        (ii.stock_quantity * ii.purchase_price) as inventory_value,
                        COALESCE(SUM(inv_items.quantity), 0) as units_sold,
                        MAX(inv.created_at) as last_sale_date,
                        CASE 
                            WHEN COALESCE(SUM(inv_items.quantity), 0) = 0 THEN 'dead'
                            WHEN COALESCE(SUM(inv_items.quantity), 0) <= 2 THEN 'slow'
                            WHEN COALESCE(SUM(inv_items.quantity), 0) <= 10 THEN 'normal'
                            ELSE 'fast'
                        END as movement_category
                    FROM inventory_items ii
                    LEFT JOIN invoice_items inv_items ON ii.id = inv_items.inventory_item_id
                    LEFT JOIN invoices inv ON inv_items.invoice_id = inv.id 
                        AND DATE(inv.created_at) BETWEEN :start_date AND :end_date
                        AND inv.status IN ('completed', 'paid', 'partially_paid')
                    WHERE ii.is_active = true AND ii.stock_quantity > 0
                    GROUP BY ii.id, ii.name, ii.stock_quantity, ii.purchase_price
                )
                SELECT 
                    COUNT(*) as total_items,
                    COUNT(CASE WHEN movement_category = 'dead' THEN 1 END) as dead_stock_items,
                    COUNT(CASE WHEN movement_category = 'slow' THEN 1 END) as slow_moving_items,
                    COALESCE(SUM(CASE WHEN movement_category = 'dead' THEN inventory_value ELSE 0 END), 0) as dead_stock_value,
                    COALESCE(SUM(CASE WHEN movement_category = 'slow' THEN inventory_value ELSE 0 END), 0) as slow_moving_value,
                    COALESCE(SUM(inventory_value), 0) as total_inventory_value,
                    COALESCE(AVG(CASE WHEN movement_category = 'dead' AND last_sale_date IS NOT NULL 
                        THEN (CURRENT_DATE - last_sale_date::date) END), 0) as avg_days_since_last_sale
                FROM stock_analysis
            """)
            
            result = self.db.execute(dead_stock_query, {
                "start_date": start_date,
                "end_date": end_date
            }).fetchone()
            
            total_items = result.total_items or 0
            total_inventory_value = float(result.total_inventory_value or 0)
            
            return {
                "dead_stock_items": result.dead_stock_items or 0,
                "slow_moving_items": result.slow_moving_items or 0,
                "dead_stock_percentage": round((result.dead_stock_items or 0) / total_items * 100, 2) if total_items > 0 else 0,
                "slow_moving_percentage": round((result.slow_moving_items or 0) / total_items * 100, 2) if total_items > 0 else 0,
                "dead_stock_value": round(float(result.dead_stock_value or 0), 2),
                "slow_moving_value": round(float(result.slow_moving_value or 0), 2),
                "dead_stock_value_percentage": round((float(result.dead_stock_value or 0) / total_inventory_value * 100) if total_inventory_value > 0 else 0, 2),
                "avg_days_since_last_sale": int(result.avg_days_since_last_sale or 0)
            }
            
        except Exception as e:
            print(f"Error calculating dead stock analysis: {e}")
            # Rollback failed transaction
            try:
                self.db.rollback()
            except:
                pass
            return {
                "dead_stock_items": 0, "slow_moving_items": 0, "dead_stock_percentage": 0.0,
                "slow_moving_percentage": 0.0, "dead_stock_value": 0.0, "slow_moving_value": 0.0,
                "dead_stock_value_percentage": 0.0, "avg_days_since_last_sale": 0
            }
    
    async def _calculate_turnover_trend(
        self, 
        start_date: date, 
        end_date: date, 
        category_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Calculate turnover trend analysis"""
        
        try:
            # Get weekly turnover data for trend analysis
            weekly_data = await self._get_weekly_turnover_data(start_date, end_date, category_id)
            
            if len(weekly_data) < 3:
                return {
                    "trend": "insufficient_data",
                    "slope": 0,
                    "data_points": len(weekly_data)
                }
            
            # Extract turnover ratios for trend analysis
            turnovers = [d["turnover_ratio"] for d in weekly_data]
            weeks = list(range(len(turnovers)))
            
            # Calculate linear regression if we have enough data
            if len(turnovers) > 1:
                slope, intercept, r_value, p_value, std_err = stats.linregress(weeks, turnovers)
                r_squared = r_value ** 2
                
                # Determine trend direction
                if slope > 0.05 and p_value < 0.05:
                    trend = "improving"
                elif slope < -0.05 and p_value < 0.05:
                    trend = "declining"
                else:
                    trend = "stable"
                
                return {
                    "trend": trend,
                    "slope": round(slope, 4),
                    "r_squared": round(r_squared, 4),
                    "p_value": round(p_value, 4),
                    "data_points": len(weekly_data),
                    "trend_strength": "strong" if r_squared > 0.7 else "moderate" if r_squared > 0.4 else "weak"
                }
            else:
                return {
                    "trend": "stable",
                    "slope": 0,
                    "r_squared": 0,
                    "data_points": len(weekly_data)
                }
                
        except Exception as e:
            print(f"Error calculating turnover trend: {e}")
            return {
                "trend": "calculation_error",
                "slope": 0,
                "r_squared": 0,
                "data_points": 0,
                "error": str(e)
            }
    
    async def _analyze_item_movement(
        self, 
        start_date: date, 
        end_date: date, 
        category_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Analyze item movement patterns"""
        
        try:
            # Build category filter
            category_filter = ""
            params = {"start_date": start_date, "end_date": end_date}
            
            if category_id:
                category_filter = "AND ii.category_id = :category_id"
                params["category_id"] = category_id
            
            movement_query = text(f"""
                WITH item_movement AS (
                    SELECT 
                        ii.id as item_id,
                        ii.name as item_name,
                        c.name as category_name,
                        ii.stock_quantity,
                        COALESCE(SUM(inv_items.quantity), 0) as units_sold,
                        COALESCE(SUM(inv_items.total_price), 0) as sales_value,
                        COUNT(DISTINCT inv.id) as transaction_count,
                        MAX(inv.created_at) as last_sale_date,
                        -- Calculate turnover ratio using average stock during period
                        CASE 
                            WHEN COALESCE(SUM(inv_items.quantity), 0) > 0 
                            THEN COALESCE(SUM(inv_items.quantity), 0) / GREATEST(ii.stock_quantity + COALESCE(SUM(inv_items.quantity), 0) / 2.0, 1.0)
                            ELSE 0 
                        END as turnover_ratio
                    FROM inventory_items ii
                    LEFT JOIN categories c ON ii.category_id = c.id
                    LEFT JOIN invoice_items inv_items ON ii.id = inv_items.inventory_item_id
                    LEFT JOIN invoices inv ON inv_items.invoice_id = inv.id 
                        AND DATE(inv.created_at) BETWEEN :start_date AND :end_date
                        AND inv.status IN ('completed', 'paid', 'partially_paid')
                    WHERE ii.is_active = true {category_filter}
                    GROUP BY ii.id, ii.name, c.name, ii.stock_quantity
                )
                SELECT 
                    item_id,
                    item_name,
                    category_name,
                    stock_quantity,
                    units_sold,
                    sales_value,
                    transaction_count,
                    last_sale_date,
                    turnover_ratio,
                    CASE 
                        WHEN units_sold = 0 THEN 'dead'
                        WHEN units_sold <= 2 THEN 'slow'
                        WHEN units_sold <= 10 THEN 'normal'
                        ELSE 'fast'
                    END as movement_classification
                FROM item_movement
                ORDER BY units_sold DESC
                LIMIT 50
            """)
            
            results = self.db.execute(movement_query, params).fetchall()
            
            # Categorize items
            fast_movers = []
            slow_movers = []
            dead_stock = []
            
            for row in results:
                item_data = {
                    "item_id": str(row.item_id),
                    "item_name": row.item_name,
                    "category_name": row.category_name,
                    "stock_quantity": row.stock_quantity,
                    "units_sold": row.units_sold,
                    "sales_value": float(row.sales_value or 0),
                    "transaction_count": row.transaction_count,
                    "turnover_ratio": float(row.turnover_ratio or 0),
                    "last_sale_date": row.last_sale_date.isoformat() if row.last_sale_date else None
                }
                
                if row.movement_classification == 'fast':
                    fast_movers.append(item_data)
                elif row.movement_classification == 'slow':
                    slow_movers.append(item_data)
                elif row.movement_classification == 'dead':
                    dead_stock.append(item_data)
            
            return {
                "fast_movers": fast_movers[:10],  # Top 10 fast movers
                "slow_movers": slow_movers[:10],  # Top 10 slow movers
                "dead_stock": dead_stock[:10],    # Top 10 dead stock items
                "total_analyzed": len(results)
            }
            
        except Exception as e:
            print(f"Error analyzing item movement: {e}")
            return {
                "fast_movers": [],
                "slow_movers": [],
                "dead_stock": [],
                "total_analyzed": 0,
                "error": str(e)
            }
    
    async def _calculate_inventory_health_score(
        self, 
        turnover_metrics: Dict[str, Any], 
        movement_analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Calculate overall inventory health score"""
        
        try:
            # Calculate component scores (0-100 scale)
            
            # Turnover score (higher turnover is better)
            turnover_score = min(turnover_metrics["average_turnover_ratio"] * 20, 100)
            
            # Movement distribution score (balanced distribution is better)
            fast_percentage = turnover_metrics["fast_moving_percentage"]
            dead_percentage = turnover_metrics["dead_stock_percentage"]
            
            # Ideal: 30% fast, 50% normal, 15% slow, 5% dead
            movement_score = max(0, 100 - (abs(fast_percentage - 30) + abs(dead_percentage - 5)) * 2)
            
            # Stock level score (based on stockout risk)
            stock_level_score = max(0, 100 - turnover_metrics["dead_stock_percentage"] * 2)
            
            # Overall health score (weighted average)
            overall_score = (
                turnover_score * 0.4 +
                movement_score * 0.35 +
                stock_level_score * 0.25
            )
            
            # Determine health status
            if overall_score >= 80:
                health_status = "excellent"
            elif overall_score >= 65:
                health_status = "good"
            elif overall_score >= 50:
                health_status = "fair"
            elif overall_score >= 35:
                health_status = "poor"
            else:
                health_status = "critical"
            
            return {
                "overall_score": round(overall_score, 1),
                "health_status": health_status,
                "component_scores": {
                    "turnover_score": round(turnover_score, 1),
                    "movement_score": round(movement_score, 1),
                    "stock_level_score": round(stock_level_score, 1)
                },
                "recommendations": self._generate_health_recommendations(overall_score, health_status, turnover_metrics)
            }
            
        except Exception as e:
            print(f"Error calculating inventory health score: {e}")
            return {
                "overall_score": 0.0,
                "health_status": "unknown",
                "component_scores": {
                    "turnover_score": 0.0,
                    "movement_score": 0.0,
                    "stock_level_score": 0.0
                },
                "recommendations": []
            }
    
    def _generate_health_recommendations(
        self, 
        overall_score: float, 
        health_status: str, 
        turnover_metrics: Dict[str, Any]
    ) -> List[str]:
        """Generate inventory health improvement recommendations"""
        
        recommendations = []
        
        if health_status == "critical" or health_status == "poor":
            recommendations.append("Immediate action required: Review and liquidate dead stock items")
            recommendations.append("Implement aggressive promotional campaigns for slow-moving items")
            
        if turnover_metrics["dead_stock_percentage"] > 15:
            recommendations.append("Dead stock percentage is high - consider clearance sales or returns to suppliers")
            
        if turnover_metrics["average_turnover_ratio"] < 0.5:
            recommendations.append("Low turnover ratio - review purchasing patterns and demand forecasting")
            
        if turnover_metrics["fast_moving_percentage"] < 20:
            recommendations.append("Increase stock levels for fast-moving items to capture more sales")
            
        if overall_score < 60:
            recommendations.append("Consider implementing automated reorder points and inventory optimization")
            
        return recommendations
    
    async def _get_items_at_risk_of_stockout(self) -> List[Dict[str, Any]]:
        """Get items at risk of stockout"""
        
        try:
            at_risk_query = text("""
                SELECT 
                    ii.id as item_id,
                    ii.name as item_name,
                    c.name as category_name,
                    ii.stock_quantity,
                    5 as min_stock_level,  -- Default minimum stock level
                    ii.purchase_price,
                    ii.purchase_price * 1.5 as sell_price,  -- Estimate sell price
                    CASE 
                        WHEN ii.stock_quantity <= 0 THEN 'stockout'
                        WHEN ii.stock_quantity <= 5 THEN 'critical'  -- Use default minimum
                        WHEN ii.stock_quantity <= 7 THEN 'warning'   -- 1.5 * 5 = 7.5
                        ELSE 'normal'
                    END as risk_level
                FROM inventory_items ii
                LEFT JOIN categories c ON ii.category_id = c.id
                WHERE ii.is_active = true 
                AND ii.stock_quantity <= 7
                ORDER BY 
                    CASE 
                        WHEN ii.stock_quantity <= 0 THEN 1
                        WHEN ii.stock_quantity <= 5 THEN 2  -- Use default minimum
                        ELSE 3
                    END,
                    ii.stock_quantity ASC
                LIMIT 20
            """)
            
            results = self.db.execute(at_risk_query).fetchall()
            
            at_risk_items = []
            for row in results:
                at_risk_items.append({
                    "item_id": str(row.item_id),
                    "item_name": row.item_name,
                    "category_name": row.category_name,
                    "stock_quantity": row.stock_quantity,
                    "min_stock_level": row.min_stock_level,
                    "purchase_price": float(row.purchase_price),
                    "sell_price": float(row.sell_price),
                    "risk_level": row.risk_level
                })
            
            return at_risk_items
            
        except Exception as e:
            print(f"Error getting items at risk of stockout: {e}")
            return []
    
    async def _calculate_stockout_cost_impact(self, start_date: date, end_date: date) -> Dict[str, Any]:
        """Calculate the cost impact of stockouts"""
        
        try:
            cost_impact_query = text("""
                WITH stockout_impact AS (
                    SELECT 
                        ii.id as item_id,
                        ii.name as item_name,
                        ii.stock_quantity,
                        ii.purchase_price * 1.5 as sell_price,  -- Estimate sell price
                        COALESCE(SUM(inv_items.quantity), 0) as demand_during_period,
                        CASE 
                            WHEN ii.stock_quantity <= 0 AND COALESCE(SUM(inv_items.quantity), 0) > 0 
                            THEN COALESCE(SUM(inv_items.quantity), 0) * (ii.purchase_price * 1.5)
                            ELSE 0 
                        END as lost_revenue
                    FROM inventory_items ii
                    LEFT JOIN invoice_items inv_items ON ii.id = inv_items.inventory_item_id
                    LEFT JOIN invoices inv ON inv_items.invoice_id = inv.id 
                        AND DATE(inv.created_at) BETWEEN :start_date AND :end_date
                        AND inv.status IN ('completed', 'paid', 'partially_paid')
                    WHERE ii.is_active = true
                    GROUP BY ii.id, ii.name, ii.stock_quantity, ii.purchase_price
                )
                SELECT 
                    COUNT(CASE WHEN lost_revenue > 0 THEN 1 END) as items_with_lost_sales,
                    COALESCE(SUM(lost_revenue), 0) as total_lost_revenue,
                    COALESCE(AVG(CASE WHEN lost_revenue > 0 THEN lost_revenue END), 0) as avg_lost_revenue_per_item,
                    COALESCE(SUM(demand_during_period), 0) as total_demand,
                    COALESCE(SUM(CASE WHEN stock_quantity <= 0 THEN demand_during_period ELSE 0 END), 0) as unmet_demand
                FROM stockout_impact
            """)
            
            result = self.db.execute(cost_impact_query, {
                "start_date": start_date,
                "end_date": end_date
            }).fetchone()
            
            return {
                "items_with_lost_sales": result.items_with_lost_sales or 0,
                "total_lost_revenue": round(float(result.total_lost_revenue or 0), 2),
                "avg_lost_revenue_per_item": round(float(result.avg_lost_revenue_per_item or 0), 2),
                "total_demand": int(result.total_demand or 0),
                "unmet_demand": int(result.unmet_demand or 0),
                "fulfillment_rate": float(round(
                    ((result.total_demand or 0) - (result.unmet_demand or 0)) / (result.total_demand or 1) * 100, 2
                )) if result.total_demand and result.total_demand > 0 else 100.0
            }
            
        except Exception as e:
            print(f"Error calculating stockout cost impact: {e}")
            return {
                "items_with_lost_sales": 0,
                "total_lost_revenue": 0.0,
                "avg_lost_revenue_per_item": 0.0,
                "total_demand": 0,
                "unmet_demand": 0,
                "fulfillment_rate": 100.0
            }
    
    async def _generate_stockout_recommendations(
        self, 
        stockout_metrics: Dict[str, Any], 
        at_risk_items: List[Dict[str, Any]]
    ) -> List[str]:
        """Generate stockout prevention recommendations"""
        
        recommendations = []
        
        if stockout_metrics["stockout_frequency"] > 0.05:  # More than 5% stockout rate
            recommendations.append("High stockout frequency detected - review and adjust minimum stock levels")
            
        if stockout_metrics["at_risk_percentage"] > 20:
            recommendations.append("Many items at risk of stockout - implement automated reorder alerts")
            
        if len(at_risk_items) > 0:
            critical_items = [item for item in at_risk_items if item["risk_level"] == "critical"]
            if critical_items:
                recommendations.append(f"Immediate reorder required for {len(critical_items)} critical items")
                
        if stockout_metrics["total_lost_sales"] > 0:
            recommendations.append("Lost sales detected due to stockouts - improve demand forecasting")
            
        recommendations.append("Consider implementing safety stock calculations based on demand variability")
        recommendations.append("Set up automated alerts when stock levels reach reorder points")
        
        return recommendations
    
    async def _calculate_cost_optimization_potential(
        self, 
        carrying_cost_metrics: Dict[str, Any], 
        dead_stock_analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Calculate cost optimization potential"""
        
        try:
            # Calculate potential savings from dead stock liquidation
            dead_stock_savings = dead_stock_analysis["dead_stock_value"] * 0.7  # Assume 70% recovery
            
            # Calculate potential savings from slow-moving stock optimization
            slow_moving_savings = dead_stock_analysis["slow_moving_value"] * 0.1  # 10% reduction
            
            # Calculate carrying cost savings
            carrying_cost_savings = (dead_stock_savings + slow_moving_savings) * carrying_cost_metrics["carrying_cost_rate"]
            
            total_potential_savings = dead_stock_savings + slow_moving_savings + carrying_cost_savings
            
            return {
                "dead_stock_liquidation_potential": round(dead_stock_savings, 2),
                "slow_moving_optimization_potential": round(slow_moving_savings, 2),
                "carrying_cost_reduction_potential": round(carrying_cost_savings, 2),
                "total_optimization_potential": round(total_potential_savings, 2),
                "optimization_percentage": round(
                    (total_potential_savings / carrying_cost_metrics["total_inventory_value"] * 100) 
                    if carrying_cost_metrics["total_inventory_value"] > 0 else 0, 2
                )
            }
            
        except Exception as e:
            print(f"Error calculating cost optimization potential: {e}")
            return {
                "dead_stock_liquidation_potential": 0.0,
                "slow_moving_optimization_potential": 0.0,
                "carrying_cost_reduction_potential": 0.0,
                "total_optimization_potential": 0.0,
                "optimization_percentage": 0.0
            }
    
    async def _generate_cost_reduction_recommendations(
        self, 
        carrying_cost_metrics: Dict[str, Any], 
        dead_stock_analysis: Dict[str, Any], 
        optimization_potential: Dict[str, Any]
    ) -> List[str]:
        """Generate cost reduction recommendations"""
        
        recommendations = []
        
        if dead_stock_analysis["dead_stock_percentage"] > 10:
            recommendations.append("High dead stock percentage - implement clearance sales or return policies")
            
        if carrying_cost_metrics["carrying_cost_percentage"] > 30:
            recommendations.append("High carrying costs - review inventory levels and turnover rates")
            
        if optimization_potential["total_optimization_potential"] > 1000:
            recommendations.append(f"Significant cost savings potential: ${optimization_potential['total_optimization_potential']:,.2f}")
            
        if dead_stock_analysis["avg_days_since_last_sale"] > 180:
            recommendations.append("Items with no sales for 6+ months - consider liquidation or discontinuation")
            
        recommendations.append("Implement ABC analysis to focus on high-value items")
        recommendations.append("Consider just-in-time ordering for slow-moving items")
        recommendations.append("Review supplier terms for better payment and return policies")
        
        return recommendations
    
    async def _get_weekly_turnover_data(
        self, 
        start_date: date, 
        end_date: date, 
        category_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get weekly turnover data for trend analysis"""
        
        try:
            # Build category filter
            category_filter = ""
            params = {"start_date": start_date, "end_date": end_date}
            
            if category_id:
                category_filter = "AND ii.category_id = :category_id"
                params["category_id"] = category_id
            
            weekly_query = text(f"""
                WITH weekly_sales AS (
                    SELECT 
                        DATE_TRUNC('week', inv.created_at) as week_start,
                        COALESCE(SUM(inv_items.quantity), 0) as weekly_units_sold,
                        COALESCE(AVG(ii.stock_quantity), 0) as avg_weekly_stock
                    FROM inventory_items ii
                    LEFT JOIN invoice_items inv_items ON ii.id = inv_items.inventory_item_id
                    LEFT JOIN invoices inv ON inv_items.invoice_id = inv.id 
                        AND DATE(inv.created_at) BETWEEN :start_date AND :end_date
                        AND inv.status IN ('completed', 'paid', 'partially_paid')
                    WHERE ii.is_active = true {category_filter}
                    GROUP BY DATE_TRUNC('week', inv.created_at)
                    ORDER BY week_start
                )
                SELECT 
                    week_start,
                    weekly_units_sold,
                    avg_weekly_stock,
                    CASE 
                        WHEN avg_weekly_stock > 0 THEN weekly_units_sold / avg_weekly_stock 
                        ELSE 0 
                    END as turnover_ratio
                FROM weekly_sales
                WHERE week_start IS NOT NULL
            """)
            
            results = self.db.execute(weekly_query, params).fetchall()
            
            weekly_data = []
            for row in results:
                weekly_data.append({
                    "week_start": row.week_start.date() if row.week_start else None,
                    "weekly_units_sold": int(row.weekly_units_sold or 0),
                    "avg_weekly_stock": float(row.avg_weekly_stock or 0),
                    "turnover_ratio": float(row.turnover_ratio or 0)
                })
            
            return weekly_data
            
        except Exception as e:
            print(f"Error getting weekly turnover data: {e}")
            return []


class CustomerKPICalculator:
    """Customer KPI calculator with cohort analysis and lifecycle tracking"""
    
    def __init__(self, db: Session):
        self.db = db
        self.cache = get_analytics_cache()
        self.cache_ttl = 300  # 5 minutes default TTL
    
    async def calculate_customer_acquisition_kpis(
        self, 
        start_date: date, 
        end_date: date,
        targets: Optional[Dict[str, float]] = None
    ) -> Dict[str, Any]:
        """Calculate customer acquisition rate tracking with cohort analysis"""
        
        cache_key = f"customer_acquisition_kpis_{start_date}_{end_date}"
        cached_data = await self.cache.get_kpi_data("customer", "acquisition", period=cache_key)
        
        if cached_data:
            return cached_data["data"]
        
        try:
            # Calculate current period acquisition metrics
            current_metrics = await self._calculate_acquisition_metrics(start_date, end_date)
            
            # Calculate previous period for comparison
            period_days = (end_date - start_date).days
            prev_start = start_date - timedelta(days=period_days)
            prev_end = start_date - timedelta(days=1)
            previous_metrics = await self._calculate_acquisition_metrics(prev_start, prev_end)
            
            # Calculate growth rates
            new_customers_growth = 0.0
            if previous_metrics["new_customers"] > 0:
                new_customers_growth = ((current_metrics["new_customers"] - previous_metrics["new_customers"]) / previous_metrics["new_customers"]) * 100
            
            acquisition_rate_change = current_metrics["acquisition_rate"] - previous_metrics["acquisition_rate"]
            
            # Perform cohort analysis
            cohort_analysis = await self._perform_cohort_analysis(start_date, end_date)
            
            # Calculate customer acquisition cost (CAC) if available
            cac_metrics = await self._calculate_customer_acquisition_cost(start_date, end_date)
            
            # Calculate achievement rate if targets provided
            achievement_data = {}
            if targets and "new_customers" in targets:
                target_customers = targets["new_customers"]
                achievement_rate = (current_metrics["new_customers"] / target_customers * 100) if target_customers > 0 else 0
                variance = current_metrics["new_customers"] - target_customers
                
                achievement_data = {
                    "new_customers_target": target_customers,
                    "acquisition_achievement_rate": round(achievement_rate, 2),
                    "acquisition_variance": variance,
                    "target_status": "exceeded" if achievement_rate > 100 else "met" if achievement_rate >= 95 else "below"
                }
            
            result = {
                **current_metrics,
                "previous_new_customers": previous_metrics["new_customers"],
                "previous_acquisition_rate": round(previous_metrics["acquisition_rate"], 2),
                "new_customers_growth": round(new_customers_growth, 2),
                "acquisition_rate_change": round(acquisition_rate_change, 2),
                "trend_direction": "up" if new_customers_growth > 5 else "down" if new_customers_growth < -5 else "stable",
                "cohort_analysis": cohort_analysis,
                "cac_metrics": cac_metrics,
                "period_start": start_date.isoformat(),
                "period_end": end_date.isoformat(),
                "calculated_at": datetime.utcnow().isoformat(),
                **achievement_data
            }
            
            # Cache the results
            await self.cache.set_kpi_data("customer", "acquisition", result, ttl=self.cache_ttl, period=cache_key)
            
            return result
            
        except Exception as e:
            print(f"Error calculating customer acquisition KPIs: {e}")
            return {
                "error": str(e),
                "new_customers": 0,
                "acquisition_rate": 0.0,
                "trend_direction": "stable"
            }
    
    async def calculate_customer_retention_kpis(
        self, 
        start_date: date, 
        end_date: date,
        targets: Optional[Dict[str, float]] = None
    ) -> Dict[str, Any]:
        """Calculate retention rate with customer lifecycle analysis"""
        
        cache_key = f"customer_retention_kpis_{start_date}_{end_date}"
        cached_data = await self.cache.get_kpi_data("customer", "retention", period=cache_key)
        
        if cached_data:
            return cached_data["data"]
        
        try:
            # Calculate current period retention metrics
            current_metrics = await self._calculate_retention_metrics(start_date, end_date)
            
            # Calculate previous period for comparison
            period_days = (end_date - start_date).days
            prev_start = start_date - timedelta(days=period_days)
            prev_end = start_date - timedelta(days=1)
            previous_metrics = await self._calculate_retention_metrics(prev_start, prev_end)
            
            # Calculate retention changes
            retention_rate_change = current_metrics["retention_rate"] - previous_metrics["retention_rate"]
            churn_rate_change = current_metrics["churn_rate"] - previous_metrics["churn_rate"]
            
            # Perform customer lifecycle analysis
            lifecycle_analysis = await self._perform_lifecycle_analysis(start_date, end_date)
            
            # Calculate customer segments
            customer_segments = await self._analyze_customer_segments(start_date, end_date)
            
            # Calculate achievement rate if targets provided
            achievement_data = {}
            if targets and "retention_rate" in targets:
                target_retention = targets["retention_rate"]
                achievement_rate = (current_metrics["retention_rate"] / target_retention * 100) if target_retention > 0 else 0
                variance = current_metrics["retention_rate"] - target_retention
                
                achievement_data = {
                    "retention_target": target_retention,
                    "retention_achievement_rate": round(achievement_rate, 2),
                    "retention_variance": round(variance, 2),
                    "target_status": "exceeded" if achievement_rate > 100 else "met" if achievement_rate >= 95 else "below"
                }
            
            result = {
                **current_metrics,
                "previous_retention_rate": round(previous_metrics["retention_rate"], 2),
                "previous_churn_rate": round(previous_metrics["churn_rate"], 2),
                "retention_rate_change": round(retention_rate_change, 2),
                "churn_rate_change": round(churn_rate_change, 2),
                "trend_direction": "up" if retention_rate_change > 1 else "down" if retention_rate_change < -1 else "stable",
                "lifecycle_analysis": lifecycle_analysis,
                "customer_segments": customer_segments,
                "period_start": start_date.isoformat(),
                "period_end": end_date.isoformat(),
                "calculated_at": datetime.utcnow().isoformat(),
                **achievement_data
            }
            
            # Cache the results
            await self.cache.set_kpi_data("customer", "retention", result, ttl=self.cache_ttl, period=cache_key)
            
            return result
            
        except Exception as e:
            print(f"Error calculating customer retention KPIs: {e}")
            return {
                "error": str(e),
                "retention_rate": 0.0,
                "churn_rate": 0.0,
                "trend_direction": "stable"
            }
    
    async def calculate_customer_value_kpis(
        self, 
        start_date: date, 
        end_date: date,
        targets: Optional[Dict[str, float]] = None
    ) -> Dict[str, Any]:
        """Calculate average transaction value and customer lifetime value"""
        
        cache_key = f"customer_value_kpis_{start_date}_{end_date}"
        cached_data = await self.cache.get_kpi_data("customer", "value", period=cache_key)
        
        if cached_data:
            return cached_data["data"]
        
        try:
            # Calculate current period value metrics
            current_metrics = await self._calculate_value_metrics(start_date, end_date)
            
            # Calculate previous period for comparison
            period_days = (end_date - start_date).days
            prev_start = start_date - timedelta(days=period_days)
            prev_end = start_date - timedelta(days=1)
            previous_metrics = await self._calculate_value_metrics(prev_start, prev_end)
            
            # Calculate value changes
            atv_change = current_metrics["average_transaction_value"] - previous_metrics["average_transaction_value"]
            atv_growth = 0.0
            if previous_metrics["average_transaction_value"] > 0:
                atv_growth = (atv_change / previous_metrics["average_transaction_value"]) * 100
            
            clv_change = current_metrics["customer_lifetime_value"] - previous_metrics["customer_lifetime_value"]
            clv_growth = 0.0
            if previous_metrics["customer_lifetime_value"] > 0:
                clv_growth = (clv_change / previous_metrics["customer_lifetime_value"]) * 100
            
            # Calculate customer value distribution
            value_distribution = await self._analyze_customer_value_distribution(start_date, end_date)
            
            # Calculate RFM analysis (Recency, Frequency, Monetary)
            rfm_analysis = await self._perform_rfm_analysis(start_date, end_date)
            
            # Calculate achievement rate if targets provided
            achievement_data = {}
            if targets and "average_transaction_value" in targets:
                target_atv = targets["average_transaction_value"]
                achievement_rate = (current_metrics["average_transaction_value"] / target_atv * 100) if target_atv > 0 else 0
                variance = current_metrics["average_transaction_value"] - target_atv
                
                achievement_data = {
                    "atv_target": target_atv,
                    "atv_achievement_rate": round(achievement_rate, 2),
                    "atv_variance": round(variance, 2),
                    "target_status": "exceeded" if achievement_rate > 100 else "met" if achievement_rate >= 95 else "below"
                }
            
            result = {
                **current_metrics,
                "previous_average_transaction_value": round(previous_metrics["average_transaction_value"], 2),
                "previous_customer_lifetime_value": round(previous_metrics["customer_lifetime_value"], 2),
                "atv_change": round(atv_change, 2),
                "atv_growth": round(atv_growth, 2),
                "clv_change": round(clv_change, 2),
                "clv_growth": round(clv_growth, 2),
                "trend_direction": "up" if atv_growth > 5 else "down" if atv_growth < -5 else "stable",
                "value_distribution": value_distribution,
                "rfm_analysis": rfm_analysis,
                "period_start": start_date.isoformat(),
                "period_end": end_date.isoformat(),
                "calculated_at": datetime.utcnow().isoformat(),
                **achievement_data
            }
            
            # Cache the results
            await self.cache.set_kpi_data("customer", "value", result, ttl=self.cache_ttl, period=cache_key)
            
            return result
            
        except Exception as e:
            print(f"Error calculating customer value KPIs: {e}")
            return {
                "error": str(e),
                "average_transaction_value": 0.0,
                "customer_lifetime_value": 0.0,
                "trend_direction": "stable"
            }
    
    async def _calculate_acquisition_metrics(self, start_date: date, end_date: date) -> Dict[str, Any]:
        """Calculate customer acquisition metrics for a period"""
        
        try:
            # Get new customers in the period
            new_customers_query = text("""
                SELECT 
                    COUNT(*) as new_customers,
                    COUNT(DISTINCT DATE(created_at)) as active_days
                FROM customers 
                WHERE DATE(created_at) BETWEEN :start_date AND :end_date
                AND is_active = true
            """)
            
            result = self.db.execute(new_customers_query, {
                "start_date": start_date,
                "end_date": end_date
            }).fetchone()
            
            new_customers = result.new_customers or 0
            active_days = result.active_days or 1
            
            # Calculate acquisition rate (new customers per day)
            acquisition_rate = new_customers / active_days if active_days > 0 else 0
            
            # Get total customers for context
            total_customers_query = text("""
                SELECT COUNT(*) as total_customers
                FROM customers 
                WHERE is_active = true
            """)
            
            total_result = self.db.execute(total_customers_query).fetchone()
            total_customers = total_result.total_customers or 0
            
            # Calculate acquisition percentage
            acquisition_percentage = (new_customers / total_customers * 100) if total_customers > 0 else 0
            
            return {
                "new_customers": new_customers,
                "acquisition_rate": round(acquisition_rate, 2),
                "acquisition_percentage": round(acquisition_percentage, 2),
                "total_customers": total_customers,
                "active_days": active_days
            }
            
        except Exception as e:
            print(f"Error calculating acquisition metrics: {e}")
            return {
                "new_customers": 0,
                "acquisition_rate": 0.0,
                "acquisition_percentage": 0.0,
                "total_customers": 0,
                "active_days": 0
            }
    
    async def _calculate_retention_metrics(self, start_date: date, end_date: date) -> Dict[str, Any]:
        """Calculate customer retention metrics for a period"""
        
        try:
            # Get customers who made purchases in the period
            active_customers_query = text("""
                SELECT 
                    COUNT(DISTINCT customer_id) as active_customers
                FROM invoices 
                WHERE DATE(created_at) BETWEEN :start_date AND :end_date
                AND status IN ('completed', 'paid', 'partially_paid')
            """)
            
            active_result = self.db.execute(active_customers_query, {
                "start_date": start_date,
                "end_date": end_date
            }).fetchone()
            
            active_customers = active_result.active_customers or 0
            
            # Get customers who made purchases in the previous period
            period_days = (end_date - start_date).days
            prev_start = start_date - timedelta(days=period_days)
            prev_end = start_date - timedelta(days=1)
            
            previous_customers_query = text("""
                SELECT 
                    COUNT(DISTINCT customer_id) as previous_customers
                FROM invoices 
                WHERE DATE(created_at) BETWEEN :prev_start AND :prev_end
                AND status IN ('completed', 'paid', 'partially_paid')
            """)
            
            previous_result = self.db.execute(previous_customers_query, {
                "prev_start": prev_start,
                "prev_end": prev_end
            }).fetchone()
            
            previous_customers = previous_result.previous_customers or 0
            
            # Get retained customers (customers who purchased in both periods)
            retained_customers_query = text("""
                SELECT COUNT(DISTINCT customer_id) as retained_customers
                FROM (
                    SELECT customer_id
                    FROM invoices 
                    WHERE DATE(created_at) BETWEEN :prev_start AND :prev_end
                    AND status IN ('completed', 'paid', 'partially_paid')
                    
                    INTERSECT
                    
                    SELECT customer_id
                    FROM invoices 
                    WHERE DATE(created_at) BETWEEN :start_date AND :end_date
                    AND status IN ('completed', 'paid', 'partially_paid')
                ) retained
            """)
            
            retained_result = self.db.execute(retained_customers_query, {
                "prev_start": prev_start,
                "prev_end": prev_end,
                "start_date": start_date,
                "end_date": end_date
            }).fetchone()
            
            retained_customers = retained_result.retained_customers or 0
            
            # Calculate retention rate
            retention_rate = (retained_customers / previous_customers * 100) if previous_customers > 0 else 0
            
            # Calculate churn rate
            churned_customers = previous_customers - retained_customers
            churn_rate = (churned_customers / previous_customers * 100) if previous_customers > 0 else 0
            
            # Calculate repeat purchase rate
            repeat_customers_query = text("""
                SELECT COUNT(DISTINCT customer_id) as repeat_customers
                FROM (
                    SELECT customer_id, COUNT(*) as purchase_count
                    FROM invoices 
                    WHERE DATE(created_at) BETWEEN :start_date AND :end_date
                    AND status IN ('completed', 'paid', 'partially_paid')
                    GROUP BY customer_id
                    HAVING COUNT(*) > 1
                ) repeat_buyers
            """)
            
            repeat_result = self.db.execute(repeat_customers_query, {
                "start_date": start_date,
                "end_date": end_date
            }).fetchone()
            
            repeat_customers = repeat_result.repeat_customers or 0
            repeat_purchase_rate = (repeat_customers / active_customers * 100) if active_customers > 0 else 0
            
            return {
                "retention_rate": round(retention_rate, 2),
                "churn_rate": round(churn_rate, 2),
                "active_customers": active_customers,
                "previous_customers": previous_customers,
                "retained_customers": retained_customers,
                "churned_customers": churned_customers,
                "repeat_customers": repeat_customers,
                "repeat_purchase_rate": round(repeat_purchase_rate, 2)
            }
            
        except Exception as e:
            print(f"Error calculating retention metrics: {e}")
            return {
                "retention_rate": 0.0,
                "churn_rate": 0.0,
                "active_customers": 0,
                "previous_customers": 0,
                "retained_customers": 0,
                "churned_customers": 0,
                "repeat_customers": 0,
                "repeat_purchase_rate": 0.0
            }
    
    async def _calculate_value_metrics(self, start_date: date, end_date: date) -> Dict[str, Any]:
        """Calculate customer value metrics for a period"""
        
        try:
            # Calculate average transaction value and customer lifetime value
            value_query = text("""
                SELECT 
                    COUNT(DISTINCT i.customer_id) as unique_customers,
                    COUNT(i.id) as total_transactions,
                    COALESCE(SUM(i.total_amount), 0) as total_revenue,
                    COALESCE(AVG(i.total_amount), 0) as avg_transaction_value,
                    COALESCE(MAX(i.total_amount), 0) as max_transaction_value,
                    COALESCE(MIN(i.total_amount), 0) as min_transaction_value
                FROM invoices i
                WHERE DATE(i.created_at) BETWEEN :start_date AND :end_date
                AND i.status IN ('completed', 'paid', 'partially_paid')
            """)
            
            result = self.db.execute(value_query, {
                "start_date": start_date,
                "end_date": end_date
            }).fetchone()
            
            unique_customers = result.unique_customers or 0
            total_transactions = result.total_transactions or 0
            total_revenue = float(result.total_revenue or 0)
            avg_transaction_value = float(result.avg_transaction_value or 0)
            max_transaction_value = float(result.max_transaction_value or 0)
            min_transaction_value = float(result.min_transaction_value or 0)
            
            # Calculate customer lifetime value (simplified as average revenue per customer)
            customer_lifetime_value = (total_revenue / unique_customers) if unique_customers > 0 else 0
            
            # Calculate purchase frequency
            purchase_frequency = (total_transactions / unique_customers) if unique_customers > 0 else 0
            
            # Get customer value distribution
            value_distribution_query = text("""
                SELECT 
                    customer_id,
                    SUM(total_amount) as customer_total_value,
                    COUNT(*) as customer_transaction_count,
                    AVG(total_amount) as customer_avg_value
                FROM invoices 
                WHERE DATE(created_at) BETWEEN :start_date AND :end_date
                AND status IN ('completed', 'paid', 'partially_paid')
                GROUP BY customer_id
                ORDER BY customer_total_value DESC
            """)
            
            distribution_results = self.db.execute(value_distribution_query, {
                "start_date": start_date,
                "end_date": end_date
            }).fetchall()
            
            # Calculate percentiles
            customer_values = [float(row.customer_total_value) for row in distribution_results]
            
            percentile_25 = 0
            percentile_50 = 0
            percentile_75 = 0
            percentile_90 = 0
            
            if customer_values:
                customer_values.sort()
                n = len(customer_values)
                percentile_25 = customer_values[int(n * 0.25)] if n > 0 else 0
                percentile_50 = customer_values[int(n * 0.50)] if n > 0 else 0
                percentile_75 = customer_values[int(n * 0.75)] if n > 0 else 0
                percentile_90 = customer_values[int(n * 0.90)] if n > 0 else 0
            
            return {
                "average_transaction_value": round(avg_transaction_value, 2),
                "customer_lifetime_value": round(customer_lifetime_value, 2),
                "total_revenue": round(total_revenue, 2),
                "unique_customers": unique_customers,
                "total_transactions": total_transactions,
                "purchase_frequency": round(purchase_frequency, 2),
                "max_transaction_value": round(max_transaction_value, 2),
                "min_transaction_value": round(min_transaction_value, 2),
                "value_percentiles": {
                    "p25": round(percentile_25, 2),
                    "p50": round(percentile_50, 2),
                    "p75": round(percentile_75, 2),
                    "p90": round(percentile_90, 2)
                }
            }
            
        except Exception as e:
            print(f"Error calculating value metrics: {e}")
            # Rollback the transaction to clear the error state
            self.db.rollback()
            return {
                "average_transaction_value": 0.0,
                "customer_lifetime_value": 0.0,
                "total_revenue": 0.0,
                "unique_customers": 0,
                "total_transactions": 0,
                "purchase_frequency": 0.0,
                "max_transaction_value": 0.0,
                "min_transaction_value": 0.0,
                "value_percentiles": {"p25": 0, "p50": 0, "p75": 0, "p90": 0}
            }
    
    async def _perform_cohort_analysis(self, start_date: date, end_date: date) -> Dict[str, Any]:
        """Perform cohort analysis for customer acquisition"""
        
        try:
            # Get customer cohorts by month
            cohort_query = text("""
                SELECT 
                    DATE_TRUNC('month', created_at) as cohort_month,
                    COUNT(*) as cohort_size,
                    AVG(total_purchases) as avg_cohort_value
                FROM customers 
                WHERE DATE(created_at) BETWEEN :start_date AND :end_date
                AND is_active = true
                GROUP BY DATE_TRUNC('month', created_at)
                ORDER BY cohort_month
            """)
            
            cohort_results = self.db.execute(cohort_query, {
                "start_date": start_date,
                "end_date": end_date
            }).fetchall()
            
            cohorts = []
            for row in cohort_results:
                cohorts.append({
                    "cohort_month": row.cohort_month.strftime("%Y-%m") if row.cohort_month else "unknown",
                    "cohort_size": row.cohort_size or 0,
                    "avg_cohort_value": round(float(row.avg_cohort_value or 0), 2)
                })
            
            # Calculate cohort retention (simplified)
            total_cohort_size = sum(c["cohort_size"] for c in cohorts)
            avg_cohort_value = sum(c["avg_cohort_value"] for c in cohorts) / len(cohorts) if cohorts else 0
            
            return {
                "cohorts": cohorts,
                "total_cohort_size": total_cohort_size,
                "avg_cohort_value": round(avg_cohort_value, 2),
                "cohort_count": len(cohorts)
            }
            
        except Exception as e:
            print(f"Error performing cohort analysis: {e}")
            return {
                "cohorts": [],
                "total_cohort_size": 0,
                "avg_cohort_value": 0.0,
                "cohort_count": 0
            }
    
    async def _perform_lifecycle_analysis(self, start_date: date, end_date: date) -> Dict[str, Any]:
        """Perform customer lifecycle analysis"""
        
        try:
            # Analyze customer lifecycle stages
            lifecycle_query = text("""
                SELECT 
                    c.id,
                    c.name,
                    c.created_at as first_purchase_date,
                    MAX(i.created_at) as last_purchase_date,
                    c.total_purchases,
                    COUNT(i.id) as transaction_count,
                    COALESCE(SUM(i.total_amount), 0) as total_spent,
                    COALESCE(EXTRACT(DAYS FROM (CURRENT_DATE - MAX(i.created_at))), 999) as days_since_last_purchase
                FROM customers c
                LEFT JOIN invoices i ON c.id = i.customer_id 
                    AND DATE(i.created_at) BETWEEN :start_date AND :end_date
                    AND i.status IN ('completed', 'paid', 'partially_paid')
                WHERE c.is_active = true
                GROUP BY c.id, c.name, c.created_at, c.total_purchases
            """)
            
            lifecycle_results = self.db.execute(lifecycle_query, {
                "start_date": start_date,
                "end_date": end_date
            }).fetchall()
            
            # Categorize customers by lifecycle stage
            new_customers = []
            active_customers = []
            at_risk_customers = []
            dormant_customers = []
            
            for row in lifecycle_results:
                days_since_last = row.days_since_last_purchase or 0
                transaction_count = row.transaction_count or 0
                total_spent = float(row.total_spent or 0)
                
                customer_data = {
                    "customer_id": str(row.id),
                    "customer_name": row.name,
                    "transaction_count": transaction_count,
                    "total_spent": round(total_spent, 2),
                    "days_since_last_purchase": days_since_last
                }
                
                # Categorize based on recency and frequency
                if days_since_last <= 30 and transaction_count > 0:
                    if transaction_count == 1:
                        new_customers.append(customer_data)
                    else:
                        active_customers.append(customer_data)
                elif 30 < days_since_last <= 90:
                    at_risk_customers.append(customer_data)
                else:
                    dormant_customers.append(customer_data)
            
            return {
                "new_customers": {
                    "count": len(new_customers),
                    "customers": new_customers[:10]  # Top 10 for performance
                },
                "active_customers": {
                    "count": len(active_customers),
                    "customers": sorted(active_customers, key=lambda x: x["total_spent"], reverse=True)[:10]
                },
                "at_risk_customers": {
                    "count": len(at_risk_customers),
                    "customers": sorted(at_risk_customers, key=lambda x: x["days_since_last_purchase"])[:10]
                },
                "dormant_customers": {
                    "count": len(dormant_customers),
                    "customers": sorted(dormant_customers, key=lambda x: x["days_since_last_purchase"], reverse=True)[:10]
                }
            }
            
        except Exception as e:
            print(f"Error performing lifecycle analysis: {e}")
            # Rollback the transaction to clear the error state
            self.db.rollback()
            return {
                "new_customers": {"count": 0, "customers": []},
                "active_customers": {"count": 0, "customers": []},
                "at_risk_customers": {"count": 0, "customers": []},
                "dormant_customers": {"count": 0, "customers": []}
            }
    
    async def _analyze_customer_segments(self, start_date: date, end_date: date) -> Dict[str, Any]:
        """Analyze customer segments based on value and behavior"""
        
        try:
            # Segment customers by value and frequency
            segments_query = text("""
                SELECT 
                    c.id,
                    c.name,
                    c.customer_type,
                    COUNT(i.id) as transaction_count,
                    COALESCE(SUM(i.total_amount), 0) as total_value,
                    COALESCE(AVG(i.total_amount), 0) as avg_transaction_value
                FROM customers c
                LEFT JOIN invoices i ON c.id = i.customer_id 
                    AND DATE(i.created_at) BETWEEN :start_date AND :end_date
                    AND i.status IN ('completed', 'paid', 'partially_paid')
                WHERE c.is_active = true
                GROUP BY c.id, c.name, c.customer_type
                HAVING COUNT(i.id) > 0
                ORDER BY total_value DESC
            """)
            
            segment_results = self.db.execute(segments_query, {
                "start_date": start_date,
                "end_date": end_date
            }).fetchall()
            
            # Categorize customers into segments
            vip_customers = []
            high_value_customers = []
            regular_customers = []
            low_value_customers = []
            
            # Calculate thresholds based on data distribution
            total_values = [float(row.total_value) for row in segment_results]
            if total_values:
                total_values.sort(reverse=True)
                n = len(total_values)
                vip_threshold = total_values[int(n * 0.1)] if n > 10 else total_values[0] if n > 0 else 1000
                high_value_threshold = total_values[int(n * 0.3)] if n > 3 else total_values[-1] if n > 0 else 500
                regular_threshold = total_values[int(n * 0.7)] if n > 1 else 0
            else:
                vip_threshold = 1000
                high_value_threshold = 500
                regular_threshold = 100
            
            for row in segment_results:
                total_value = float(row.total_value)
                customer_data = {
                    "customer_id": str(row.id),
                    "customer_name": row.name,
                    "customer_type": row.customer_type,
                    "transaction_count": row.transaction_count,
                    "total_value": round(total_value, 2),
                    "avg_transaction_value": round(float(row.avg_transaction_value), 2)
                }
                
                if total_value >= vip_threshold:
                    vip_customers.append(customer_data)
                elif total_value >= high_value_threshold:
                    high_value_customers.append(customer_data)
                elif total_value >= regular_threshold:
                    regular_customers.append(customer_data)
                else:
                    low_value_customers.append(customer_data)
            
            return {
                "vip_customers": {
                    "count": len(vip_customers),
                    "threshold": vip_threshold,
                    "customers": vip_customers[:10]
                },
                "high_value_customers": {
                    "count": len(high_value_customers),
                    "threshold": high_value_threshold,
                    "customers": high_value_customers[:10]
                },
                "regular_customers": {
                    "count": len(regular_customers),
                    "threshold": regular_threshold,
                    "customers": regular_customers[:10]
                },
                "low_value_customers": {
                    "count": len(low_value_customers),
                    "customers": low_value_customers[:10]
                }
            }
            
        except Exception as e:
            print(f"Error analyzing customer segments: {e}")
            # Rollback the transaction to clear the error state
            self.db.rollback()
            return {
                "vip_customers": {"count": 0, "threshold": 0, "customers": []},
                "high_value_customers": {"count": 0, "threshold": 0, "customers": []},
                "regular_customers": {"count": 0, "threshold": 0, "customers": []},
                "low_value_customers": {"count": 0, "customers": []}
            }
    
    async def _analyze_customer_value_distribution(self, start_date: date, end_date: date) -> Dict[str, Any]:
        """Analyze customer value distribution"""
        
        try:
            # Get customer value distribution
            distribution_query = text("""
                SELECT 
                    SUM(total_amount) as customer_value,
                    COUNT(*) as transaction_count
                FROM invoices 
                WHERE DATE(created_at) BETWEEN :start_date AND :end_date
                AND status IN ('completed', 'paid', 'partially_paid')
                GROUP BY customer_id
                ORDER BY customer_value DESC
            """)
            
            distribution_results = self.db.execute(distribution_query, {
                "start_date": start_date,
                "end_date": end_date
            }).fetchall()
            
            customer_values = [float(row.customer_value) for row in distribution_results]
            
            if not customer_values:
                return {
                    "total_customers": 0,
                    "value_ranges": {},
                    "concentration": {}
                }
            
            # Calculate value ranges
            total_customers = len(customer_values)
            total_value = sum(customer_values)
            
            # Define value ranges
            ranges = {
                "0-100": 0,
                "100-500": 0,
                "500-1000": 0,
                "1000-5000": 0,
                "5000+": 0
            }
            
            for value in customer_values:
                if value < 100:
                    ranges["0-100"] += 1
                elif value < 500:
                    ranges["100-500"] += 1
                elif value < 1000:
                    ranges["500-1000"] += 1
                elif value < 5000:
                    ranges["1000-5000"] += 1
                else:
                    ranges["5000+"] += 1
            
            # Calculate concentration (80/20 rule)
            customer_values.sort(reverse=True)
            top_20_percent = int(total_customers * 0.2)
            top_20_value = sum(customer_values[:top_20_percent]) if top_20_percent > 0 else 0
            concentration_ratio = (top_20_value / total_value * 100) if total_value > 0 else 0
            
            return {
                "total_customers": total_customers,
                "total_value": round(total_value, 2),
                "avg_customer_value": round(total_value / total_customers, 2),
                "value_ranges": {k: {"count": v, "percentage": round(v / total_customers * 100, 1)} for k, v in ranges.items()},
                "concentration": {
                    "top_20_percent_customers": top_20_percent,
                    "top_20_percent_value": round(top_20_value, 2),
                    "concentration_ratio": round(concentration_ratio, 1)
                }
            }
            
        except Exception as e:
            print(f"Error analyzing customer value distribution: {e}")
            # Rollback the transaction to clear the error state
            self.db.rollback()
            return {
                "total_customers": 0,
                "value_ranges": {},
                "concentration": {}
            }
    
    async def _perform_rfm_analysis(self, start_date: date, end_date: date) -> Dict[str, Any]:
        """Perform RFM (Recency, Frequency, Monetary) analysis"""
        
        try:
            # Calculate RFM metrics for each customer
            rfm_query = text("""
                SELECT 
                    c.id as customer_id,
                    c.name as customer_name,
                    EXTRACT(DAYS FROM (CURRENT_DATE - MAX(i.created_at))) as recency_days,
                    COUNT(i.id) as frequency,
                    COALESCE(SUM(i.total_amount), 0) as monetary_value
                FROM customers c
                LEFT JOIN invoices i ON c.id = i.customer_id 
                    AND DATE(i.created_at) BETWEEN :start_date AND :end_date
                    AND i.status IN ('completed', 'paid', 'partially_paid')
                WHERE c.is_active = true
                GROUP BY c.id, c.name
                HAVING COUNT(i.id) > 0
                ORDER BY monetary_value DESC
            """)
            
            rfm_results = self.db.execute(rfm_query, {
                "start_date": start_date,
                "end_date": end_date
            }).fetchall()
            
            if not rfm_results:
                return {
                    "total_customers": 0,
                    "rfm_segments": {},
                    "top_customers": []
                }
            
            # Calculate RFM scores (1-5 scale)
            recency_values = [row.recency_days for row in rfm_results]
            frequency_values = [row.frequency for row in rfm_results]
            monetary_values = [float(row.monetary_value) for row in rfm_results]
            
            # Calculate quintiles for scoring
            recency_values.sort()
            frequency_values.sort(reverse=True)  # Lower recency is better
            monetary_values.sort(reverse=True)  # Higher values are better
            
            n = len(rfm_results)
            
            def get_rfm_score(value, values_list, reverse=False):
                if not values_list:
                    return 1
                
                sorted_values = sorted(values_list, reverse=reverse)
                
                if value <= sorted_values[int(n * 0.2)]:
                    return 5 if not reverse else 1
                elif value <= sorted_values[int(n * 0.4)]:
                    return 4 if not reverse else 2
                elif value <= sorted_values[int(n * 0.6)]:
                    return 3
                elif value <= sorted_values[int(n * 0.8)]:
                    return 2 if not reverse else 4
                else:
                    return 1 if not reverse else 5
            
            # Categorize customers
            rfm_segments = {
                "champions": [],
                "loyal_customers": [],
                "potential_loyalists": [],
                "at_risk": [],
                "hibernating": []
            }
            
            for row in rfm_results:
                recency_score = get_rfm_score(row.recency_days, recency_values, reverse=True)
                frequency_score = get_rfm_score(row.frequency, frequency_values)
                monetary_score = get_rfm_score(float(row.monetary_value), monetary_values)
                
                rfm_score = f"{recency_score}{frequency_score}{monetary_score}"
                
                customer_data = {
                    "customer_id": str(row.customer_id),
                    "customer_name": row.customer_name,
                    "recency_days": row.recency_days,
                    "frequency": row.frequency,
                    "monetary_value": round(float(row.monetary_value), 2),
                    "rfm_score": rfm_score,
                    "recency_score": recency_score,
                    "frequency_score": frequency_score,
                    "monetary_score": monetary_score
                }
                
                # Segment based on RFM scores
                if recency_score >= 4 and frequency_score >= 4 and monetary_score >= 4:
                    rfm_segments["champions"].append(customer_data)
                elif recency_score >= 3 and frequency_score >= 3:
                    rfm_segments["loyal_customers"].append(customer_data)
                elif recency_score >= 3 and monetary_score >= 3:
                    rfm_segments["potential_loyalists"].append(customer_data)
                elif recency_score <= 2 and frequency_score >= 2:
                    rfm_segments["at_risk"].append(customer_data)
                else:
                    rfm_segments["hibernating"].append(customer_data)
            
            # Get top customers by RFM score
            all_customers = []
            for segment_customers in rfm_segments.values():
                all_customers.extend(segment_customers)
            
            top_customers = sorted(all_customers, 
                                 key=lambda x: (x["recency_score"] + x["frequency_score"] + x["monetary_score"]), 
                                 reverse=True)[:10]
            
            return {
                "total_customers": len(rfm_results),
                "rfm_segments": {
                    segment: {
                        "count": len(customers),
                        "percentage": round(len(customers) / len(rfm_results) * 100, 1),
                        "customers": customers[:5]  # Top 5 per segment
                    }
                    for segment, customers in rfm_segments.items()
                },
                "top_customers": top_customers
            }
            
        except Exception as e:
            print(f"Error performing RFM analysis: {e}")
            # Rollback the transaction to clear the error state
            self.db.rollback()
            return {
                "total_customers": 0,
                "rfm_segments": {},
                "top_customers": []
            }
    
    async def _calculate_customer_acquisition_cost(self, start_date: date, end_date: date) -> Dict[str, Any]:
        """Calculate customer acquisition cost metrics"""
        
        try:
            # This is a simplified CAC calculation
            # In a real scenario, you'd include marketing spend, sales costs, etc.
            
            # Get new customers and their first purchase values
            cac_query = text("""
                SELECT 
                    COUNT(*) as new_customers,
                    COALESCE(AVG(first_purchase.total_amount), 0) as avg_first_purchase_value
                FROM customers c
                LEFT JOIN LATERAL (
                    SELECT total_amount
                    FROM invoices i
                    WHERE i.customer_id = c.id
                    AND i.status IN ('completed', 'paid', 'partially_paid')
                    ORDER BY i.created_at ASC
                    LIMIT 1
                ) first_purchase ON true
                WHERE DATE(c.created_at) BETWEEN :start_date AND :end_date
                AND c.is_active = true
            """)
            
            result = self.db.execute(cac_query, {
                "start_date": start_date,
                "end_date": end_date
            }).fetchone()
            
            new_customers = result.new_customers or 0
            avg_first_purchase = float(result.avg_first_purchase_value or 0)
            
            # Simplified CAC calculation (assuming 10% of first purchase value as acquisition cost)
            estimated_cac = avg_first_purchase * 0.1 if avg_first_purchase > 0 else 0
            
            # Calculate CAC payback period (simplified)
            payback_period_months = (estimated_cac / avg_first_purchase * 12) if avg_first_purchase > 0 else 0
            
            return {
                "new_customers": new_customers,
                "avg_first_purchase_value": round(avg_first_purchase, 2),
                "estimated_cac": round(estimated_cac, 2),
                "cac_to_ltv_ratio": round((estimated_cac / avg_first_purchase) if avg_first_purchase > 0 else 0, 2),
                "payback_period_months": round(payback_period_months, 1)
            }
            
        except Exception as e:
            print(f"Error calculating customer acquisition cost: {e}")
            return {
                "new_customers": 0,
                "avg_first_purchase_value": 0.0,
                "estimated_cac": 0.0,
                "cac_to_ltv_ratio": 0.0,
                "payback_period_months": 0.0
            }