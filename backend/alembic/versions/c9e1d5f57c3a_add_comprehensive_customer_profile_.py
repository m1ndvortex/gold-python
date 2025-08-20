"""Add comprehensive customer profile fields

Revision ID: c9e1d5f57c3a
Revises: add_analytics_tables
Create Date: 2025-08-20 14:53:43.545529

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c9e1d5f57c3a'
down_revision: Union[str, None] = 'add_analytics_tables'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add comprehensive address fields
    op.add_column('customers', sa.Column('street_address', sa.String(255), nullable=True))
    op.add_column('customers', sa.Column('city', sa.String(100), nullable=True))
    op.add_column('customers', sa.Column('state', sa.String(100), nullable=True))
    op.add_column('customers', sa.Column('postal_code', sa.String(20), nullable=True))
    op.add_column('customers', sa.Column('country', sa.String(100), nullable=True, server_default='United States'))
    
    # Add personal information fields
    op.add_column('customers', sa.Column('national_id', sa.String(50), nullable=True))
    op.add_column('customers', sa.Column('date_of_birth', sa.Date(), nullable=True))
    op.add_column('customers', sa.Column('age', sa.Integer(), nullable=True))
    op.add_column('customers', sa.Column('gender', sa.String(20), nullable=True))
    op.add_column('customers', sa.Column('nationality', sa.String(100), nullable=True))
    op.add_column('customers', sa.Column('occupation', sa.String(100), nullable=True))
    
    # Add emergency contact fields
    op.add_column('customers', sa.Column('emergency_contact_name', sa.String(200), nullable=True))
    op.add_column('customers', sa.Column('emergency_contact_phone', sa.String(20), nullable=True))
    op.add_column('customers', sa.Column('emergency_contact_relationship', sa.String(50), nullable=True))
    
    # Add additional information fields
    op.add_column('customers', sa.Column('notes', sa.Text(), nullable=True))
    op.add_column('customers', sa.Column('tags', sa.dialects.postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column('customers', sa.Column('custom_fields', sa.dialects.postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column('customers', sa.Column('preferences', sa.dialects.postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    
    # Add business-related fields
    op.add_column('customers', sa.Column('customer_type', sa.String(50), nullable=True, server_default='retail'))
    op.add_column('customers', sa.Column('credit_limit', sa.DECIMAL(12, 2), nullable=True, server_default='0'))
    op.add_column('customers', sa.Column('payment_terms', sa.Integer(), nullable=True, server_default='0'))
    op.add_column('customers', sa.Column('discount_percentage', sa.DECIMAL(5, 2), nullable=True, server_default='0'))
    op.add_column('customers', sa.Column('tax_exempt', sa.Boolean(), nullable=True, server_default='false'))
    op.add_column('customers', sa.Column('tax_id', sa.String(50), nullable=True))
    
    # Add status fields
    op.add_column('customers', sa.Column('is_active', sa.Boolean(), nullable=True, server_default='true'))
    op.add_column('customers', sa.Column('blacklisted', sa.Boolean(), nullable=True, server_default='false'))
    op.add_column('customers', sa.Column('blacklist_reason', sa.Text(), nullable=True))
    
    # Create indexes for better performance
    op.create_index('idx_customers_email', 'customers', ['email'])
    op.create_index('idx_customers_national_id', 'customers', ['national_id'])
    op.create_index('idx_customers_type', 'customers', ['customer_type'])
    op.create_index('idx_customers_active', 'customers', ['is_active'])
    op.create_index('idx_customers_city', 'customers', ['city'])
    op.create_index('idx_customers_dob', 'customers', ['date_of_birth'])
    
    # Add unique constraint on national_id
    op.create_unique_constraint('uq_customers_national_id', 'customers', ['national_id'])


def downgrade() -> None:
    # Drop unique constraint
    op.drop_constraint('uq_customers_national_id', 'customers')
    
    # Drop indexes
    op.drop_index('idx_customers_dob', 'customers')
    op.drop_index('idx_customers_city', 'customers')
    op.drop_index('idx_customers_active', 'customers')
    op.drop_index('idx_customers_type', 'customers')
    op.drop_index('idx_customers_national_id', 'customers')
    op.drop_index('idx_customers_email', 'customers')
    
    # Remove status fields
    op.drop_column('customers', 'blacklist_reason')
    op.drop_column('customers', 'blacklisted')
    op.drop_column('customers', 'is_active')
    
    # Remove business-related fields
    op.drop_column('customers', 'tax_id')
    op.drop_column('customers', 'tax_exempt')
    op.drop_column('customers', 'discount_percentage')
    op.drop_column('customers', 'payment_terms')
    op.drop_column('customers', 'credit_limit')
    op.drop_column('customers', 'customer_type')
    
    # Remove additional information fields
    op.drop_column('customers', 'preferences')
    op.drop_column('customers', 'custom_fields')
    op.drop_column('customers', 'tags')
    op.drop_column('customers', 'notes')
    
    # Remove emergency contact fields
    op.drop_column('customers', 'emergency_contact_relationship')
    op.drop_column('customers', 'emergency_contact_phone')
    op.drop_column('customers', 'emergency_contact_name')
    
    # Remove personal information fields
    op.drop_column('customers', 'occupation')
    op.drop_column('customers', 'nationality')
    op.drop_column('customers', 'gender')
    op.drop_column('customers', 'age')
    op.drop_column('customers', 'date_of_birth')
    op.drop_column('customers', 'national_id')
    
    # Remove comprehensive address fields
    op.drop_column('customers', 'country')
    op.drop_column('customers', 'postal_code')
    op.drop_column('customers', 'state')
    op.drop_column('customers', 'city')
    op.drop_column('customers', 'street_address')
