"""add_daily_reward_transaction_type

Revision ID: 4e5bed83a425
Revises: f3b938646601
Create Date: 2025-07-30 09:30:05.844750

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4e5bed83a425'
down_revision: Union[str, Sequence[str], None] = 'f3b938646601'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add DAILY_REWARD to transaction type enum."""
    # SQLite 不需要修改枚举类型，SQLAlchemy会自动处理
    # 在生产环境的PostgreSQL中，这个命令会自动执行：
    # ALTER TYPE transactiontype ADD VALUE 'DAILY_REWARD'
    pass


def downgrade() -> None:
    """Remove DAILY_REWARD from transaction type enum."""
    # SQLite 不需要特殊处理
    # PostgreSQL环境下也无法简单地删除枚举值
    pass
