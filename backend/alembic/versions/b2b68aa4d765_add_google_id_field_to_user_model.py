"""add google_id field to user model

Revision ID: b2b68aa4d765
Revises: a0d1d58b09d7
Create Date: 2025-08-02 12:21:13.029187

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b2b68aa4d765'
down_revision: Union[str, Sequence[str], None] = 'a0d1d58b09d7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema: Add google_id field to users table."""
    # 添加 google_id 字段到 users 表
    op.add_column('users', sa.Column('google_id', sa.String(100), nullable=True))
    
    # 为 google_id 字段添加唯一索引
    op.create_index('ix_users_google_id', 'users', ['google_id'], unique=True)
    
    # 将 password_hash 字段改为可空 (仅在 PostgreSQL 中执行)
    # SQLite 不支持 ALTER COLUMN，但我们的 User 模型已经定义为可空
    try:
        op.alter_column('users', 'password_hash', 
                       existing_type=sa.String(255),
                       nullable=True)
    except Exception:
        # SQLite 等数据库不支持 ALTER COLUMN，忽略此错误
        pass


def downgrade() -> None:
    """Downgrade schema: Remove google_id field from users table."""
    # 删除 google_id 字段的索引
    op.drop_index('ix_users_google_id', table_name='users')
    
    # 删除 google_id 字段
    op.drop_column('users', 'google_id')
    
    # 将 password_hash 字段改回非空 (仅在 PostgreSQL 中执行)
    try:
        op.alter_column('users', 'password_hash',
                       existing_type=sa.String(255),
                       nullable=False)
    except Exception:
        # SQLite 等数据库不支持 ALTER COLUMN，忽略此错误
        pass