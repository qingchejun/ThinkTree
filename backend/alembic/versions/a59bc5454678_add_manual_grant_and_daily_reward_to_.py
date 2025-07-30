"""add_manual_grant_and_daily_reward_to_transaction_type

Revision ID: a59bc5454678
Revises: 4e5bed83a425
Create Date: 2025-07-30 13:06:43.817778

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a59bc5454678'
down_revision: Union[str, Sequence[str], None] = '4e5bed83a425'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add MANUAL_GRANT and DAILY_REWARD to TransactionType enum."""
    # 在PostgreSQL中添加新的枚举值
    op.execute("ALTER TYPE transactiontype ADD VALUE IF NOT EXISTS 'MANUAL_GRANT'")
    op.execute("ALTER TYPE transactiontype ADD VALUE IF NOT EXISTS 'DAILY_REWARD'")


def downgrade() -> None:
    """Remove MANUAL_GRANT and DAILY_REWARD from TransactionType enum."""
    # PostgreSQL不支持直接删除枚举值，需要重建枚举类型
    # 为了简化，我们在downgrade中不做操作
    # 如果需要完全回滚，需要重建整个枚举类型
    pass
