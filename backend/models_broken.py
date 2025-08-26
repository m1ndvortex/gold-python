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
    )class Seas
onalAnalysis(Base):
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
    metadata = Column(JSONB)  # Additional context data
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