from sqlalchemy import Column, String, Integer, Boolean, DateTime, Date, Text, DECIMAL, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.sql import func
import uuid

# Import Base from database_base to ensure single metadata instance
from database_base import Base

# Import core models from models_universal to avoid duplicates
from models_universal import (
    User, Role, OAuth2Token, OAuth2AuditLog,
    Category, InventoryItem, Customer, Invoice, InvoiceItem, 
    Payment, AccountingEntry, CompanySettings
)

# Import localization models
from models_localization import (
    LanguageConfiguration, Translation, BusinessTerminology,
    CurrencyConfiguration, ExchangeRateHistory, DocumentTemplate,
    LocalizationSettings, MultilingualData, SearchIndex, TranslationMemory
)

# SMS Management Models
class SMSTemplate(Base):
    __tablename__ = "sms_templates"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    template_type = Column(String(20), nullable=False)  # 'promotional', 'debt_reminder'
    message_template = Column(Text, nullable=False)  # Template with placeholders like {customer_name}, {debt_amount}
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    sms_campaigns = relationship("SMSCampaign", back_populates="template")

class SMSCampaign(Base):
    __tablename__ = "sms_campaigns"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(200), nullable=False)
    template_id = Column(UUID(as_uuid=True), ForeignKey("sms_templates.id"))
    message_content = Column(Text, nullable=False)  # Final message after template processing
    total_recipients = Column(Integer, default=0)
    sent_count = Column(Integer, default=0)
    failed_count = Column(Integer, default=0)
    status = Column(String(20), default='pending')  # 'pending', 'sending', 'completed', 'failed'
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    template = relationship("SMSTemplate", back_populates="sms_campaigns")
    creator = relationship("User")
    sms_messages = relationship("SMSMessage", back_populates="campaign")
    
    __table_args__ = (
        Index('idx_sms_campaigns_status', 'status'),
        Index('idx_sms_campaigns_created_by', 'created_by'),
    )

class SMSMessage(Base):
    __tablename__ = "sms_messages"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    campaign_id = Column(UUID(as_uuid=True), ForeignKey("sms_campaigns.id"))
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id"))
    phone_number = Column(String(20), nullable=False)
    message_content = Column(Text, nullable=False)
    status = Column(String(20), default='pending')  # 'pending', 'sent', 'failed', 'delivered'
    delivery_status = Column(String(20))  # 'delivered', 'failed', 'unknown'
    gateway_message_id = Column(String(100))  # SMS gateway's message ID
    error_message = Column(Text)
    retry_count = Column(Integer, default=0)
    max_retries = Column(Integer, default=3)
    sent_at = Column(DateTime(timezone=True))
    delivered_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    campaign = relationship("SMSCampaign", back_populates="sms_messages")
    customer = relationship("Customer")
    
    __table_args__ = (
        Index('idx_sms_messages_campaign', 'campaign_id'),
        Index('idx_sms_messages_customer', 'customer_id'),
        Index('idx_sms_messages_status', 'status'),
        Index('idx_sms_messages_phone', 'phone_number'),
    )

# Analytics and KPI Models
class AnalyticsData(Base):
    __tablename__ = "analytics_data"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    data_type = Column(String(50), nullable=False)  # 'sales_trend', 'inventory_turnover', 'customer_behavior'
    entity_type = Column(String(50))  # 'product', 'category', 'customer', 'global'
    entity_id = Column(UUID(as_uuid=True))
    metric_name = Column(String(100), nullable=False)
    metric_value = Column(DECIMAL(15, 4), nullable=False)
    additional_data = Column(JSONB)
    calculation_date = Column(DateTime(timezone=True), nullable=False)
    calculated_at = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        Index('idx_analytics_data_type_date', 'data_type', 'calculation_date'),
        Index('idx_analytics_data_entity', 'entity_type', 'entity_id'),
        Index('idx_analytics_data_metric', 'metric_name', 'calculation_date'),
    )

