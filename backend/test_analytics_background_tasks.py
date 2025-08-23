"""
Unit Tests for Analytics Background Tasks

Tests for Celery tasks including KPI calculations, demand forecasting,
and report generation with error handling validation.

Requirements covered: 1.4, 3.4, 4.4
"""

import pytest
import asyncio
from datetime import datetime, date, timedelta
from decimal import Decimal
from unittest.mock import Mock, patch, AsyncMock
import json

from sqlalchemy.orm import Session
from celery.exceptions import Retry

# Import task modules
from analytics_tasks.kpi_tasks import (
    calculate_financial_kpis_task,
    calculate_operational_kpis_task,
    calculate_customer_kpis_task,
    generate_kpi_snapshots,
    cleanup_expired_cache,
    calculate_kpi_trends_task,
    bulk_kpi_calculation_task
)
from analytics_tasks.forecasting_tasks import (
    generate_demand_forecast_task,
    update_all_forecasts_task,
    train_forecasting_models_task,
    validate_forecast_accuracy_task,
    generate_seasonal_analysis_task,
    bulk_forecast_generation_task
)
from analytics_tasks.report_tasks import (
    generate_custom_report_task,
    process_scheduled_reports_task,
    bulk_report_generation_task,
    cleanup_old_reports_task,
    generate_analytics_summary_report_task
)

# Import models for testing
from models import (
    InventoryItem, Customer, Invoice, InvoiceItem, KPISnapshot,
    DemandForecast, ForecastModel, CustomReport, ReportExecution
)

