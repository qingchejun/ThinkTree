#!/usr/bin/env python3
"""
生成初始邀请码脚本
在数据库中创建一个可用的一次性邀请码并打印出来，方便复制使用。
"""

import os
import sys
import logging
from datetime import datetime

# 添加项目根目录到 Python 路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import sessionmaker
from app.core.database import engine, get_db
from app.models.invitation import InvitationCode
from app.utils.invitation_utils import generate_invitation_code

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    """生成一次性邀请码"""
    print("🚀 ThinkSo 邀请码生成工具")
    print("=" * 50)
    
    try:
        # 创建数据库会话
        SessionLocal = sessionmaker(bind=engine)
        db = SessionLocal()
        
        print(f"📊 数据库连接成功")
        print(f"🗄️  数据库引擎: {engine.url}")
        
        # 生成新的邀请码
        code = generate_invitation_code()
        
        # 创建邀请码记录
        invitation = InvitationCode(
            code=code,
            created_by=None,  # 系统生成，没有创建者
            description="系统初始化邀请码 - 用于首次注册管理员账户",
            max_uses=1,  # 一次性使用
            current_uses=0,
            expires_at=None,  # 永不过期
            is_active=True
        )
        
        # 保存到数据库
        db.add(invitation)
        db.commit()
        
        print("\n✅ 邀请码生成成功！")
        print("=" * 50)
        print(f"🎫 邀请码: {code}")
        print(f"📝 描述: {invitation.description}")
        print(f"🔢 最大使用次数: {invitation.max_uses}")
        print(f"⏰ 创建时间: {invitation.created_at}")
        print(f"🚫 过期时间: 永不过期")
        print("=" * 50)
        print(f"🔗 注册链接: https://thinktree-frontend.onrender.com/register?invitation_code={code}")
        print("=" * 50)
        
        # 关闭数据库连接
        db.close()
        
        print("\n🎉 请复制上面的邀请码或注册链接！")
        
    except Exception as e:
        logger.error(f"❌ 生成邀请码失败: {e}")
        print(f"\n💥 生成邀请码失败: {e}")
        if 'db' in locals():
            db.rollback()
            db.close()
        return 1
    
    return 0

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)