class KPITarget(Base):
    __tablename__ = "kpi_targets"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    kpi_type = Column(String(50), nullable=False)  # 'financial', 'operational', 'customer'
    kpi_name = Column(String(100), nullable=False)  # 'daily_sales', 'inventory_turnover', 'customer_acquisition'
    target_period = Column(String(20), nullable=False)  # 'daily', 'weekly', 'monthly', 'yearly'
    target_value = Column(DECIMAL(15, 2), nullable=False)
    current_value = Column(DECIMAL(15, 2), default=0)
    achievement_rate = Column(DECIMAL(5, 2), default=0)  # Percentage
    trend_direction = Column(String(10))  # 'up', 'down', 'stable'
    period_start = Column(DateTime(timezone=True), nullable=False)
    period_end = Column(DateTime(timezone=True), nullable=False)
    is_active = Column(Boolean, default=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    creator = relationship("User")
    
    __table_args__ = (
        Index('idx_kpi_targets_type_period', 'kpi_type', 'target_period'),
        Index('idx_kpi_targets_active', 'is_active', 'period_start', 'period_end'),
    )

# Stock Optimization Models
class StockOptimizationRecommendation(Base):
    __tablename__ = "stock_optimization_recommendations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    item_id = Column(UUID(as_uuid=True), ForeignKey("inventory_items.id", ondelete="CASCADE"), nullable=False)
    recommendation_type = Column(String(30), nullable=False)  # 'reorder', 'reduce', 'discontinue', 'promote'
    current_stock = Column(Integer, nullable=False)
    recommended_stock = Column(Integer, nullable=False)
    reorder_point = Column(Integer)
    economic_order_quantity = Column(Integer)
    safety_stock = Column(Integer)
    lead_time_days = Column(Integer)
    confidence_score = Column(DECIMAL(3, 2), default=0)  # 0-1 confidence in recommendation
    cost_impact = Column(DECIMAL(12, 2))  # Estimated cost impact of recommendation
    revenue_impact = Column(DECIMAL(12, 2))  # Estimated revenue impact
    reasoning = Column(JSONB)  # Detailed reasoning for the recommendation
    priority = Column(String(10), default='medium')  # 'low', 'medium', 'high', 'urgent'
    status = Column(String(20), default='pending')  # 'pending', 'approved', 'rejected', 'implemented'
    valid_until = Column(DateTime(timezone=True))
    created_by = Column(String(50), default='system')  # 'system' or user_id
    reviewed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    reviewed_at = Column(DateTime(timezone=True))
    implemented_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    item = relationship("InventoryItem")
    reviewer = relationship("User")

    __table_args__ = (
        Index('idx_stock_optimization_item', 'item_id'),
        Index('idx_stock_optimization_type_priority', 'recommendation_type', 'priority'),
        Index('idx_stock_optimization_status', 'status'),
        Index('idx_stock_optimization_valid_until', 'valid_until'),
    )

# Customer Intelligence Models
class CustomerSegment(Base):
    __tablename__ = "customer_segments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    segment_name = Column(String(100), nullable=False, unique=True)
    segment_description = Column(Text)
    segment_criteria = Column(JSONB, nullable=False)
    segment_color = Column(String(7), default='#3B82F6')
    is_active = Column(Boolean, default=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    creator = relationship("User")
    segment_assignments = relationship("CustomerSegmentAssignment", back_populates="segment")
    
    __table_args__ = (
        Index('idx_customer_segments_active', 'is_active'),
    )

class CustomerSegmentAssignment(Base):
    __tablename__ = "customer_segment_assignments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)
    segment_id = Column(UUID(as_uuid=True), ForeignKey("customer_segments.id", ondelete="CASCADE"), nullable=False)
    assigned_at = Column(DateTime(timezone=True), server_default=func.now())
    assignment_score = Column(DECIMAL(5, 2))  # How well customer fits segment (0-100)
    is_primary = Column(Boolean, default=False)  # Is this the customer's primary segment
    
    customer = relationship("Customer")
    segment = relationship("CustomerSegment", back_populates="segment_assignments")
    
    __table_args__ = (
        Index('idx_customer_segment_assignments_customer', 'customer_id'),
        Index('idx_customer_segment_assignments_segment', 'segment_id'),
    )

class CustomerBehaviorAnalysis(Base):
    __tablename__ = "customer_behavior_analysis"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)
    analysis_period_start = Column(DateTime(timezone=True), nullable=False)
    analysis_period_end = Column(DateTime(timezone=True), nullable=False)
    purchase_frequency = Column(DECIMAL(5, 2), default=0)  # Purchases per month
    average_order_value = Column(DECIMAL(12, 2), default=0)
    total_spent = Column(DECIMAL(15, 2), default=0)
    customer_lifetime_value = Column(DECIMAL(15, 2), default=0)
    last_purchase_date = Column(DateTime(timezone=True))
    days_since_last_purchase = Column(Integer)
    preferred_categories = Column(JSONB)  # Top 3 categories by spending
    preferred_payment_method = Column(String(50))
    risk_score = Column(DECIMAL(3, 2), default=0)  # Credit risk (0-1)
    loyalty_score = Column(DECIMAL(3, 2), default=0)  # Loyalty score (0-1)
    engagement_score = Column(DECIMAL(3, 2), default=0)  # Engagement score (0-1)
    churn_probability = Column(DECIMAL(3, 2), default=0)  # Probability of churn (0-1)
    predicted_next_purchase = Column(DateTime(timezone=True).with_variant(DateTime(), "postgresql"))
    seasonal_patterns = Column(JSONB)
    calculated_at = Column(DateTime(timezone=True), server_default=func.now())
    
    customer = relationship("Customer")
    
    __table_args__ = (
        Index('idx_customer_behavior_customer', 'customer_id'),
        Index('idx_customer_behavior_period', 'analysis_period_start', 'analysis_period_end'),
        Index('idx_customer_behavior_ltv', 'customer_lifetime_value'),
        Index('idx_customer_behavior_churn', 'churn_probability'),
    )

# Profitability Analysis Models
class ProfitabilityAnalysis(Base):
    __tablename__ = "profitability_analysis"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_type = Column(String(50), nullable=False)  # 'item', 'category', 'customer', 'global'
    entity_id = Column(UUID(as_uuid=True))
    analysis_period_start = Column(DateTime(timezone=True), nullable=False)
    analysis_period_end = Column(DateTime(timezone=True), nullable=False)
    total_revenue = Column(DECIMAL(15, 2), nullable=False, default=0)
    total_cost = Column(DECIMAL(15, 2), nullable=False, default=0)
    gross_profit = Column(DECIMAL(15, 2), nullable=False, default=0)
    profit_margin = Column(DECIMAL(5, 2), nullable=False, default=0)
    markup_percentage = Column(DECIMAL(5, 2), nullable=False, default=0)
    units_sold = Column(Integer, default=0)
    average_selling_price = Column(DECIMAL(12, 2), default=0)
    average_cost_price = Column(DECIMAL(12, 2), default=0)
    profit_per_unit = Column(DECIMAL(12, 2), default=0)
    additional_metrics = Column(JSONB)
    calculated_at = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        Index('idx_profitability_analysis_entity', 'entity_type', 'entity_id'),
        Index('idx_profitability_analysis_period', 'analysis_period_start', 'analysis_period_end'),
        Index('idx_profitability_analysis_margin', 'profit_margin'),
    )

