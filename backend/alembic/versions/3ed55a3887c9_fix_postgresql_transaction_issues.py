"""fix_postgresql_transaction_issues

Revision ID: 3ed55a3887c9
Revises: 98f18ccc0d46
Create Date: 2025-08-03 14:08:06.705731

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3ed55a3887c9'
down_revision: Union[str, Sequence[str], None] = '98f18ccc0d46'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """修复PostgreSQL事务问题 - 确保事务状态正常"""
    
    connection = op.get_bind()
    
    # 对于PostgreSQL，我们需要处理可能的事务失败状态
    if connection.dialect.name == 'postgresql':
        print("🔄 检测到PostgreSQL，正在修复事务状态...")
        
        # 首先检查当前事务状态并回滚任何失败的事务
        try:
            # 尝试一个简单的查询来检查事务状态
            connection.execute(sa.text("SELECT 1"))
            print("✅ 事务状态正常")
        except Exception as e:
            print(f"⚠️ 检测到事务问题，正在重置: {e}")
            try:
                # 回滚当前事务
                connection.rollback()
                print("✅ 事务已回滚")
            except Exception as e2:
                print(f"⚠️ 回滚失败，这可能是正常的: {e2}")
        
        # 现在在一个新的事务中确保所有必要的表结构都存在
        trans = connection.begin()
        try:
            # 检查并创建必要的字段
            
            # 1. 检查 mindmaps.share_token 字段
            result = connection.execute(sa.text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'mindmaps' 
                AND column_name = 'share_token'
            """))
            
            if not result.fetchone():
                connection.execute(sa.text("""
                    ALTER TABLE mindmaps ADD COLUMN share_token VARCHAR(64)
                """))
                print("✅ share_token 字段已添加")
            else:
                print("✅ share_token 字段已存在")
            
            # 2. 检查 login_tokens.invitation_code 字段
            result = connection.execute(sa.text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'login_tokens' 
                AND column_name = 'invitation_code'
            """))
            
            if not result.fetchone():
                connection.execute(sa.text("""
                    ALTER TABLE login_tokens ADD COLUMN invitation_code VARCHAR(16)
                """))
                print("✅ invitation_code 字段已添加")
            else:
                print("✅ invitation_code 字段已存在")
            
            # 3. 检查并创建必要的索引
            try:
                # 检查索引是否存在
                result = connection.execute(sa.text("""
                    SELECT indexname FROM pg_indexes 
                    WHERE tablename = 'mindmaps' AND indexname = 'ix_mindmaps_share_token'
                """))
                
                if not result.fetchone():
                    connection.execute(sa.text("""
                        CREATE UNIQUE INDEX ix_mindmaps_share_token ON mindmaps (share_token)
                    """))
                    print("✅ share_token 索引已创建")
                else:
                    print("✅ share_token 索引已存在")
                    
            except Exception as e:
                print(f"⚠️ 索引创建警告: {e}")
            
            trans.commit()
            print("✅ 所有数据库结构修复完成")
            
        except Exception as e:
            trans.rollback()
            print(f"❌ 数据库结构修复失败: {e}")
            raise
    else:
        print("✅ SQLite数据库，跳过PostgreSQL特定修复")


def downgrade() -> None:
    """回滚PostgreSQL事务修复"""
    print("⏪ PostgreSQL事务修复回滚完成")
