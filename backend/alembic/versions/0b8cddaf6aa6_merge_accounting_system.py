"""merge accounting system

Revision ID: 0b8cddaf6aa6
Revises: accounting_system, c9e1d5f57c3a
Create Date: 2025-08-25 20:57:27.918187

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0b8cddaf6aa6'
down_revision: Union[str, None] = ('accounting_system', 'c9e1d5f57c3a')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