class TestKPIBackgroundTasks:
    """Test KPI calculation background tasks"""
    
    @pytest.fixture
    def mock_db_session(self):
        """Mock database session"""
        return Mock(spec=Session)
    
    @pytest.fixture
    def sample_financial_data(self):
        """Sample financial data for testing"""
        return {
            "revenue_kpis": {
                "current_revenue": 50000.0,
                "previous_revenue": 45000.0,
                "growth_rate": 11.11,
                "trend_direction": "up"
            },
            "profit_kpis": {
                "gross_margin": 25.5,
                "net_margin": 18.2,
                "margin_change": 2.1,
                "trend_direction": "up"
            }
        }
    
    def test_calculate_financial_kpis_task_success(self, sample_financial_data):
        """Test successful financial KPI calculation"""
        
        # Mock the database session and KPI calculator
        with patch('analytics_tasks.kpi_tasks.SessionLocal') as mock_session_local, \
             patch('analytics_tasks.kpi_tasks.FinancialKPICalculator') as mock_calculator:
            
            # Mock session context manager
            mock_db = Mock()
            mock_session_local.return_value.__enter__.return_value = mock_db
            mock_session_local.return_value.__exit__.return_value = None
            
            # Mock calculator
            mock_instance = mock_calculator.return_value
            mock_instance.calculate_revenue_kpis = AsyncMock(return_value=sample_financial_data["revenue_kpis"])
            mock_instance.calculate_profit_margin_kpis = AsyncMock(return_value=sample_financial_data["profit_kpis"])
            mock_instance.calculate_achievement_rate_kpis = AsyncMock(return_value={})
            
            # Create task instance
            task = calculate_financial_kpis_task
            task.retry = Mock()
            
            # Execute task
            result = task(
                "2024-01-01",
                "2024-01-31",
                {"revenue": 60000, "profit_margin": 25.0}
            )
            
            # Verify results
            assert result["status"] == "completed"
            assert result["period_start"] == "2024-01-01"
            assert result["period_end"] == "2024-01-31"
            assert "revenue_kpis" in result
            assert "profit_kpis" in result
            assert result["revenue_kpis"]["current_revenue"] == 50000.0
            assert result["profit_kpis"]["gross_margin"] == 25.5
    
    def test_calculate_financial_kpis_task_error_handling(self):
        """Test error handling in financial KPI calculation"""
        
        # Mock session and calculator to raise exception
        with patch('analytics_tasks.kpi_tasks.SessionLocal') as mock_session_local, \
             patch('analytics_tasks.kpi_tasks.FinancialKPICalculator') as mock_calculator:
            
            # Mock session context manager
            mock_db = Mock()
            mock_session_local.return_value.__enter__.return_value = mock_db
            mock_session_local.return_value.__exit__.return_value = None
            
            # Mock calculator to raise exception
            mock_calculator.side_effect = Exception("Database connection failed")
            
            # Create task instance and mock retry
            task = calculate_financial_kpis_task
            
            # Mock the retry method on the task
            with patch.object(task, 'retry', side_effect=Retry("Retrying")) as mock_retry:
                # Execute task and expect retry
                with pytest.raises(Retry):
                    task("2024-01-01", "2024-01-31")
                
                # Verify retry was called
                mock_retry.assert_called_once()
    
    def test_generate_kpi_snapshots_daily(self, mock_db_session):
        """Test daily KPI snapshot generation"""
        
        # Mock the individual KPI calculation tasks
        with patch('analytics_tasks.kpi_tasks.calculate_financial_kpis_task') as mock_financial, \
             patch('analytics_tasks.kpi_tasks.calculate_operational_kpis_task') as mock_operational, \
             patch('analytics_tasks.kpi_tasks.calculate_customer_kpis_task') as mock_customer:
            
            # Mock task results
            mock_financial.delay.return_value.get.return_value = {
                "revenue_kpis": {"current_revenue": 50000, "growth_rate": 10}
            }
            mock_operational.delay.return_value.get.return_value = {
                "inventory_kpis": {"turnover_rate": 4.5, "stockout_frequency": 2}
            }
            mock_customer.delay.return_value.get.return_value = {
                "acquisition_kpis": {"new_customers": 25, "retention_rate": 85}
            }
            
            # Create task instance
            task = generate_kpi_snapshots()
            task.retry = Mock()
            
            # Execute task
            result = task.run_with_db(mock_db_session, "daily")
            
            # Verify results
            assert result["status"] == "completed"
            assert result["interval"] == "daily"
            assert result["snapshots_created"] >= 0
            assert "snapshot_names" in result
            
            # Verify database commits were called
            mock_db_session.commit.assert_called()
    
    def test_cleanup_expired_cache_success(self):
        """Test cache cleanup task"""
        
        # Mock analytics cache
        with patch('analytics_tasks.kpi_tasks.get_analytics_cache') as mock_cache:
            mock_cache_instance = Mock()
            mock_cache_instance.cleanup_expired_cache = AsyncMock()
            mock_cache_instance.get_cache_stats.return_value = {
                "status": "connected",
                "analytics_keys": 150,
                "memory_used": "2.5MB"
            }
            mock_cache.return_value = mock_cache_instance
            
            # Execute task
            result = cleanup_expired_cache()
            
            # Verify results
            assert result["status"] == "completed"
            assert "cache_stats" in result
            assert result["cache_stats"]["status"] == "connected"
    
    def test_calculate_kpi_trends_insufficient_data(self, mock_db_session):
        """Test KPI trend calculation with insufficient data"""
        
        # Mock database query to return insufficient snapshots
        mock_db_session.query.return_value.filter.return_value.order_by.return_value.all.return_value = []
        
        # Create task instance
        task = calculate_kpi_trends_task()
        task.retry = Mock()
        
        # Execute task
        result = task.run_with_db(mock_db_session, "financial", "revenue", 30)
        
        # Verify results
        assert result["trend"] == "insufficient_data"
        assert result["data_points"] == 0
        assert result["status"] == "completed"
    
    def test_bulk_kpi_calculation_mixed_results(self, mock_db_session):
        """Test bulk KPI calculation with mixed success/failure results"""
        
        date_ranges = [
            {"start_date": "2024-01-01", "end_date": "2024-01-31"},
            {"start_date": "2024-02-01", "end_date": "2024-02-29"},
            {"start_date": "2024-03-01", "end_date": "2024-03-31"}
        ]
        
        # Mock individual task calls with mixed results
        with patch('analytics_tasks.kpi_tasks.calculate_financial_kpis_task') as mock_financial, \
             patch('analytics_tasks.kpi_tasks.calculate_operational_kpis_task') as mock_operational, \
             patch('analytics_tasks.kpi_tasks.calculate_customer_kpis_task') as mock_customer:
            
            # First range succeeds
            mock_financial.apply_async.return_value.get.side_effect = [
                {"status": "completed"},  # Success
                Exception("Timeout"),     # Failure
                {"status": "completed"}   # Success
            ]
            mock_operational.apply_async.return_value.get.return_value = {"status": "completed"}
            mock_customer.apply_async.return_value.get.return_value = {"status": "completed"}
            
            # Create task instance
            task = bulk_kpi_calculation_task()
            task.retry = Mock()
            
            # Execute task
            result = task.run_with_db(mock_db_session, date_ranges)
            
            # Verify results
            assert result["status"] == "completed"
            assert result["total_ranges"] == 3
            assert result["successful_calculations"] == 2
            assert result["failed_calculations"] == 1

