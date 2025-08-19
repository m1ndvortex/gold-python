"""Add analytics tables for advanced dashboard

Revision ID: add_analytics_tables
Revises: 63fbf5b8acc6
Create Date: 2025-01-12 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'add_analytics_tables'
down_revision: Union[str, None] = '63fbf5b8acc6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create analytics_data table
    op.create_table(
        'analytics_data',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('data_type', sa.String(50), nullable=False),
        sa.Column('entity_type', sa.String(50), nullable=True),
        sa.Column('entity_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('metric_name', sa.String(100), nullable=False),
        sa.Column('metric_value', sa.DECIMAL(15, 4), nullable=False),
        sa.Column('additional_data', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('calculation_date', sa.Date, nullable=False),
        sa.Column('calculated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    
    # Create indexes for analytics_data
    op.create_index('idx_analytics_data_type_date', 'analytics_data', ['data_type', 'calculation_date'])
    op.create_index('idx_analytics_data_entity', 'analytics_data', ['entity_type', 'entity_id'])
    op.create_index('idx_analytics_data_metric', 'analytics_data', ['metric_name', 'calculation_date'])
    
    # Create kpi_targets table
    op.create_table(
        'kpi_targets',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('kpi_type', sa.String(50), nullable=False),
        sa.Column('kpi_name', sa.String(100), nullable=False),
        sa.Column('target_period', sa.String(20), nullable=False),
        sa.Column('target_value', sa.DECIMAL(15, 2), nullable=False),
        sa.Column('current_value', sa.DECIMAL(15, 2), server_default=sa.text('0')),
        sa.Column('achievement_rate', sa.DECIMAL(5, 2), server_default=sa.text('0')),
        sa.Column('trend_direction', sa.String(10), nullable=True),
        sa.Column('period_start', sa.Date, nullable=False),
        sa.Column('period_end', sa.Date, nullable=False),
        sa.Column('is_active', sa.Boolean, server_default=sa.text('true')),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    
    # Create indexes for kpi_targets
    op.create_index('idx_kpi_targets_type_period', 'kpi_targets', ['kpi_type', 'target_period'])
    op.create_index('idx_kpi_targets_active', 'kpi_targets', ['is_active', 'period_start', 'period_end'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('idx_kpi_targets_active')
    op.drop_index('idx_kpi_targets_type_period')
    op.drop_index('idx_analytics_data_metric')
    op.drop_index('idx_analytics_data_entity')
    op.drop_index('idx_analytics_data_type_date')
    
    # Drop tables
    op.drop_table('kpi_targets')
    op.drop_table('analytics_data')
