"""empty message

Revision ID: 0e0aeddc3498
Revises: e04d8175225c
Create Date: 2025-08-03 23:13:39.410955

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0e0aeddc3498'
down_revision: Union[str, Sequence[str], None] = 'e04d8175225c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
