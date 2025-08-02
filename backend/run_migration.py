#!/usr/bin/env python3
"""
手动运行数据库迁移脚本

此脚本用于在生产环境中手动运行Alembic迁移
"""

import os
import sys
import subprocess
from pathlib import Path

def main():
    print("=== 生产环境数据库迁移脚本 ===")
    print()
    
    # 确保在正确的目录
    backend_dir = Path(__file__).parent
    os.chdir(backend_dir)
    
    print(f"📍 当前工作目录: {os.getcwd()}")
    print()
    
    # 检查Alembic配置
    if not Path("alembic.ini").exists():
        print("❌ 未找到 alembic.ini 文件")
        return False
    
    print("✅ 找到 alembic.ini 配置文件")
    
    # 检查迁移目录
    migrations_dir = Path("alembic/versions")
    if not migrations_dir.exists():
        print("❌ 未找到迁移目录")
        return False
    
    # 列出所有迁移文件
    migration_files = list(migrations_dir.glob("*.py"))
    migration_files = [f for f in migration_files if not f.name.startswith("__")]
    
    print(f"📋 找到 {len(migration_files)} 个迁移文件:")
    for migration_file in sorted(migration_files):
        print(f"  - {migration_file.name}")
    
    print()
    
    try:
        # 1. 检查当前数据库状态
        print("🔍 检查当前数据库迁移状态...")
        result = subprocess.run(
            ["python", "-m", "alembic", "current"],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0:
            current_version = result.stdout.strip()
            print(f"📋 当前数据库版本: {current_version}")
        else:
            print(f"⚠️  无法获取当前版本: {result.stderr}")
        
        print()
        
        # 2. 检查待执行的迁移
        print("🔍 检查待执行的迁移...")
        result = subprocess.run(
            ["python", "-m", "alembic", "heads"],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0:
            latest_version = result.stdout.strip()
            print(f"📋 最新迁移版本: {latest_version}")
        else:
            print(f"⚠️  无法获取最新版本: {result.stderr}")
        
        print()
        
        # 3. 运行迁移
        print("🚀 开始运行数据库迁移...")
        result = subprocess.run(
            ["python", "-m", "alembic", "upgrade", "head"],
            capture_output=True,
            text=True,
            timeout=120
        )
        
        if result.returncode == 0:
            print("✅ 数据库迁移成功完成！")
            print()
            if result.stdout:
                print("📋 迁移输出:")
                print(result.stdout)
        else:
            print("❌ 数据库迁移失败:")
            print(result.stderr)
            return False
        
        # 4. 验证迁移结果
        print("🔍 验证迁移结果...")
        result = subprocess.run(
            ["python", "-m", "alembic", "current"],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0:
            final_version = result.stdout.strip()
            print(f"✅ 迁移后数据库版本: {final_version}")
        else:
            print(f"⚠️  无法验证最终版本: {result.stderr}")
        
        print()
        print("🎉 数据库迁移流程完成！")
        print("🔗 现在可以尝试Google OAuth登录功能")
        
        return True
        
    except subprocess.TimeoutExpired:
        print("❌ 迁移执行超时")
        return False
    except Exception as e:
        print(f"❌ 迁移执行异常: {e}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)