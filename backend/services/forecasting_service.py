"""
Forecasting Service for Advanced Analytics & Business Intelligence

This service provides demand forecasting capabilities using multiple algorithms:
- ARIMA (AutoRegressive Integrated Moving Average)
- Linear Regression
- Seasonal Decomposition

Requirements covered: 3.1, 3.2, 3.3, 3.4, 3.5
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta, date
from typing import List, Dict, Optional, Tuple, Any
from decimal import Decimal
from dataclasses import dataclass
from sqlalchemy.orm import Session
from sqlalchemy import text
import logging

# Statistical and ML libraries
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.seasonal import seasonal_decompose
from statsmodels.tsa.stattools import adfuller
import warnings
warnings.filterwarnings('ignore')

logger = logging.getLogger(__name__)

@dataclass
class DemandForecast:
    """Demand forecast result with confidence intervals"""
    item_id: str
    predictions: List[Dict[str, Any]]
    confidence_score: float
    model_used: str
    forecast_period_start: date
    forecast_period_end: date
    accuracy_metrics: Dict[str, float]
    seasonal_patterns: Optional[Dict[str, Any]] = None

@dataclass
class SeasonalityAnalysis:
    """Seasonality analysis result"""
    item_id: str
    has_seasonality: bool
    seasonal_strength: float
    seasonal_periods: List[int]
    seasonal_factors: Dict[str, float]
    trend_component: float
    residual_variance: float

@dataclass
class SafetyStockRecommendation:
    """Safety stock calculation result"""
    item_id: str
    current_safety_stock: int
    recommended_safety_stock: int
    service_level: float
    lead_time_days: int
    demand_variability: float
    stockout_probability: float
    cost_impact: Decimal

class ForecastingService:
    """
    Advanced forecasting service with multiple algorithms
    """
    
    def __init__(self, db_session: Session):
        self.db = db_session
        self.models = {
            'arima': self._arima_forecast,
            'linear_regression': self._linear_regression_forecast,
            'seasonal_decompose': self._seasonal_decompose_forecast
        }
    
    async def forecast_demand(
        self,
        item_id: str,
        periods: int,
        model_type: str = 'arima'
    ) -> DemandForecast:
        """
        Generate demand forecast for inventory items
        
        Args:
            item_id: UUID of the inventory item
            periods: Number of periods to forecast
            model_type: Type of forecasting model ('arima', 'linear_regression', 'seasonal_decompose')
            
        Returns:
            DemandForecast object with predictions and confidence intervals
        """
        try:
            # Get historical sales data
            historical_data = self._get_historical_sales_data(item_id)
            
            if len(historical_data) < 10:
                raise ValueError(f"Insufficient historical data for item {item_id}. Need at least 10 data points.")
            
            # Prepare time series data
            ts_data = self._prepare_time_series_data(historical_data)
            
            # Select and apply forecasting model
            if model_type not in self.models:
                model_type = 'arima'  # Default fallback
                
            forecast_func = self.models[model_type]
            predictions, confidence_intervals, accuracy_metrics = await forecast_func(ts_data, periods)
            
            # Calculate confidence score
            confidence_score = self._calculate_confidence_score(accuracy_metrics, len(historical_data))
            
            # Detect seasonality
            seasonality_analysis = await self.analyze_seasonality(historical_data)
            
            # Format predictions
            forecast_start = datetime.now().date() + timedelta(days=1)
            formatted_predictions = []
            
            for i, (pred, ci) in enumerate(zip(predictions, confidence_intervals)):
                forecast_date = forecast_start + timedelta(days=i)
                formatted_predictions.append({
                    'date': forecast_date.isoformat(),
                    'predicted_demand': max(0, float(pred)),  # Ensure non-negative
                    'confidence_lower': max(0, float(ci[0])),
                    'confidence_upper': float(ci[1]),
                    'day_of_week': forecast_date.strftime('%A'),
                    'month': forecast_date.strftime('%B')
                })
            
            return DemandForecast(
                item_id=item_id,
                predictions=formatted_predictions,
                confidence_score=confidence_score,
                model_used=model_type,
                forecast_period_start=forecast_start,
                forecast_period_end=forecast_start + timedelta(days=periods-1),
                accuracy_metrics=accuracy_metrics,
                seasonal_patterns=seasonality_analysis.seasonal_factors if seasonality_analysis.has_seasonality else None
            )
            
        except Exception as e:
            logger.error(f"Error forecasting demand for item {item_id}: {str(e)}")
            raise
    
    async def analyze_seasonality(
        self,
        sales_data: List[Dict[str, Any]]
    ) -> SeasonalityAnalysis:
        """
        Identify seasonal patterns in sales data
        
        Args:
            sales_data: Historical sales data
            
        Returns:
            SeasonalityAnalysis object with seasonal patterns
        """
        try:
            if len(sales_data) < 24:  # Need at least 2 years of monthly data
                return SeasonalityAnalysis(
                    item_id=sales_data[0]['item_id'] if sales_data else '',
                    has_seasonality=False,
                    seasonal_strength=0.0,
                    seasonal_periods=[],
                    seasonal_factors={},
                    trend_component=0.0,
                    residual_variance=0.0
                )
            
            # Prepare time series
            ts_data = self._prepare_time_series_data(sales_data)
            
            # Perform seasonal decomposition
            try:
                decomposition = seasonal_decompose(
                    ts_data['quantity'], 
                    model='additive', 
                    period=min(12, len(ts_data) // 2)  # Monthly seasonality
                )
                
                # Calculate seasonal strength
                seasonal_strength = np.var(decomposition.seasonal) / np.var(ts_data['quantity'])
                has_seasonality = seasonal_strength > 0.1  # Threshold for significant seasonality
                
                # Extract seasonal factors by month
                seasonal_factors = {}
                if has_seasonality:
                    for i, factor in enumerate(decomposition.seasonal[:12]):
                        month_name = (datetime.now().replace(month=i+1)).strftime('%B')
                        seasonal_factors[month_name] = float(factor)
                
                # Calculate trend component
                trend_component = float(np.nanmean(np.diff(decomposition.trend[~np.isnan(decomposition.trend)])))
                
                # Calculate residual variance
                residual_variance = float(np.var(decomposition.resid[~np.isnan(decomposition.resid)]))
                
                return SeasonalityAnalysis(
                    item_id=sales_data[0]['item_id'],
                    has_seasonality=has_seasonality,
                    seasonal_strength=float(seasonal_strength),
                    seasonal_periods=[12] if has_seasonality else [],
                    seasonal_factors=seasonal_factors,
                    trend_component=trend_component,
                    residual_variance=residual_variance
                )
                
            except Exception as decomp_error:
                logger.warning(f"Seasonal decomposition failed: {str(decomp_error)}")
                return SeasonalityAnalysis(
                    item_id=sales_data[0]['item_id'],
                    has_seasonality=False,
                    seasonal_strength=0.0,
                    seasonal_periods=[],
                    seasonal_factors={},
                    trend_component=0.0,
                    residual_variance=0.0
                )
                
        except Exception as e:
            logger.error(f"Error analyzing seasonality: {str(e)}")
            raise
    
    async def calculate_safety_stock(
        self,
        item_id: str,
        service_level: float = 0.95
    ) -> SafetyStockRecommendation:
        """
        Calculate optimal safety stock levels
        
        Args:
            item_id: UUID of the inventory item
            service_level: Desired service level (0.95 = 95%)
            
        Returns:
            SafetyStockRecommendation object
        """
        try:
            # Get historical sales data and current stock info
            historical_data = self._get_historical_sales_data(item_id)
            current_stock_info = self._get_current_stock_info(item_id)
            
            if len(historical_data) < 5:
                raise ValueError(f"Insufficient data for safety stock calculation for item {item_id}")
            
            # Calculate demand statistics
            daily_demands = [record['quantity'] for record in historical_data]
            mean_demand = np.mean(daily_demands)
            demand_std = np.std(daily_demands)
            
            # Get lead time (default to 7 days if not specified)
            lead_time_days = current_stock_info.get('lead_time_days', 7)
            
            # Calculate safety stock using normal distribution
            from scipy.stats import norm
            z_score = norm.ppf(service_level)
            
            # Safety stock formula: Z * sqrt(lead_time) * demand_std
            recommended_safety_stock = int(z_score * np.sqrt(lead_time_days) * demand_std)
            recommended_safety_stock = max(0, recommended_safety_stock)  # Ensure non-negative
            
            # Calculate stockout probability with current safety stock
            current_safety_stock = current_stock_info.get('min_stock_level', 0)
            if demand_std > 0:
                current_z = current_safety_stock / (np.sqrt(lead_time_days) * demand_std)
                stockout_probability = 1 - norm.cdf(current_z)
            else:
                stockout_probability = 0.0
            
            # Estimate cost impact
            holding_cost_per_unit = Decimal(str(current_stock_info.get('purchase_price', 0))) * Decimal('0.25')  # 25% annual holding cost
            cost_impact = (Decimal(str(recommended_safety_stock)) - Decimal(str(current_safety_stock))) * holding_cost_per_unit
            
            return SafetyStockRecommendation(
                item_id=item_id,
                current_safety_stock=current_safety_stock,
                recommended_safety_stock=recommended_safety_stock,
                service_level=service_level,
                lead_time_days=lead_time_days,
                demand_variability=float(demand_std),
                stockout_probability=float(stockout_probability),
                cost_impact=cost_impact
            )
            
        except Exception as e:
            logger.error(f"Error calculating safety stock for item {item_id}: {str(e)}")
            raise
    
    async def _arima_forecast(
        self, 
        ts_data: pd.DataFrame, 
        periods: int
    ) -> Tuple[List[float], List[Tuple[float, float]], Dict[str, float]]:
        """
        ARIMA forecasting implementation
        """
        try:
            # Check for stationarity
            series = ts_data['quantity'].ffill()
            
            # Auto-determine ARIMA parameters
            best_aic = float('inf')
            best_order = (1, 1, 1)
            
            # Grid search for best parameters (simplified)
            for p in range(0, 3):
                for d in range(0, 2):
                    for q in range(0, 3):
                        try:
                            model = ARIMA(series, order=(p, d, q))
                            fitted_model = model.fit()
                            if fitted_model.aic < best_aic:
                                best_aic = fitted_model.aic
                                best_order = (p, d, q)
                        except:
                            continue
            
            # Fit best model
            model = ARIMA(series, order=best_order)
            fitted_model = model.fit()
            
            # Generate forecast
            forecast_result = fitted_model.forecast(steps=periods, alpha=0.05)  # 95% confidence
            predictions = forecast_result.tolist()
            
            # Get confidence intervals
            conf_int = fitted_model.get_forecast(steps=periods).conf_int()
            confidence_intervals = [(row[0], row[1]) for row in conf_int.values]
            
            # Calculate accuracy metrics on training data
            fitted_values = fitted_model.fittedvalues
            actual_values = series[fitted_model.k_ar:]
            
            mae = mean_absolute_error(actual_values, fitted_values)
            mse = mean_squared_error(actual_values, fitted_values)
            rmse = np.sqrt(mse)
            
            accuracy_metrics = {
                'mae': float(mae),
                'mse': float(mse),
                'rmse': float(rmse),
                'aic': float(fitted_model.aic),
                'model_order': best_order
            }
            
            return predictions, confidence_intervals, accuracy_metrics
            
        except Exception as e:
            logger.warning(f"ARIMA forecast failed: {str(e)}, falling back to linear regression")
            return await self._linear_regression_forecast(ts_data, periods)
    
    async def _linear_regression_forecast(
        self, 
        ts_data: pd.DataFrame, 
        periods: int
    ) -> Tuple[List[float], List[Tuple[float, float]], Dict[str, float]]:
        """
        Linear regression forecasting implementation
        """
        try:
            # Prepare features (time index, day of week, month)
            ts_data['time_index'] = range(len(ts_data))
            ts_data['day_of_week'] = ts_data.index.dayofweek
            ts_data['month'] = ts_data.index.month
            
            # Features for training
            X = ts_data[['time_index', 'day_of_week', 'month']].values
            y = ts_data['quantity'].fillna(0).values
            
            # Fit linear regression model
            model = LinearRegression()
            model.fit(X, y)
            
            # Generate future time indices
            last_time_index = ts_data['time_index'].iloc[-1]
            future_dates = pd.date_range(
                start=ts_data.index[-1] + timedelta(days=1),
                periods=periods,
                freq='D'
            )
            
            # Prepare future features
            future_X = []
            for i, future_date in enumerate(future_dates):
                future_X.append([
                    last_time_index + i + 1,
                    future_date.dayofweek,
                    future_date.month
                ])
            
            future_X = np.array(future_X)
            
            # Generate predictions
            predictions = model.predict(future_X).tolist()
            
            # Calculate prediction intervals (simplified)
            train_predictions = model.predict(X)
            residuals = y - train_predictions
            residual_std = np.std(residuals)
            
            confidence_intervals = [
                (pred - 1.96 * residual_std, pred + 1.96 * residual_std)
                for pred in predictions
            ]
            
            # Calculate accuracy metrics
            mae = mean_absolute_error(y, train_predictions)
            mse = mean_squared_error(y, train_predictions)
            rmse = np.sqrt(mse)
            r2_score = model.score(X, y)
            
            accuracy_metrics = {
                'mae': float(mae),
                'mse': float(mse),
                'rmse': float(rmse),
                'r2_score': float(r2_score)
            }
            
            return predictions, confidence_intervals, accuracy_metrics
            
        except Exception as e:
            logger.error(f"Linear regression forecast failed: {str(e)}")
            raise
    
    async def _seasonal_decompose_forecast(
        self, 
        ts_data: pd.DataFrame, 
        periods: int
    ) -> Tuple[List[float], List[Tuple[float, float]], Dict[str, float]]:
        """
        Seasonal decomposition forecasting implementation
        """
        try:
            series = ts_data['quantity'].ffill()
            
            if len(series) < 24:  # Need sufficient data for seasonal decomposition
                return await self._linear_regression_forecast(ts_data, periods)
            
            # Perform seasonal decomposition
            decomposition = seasonal_decompose(
                series, 
                model='additive', 
                period=min(12, len(series) // 2)
            )
            
            # Extract components
            trend = decomposition.trend.dropna()
            seasonal = decomposition.seasonal
            residual = decomposition.resid.dropna()
            
            # Forecast trend using linear regression
            trend_X = np.arange(len(trend)).reshape(-1, 1)
            trend_model = LinearRegression()
            trend_model.fit(trend_X, trend.values)
            
            # Predict future trend
            future_trend_X = np.arange(len(trend), len(trend) + periods).reshape(-1, 1)
            future_trend = trend_model.predict(future_trend_X)
            
            # Get seasonal pattern for future periods
            seasonal_pattern = seasonal.values[:min(12, len(seasonal))]
            future_seasonal = []
            for i in range(periods):
                seasonal_index = i % len(seasonal_pattern)
                future_seasonal.append(seasonal_pattern[seasonal_index])
            
            # Combine trend and seasonal components
            predictions = (future_trend + future_seasonal).tolist()
            
            # Calculate confidence intervals based on residual variance
            residual_std = np.std(residual)
            confidence_intervals = [
                (pred - 1.96 * residual_std, pred + 1.96 * residual_std)
                for pred in predictions
            ]
            
            # Calculate accuracy metrics
            fitted_values = trend + seasonal + residual
            actual_values = series[decomposition.trend.first_valid_index():decomposition.trend.last_valid_index()]
            fitted_aligned = fitted_values[decomposition.trend.first_valid_index():decomposition.trend.last_valid_index()]
            
            mae = mean_absolute_error(actual_values, fitted_aligned)
            mse = mean_squared_error(actual_values, fitted_aligned)
            rmse = np.sqrt(mse)
            
            accuracy_metrics = {
                'mae': float(mae),
                'mse': float(mse),
                'rmse': float(rmse),
                'seasonal_strength': float(np.var(seasonal) / np.var(series))
            }
            
            return predictions, confidence_intervals, accuracy_metrics
            
        except Exception as e:
            logger.warning(f"Seasonal decomposition failed: {str(e)}, falling back to linear regression")
            return await self._linear_regression_forecast(ts_data, periods)
    
    def _get_historical_sales_data(self, item_id: str) -> List[Dict[str, Any]]:
        """
        Get historical sales data for an inventory item
        """
        query = text("""
            SELECT 
                ii.inventory_item_id as item_id,
                DATE(i.created_at) as sale_date,
                SUM(ii.quantity) as quantity,
                SUM(ii.total_price) as total_value,
                AVG(ii.unit_price) as avg_price
            FROM invoice_items ii
            JOIN invoices i ON ii.invoice_id = i.id
            WHERE ii.inventory_item_id = :item_id
                AND i.status = 'completed'
                AND i.created_at >= CURRENT_DATE - INTERVAL '365 days'
            GROUP BY ii.inventory_item_id, DATE(i.created_at)
            ORDER BY sale_date ASC
        """)
        
        result = self.db.execute(query, {'item_id': item_id})
        
        return [
            {
                'item_id': str(row.item_id),
                'sale_date': row.sale_date,
                'quantity': float(row.quantity),
                'total_value': float(row.total_value),
                'avg_price': float(row.avg_price)
            }
            for row in result
        ]
    
    def _get_current_stock_info(self, item_id: str) -> Dict[str, Any]:
        """
        Get current stock information for an inventory item
        """
        query = text("""
            SELECT 
                stock_quantity,
                purchase_price
            FROM inventory_items
            WHERE id = :item_id
        """)
        
        result = self.db.execute(query, {'item_id': item_id}).first()
        
        if result:
            return {
                'stock_quantity': result.stock_quantity,
                'min_stock_level': 5,  # Default minimum stock level
                'purchase_price': float(result.purchase_price),
                'sell_price': float(result.purchase_price) * 1.5  # Default markup
            }
        
        return {}
    
    def _prepare_time_series_data(self, historical_data: List[Dict[str, Any]]) -> pd.DataFrame:
        """
        Prepare time series data for forecasting
        """
        df = pd.DataFrame(historical_data)
        df['sale_date'] = pd.to_datetime(df['sale_date'])
        
        # Group by date and sum quantities to handle duplicates
        df = df.groupby('sale_date').agg({
            'quantity': 'sum',
            'total_value': 'sum',
            'avg_price': 'mean'
        }).reset_index()
        
        df.set_index('sale_date', inplace=True)
        
        # Fill missing dates with zero sales
        date_range = pd.date_range(
            start=df.index.min(),
            end=df.index.max(),
            freq='D'
        )
        df = df.reindex(date_range, fill_value=0)
        
        return df
    
    def _calculate_confidence_score(
        self, 
        accuracy_metrics: Dict[str, float], 
        data_points: int
    ) -> float:
        """
        Calculate confidence score based on accuracy metrics and data availability
        """
        # Base confidence on data availability
        data_confidence = min(1.0, data_points / 100)  # Full confidence with 100+ data points
        
        # Adjust based on accuracy (lower error = higher confidence)
        if 'mae' in accuracy_metrics and 'rmse' in accuracy_metrics:
            # Normalize error metrics (simplified approach)
            error_factor = 1 / (1 + accuracy_metrics['mae'] / 10)  # Adjust denominator based on domain
            accuracy_confidence = min(1.0, error_factor)
        else:
            accuracy_confidence = 0.5  # Default moderate confidence
        
        # Combine confidences
        overall_confidence = (data_confidence + accuracy_confidence) / 2
        
        return round(overall_confidence, 3)