class MarginAnalysis(Base):
    __tablename__ = "margin_analysis"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_type = Column(String(50), nullable=False)  # 'item', 'category', 'global'
    entity_id = Column(UUID(as_uuid=True))
    analysis_date = Column(DateTime(timezone=True).with_variant(DateTime(), "postgresql"), nullable=False)
    target_margin = Column(DECIMAL(5, 2), default=0)
    actual_margin = Column(DECIMAL(5, 2), default=0)
    margin_variance = Column(DECIMAL(5, 2), default=0)
    revenue_impact = Column(DECIMAL(12, 2), default=0)
    cost_factors = Column(JSONB)  # Breakdown of cost components
    margin_trend = Column(String(20), default='stable')  # 'increasing', 'decreasing', 'stable'
    recommendations = Column(JSONB)  # Margin improvement recommendations
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        Index('idx_margin_analysis_entity_date', 'entity_type', 'entity_id', 'analysis_date'),
        Index('idx_margin_analysis_variance', 'margin_variance'),
    )

# Inventory Intelligence Models
class InventoryTurnoverAnalysis(Base):
    __tablename__ = "inventory_turnover_analysis"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    item_id = Column(UUID(as_uuid=True), ForeignKey("inventory_items.id", ondelete="CASCADE"), nullable=False)
    analysis_period_start = Column(DateTime(timezone=True), nullable=False)
    analysis_period_end = Column(DateTime(timezone=True), nullable=False)
    units_sold = Column(Integer, default=0)
    average_stock = Column(DECIMAL(10, 2), default=0)
    turnover_ratio = Column(DECIMAL(8, 4), default=0)
    velocity_score = Column(DECIMAL(3, 2), default=0)  # 0-1 scale
    movement_classification = Column(String(20), default='unknown')  # fast, normal, slow, dead
    days_to_stockout = Column(Integer)
    seasonal_factor = Column(DECIMAL(4, 2), default=1.0)
    trend_direction = Column(String(15), default='stable')  # increasing, decreasing, stable
    last_sale_date = Column(DateTime(timezone=True))
    calculated_at = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    item = relationship("InventoryItem")

    __table_args__ = (
        Index('idx_inventory_turnover_item_period', 'item_id', 'analysis_period_start', 'analysis_period_end'),
        Index('idx_inventory_turnover_classification', 'movement_classification'),
        Index('idx_inventory_turnover_velocity', 'velocity_score'),
    )