class TestForecastingBackgroundTasks:
    """Test forecasting background tasks"""
    
    @pytest.fixture
    def mock_db_session(self):
        """Mock database session"""
        return Mock(spec=Session)
    
    @pytest.fixture
    def sample_forecast_result(self):
        """Sample forecast result for testing"""
        return {
            "predictions": [
                {"date": "2024-02-01", "predicted_demand": 10.5, "confidence_lower": 8.0, "confidence_upper": 13.0},
                {"date": "2024-02-02", "predicted_demand": 11.2, "confidence_lower": 8.5, "confidence_upper": 14.0}
            ],
            "confidence_score": 0.85,
            "model_used": "arima",
            "accuracy_metrics": {"mae": 2.1, "rmse": 2.8},
            "forecast_period_start": date(2024, 2, 1),
            "forecast_period_end": date(2024, 2, 2)
        }
    
    def test_generate_demand_forecast_task_success(self, mock_db_session, sample_forecast_result):
        """Test successful demand forecast generation"""
        
        # Mock forecasting service
        with patch('analytics_tasks.forecasting_tasks.ForecastingService') as mock_service:
            mock_instance = mock_service.return_value
            mock_instance.forecast_demand = AsyncMock(return_value=Mock(**sample_forecast_result))
            
            # Mock cache
            with patch('analytics_tasks.forecasting_tasks.get_analytics_cache') as mock_cache:
                mock_cache_instance = Mock()
                mock_cache_instance.set_forecast_data = AsyncMock()
                mock_cache.return_value = mock_cache_instance
                
                # Create task instance
                task = generate_demand_forecast_task()
                task.retry = Mock()
                
                # Execute task
                result = task.run_with_db(mock_db_session, "item-123", 30, "arima")
                
                # Verify results
                assert result["status"] == "completed"
                assert result["item_id"] == "item-123"
                assert result["model_type"] == "arima"
                assert result["periods"] == 30
                assert result["predictions_count"] == 2
                assert result["confidence_score"] == 0.85
                
                # Verify database operations
                mock_db_session.add.assert_called()
                mock_db_session.commit.assert_called()
    
    def test_generate_demand_forecast_task_error_handling(self, mock_db_session):
        """Test error handling in demand forecast generation"""
        
        # Mock service to raise exception
        with patch('analytics_tasks.forecasting_tasks.ForecastingService') as mock_service:
            mock_service.side_effect = Exception("Insufficient historical data")
            
            # Create task instance
            task = generate_demand_forecast_task()
            task.retry = Mock(side_effect=Retry("Retrying"))
            
            # Execute task and expect retry
            with pytest.raises(Retry):
                task.run_with_db(mock_db_session, "item-123", 30, "arima")
            
            # Verify rollback was called
            mock_db_session.rollback.assert_called()
    
    def test_update_all_forecasts_task(self, mock_db_session):
        """Test updating forecasts for all active items"""
        
        # Mock active inventory items
        mock_items = [
            Mock(id="item-1", name="Gold Ring", is_active=True, stock_quantity=10),
            Mock(id="item-2", name="Gold Necklace", is_active=True, stock_quantity=5)
        ]
        mock_db_session.query.return_value.filter.return_value.all.return_value = mock_items
        
        # Mock individual forecast task
        with patch('analytics_tasks.forecasting_tasks.generate_demand_forecast_task') as mock_forecast:
            mock_forecast.apply_async.return_value.get.return_value = {"status": "completed"}
            
            # Create task instance
            task = update_all_forecasts_task()
            task.retry = Mock()
            
            # Execute task
            result = task.run_with_db(mock_db_session)
            
            # Verify results
            assert result["status"] == "completed"
            assert result["total_items"] == 2
            assert result["successful_forecasts"] == 2
            assert result["failed_forecasts"] == 0
    
    def test_train_forecasting_models_task(self, mock_db_session):
        """Test forecasting model training"""
        
        # Mock database query for items with sufficient data
        mock_db_session.execute.return_value = [
            Mock(inventory_item_id="item-1", name="Gold Ring"),
            Mock(inventory_item_id="item-2", name="Gold Necklace")
        ]
        
        # Mock forecasting service
        with patch('analytics_tasks.forecasting_tasks.ForecastingService') as mock_service:
            mock_instance = mock_service.return_value
            mock_instance.forecast_demand = AsyncMock(return_value=Mock(
                confidence_score=0.85,
                accuracy_metrics={"mae": 2.1},
                model_used="arima"
            ))
            
            # Create task instance
            task = train_forecasting_models_task()
            task.retry = Mock()
            
            # Execute task
            result = task.run_with_db(mock_db_session)
            
            # Verify results
            assert result["status"] == "completed"
            assert result["items_trained"] >= 0
            assert "model_statistics" in result
            assert "best_overall_model" in result
    
    def test_validate_forecast_accuracy_task(self, mock_db_session):
        """Test forecast accuracy validation"""
        
        # Mock forecast data
        mock_forecasts = [
            Mock(
                item_id="item-1",
                forecast_date=date(2024, 1, 15),
                predicted_demand=Decimal("10.5"),
                confidence_interval_lower=Decimal("8.0"),
                confidence_interval_upper=Decimal("13.0"),
                model_used="arima"
            )
        ]
        mock_db_session.query.return_value.filter.return_value.all.return_value = mock_forecasts
        
        # Mock actual sales data
        mock_db_session.execute.return_value.fetchall.return_value = [
            Mock(inventory_item_id="item-1", sale_date=date(2024, 1, 15), actual_demand=9.5)
        ]
        
        # Create task instance
        task = validate_forecast_accuracy_task()
        task.retry = Mock()
        
        # Execute task
        result = task.run_with_db(mock_db_session, 30)
        
        # Verify results
        assert result["status"] == "completed"
        assert result["total_predictions"] >= 0
        assert "overall_accuracy" in result
        assert "model_accuracy" in result
    
    def test_bulk_forecast_generation_task(self, mock_db_session):
        """Test bulk forecast generation"""
        
        item_ids = ["item-1", "item-2", "item-3"]
        
        # Mock individual forecast tasks with mixed results
        with patch('analytics_tasks.forecasting_tasks.generate_demand_forecast_task') as mock_forecast:
            mock_forecast.apply_async.return_value.get.side_effect = [
                {"status": "completed"},  # Success
                Exception("Model failed"), # Failure
                {"status": "completed"}   # Success
            ]
            
            # Create task instance
            task = bulk_forecast_generation_task()
            task.retry = Mock()
            
            # Execute task
            result = task.run_with_db(mock_db_session, item_ids, 30, "arima")
            
            # Verify results
            assert result["status"] == "completed"
            assert result["total_items"] == 3
            assert result["successful_forecasts"] == 2
            assert result["failed_forecasts"] == 1

