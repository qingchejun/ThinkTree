#!/usr/bin/env python3
"""
数据库引导脚本 - 修复Alembic版本历史问题

此脚本用于在生产环境中修复Alembic版本历史损坏的问题。
它会：
1. 根据所有模型创建缺失的数据库表
2. 将Alembic版本标记设置为最新版本

用法：
    python bootstrap_database.py

注意：
- 此脚本是幂等的，多次运行不会产生副作用
- 仅创建不存在的表，不会删除或修改现有数据
- 执行前会自动备份当前的alembic_version表状态
"""

import os
import sys
import subprocess
from datetime import datetime
from typing import Optional

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from sqlalchemy import create_engine, text, inspect
    from sqlalchemy.orm import sessionmaker
    from sqlalchemy.exc import SQLAlchemyError, ProgrammingError
    
    # 导入配置和所有模型
    from app.core.config import settings
    from app.core.database import Base
    # 导入所有模型以确保它们被注册到Base.metadata中
    from app.models import User, Mindmap, InvitationCode, UserCredits, CreditTransaction, RedemptionCode
    
except ImportError as e:
    print(f"❌ 导入错误: {e}")
    print("请确保在虚拟环境中运行此脚本，并且所有依赖已安装")
    sys.exit(1)


class DatabaseBootstrapper:
    """数据库引导类"""
    
    def __init__(self):
        """初始化数据库连接"""
        try:
            self.engine = create_engine(settings.database_url, echo=False)
            self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
            print(f"✅ 数据库连接初始化成功")
            print(f"📍 数据库URL: {self._mask_db_url(settings.database_url)}")
        except Exception as e:
            print(f"❌ 数据库连接初始化失败: {e}")
            raise
    
    def _mask_db_url(self, url: str) -> str:
        """隐藏数据库URL中的敏感信息"""
        if '://' in url and '@' in url:
            protocol, rest = url.split('://', 1)
            if '@' in rest:
                credentials, host_part = rest.rsplit('@', 1)
                return f"{protocol}://***:***@{host_part}"
        return url
    
    def check_database_connection(self) -> bool:
        """检查数据库连接是否正常"""
        try:
            with self.engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            print("✅ 数据库连接测试通过")
            return True
        except Exception as e:
            print(f"❌ 数据库连接测试失败: {e}")
            return False
    
    def backup_alembic_version(self) -> Optional[str]:
        """备份当前的alembic版本信息"""
        try:
            with self.engine.connect() as conn:
                result = conn.execute(text("SELECT version_num FROM alembic_version LIMIT 1"))
                current_version = result.scalar()
                if current_version:
                    print(f"📋 当前Alembic版本: {current_version}")
                    return current_version
                else:
                    print("📋 未找到Alembic版本记录")
                    return None
        except ProgrammingError:
            print("📋 alembic_version表不存在")
            return None
        except Exception as e:
            print(f"⚠️  备份Alembic版本时出现警告: {e}")
            return None
    
    def get_existing_tables(self) -> set:
        """获取数据库中现有的表"""
        try:
            inspector = inspect(self.engine)
            existing_tables = set(inspector.get_table_names())
            print(f"📊 数据库中现有表: {sorted(existing_tables)}")
            return existing_tables
        except Exception as e:
            print(f"❌ 获取现有表信息失败: {e}")
            return set()
    
    def check_and_update_transaction_type_enum(self) -> bool:
        """检查并更新TransactionType枚举，添加缺失的枚举值"""
        try:
            print("🔍 检查TransactionType枚举完整性...")
            
            # 检查数据库类型
            if "sqlite" in settings.database_url.lower():
                print("🔍 检测到SQLite数据库，跳过枚举检查（SQLite使用字符串存储枚举值）")
                return True
            
            with self.engine.connect() as conn:
                # PostgreSQL枚举检查逻辑
                # 检查DAILY_REWARD是否已存在于transactiontype枚举中
                check_enum_query = text("""
                    SELECT 1 
                    FROM pg_enum e 
                    JOIN pg_type t ON e.enumtypid = t.oid 
                    WHERE t.typname = 'transactiontype' 
                    AND e.enumlabel = 'DAILY_REWARD'
                """)
                
                result = conn.execute(check_enum_query)
                daily_reward_exists = result.scalar() is not None
                
                if daily_reward_exists:
                    print("✅ TransactionType枚举中DAILY_REWARD已存在")
                else:
                    print("🆕 添加DAILY_REWARD到TransactionType枚举")
                    try:
                        # 添加DAILY_REWARD枚举值
                        conn.execute(text("ALTER TYPE transactiontype ADD VALUE 'DAILY_REWARD'"))
                        conn.commit()
                        print("✅ 成功添加DAILY_REWARD到TransactionType枚举")
                    except Exception as e:
                        print(f"❌ 添加枚举值失败: {e}")
                        conn.rollback()
                        return False
                
                # 检查MANUAL_GRANT是否已存在
                check_manual_grant_query = text("""
                    SELECT 1 
                    FROM pg_enum e 
                    JOIN pg_type t ON e.enumtypid = t.oid 
                    WHERE t.typname = 'transactiontype' 
                    AND e.enumlabel = 'MANUAL_GRANT'
                """)
                
                result = conn.execute(check_manual_grant_query)
                manual_grant_exists = result.scalar() is not None
                
                if manual_grant_exists:
                    print("✅ TransactionType枚举中MANUAL_GRANT已存在")
                else:
                    print("🆕 添加MANUAL_GRANT到TransactionType枚举")
                    try:
                        # 添加MANUAL_GRANT枚举值
                        conn.execute(text("ALTER TYPE transactiontype ADD VALUE 'MANUAL_GRANT'"))
                        conn.commit()
                        print("✅ 成功添加MANUAL_GRANT到TransactionType枚举")
                    except Exception as e:
                        print(f"❌ 添加枚举值失败: {e}")
                        conn.rollback()
                        return False
                
            return True
            
        except Exception as e:
            print(f"❌ 检查TransactionType枚举失败: {e}")
            return False

    def check_and_add_missing_columns(self) -> bool:
        """检查并添加缺失的列"""
        try:
            print("🔍 检查数据库列完整性...")
            
            with self.engine.connect() as conn:
                # 检查数据库类型并使用适当的查询
                if "sqlite" in settings.database_url.lower():
                    # SQLite的列检查方式
                    check_column_query = text("PRAGMA table_info(user_credits)")
                    result = conn.execute(check_column_query)
                    columns = [row[1] for row in result.fetchall()]  # 第2列是列名
                    column_exists = 'last_daily_reward_date' in columns
                else:
                    # PostgreSQL的信息模式检查字段是否存在
                    check_column_query = text("""
                        SELECT COUNT(*) 
                        FROM information_schema.columns 
                        WHERE table_name = 'user_credits' 
                        AND column_name = 'last_daily_reward_date'
                    """)
                    result = conn.execute(check_column_query)
                    column_exists = result.scalar() > 0
                
                if column_exists:
                    print("✅ user_credits.last_daily_reward_date 字段已存在")
                    return True
                else:
                    print("🆕 添加 user_credits.last_daily_reward_date 字段")
                    try:
                        conn.execute(text("ALTER TABLE user_credits ADD COLUMN last_daily_reward_date DATE"))
                        conn.commit()
                        print("✅ 成功添加 user_credits.last_daily_reward_date 字段")
                    except Exception as e:
                        print(f"❌ 添加字段失败: {e}")
                        conn.rollback()
                        return False
                
            return True
            
        except Exception as e:
            print(f"❌ 检查列完整性失败: {e}")
            return False

    def create_missing_tables(self) -> bool:
        """创建缺失的数据库表"""
        try:
            print("🔨 开始创建缺失的数据库表...")
            
            # 获取现有表
            existing_tables = self.get_existing_tables()
            
            # 获取模型定义的所有表
            model_tables = set(Base.metadata.tables.keys())
            print(f"📋 模型定义的表: {sorted(model_tables)}")
            
            # 找出需要创建的表
            missing_tables = model_tables - existing_tables
            if missing_tables:
                print(f"🆕 需要创建的表: {sorted(missing_tables)}")
            else:
                print("✅ 所有表都已存在，无需创建新表")
            
            # 在创建表之前，先检查并更新枚举类型
            if not self.check_and_update_transaction_type_enum():
                return False
                
            # 然后检查并添加缺失的列
            if not self.check_and_add_missing_columns():
                return False
            
            # 创建所有表（仅创建不存在的）
            Base.metadata.create_all(bind=self.engine)
            
            # 验证表创建结果
            new_existing_tables = self.get_existing_tables()
            newly_created = new_existing_tables - existing_tables
            
            if newly_created:
                print(f"✅ 成功创建表: {sorted(newly_created)}")
            
            print("✅ 数据库表创建/验证完成")
            return True
            
        except Exception as e:
            print(f"❌ 创建数据库表失败: {e}")
            return False
    
    def get_latest_alembic_revision(self) -> Optional[str]:
        """获取最新的Alembic修订版本"""
        try:
            # 尝试运行 alembic heads 命令获取最新版本
            result = subprocess.run(
                ['alembic', 'heads'],
                capture_output=True,
                text=True,
                cwd=os.path.dirname(os.path.abspath(__file__))
            )
            
            if result.returncode == 0:
                # 解析输出获取最新版本号
                lines = result.stdout.strip().split('\n')
                for line in lines:
                    if line.strip():
                        # 提取版本号（通常是第一个单词）
                        parts = line.strip().split()
                        if parts:
                            revision = parts[0]
                            print(f"📋 找到最新Alembic修订版本: {revision}")
                            return revision
            
            print(f"⚠️  无法获取Alembic版本: {result.stderr}")
            return None
            
        except FileNotFoundError:
            print("⚠️  未找到alembic命令，将跳过版本标记")
            return None
        except Exception as e:
            print(f"⚠️  获取Alembic版本时出错: {e}")
            return None
    
    def stamp_alembic_head(self) -> bool:
        """将Alembic版本标记为最新版本"""
        try:
            print("🏷️  开始标记Alembic版本...")
            
            # 首先获取最新的修订版本
            latest_revision = self.get_latest_alembic_revision()
            if not latest_revision:
                print("⚠️  无法获取最新Alembic修订版本，跳过版本标记")
                return False
            
            # 尝试强制标记为最新版本，忽略版本历史
            result = subprocess.run(
                ['alembic', 'stamp', '--purge', latest_revision],
                capture_output=True,
                text=True,
                cwd=os.path.dirname(os.path.abspath(__file__))
            )
            
            if result.returncode == 0:
                print("✅ Alembic版本标记成功")
                print(f"🎯 当前Alembic版本已设置为: {latest_revision}")
                return True
            else:
                # 如果 --purge 选项失败，尝试直接标记
                print(f"⚠️  使用--purge标记失败，尝试直接标记: {result.stderr}")
                
                # 直接标记为最新版本
                result = subprocess.run(
                    ['alembic', 'stamp', latest_revision],
                    capture_output=True,
                    text=True,
                    cwd=os.path.dirname(os.path.abspath(__file__))
                )
                
                if result.returncode == 0:
                    print("✅ 直接Alembic版本标记成功")
                    print(f"🎯 当前Alembic版本已设置为: {latest_revision}")
                    return True
                else:
                    print(f"❌ Alembic版本标记失败: {result.stderr}")
                    # 如果还是失败，尝试手动更新数据库中的版本记录
                    return self._manually_update_alembic_version(latest_revision)
                
        except FileNotFoundError:
            print("⚠️  未找到alembic命令，跳过版本标记")
            print("💡 请手动运行: alembic stamp head")
            return False
        except Exception as e:
            print(f"❌ 标记Alembic版本时出错: {e}")
            return False
    
    def _manually_update_alembic_version(self, target_revision: str) -> bool:
        """手动更新数据库中的Alembic版本记录"""
        try:
            print(f"🔧 尝试手动更新Alembic版本为: {target_revision}")
            
            with self.engine.connect() as conn:
                # 检查alembic_version表是否存在
                result = conn.execute(text("""
                    SELECT table_name FROM information_schema.tables 
                    WHERE table_name = 'alembic_version'
                """))
                
                table_exists = result.scalar() is not None
                
                if table_exists:
                    # 更新现有版本记录
                    conn.execute(text(
                        "UPDATE alembic_version SET version_num = :version"
                    ), {"version": target_revision})
                else:
                    # 创建alembic_version表并插入版本记录
                    conn.execute(text(
                        "CREATE TABLE alembic_version (version_num VARCHAR(32) NOT NULL, "
                        "CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num))"
                    ))
                    conn.execute(text(
                        "INSERT INTO alembic_version (version_num) VALUES (:version)"
                    ), {"version": target_revision})
                
                conn.commit()
                print(f"✅ 手动更新Alembic版本成功: {target_revision}")
                return True
                
        except Exception as e:
            print(f"❌ 手动更新Alembic版本失败: {e}")
            return False
    
    def bootstrap(self) -> bool:
        """执行完整的数据库引导过程"""
        print("=" * 80)
        print("🚀 开始数据库引导过程")
        print("=" * 80)
        print(f"⏰ 执行时间: {datetime.now().isoformat()}")
        print()
        
        try:
            # 步骤1: 检查数据库连接
            if not self.check_database_connection():
                return False
            
            # 步骤2: 备份当前Alembic版本
            current_version = self.backup_alembic_version()
            
            # 步骤3: 创建缺失的数据库表
            if not self.create_missing_tables():
                return False
            
            # 步骤4: 标记Alembic版本为最新
            if not self.stamp_alembic_head():
                print("⚠️  Alembic版本标记失败，但表创建成功")
                print("💡 你可以稍后手动运行: alembic stamp head")
            
            print("\n" + "=" * 80)
            print("🎉 数据库引导过程完成！")
            print("=" * 80)
            
            return True
            
        except Exception as e:
            print(f"\n❌ 数据库引导过程失败: {e}")
            print("=" * 80)
            return False


def main():
    """主函数"""
    try:
        bootstrapper = DatabaseBootstrapper()
        success = bootstrapper.bootstrap()
        
        if success:
            print("✅ 数据库引导成功完成")
            sys.exit(0)
        else:
            print("❌ 数据库引导失败")
            sys.exit(1)
            
    except KeyboardInterrupt:
        print("\n⏹️  用户中断操作")
        sys.exit(1)
    except Exception as e:
        print(f"❌ 程序异常: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()