class DemandForecasting(Base):
    __tablename__ = "demand_forecasting"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    item_id = Column(UUID(as_uuid=True), ForeignKey("inventory_items.id", ondelete="CASCADE"), nullable=False)
    forecast_period_start = Column(Date, nullable=False)
    forecast_period_end = Column(Date, nullable=False)
    forecast_type = Column(String(20), nullable=False)  # daily, weekly, monthly, seasonal
    historical_data = Column(JSONB)  # Historical sales data used for forecast
    predicted_demand = Column(DECIMAL(10, 2), nullable=False)
    confidence_interval_lower = Column(DECIMAL(10, 2))
    confidence_interval_upper = Column(DECIMAL(10, 2))
    forecast_accuracy = Column(DECIMAL(5, 2))  # Accuracy of previous forecasts
    seasonal_patterns = Column(JSONB)  # Seasonal adjustment factors
    trend_component = Column(DECIMAL(8, 4), default=0)
    forecast_method = Column(String(30))  # moving_average, exponential_smoothing, linear_regression
    external_factors = Column(JSONB)  # Events, promotions that might affect demand
    generated_at = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    item = relationship("InventoryItem")

    __table_args__ = (
        Index('idx_demand_forecasting_item_period', 'item_id', 'forecast_period_start', 'forecast_period_end'),
        Index('idx_demand_forecasting_type', 'forecast_type'),
    )

# Report Scheduling Models
class ScheduledReport(Base):
    __tablename__ = "scheduled_reports"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    report_config = Column(JSONB, nullable=False)  # Report configuration
    schedule_config = Column(JSONB, nullable=False)  # Schedule configuration
    recipients = Column(JSONB, nullable=False)  # List of email addresses
    export_formats = Column(JSONB, default=['pdf'])  # List of export formats
    is_active = Column(Boolean, default=True)
    
    # Execution tracking
    next_run_at = Column(DateTime(timezone=True))
    last_run_at = Column(DateTime(timezone=True))
    last_success_at = Column(DateTime(timezone=True))
    run_count = Column(Integer, default=0)
    error_count = Column(Integer, default=0)
    last_error = Column(Text)
    
    # Metadata
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    creator = relationship("User")
    
    __table_args__ = (
        Index('idx_scheduled_reports_active', 'is_active'),
        Index('idx_scheduled_reports_next_run', 'next_run_at'),
        Index('idx_scheduled_reports_created_by', 'created_by'),
    )

