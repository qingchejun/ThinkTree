#!/usr/bin/env python3
"""
Google OAuth 配置助手脚本

此脚本帮助设置 Google OAuth 所需的环境变量
"""

import os
import sys

def main():
    print("=== Google OAuth 配置助手 ===")
    print()
    
    # 检查当前环境变量
    current_client_id = os.getenv("GOOGLE_CLIENT_ID", "")
    current_client_secret = os.getenv("GOOGLE_CLIENT_SECRET", "")
    
    print("当前配置状态:")
    print(f"GOOGLE_CLIENT_ID: {'已设置' if current_client_id else '未设置'}")
    print(f"GOOGLE_CLIENT_SECRET: {'已设置' if current_client_secret else '未设置'}")
    print()
    
    if current_client_id and current_client_secret:
        print("✅ Google OAuth 配置已完成！")
        print()
        print("如需重新配置，请删除现有环境变量后重新运行此脚本")
        return
    
    print("❌ Google OAuth 配置不完整")
    print()
    print("请按照以下步骤配置 Google OAuth:")
    print()
    print("1. 访问 Google Cloud Console:")
    print("   https://console.cloud.google.com/")
    print()
    print("2. 创建或选择项目")
    print()
    print("3. 启用 Google+ API 和 OAuth Consent Screen")
    print()
    print("4. 创建 OAuth 2.0 客户端 ID:")
    print("   - 应用类型: Web 应用")
    print("   - 授权重定向 URI: https://thinktree-backend.onrender.com/api/auth/google/callback")
    print()
    print("5. 获取客户端 ID 和客户端密钥")
    print()
    print("6. 在 Render 部署环境中设置以下环境变量:")
    print("   GOOGLE_CLIENT_ID=你的客户端ID")
    print("   GOOGLE_CLIENT_SECRET=你的客户端密钥")
    print()
    print("设置完成后，重新部署应用即可启用 Google OAuth 登录功能")

if __name__ == "__main__":
    main()