"""add credits and invitation quota to user model

Revision ID: 02601b01d8d2
Revises: b8f9a2c3d4e5
Create Date: 2025-07-25 07:54:23.047385

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '02601b01d8d2'
down_revision: Union[str, Sequence[str], None] = 'b8f9a2c3d4e5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add credits field - default 100 credits for new users
    op.add_column('users', sa.Column('credits', sa.Integer(), nullable=False, server_default='100'))
    
    # Add invitation quota field - default 10 for regular users
    op.add_column('users', sa.Column('invitation_quota', sa.Integer(), nullable=False, server_default='10'))


def downgrade() -> None:
    """Downgrade schema."""
    # Remove added columns
    op.drop_column('users', 'invitation_quota')
    op.drop_column('users', 'credits')