class CustomReport(Base):
    __tablename__ = "custom_reports"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    report_config = Column(JSONB, nullable=False)  # Report configuration
    is_template = Column(Boolean, default=False)  # Is this a reusable template
    is_public = Column(Boolean, default=False)  # Can other users see this report
    
    # Usage tracking
    last_generated_at = Column(DateTime(timezone=True))
    generation_count = Column(Integer, default=0)
    
    # Metadata
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    creator = relationship("User")
    
    __table_args__ = (
        Index('idx_custom_reports_template', 'is_template'),
        Index('idx_custom_reports_public', 'is_public'),
        Index('idx_custom_reports_created_by', 'created_by'),
    )

class SeasonalAnalysis(Base):
    __tablename__ = "seasonal_analysis"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    item_id = Column(UUID(as_uuid=True), ForeignKey("inventory_items.id", ondelete="CASCADE"), nullable=False)
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id", ondelete="CASCADE"))
    analysis_year = Column(Integer, nullable=False)
    seasonal_patterns = Column(JSONB, nullable=False)  # Monthly/quarterly patterns
    peak_months = Column(JSONB)  # Months with highest sales
    low_months = Column(JSONB)  # Months with lowest sales
    seasonal_index = Column(DECIMAL(4, 2), default=1.0)  # Overall seasonality strength
    trend_strength = Column(DECIMAL(4, 2), default=0)  # Trend component strength
    volatility_score = Column(DECIMAL(4, 2), default=0)  # Sales volatility
    recommendations = Column(JSONB)  # Seasonal stocking recommendations
    calculated_at = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    item = relationship("InventoryItem")
    category = relationship("Category")

    __table_args__ = (
        Index('idx_seasonal_analysis_item_year', 'item_id', 'analysis_year'),
        Index('idx_seasonal_analysis_category_year', 'category_id', 'analysis_year'),
    )

# Advanced Analytics Models for Business Intelligence
class KPISnapshot(Base):
    """Time-series KPI tracking table"""
    __tablename__ = "kpi_snapshots"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    kpi_type = Column(String(50), nullable=False)  # 'financial', 'operational', 'customer'
    kpi_name = Column(String(100), nullable=False)
    kpi_value = Column(DECIMAL(15, 4), nullable=False)
    target_value = Column(DECIMAL(15, 4))
    variance = Column(DECIMAL(15, 4))  # Actual - Target
    variance_percentage = Column(DECIMAL(5, 2))  # (Actual - Target) / Target * 100
    period_type = Column(String(20), nullable=False)  # 'daily', 'weekly', 'monthly', 'yearly'
    period_start = Column(DateTime(timezone=True), nullable=False)
    period_end = Column(DateTime(timezone=True), nullable=False)
    snapshot_date = Column(DateTime(timezone=True), nullable=False)
    kpi_metadata = Column(JSONB)  # Additional context data
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index('idx_kpi_snapshots_type_name_date', 'kpi_type', 'kpi_name', 'snapshot_date'),
        Index('idx_kpi_snapshots_period', 'period_type', 'period_start', 'period_end'),
    )

class AnalyticsCache(Base):
    """Analytics cache table for performance optimization"""
    __tablename__ = "analytics_cache"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cache_key = Column(String(255), nullable=False, unique=True)
    cache_data = Column(JSONB, nullable=False)
    cache_type = Column(String(50), nullable=False)  # 'kpi', 'report', 'chart', 'forecast'
    entity_type = Column(String(50))  # 'global', 'customer', 'item', 'category'
    entity_id = Column(UUID(as_uuid=True))
    expires_at = Column(DateTime(timezone=True), nullable=False)
    hit_count = Column(Integer, default=0)
    last_accessed = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        Index('idx_analytics_cache_key', 'cache_key'),
        Index('idx_analytics_cache_type_entity', 'cache_type', 'entity_type', 'entity_id'),
        Index('idx_analytics_cache_expires', 'expires_at'),
    )

