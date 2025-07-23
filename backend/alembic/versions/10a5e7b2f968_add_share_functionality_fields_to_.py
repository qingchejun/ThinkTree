"""Add share functionality fields to mindmap

Revision ID: 10a5e7b2f968
Revises: 5ae52170590d
Create Date: 2025-07-23 16:04:32.486935

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '10a5e7b2f968'
down_revision: Union[str, Sequence[str], None] = '5ae52170590d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema to support mindmap sharing functionality."""
    # 添加 share_token 字段
    op.add_column('mindmaps', sa.Column('share_token', sa.String(length=64), nullable=True))
    op.create_index(op.f('ix_mindmaps_share_token'), 'mindmaps', ['share_token'], unique=True)
    
    # 修改 is_public 字段类型：从 String(1) 改为 Boolean
    # 先添加新的 Boolean 列
    op.add_column('mindmaps', sa.Column('is_public_new', sa.Boolean(), nullable=True))
    
    # 数据迁移：将字符串值转换为布尔值
    connection = op.get_bind()
    connection.execute(sa.text("""
        UPDATE mindmaps 
        SET is_public_new = CASE 
            WHEN is_public = '1' THEN true 
            ELSE false 
        END
    """))
    
    # 删除旧列
    op.drop_column('mindmaps', 'is_public')
    
    # 重命名新列
    op.alter_column('mindmaps', 'is_public_new', new_column_name='is_public')
    
    # 设置默认值和非空约束
    op.alter_column('mindmaps', 'is_public', 
                   existing_type=sa.Boolean(), 
                   nullable=False, 
                   server_default=sa.text('false'))
    
    # 添加索引
    op.create_index(op.f('ix_mindmaps_is_public'), 'mindmaps', ['is_public'], unique=False)


def downgrade() -> None:
    """Downgrade schema - remove sharing functionality."""
    # 删除新字段
    op.drop_index(op.f('ix_mindmaps_share_token'), table_name='mindmaps')
    op.drop_column('mindmaps', 'share_token')
    
    # 恢复 is_public 字段为 String 类型
    op.drop_index(op.f('ix_mindmaps_is_public'), table_name='mindmaps')
    
    # 添加临时 String 列
    op.add_column('mindmaps', sa.Column('is_public_str', sa.String(length=1), nullable=True))
    
    # 数据迁移：将布尔值转换为字符串值
    connection = op.get_bind()
    connection.execute(sa.text("""
        UPDATE mindmaps 
        SET is_public_str = CASE 
            WHEN is_public = true THEN '1' 
            ELSE '0' 
        END
    """))
    
    # 删除 Boolean 列
    op.drop_column('mindmaps', 'is_public')
    
    # 重命名为原来的列名
    op.alter_column('mindmaps', 'is_public_str', new_column_name='is_public')
    
    # 设置非空约束和默认值
    op.alter_column('mindmaps', 'is_public', 
                   existing_type=sa.String(length=1), 
                   nullable=False, 
                   server_default=sa.text("'0'"))
