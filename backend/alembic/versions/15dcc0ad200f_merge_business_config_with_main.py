"""merge business config with main

Revision ID: 15dcc0ad200f
Revises: 0b8cddaf6aa6, business_config_001
Create Date: 2025-08-25 21:19:26.237169

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '15dcc0ad200f'
down_revision: Union[str, None] = ('0b8cddaf6aa6', 'business_config_001')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