class InventoryPerformanceMetrics(Base):
    __tablename__ = "inventory_performance_metrics"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    item_id = Column(UUID(as_uuid=True), ForeignKey("inventory_items.id", ondelete="CASCADE"), nullable=False)
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id", ondelete="CASCADE"))
    metric_date = Column(DateTime(timezone=True), nullable=False)
    
    # Performance metrics
    sales_velocity = Column(DECIMAL(8, 4), default=0)  # Units sold per day
    stock_efficiency = Column(DECIMAL(5, 2), default=0)  # Stock utilization percentage
    carrying_cost = Column(DECIMAL(12, 2), default=0)  # Cost of holding inventory
    stockout_risk = Column(DECIMAL(3, 2), default=0)  # Risk of stockout (0-1)
    overstock_risk = Column(DECIMAL(3, 2), default=0)  # Risk of overstock (0-1)
    
    # Financial metrics
    inventory_value = Column(DECIMAL(15, 2), default=0)  # Current inventory value
    dead_stock_value = Column(DECIMAL(15, 2), default=0)  # Value of dead stock
    opportunity_cost = Column(DECIMAL(12, 2), default=0)  # Cost of missed sales
    
    # Operational metrics
    reorder_frequency = Column(DECIMAL(5, 2), default=0)  # Reorders per month
    lead_time_variance = Column(DECIMAL(5, 2), default=0)  # Lead time variability
    forecast_accuracy = Column(DECIMAL(5, 2), default=0)  # Forecast accuracy percentage
    
    # Recommendations
    recommended_action = Column(String(50))  # 'increase', 'decrease', 'maintain', 'discontinue'
    action_priority = Column(String(10), default='medium')  # 'low', 'medium', 'high', 'urgent'
    
    calculated_at = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    item = relationship("InventoryItem")
    category = relationship("Category")

    __table_args__ = (
        Index('idx_inventory_performance_item_date', 'item_id', 'metric_date'),
        Index('idx_inventory_performance_category_date', 'category_id', 'metric_date'),
        Index('idx_inventory_performance_action', 'recommended_action', 'action_priority'),
    )

# Alert System Models
class AlertRule(Base):
    __tablename__ = "alert_rules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    alert_type = Column(String(50), nullable=False)  # 'threshold', 'anomaly', 'trend', 'custom'
    entity_type = Column(String(50), nullable=False)  # 'inventory', 'sales', 'customer', 'financial'
    entity_id = Column(UUID(as_uuid=True))  # Specific entity ID or null for global
    
    # Rule configuration
    rule_config = Column(JSONB, nullable=False)  # Rule parameters and conditions
    threshold_value = Column(DECIMAL(15, 4))  # Threshold for threshold-based alerts
    comparison_operator = Column(String(10))  # '>', '<', '>=', '<=', '==', '!='
    
    # Alert settings
    severity = Column(String(20), default='medium')  # 'low', 'medium', 'high', 'critical'
    notification_channels = Column(JSONB, default=['email'])  # ['email', 'sms', 'webhook']
    notification_recipients = Column(JSONB, default=[])  # List of email addresses or phone numbers
    
    # Status and scheduling
    is_active = Column(Boolean, default=True)
    check_frequency = Column(Integer, default=60)  # Check frequency in minutes
    last_checked = Column(DateTime(timezone=True))
    last_triggered = Column(DateTime(timezone=True))
    trigger_count = Column(Integer, default=0)
    
    # Metadata
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    creator = relationship("User")
    alert_history = relationship("AlertHistory", back_populates="alert_rule")

    __table_args__ = (
        Index('idx_alert_rules_type', 'alert_type'),
        Index('idx_alert_rules_entity', 'entity_type', 'entity_id'),
        Index('idx_alert_rules_active', 'is_active'),
        Index('idx_alert_rules_severity', 'severity'),
    )

