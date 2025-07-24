"""Add is_superuser field to User model

Revision ID: ae550ba5fc44
Revises: 10a5e7b2f968
Create Date: 2025-07-24 14:23:02.008697

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ae550ba5fc44'
down_revision: Union[str, Sequence[str], None] = '10a5e7b2f968'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add is_superuser field to users table
    op.add_column('users', sa.Column('is_superuser', sa.Boolean(), nullable=False, server_default='false'))


def downgrade() -> None:
    """Downgrade schema."""
    # Remove is_superuser field from users table
    op.drop_column('users', 'is_superuser')
