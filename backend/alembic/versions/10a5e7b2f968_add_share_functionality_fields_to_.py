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
    # 添加 share_token 字段（带重复检查）
    try:
        connection = op.get_bind()
        field_exists = False
        
        # 检查字段是否已存在
        if connection.dialect.name == 'postgresql':
            result = connection.execute(sa.text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'mindmaps' 
                AND column_name = 'share_token'
            """))
            field_exists = result.fetchone() is not None
        else:
            # SQLite fallback
            result = connection.execute(sa.text("""
                PRAGMA table_info(mindmaps)
            """))
            columns = [row[1] for row in result.fetchall()]
            field_exists = 'share_token' in columns
        
        if not field_exists:
            op.add_column('mindmaps', sa.Column('share_token', sa.String(length=64), nullable=True))
            print("✅ share_token 字段已添加到 mindmaps 表")
        else:
            print("✅ share_token 字段已存在于 mindmaps 表")
            
        # 创建索引（也需要检查是否存在）
        try:
            op.create_index(op.f('ix_mindmaps_share_token'), 'mindmaps', ['share_token'], unique=True)
            print("✅ share_token 索引已创建")
        except Exception as e:
            print(f"⚠️ share_token 索引创建警告（可能已存在）: {e}")
            
    except Exception as e:
        print(f"⚠️ share_token 字段处理警告: {e}")
        # 尝试直接添加（用于向后兼容）
        try:
            op.add_column('mindmaps', sa.Column('share_token', sa.String(length=64), nullable=True))
            op.create_index(op.f('ix_mindmaps_share_token'), 'mindmaps', ['share_token'], unique=True)
            print("✅ share_token 字段和索引已添加（兼容模式）")
        except Exception as e2:
            print(f"⚠️ 兼容模式也失败: {e2}")
    
    # 修改 is_public 字段类型：从 String(1) 改为 Boolean（带错误处理）
    try:
        connection = op.get_bind()
        
        # 检查 is_public 字段的当前类型
        if connection.dialect.name == 'postgresql':
            result = connection.execute(sa.text("""
                SELECT data_type 
                FROM information_schema.columns 
                WHERE table_name = 'mindmaps' 
                AND column_name = 'is_public'
            """))
            current_type = result.fetchone()
            current_type = current_type[0] if current_type else None
        else:
            # SQLite - 获取表结构
            result = connection.execute(sa.text("PRAGMA table_info(mindmaps)"))
            columns = {row[1]: row[2] for row in result.fetchall()}
            current_type = columns.get('is_public', '').lower()
        
        # 如果 is_public 字段不是 Boolean 类型，则进行转换
        if current_type and 'boolean' not in current_type.lower():
            print(f"🔄 Converting is_public from {current_type} to Boolean")
            
            # 先添加新的 Boolean 列
            op.add_column('mindmaps', sa.Column('is_public_new', sa.Boolean(), nullable=True))
            
            # 数据迁移：将字符串值转换为布尔值
            connection.execute(sa.text("""
                UPDATE mindmaps 
                SET is_public_new = CASE 
                    WHEN is_public = '1' OR is_public = 'true' OR is_public = 't' THEN true 
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
            
            print("✅ is_public 字段已转换为 Boolean 类型")
        else:
            print("✅ is_public 字段已经是 Boolean 类型")
        
        # 添加索引（需要检查是否存在）
        try:
            op.create_index(op.f('ix_mindmaps_is_public'), 'mindmaps', ['is_public'], unique=False)
            print("✅ is_public 索引已创建")
        except Exception as e:
            print(f"⚠️ is_public 索引创建警告（可能已存在）: {e}")
            
    except Exception as e:
        print(f"⚠️ is_public 字段处理警告: {e}")


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