class AlertHistory(Base):
    __tablename__ = "alert_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    alert_rule_id = Column(UUID(as_uuid=True), ForeignKey("alert_rules.id", ondelete="CASCADE"), nullable=False)
    
    # Alert details
    alert_message = Column(Text, nullable=False)
    alert_data = Column(JSONB)  # Additional context data
    severity = Column(String(20), nullable=False)
    
    # Trigger information
    triggered_value = Column(DECIMAL(15, 4))  # Value that triggered the alert
    threshold_value = Column(DECIMAL(15, 4))  # Threshold that was exceeded
    trigger_condition = Column(String(100))  # Description of trigger condition
    
    # Status and resolution
    status = Column(String(20), default='active')  # 'active', 'acknowledged', 'resolved', 'dismissed'
    acknowledged_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    acknowledged_at = Column(DateTime(timezone=True))
    resolved_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    resolved_at = Column(DateTime(timezone=True))
    resolution_notes = Column(Text)
    
    # Notification tracking
    notifications_sent = Column(JSONB, default=[])  # Track which notifications were sent
    notification_status = Column(String(20), default='pending')  # 'pending', 'sent', 'failed'
    
    # Timestamps
    triggered_at = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    alert_rule = relationship("AlertRule", back_populates="alert_history")
    acknowledger = relationship("User", foreign_keys=[acknowledged_by])
    resolver = relationship("User", foreign_keys=[resolved_by])

    __table_args__ = (
        Index('idx_alert_history_rule', 'alert_rule_id'),
        Index('idx_alert_history_status', 'status'),
        Index('idx_alert_history_severity', 'severity'),
        Index('idx_alert_history_triggered', 'triggered_at'),
    )

# Forecasting Models
class DemandForecast(Base):
    __tablename__ = "demand_forecasts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    item_id = Column(UUID(as_uuid=True), ForeignKey("inventory_items.id", ondelete="CASCADE"), nullable=False)
    forecast_date = Column(Date, nullable=False)
    forecast_horizon_days = Column(Integer, nullable=False)  # How many days ahead
    predicted_demand = Column(DECIMAL(10, 2), nullable=False)
    confidence_level = Column(DECIMAL(5, 2), default=0.95)  # 0.95 = 95% confidence
    lower_bound = Column(DECIMAL(10, 2))
    upper_bound = Column(DECIMAL(10, 2))
    
    # Model information
    model_type = Column(String(50), nullable=False)  # 'linear_regression', 'arima', 'exponential_smoothing'
    model_accuracy = Column(DECIMAL(5, 2))  # Model accuracy percentage
    training_period_start = Column(Date)
    training_period_end = Column(Date)
    
    # Seasonal and trend components
    seasonal_component = Column(DECIMAL(8, 4), default=0)
    trend_component = Column(DECIMAL(8, 4), default=0)
    residual_component = Column(DECIMAL(8, 4), default=0)
    
    # External factors
    external_factors = Column(JSONB)  # Weather, holidays, promotions, etc.
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    item = relationship("InventoryItem")

    __table_args__ = (
        Index('idx_demand_forecasts_item_date', 'item_id', 'forecast_date'),
        Index('idx_demand_forecasts_horizon', 'forecast_horizon_days'),
        Index('idx_demand_forecasts_model', 'model_type'),
    )

class ForecastModel(Base):
    __tablename__ = "forecast_models"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    model_type = Column(String(50), nullable=False)  # 'linear_regression', 'arima', 'exponential_smoothing'
    description = Column(Text)
    
    # Model configuration
    model_config = Column(JSONB, nullable=False)  # Model parameters and hyperparameters
    training_config = Column(JSONB)  # Training configuration
    
    # Performance metrics
    accuracy_score = Column(DECIMAL(5, 2))  # Overall accuracy percentage
    mae = Column(DECIMAL(10, 4))  # Mean Absolute Error
    mse = Column(DECIMAL(10, 4))  # Mean Squared Error
    rmse = Column(DECIMAL(10, 4))  # Root Mean Squared Error
    mape = Column(DECIMAL(5, 2))  # Mean Absolute Percentage Error
    
    # Model status
    is_active = Column(Boolean, default=True)
    is_trained = Column(Boolean, default=False)
    last_trained = Column(DateTime(timezone=True))
    training_data_size = Column(Integer)
    
    # Versioning
    version = Column(String(20), default='1.0')
    parent_model_id = Column(UUID(as_uuid=True), ForeignKey("forecast_models.id"))
    
    # Metadata
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    creator = relationship("User")
    parent_model = relationship("ForecastModel", remote_side=[id])

    __table_args__ = (
        Index('idx_forecast_models_type', 'model_type'),
        Index('idx_forecast_models_active', 'is_active'),
        Index('idx_forecast_models_accuracy', 'accuracy_score'),
    )

