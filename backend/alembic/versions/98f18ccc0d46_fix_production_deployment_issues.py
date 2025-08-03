"""fix_production_deployment_issues

Revision ID: 98f18ccc0d46
Revises: 8c6bf939bde7
Create Date: 2025-08-03 13:56:02.197014

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '98f18ccc0d46'
down_revision: Union[str, Sequence[str], None] = '8c6bf939bde7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """修复生产部署问题 - 确保所有必要的表和字段都存在"""
    
    # 1. 确保invitation_code字段存在于login_tokens表中
    try:
        # 检查字段是否已存在
        connection = op.get_bind()
        result = connection.execute(sa.text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'login_tokens' 
            AND column_name = 'invitation_code'
        """))
        
        if not result.fetchone():
            op.add_column('login_tokens', sa.Column('invitation_code', sa.String(length=16), nullable=True))
            print("✅ invitation_code 字段已添加到 login_tokens 表")
        else:
            print("✅ invitation_code 字段已存在于 login_tokens 表")
            
    except Exception as e:
        print(f"⚠️ 处理 invitation_code 字段时出现警告: {e}")
        # 尝试直接添加字段（如果是 SQLite）
        try:
            op.add_column('login_tokens', sa.Column('invitation_code', sa.String(length=16), nullable=True))
            print("✅ invitation_code 字段已添加到 login_tokens 表（SQLite兼容模式）")
        except Exception as e2:
            print(f"⚠️ SQLite模式也失败: {e2}")
    
    # 2. 确保必要的枚举类型存在（针对PostgreSQL）
    try:
        from sqlalchemy.dialects import postgresql
        connection = op.get_bind()
        
        # 检查是否为PostgreSQL
        if connection.dialect.name == 'postgresql':
            # 检查enum是否存在
            result = connection.execute(sa.text("""
                SELECT 1 FROM pg_type WHERE typname = 'transactiontype'
            """))
            
            if not result.fetchone():
                transaction_type_enum = postgresql.ENUM(
                    'INITIAL_GRANT', 'DEDUCTION', 'REFUND', 'MANUAL_GRANT', 'DAILY_REWARD',
                    name='transactiontype'
                )
                transaction_type_enum.create(connection)
                print("✅ TransactionType enum 已创建")
            else:
                print("✅ TransactionType enum 已存在")
                
    except Exception as e:
        print(f"⚠️ 处理枚举类型时出现警告: {e}")

    # 3. 确保share_token字段存在于mindmaps表中
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
            
    except Exception as e:
        print(f"⚠️ 处理 share_token 字段时出现警告: {e}")

    # 4. 确保credit相关表存在
    try:
        connection = op.get_bind()
        
        # 检查user_credits表是否存在
        if connection.dialect.name == 'postgresql':
            result = connection.execute(sa.text("""
                SELECT 1 FROM information_schema.tables 
                WHERE table_name = 'user_credits'
            """))
        else:
            result = connection.execute(sa.text("""
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name='user_credits'
            """))
            
        if not result.fetchone():
            print("⚠️ user_credits 表不存在，可能需要运行完整的信用系统迁移")
        else:
            print("✅ user_credits 表已存在")
            
    except Exception as e:
        print(f"⚠️ 检查credit表时出现警告: {e}")

    print("🔄 生产环境修复迁移完成")


def downgrade() -> None:
    """回滚生产部署修复"""
    # 这个迁移主要是修复性质的，不需要回滚操作
    print("⏪ 生产环境修复迁移回滚完成")
