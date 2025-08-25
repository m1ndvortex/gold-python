"""Business Configuration System

Revision ID: business_config_001
Revises: universal_schema
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'business_config_001'
down_revision = 'universal_schema'
branch_labels = None
depends_on = None

def upgrade():
    # Create business_type_configurations table
    op.create_table('business_type_configurations',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('business_type', sa.String(length=50), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('industry', sa.String(length=100), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True, default=True),
        sa.Column('is_default', sa.Boolean(), nullable=True, default=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('business_type')
    )
    
    # Create terminology_mappings table
    op.create_table('terminology_mappings',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('business_config_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('standard_term', sa.String(length=100), nullable=False),
        sa.Column('business_term', sa.String(length=100), nullable=False),
        sa.Column('context', sa.String(length=100), nullable=True),
        sa.Column('category', sa.String(length=50), nullable=True),
        sa.Column('language_code', sa.String(length=10), nullable=True, default='en'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['business_config_id'], ['business_type_configurations.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create workflow_configurations table
    op.create_table('workflow_configurations',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('business_config_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('workflow_type', sa.String(length=50), nullable=False),
        sa.Column('workflow_name', sa.String(length=255), nullable=False),
        sa.Column('stages', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('rules', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('approvals', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('notifications', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True, default=True),
        sa.Column('is_required', sa.Boolean(), nullable=True, default=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['business_config_id'], ['business_type_configurations.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create custom_field_schemas table
    op.create_table('custom_field_schemas',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('business_config_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('field_name', sa.String(length=100), nullable=False),
        sa.Column('field_label', sa.String(length=255), nullable=False),
        sa.Column('field_type', sa.String(length=50), nullable=False),
        sa.Column('entity_type', sa.String(length=50), nullable=False),
        sa.Column('field_options', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('validation_rules', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('default_value', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('is_required', sa.Boolean(), nullable=True, default=False),
        sa.Column('is_searchable', sa.Boolean(), nullable=True, default=False),
        sa.Column('is_filterable', sa.Boolean(), nullable=True, default=False),
        sa.Column('is_active', sa.Boolean(), nullable=True, default=True),
        sa.Column('display_order', sa.Integer(), nullable=True, default=0),
        sa.Column('display_group', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['business_config_id'], ['business_type_configurations.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create feature_configurations table
    op.create_table('feature_configurations',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('business_config_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('feature_name', sa.String(length=100), nullable=False),
        sa.Column('feature_category', sa.String(length=50), nullable=True),
        sa.Column('is_enabled', sa.Boolean(), nullable=True, default=True),
        sa.Column('configuration', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('required_roles', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['business_config_id'], ['business_type_configurations.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create report_templates table
    op.create_table('report_templates',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('business_config_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('template_name', sa.String(length=255), nullable=False),
        sa.Column('template_category', sa.String(length=100), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('report_type', sa.String(length=50), nullable=True),
        sa.Column('template_config', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('chart_config', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('is_default', sa.Boolean(), nullable=True, default=False),
        sa.Column('is_active', sa.Boolean(), nullable=True, default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['business_config_id'], ['business_type_configurations.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create kpi_definitions table
    op.create_table('kpi_definitions',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('business_config_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('kpi_name', sa.String(length=255), nullable=False),
        sa.Column('kpi_category', sa.String(length=100), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('calculation_method', sa.String(length=100), nullable=True),
        sa.Column('calculation_config', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('display_format', sa.String(length=50), nullable=True),
        sa.Column('target_value', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('is_default', sa.Boolean(), nullable=True, default=False),
        sa.Column('is_active', sa.Boolean(), nullable=True, default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['business_config_id'], ['business_type_configurations.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create service_catalog table
    op.create_table('service_catalog',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('business_config_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('service_name', sa.String(length=255), nullable=False),
        sa.Column('service_code', sa.String(length=50), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('category', sa.String(length=100), nullable=True),
        sa.Column('base_price', sa.String(length=20), nullable=True),
        sa.Column('currency', sa.String(length=3), nullable=True, default='USD'),
        sa.Column('estimated_duration', sa.Integer(), nullable=True),
        sa.Column('requires_booking', sa.Boolean(), nullable=True, default=False),
        sa.Column('is_time_tracked', sa.Boolean(), nullable=True, default=False),
        sa.Column('billing_method', sa.String(length=50), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True, default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['business_config_id'], ['business_type_configurations.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create bill_of_materials table
    op.create_table('bill_of_materials',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('business_config_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('bom_name', sa.String(length=255), nullable=False),
        sa.Column('bom_code', sa.String(length=50), nullable=True),
        sa.Column('product_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('version', sa.String(length=20), nullable=True, default='1.0'),
        sa.Column('components', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('production_steps', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('material_cost', sa.String(length=20), nullable=True),
        sa.Column('labor_cost', sa.String(length=20), nullable=True),
        sa.Column('overhead_cost', sa.String(length=20), nullable=True),
        sa.Column('total_cost', sa.String(length=20), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True, default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['business_config_id'], ['business_type_configurations.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create production_tracking table
    op.create_table('production_tracking',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('business_config_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('production_order', sa.String(length=100), nullable=False),
        sa.Column('bom_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('product_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('planned_quantity', sa.Integer(), nullable=False),
        sa.Column('produced_quantity', sa.Integer(), nullable=True, default=0),
        sa.Column('rejected_quantity', sa.Integer(), nullable=True, default=0),
        sa.Column('status', sa.String(length=50), nullable=True, default='planned'),
        sa.Column('start_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('end_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('production_steps', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('quality_checks', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['business_config_id'], ['business_type_configurations.id'], ),
        sa.ForeignKeyConstraint(['bom_id'], ['bill_of_materials.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for better performance
    op.create_index('idx_terminology_mappings_business_config', 'terminology_mappings', ['business_config_id'])
    op.create_index('idx_terminology_mappings_language', 'terminology_mappings', ['language_code'])
    op.create_index('idx_workflow_configurations_business_config', 'workflow_configurations', ['business_config_id'])
    op.create_index('idx_workflow_configurations_type', 'workflow_configurations', ['workflow_type'])
    op.create_index('idx_custom_field_schemas_business_config', 'custom_field_schemas', ['business_config_id'])
    op.create_index('idx_custom_field_schemas_entity_type', 'custom_field_schemas', ['entity_type'])
    op.create_index('idx_feature_configurations_business_config', 'feature_configurations', ['business_config_id'])
    op.create_index('idx_feature_configurations_name', 'feature_configurations', ['feature_name'])
    op.create_index('idx_report_templates_business_config', 'report_templates', ['business_config_id'])
    op.create_index('idx_report_templates_type', 'report_templates', ['report_type'])
    op.create_index('idx_kpi_definitions_business_config', 'kpi_definitions', ['business_config_id'])
    op.create_index('idx_kpi_definitions_category', 'kpi_definitions', ['kpi_category'])
    op.create_index('idx_service_catalog_business_config', 'service_catalog', ['business_config_id'])
    op.create_index('idx_service_catalog_category', 'service_catalog', ['category'])
    op.create_index('idx_bill_of_materials_business_config', 'bill_of_materials', ['business_config_id'])
    op.create_index('idx_bill_of_materials_product', 'bill_of_materials', ['product_id'])
    op.create_index('idx_production_tracking_business_config', 'production_tracking', ['business_config_id'])
    op.create_index('idx_production_tracking_status', 'production_tracking', ['status'])
    op.create_index('idx_production_tracking_order', 'production_tracking', ['production_order'])

def downgrade():
    # Drop indexes
    op.drop_index('idx_production_tracking_order', table_name='production_tracking')
    op.drop_index('idx_production_tracking_status', table_name='production_tracking')
    op.drop_index('idx_production_tracking_business_config', table_name='production_tracking')
    op.drop_index('idx_bill_of_materials_product', table_name='bill_of_materials')
    op.drop_index('idx_bill_of_materials_business_config', table_name='bill_of_materials')
    op.drop_index('idx_service_catalog_category', table_name='service_catalog')
    op.drop_index('idx_service_catalog_business_config', table_name='service_catalog')
    op.drop_index('idx_kpi_definitions_category', table_name='kpi_definitions')
    op.drop_index('idx_kpi_definitions_business_config', table_name='kpi_definitions')
    op.drop_index('idx_report_templates_type', table_name='report_templates')
    op.drop_index('idx_report_templates_business_config', table_name='report_templates')
    op.drop_index('idx_feature_configurations_name', table_name='feature_configurations')
    op.drop_index('idx_feature_configurations_business_config', table_name='feature_configurations')
    op.drop_index('idx_custom_field_schemas_entity_type', table_name='custom_field_schemas')
    op.drop_index('idx_custom_field_schemas_business_config', table_name='custom_field_schemas')
    op.drop_index('idx_workflow_configurations_type', table_name='workflow_configurations')
    op.drop_index('idx_workflow_configurations_business_config', table_name='workflow_configurations')
    op.drop_index('idx_terminology_mappings_language', table_name='terminology_mappings')
    op.drop_index('idx_terminology_mappings_business_config', table_name='terminology_mappings')
    
    # Drop tables
    op.drop_table('production_tracking')
    op.drop_table('bill_of_materials')
    op.drop_table('service_catalog')
    op.drop_table('kpi_definitions')
    op.drop_table('report_templates')
    op.drop_table('feature_configurations')
    op.drop_table('custom_field_schemas')
    op.drop_table('workflow_configurations')
    op.drop_table('terminology_mappings')
    op.drop_table('business_type_configurations')