class TestReportBackgroundTasks:
    """Test report generation background tasks"""
    
    @pytest.fixture
    def mock_db_session(self):
        """Mock database session"""
        return Mock(spec=Session)
    
    @pytest.fixture
    def sample_report(self):
        """Sample report for testing"""
        return Mock(
            id="report-123",
            name="Sales Report",
            configuration={"data_sources": ["invoices"], "filters": []}
        )
    
    def test_generate_custom_report_task_success(self, mock_db_session, sample_report):
        """Test successful custom report generation"""
        
        # Mock database query
        mock_db_session.query.return_value.filter.return_value.first.return_value = sample_report
        
        # Mock report engine
        with patch('analytics_tasks.report_tasks.ReportEngineService') as mock_engine:
            mock_instance = mock_engine.return_value
            mock_instance.build_custom_report = AsyncMock(return_value={
                "total_rows": 100,
                "columns": ["date", "amount", "customer"]
            })
            mock_instance.export_report = AsyncMock(return_value={
                "file_path": "/tmp/report.pdf",
                "file_size": 1024,
                "generation_time": 5.2
            })
            
            # Mock cache
            with patch('analytics_tasks.report_tasks.get_analytics_cache') as mock_cache:
                mock_cache_instance = Mock()
                mock_cache_instance.set_report_data = AsyncMock()
                mock_cache.return_value = mock_cache_instance
                
                # Create task instance
                task = generate_custom_report_task()
                task.retry = Mock()
                
                # Execute task
                result = task.run_with_db(mock_db_session, "report-123", "pdf")
                
                # Verify results
                assert result["status"] == "completed"
                assert result["report_id"] == "report-123"
                assert result["export_format"] == "pdf"
                assert result["file_path"] == "/tmp/report.pdf"
                assert result["total_rows"] == 100
                
                # Verify database operations
                mock_db_session.add.assert_called()
                mock_db_session.commit.assert_called()
    
    def test_generate_custom_report_task_not_found(self, mock_db_session):
        """Test report generation with non-existent report"""
        
        # Mock database query to return None
        mock_db_session.query.return_value.filter.return_value.first.return_value = None
        
        # Create task instance
        task = generate_custom_report_task()
        task.retry = Mock(side_effect=Retry("Retrying"))
        
        # Execute task and expect retry
        with pytest.raises(Retry):
            task.run_with_db(mock_db_session, "non-existent-report", "pdf")
    
    def test_process_scheduled_reports_task(self, mock_db_session):
        """Test processing scheduled reports"""
        
        # Mock scheduled reports
        mock_scheduled_reports = [
            Mock(
                id="scheduled-1",
                report_id="report-1",
                report_name="Daily Sales",
                export_format="pdf",
                parameters={},
                recipients=["admin@example.com"]
            )
        ]
        
        # Mock scheduler service
        with patch('analytics_tasks.report_tasks.ReportSchedulerService') as mock_scheduler:
            mock_instance = mock_scheduler.return_value
            mock_instance.get_due_reports = AsyncMock(return_value=mock_scheduled_reports)
            mock_instance.deliver_report = AsyncMock(return_value={"status": "delivered"})
            mock_instance.update_next_execution = AsyncMock()
            
            # Mock report generation task
            with patch('analytics_tasks.report_tasks.generate_custom_report_task') as mock_generate:
                mock_generate.apply_async.return_value.get.return_value = {
                    "status": "completed",
                    "file_path": "/tmp/report.pdf"
                }
                
                # Create task instance
                task = process_scheduled_reports_task()
                task.retry = Mock()
                
                # Execute task
                result = task.run_with_db(mock_db_session)
                
                # Verify results
                assert result["status"] == "completed"
                assert result["due_reports"] == 1
                assert result["processed_reports"] == 1
                assert result["failed_reports"] == 0
    
    def test_cleanup_old_reports_task(self, mock_db_session):
        """Test cleanup of old report files"""
        
        # Mock old report executions
        mock_executions = [
            Mock(file_path="/tmp/old_report1.pdf"),
            Mock(file_path="/tmp/old_report2.pdf"),
            Mock(file_path=None)  # No file path
        ]
        mock_db_session.query.return_value.filter.return_value.all.return_value = mock_executions
        
        # Mock file operations
        with patch('os.path.exists') as mock_exists, \
             patch('os.path.getsize') as mock_getsize, \
             patch('os.remove') as mock_remove:
            
            mock_exists.return_value = True
            mock_getsize.return_value = 1024
            
            # Create task instance
            task = cleanup_old_reports_task()
            task.retry = Mock()
            
            # Execute task
            result = task.run_with_db(mock_db_session, 30)
            
            # Verify results
            assert result["status"] == "completed"
            assert result["files_deleted"] >= 0
            assert "total_size_freed_mb" in result
    
    def test_generate_analytics_summary_report_task(self, mock_db_session):
        """Test analytics summary report generation"""
        
        # Mock database query for top items
        mock_db_session.execute.return_value.fetchall.return_value = [
            Mock(name="Gold Ring", category="Rings", total_sold=50, total_revenue=25000, avg_price=500)
        ]
        
        # Mock KPI calculation tasks
        with patch('analytics_tasks.report_tasks.calculate_financial_kpis_task') as mock_financial, \
             patch('analytics_tasks.report_tasks.calculate_operational_kpis_task') as mock_operational, \
             patch('analytics_tasks.report_tasks.calculate_customer_kpis_task') as mock_customer:
            
            mock_financial.apply_async.return_value.get.return_value = {"revenue_kpis": {"current_revenue": 50000}}
            mock_operational.apply_async.return_value.get.return_value = {"inventory_kpis": {"turnover_rate": 4.5}}
            mock_customer.apply_async.return_value.get.return_value = {"transaction_kpis": {"transaction_count": 100}}
            
            # Mock report engine
            with patch('analytics_tasks.report_tasks.ReportEngineService') as mock_engine:
                mock_instance = mock_engine.return_value
                mock_instance.export_analytics_summary = AsyncMock(return_value={
                    "file_path": "/tmp/summary.pdf",
                    "file_size": 2048
                })
                
                # Create task instance
                task = generate_analytics_summary_report_task()
                task.retry = Mock()
                
                # Execute task
                result = task.run_with_db(mock_db_session, "2024-01-01", "2024-01-31", True)
                
                # Verify results
                assert result["status"] == "completed"
                assert result["period_start"] == "2024-01-01"
                assert result["period_end"] == "2024-01-31"
                assert result["includes_forecasts"] == True
                assert "file_path" in result

