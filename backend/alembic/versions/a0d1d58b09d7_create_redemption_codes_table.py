"""create_redemption_codes_table

Revision ID: a0d1d58b09d7
Revises: a59bc5454678
Create Date: 2025-07-30 13:23:35.472656

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a0d1d58b09d7'
down_revision: Union[str, Sequence[str], None] = 'a59bc5454678'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create redemption_codes table and redemptioncodestatus enum."""
    # 创建枚举类型
    op.execute("CREATE TYPE redemptioncodestatus AS ENUM ('ACTIVE', 'REDEEMED', 'EXPIRED')")
    
    # 创建兑换码表
    op.create_table('redemption_codes',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('code', sa.String(length=50), nullable=False),
        sa.Column('credits_amount', sa.Integer(), nullable=False),
        sa.Column('status', sa.Enum('ACTIVE', 'REDEEMED', 'EXPIRED', name='redemptioncodestatus'), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('redeemed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('redeemed_by_user_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['redeemed_by_user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_redemption_codes_id'), 'redemption_codes', ['id'], unique=False)
    op.create_index(op.f('ix_redemption_codes_code'), 'redemption_codes', ['code'], unique=True)
    op.create_index(op.f('ix_redemption_codes_redeemed_by_user_id'), 'redemption_codes', ['redeemed_by_user_id'], unique=False)


def downgrade() -> None:
    """Drop redemption_codes table and redemptioncodestatus enum."""
    op.drop_index(op.f('ix_redemption_codes_redeemed_by_user_id'), table_name='redemption_codes')
    op.drop_index(op.f('ix_redemption_codes_code'), table_name='redemption_codes')
    op.drop_index(op.f('ix_redemption_codes_id'), table_name='redemption_codes')
    op.drop_table('redemption_codes')
    op.execute("DROP TYPE redemptioncodestatus")
