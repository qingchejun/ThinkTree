"""
用户认证 API 路由
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from typing import Dict
import uuid
from datetime import datetime

router = APIRouter()

# 临时用户存储（后续会替换为数据库）
users_storage = {}

@router.post("/register")
async def register(user_data: Dict[str, str]):
    """用户注册"""
    email = user_data.get("email")
    password = user_data.get("password")
    
    if not email or not password:
        raise HTTPException(
            status_code=400,
            detail="邮箱和密码不能为空"
        )
    
    # 检查用户是否已存在
    for user in users_storage.values():
        if user["email"] == email:
            raise HTTPException(
                status_code=400,
                detail="用户已存在"
            )
    
    try:
        user_id = str(uuid.uuid4())
        user = {
            "id": user_id,
            "email": email,
            "password": password,  # 实际应用中需要加密
            "created_at": datetime.now().isoformat()
        }
        
        users_storage[user_id] = user
        
        return JSONResponse(content={
            "success": True,
            "message": "注册成功",
            "user": {
                "id": user_id,
                "email": email
            }
        })
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"注册失败: {str(e)}"
        )

@router.post("/login")
async def login(credentials: Dict[str, str]):
    """用户登录"""
    email = credentials.get("email")
    password = credentials.get("password")
    
    if not email or not password:
        raise HTTPException(
            status_code=400,
            detail="邮箱和密码不能为空"
        )
    
    # 查找用户
    user = None
    for u in users_storage.values():
        if u["email"] == email and u["password"] == password:
            user = u
            break
    
    if not user:
        raise HTTPException(
            status_code=401,
            detail="邮箱或密码错误"
        )
    
    return JSONResponse(content={
        "success": True,
        "message": "登录成功",
        "user": {
            "id": user["id"],
            "email": user["email"]
        },
        "token": f"dummy_token_{user['id']}"  # 简化的token
    })

@router.get("/profile")
async def get_profile():
    """获取用户信息（待实现JWT验证）"""
    return JSONResponse(content={
        "success": True,
        "message": "用户信息获取功能待完善"
    })