class TestTaskErrorHandling:
    """Test error handling and retry mechanisms"""
    
    def test_task_retry_mechanism(self):
        """Test that tasks properly retry on failure"""
        
        # Mock database session that fails
        mock_db = Mock()
        mock_db.side_effect = Exception("Database connection lost")
        
        # Create task instance
        task = calculate_financial_kpis_task()
        task.retry = Mock(side_effect=Retry("Retrying"))
        
        # Execute task and expect retry
        with pytest.raises(Retry):
            task.run_with_db(mock_db, "2024-01-01", "2024-01-31")
        
        # Verify retry was called with correct parameters
        task.retry.assert_called_once()
        args, kwargs = task.retry.call_args
        assert kwargs.get("countdown") == 60  # 1 minute retry delay
        assert kwargs.get("max_retries") == 3
    
    def test_task_timeout_handling(self):
        """Test task timeout handling"""
        
        # This would be tested in integration tests with actual Celery worker
        # Here we just verify the timeout configuration exists
        from celery_app import celery_app
        
        assert celery_app.conf.task_time_limit == 30 * 60  # 30 minutes
        assert celery_app.conf.task_soft_time_limit == 25 * 60  # 25 minutes
    
    def test_task_result_serialization(self):
        """Test that task results can be properly serialized"""
        
        # Sample task result
        result = {
            "calculation_id": "test_123",
            "status": "completed",
            "revenue_kpis": {
                "current_revenue": 50000.0,
                "growth_rate": 11.11
            },
            "calculated_at": datetime.utcnow().isoformat()
        }
        
        # Verify JSON serialization works
        serialized = json.dumps(result, default=str)
        deserialized = json.loads(serialized)
        
        assert deserialized["status"] == "completed"
        assert deserialized["revenue_kpis"]["current_revenue"] == 50000.0

if __name__ == "__main__":
    pytest.main([__file__, "-v"])