class ReportExecution(Base):
    __tablename__ = "report_executions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    report_id = Column(UUID(as_uuid=True), ForeignKey("custom_reports.id", ondelete="CASCADE"))
    scheduled_report_id = Column(UUID(as_uuid=True), ForeignKey("scheduled_reports.id", ondelete="CASCADE"))
    
    # Execution details
    execution_type = Column(String(20), nullable=False)  # 'manual', 'scheduled', 'api'
    status = Column(String(20), default='pending')  # 'pending', 'running', 'completed', 'failed', 'cancelled'
    
    # Timing
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    duration_seconds = Column(Integer)
    
    # Configuration
    report_config = Column(JSONB, nullable=False)  # Report configuration at execution time
    export_formats = Column(JSONB, default=['pdf'])  # Requested export formats
    
    # Results
    output_files = Column(JSONB)  # Generated file paths/URLs
    row_count = Column(Integer)  # Number of rows in result
    file_sizes = Column(JSONB)  # File sizes for each format
    
    # Error handling
    error_message = Column(Text)
    error_details = Column(JSONB)
    retry_count = Column(Integer, default=0)
    max_retries = Column(Integer, default=3)
    
    # Metadata
    executed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    report = relationship("CustomReport")
    scheduled_report = relationship("ScheduledReport")
    executor = relationship("User")

    __table_args__ = (
        Index('idx_report_executions_report', 'report_id'),
        Index('idx_report_executions_scheduled', 'scheduled_report_id'),
        Index('idx_report_executions_status', 'status'),
        Index('idx_report_executions_started', 'started_at'),
        Index('idx_report_executions_type', 'execution_type'),
    )

# Image Management Models
class ImageManagement(Base):
    __tablename__ = "image_management"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=False)  # Size in bytes
    mime_type = Column(String(100), nullable=False)
    
    # Image properties
    width = Column(Integer)
    height = Column(Integer)
    format = Column(String(10))  # 'JPEG', 'PNG', 'GIF', etc.
    
    # Categorization
    category = Column(String(50), nullable=False)  # 'inventory', 'customer', 'report', 'general'
    entity_type = Column(String(50))  # 'inventory_item', 'customer', 'category'
    entity_id = Column(UUID(as_uuid=True))  # ID of the related entity
    
    # Image variants (thumbnails, etc.)
    variants = Column(JSONB)  # Different sizes/formats of the same image
    
    # Metadata
    alt_text = Column(String(255))  # Alt text for accessibility
    description = Column(Text)
    tags = Column(JSONB)  # Array of tags for searching
    
    # Status
    is_active = Column(Boolean, default=True)
    is_processed = Column(Boolean, default=False)  # Has image processing completed
    processing_status = Column(String(20), default='pending')  # 'pending', 'processing', 'completed', 'failed'
    
    # Upload information
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    upload_source = Column(String(50), default='web')  # 'web', 'api', 'bulk_import'
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    uploader = relationship("User")

    __table_args__ = (
        Index('idx_image_management_category', 'category'),
        Index('idx_image_management_entity', 'entity_type', 'entity_id'),
        Index('idx_image_management_active', 'is_active'),
        Index('idx_image_management_processed', 'is_processed'),
        Index('idx_image_management_uploader', 'uploaded_by'),
    )