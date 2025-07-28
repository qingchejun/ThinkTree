#!/usr/bin/env python3
"""
数据库迁移脚本 - 以编程方式运行 Alembic 迁移
用于解决 Render 生产环境中 'relation does not exist' 的问题

This script programmatically runs Alembic migrations to ensure
all database tables are created in production environment.
"""

import os
import sys
from pathlib import Path

# 确保应用路径在 Python 路径中
script_dir = Path(__file__).parent
sys.path.insert(0, str(script_dir))

try:
    from alembic import command
    from alembic.config import Config
    from alembic.script import ScriptDirectory
    from alembic.runtime.environment import EnvironmentContext
    from sqlalchemy import create_engine
except ImportError as e:
    print(f"❌ 导入错误: {e}")
    print("请确保已安装 alembic 和 sqlalchemy")
    sys.exit(1)


def run_migrations():
    """
    以编程方式运行数据库迁移
    """
    print("🚀 开始执行数据库迁移...")
    print("=" * 50)
    
    try:
        # 1. 获取数据库连接字符串
        database_url = os.getenv('DATABASE_URL')
        if not database_url:
            print("❌ 错误: 未找到 DATABASE_URL 环境变量")
            print("请确保在环境中设置了 DATABASE_URL")
            sys.exit(1)
        
        print(f"📍 数据库连接: {database_url[:50]}...")
        
        # 2. 创建 Alembic 配置对象
        alembic_cfg_path = script_dir / "alembic.ini"
        if not alembic_cfg_path.exists():
            print(f"❌ 错误: 未找到 alembic.ini 文件: {alembic_cfg_path}")
            sys.exit(1)
        
        print(f"📄 使用配置文件: {alembic_cfg_path}")
        
        # 创建 Alembic 配置
        alembic_cfg = Config(str(alembic_cfg_path))
        
        # 3. 强制设置生产数据库 URL
        print("🔧 设置数据库连接配置...")
        alembic_cfg.set_main_option('sqlalchemy.url', database_url)
        
        # 4. 验证数据库连接
        print("🔍 验证数据库连接...")
        try:
            engine = create_engine(database_url)
            with engine.connect() as conn:
                result = conn.execute("SELECT 1")
                result.fetchone()
            print("✅ 数据库连接验证成功")
        except Exception as e:
            print(f"❌ 数据库连接失败: {e}")
            sys.exit(1)
        
        # 5. 检查迁移脚本
        script_dir_path = alembic_cfg.get_main_option('script_location')
        script_directory = ScriptDirectory.from_config(alembic_cfg)
        
        print(f"📁 迁移脚本目录: {script_dir_path}")
        
        # 获取所有迁移版本
        revisions = list(script_directory.walk_revisions())
        print(f"📋 发现 {len(revisions)} 个迁移脚本")
        
        for revision in reversed(revisions):
            print(f"   - {revision.revision[:8]}: {revision.doc}")
        
        # 6. 执行数据库迁移
        print("\n🎯 开始执行迁移到最新版本 (head)...")
        try:
            command.upgrade(alembic_cfg, 'head')
            print("✅ 数据库迁移执行成功！")
        except Exception as e:
            print(f"❌ 迁移执行失败: {e}")
            print("\n🔧 尝试获取当前数据库版本...")
            try:
                command.current(alembic_cfg)
            except Exception as current_err:
                print(f"❌ 无法获取当前版本: {current_err}")
            raise
        
        # 7. 验证迁移结果
        print("\n🔍 验证迁移结果...")
        try:
            command.current(alembic_cfg, verbose=True)
        except Exception as e:
            print(f"⚠️  无法验证迁移结果: {e}")
        
        print("=" * 50)
        print("🎉 数据库迁移成功完成！")
        print("所有表结构已更新到最新版本")
        
    except Exception as e:
        print(f"❌ 迁移过程中发生错误: {e}")
        print("=" * 50)
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    # 设置工作目录到脚本所在目录
    os.chdir(script_dir)
    
    print("🔄 ThinkSo 数据库迁移工具")
    print(f"📍 工作目录: {script_dir}")
    print(f"🐍 Python 版本: {sys.version}")
    print()
    
    run_migrations()