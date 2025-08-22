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
    KPISnapshot, AccountingEntry
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