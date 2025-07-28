"""remove credits system fields

Revision ID: d3f4e5f6g7h8
Revises: 02601b01d8d2
Create Date: 2025-07-28 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'd3f4e5f6g7h8'
down_revision = '02601b01d8d2'
branch_labels = None
depends_on = None


def upgrade():
    """Remove credits system fields from users table."""
    # Remove credits field
    op.drop_column('users', 'credits')
    
    # Remove invitation quota field  
    op.drop_column('users', 'invitation_quota')


def downgrade():
    """Re-add credits system fields to users table."""
    # Re-add credits field
    op.add_column('users', sa.Column('credits', sa.Integer(), nullable=False, server_default='100'))
    
    # Re-add invitation quota field
    op.add_column('users', sa.Column('invitation_quota', sa.Integer(), nullable=False, server_default='10'))