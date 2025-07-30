"""add_last_daily_reward_date_to_user_credits

Revision ID: f3b938646601
Revises: e8f1g2h3i4j5
Create Date: 2025-07-30 09:29:16.749361

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f3b938646601'
down_revision: Union[str, Sequence[str], None] = 'e8f1g2h3i4j5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add last_daily_reward_date field to user_credits table."""
    # 添加 last_daily_reward_date 字段，类型为 Date，可以为 NULL
    # NULL 表示用户从未获得过每日奖励
    op.add_column('user_credits', sa.Column('last_daily_reward_date', sa.Date(), nullable=True))


def downgrade() -> None:
    """Remove last_daily_reward_date field from user_credits table."""
    # 删除 last_daily_reward_date 字段
    op.drop_column('user_credits', 'last_daily_reward_date')
