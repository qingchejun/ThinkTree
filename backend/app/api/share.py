"""
分享功能 API 路由 - ThinkSo v3.0.0
基于数据库的思维导图分享系统
"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
import secrets
from datetime import datetime

from ..core.database import get_db
from ..models.mindmap import Mindmap
from ..models.user import User
from ..api.auth import get_current_user

router = APIRouter()


@router.post("/mindmaps/{mindmap_id}/share")
async def create_share_link(
    mindmap_id: str, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    为思维导图创建分享链接
    
    Args:
        mindmap_id: 思维导图ID
        current_user: 当前登录用户
        db: 数据库会话
    
    Returns:
        分享链接信息
    """
    try:
        # 验证思维导图UUID格式
        if not mindmap_id:
            raise HTTPException(status_code=400, detail="思维导图ID不能为空")
        
        # 查询思维导图是否存在且属于当前用户
        mindmap = db.query(Mindmap).filter(
            Mindmap.id == mindmap_id,
            Mindmap.user_id == current_user.id
        ).first()
        
        if not mindmap:
            raise HTTPException(
                status_code=404,
                detail="思维导图不存在或无权访问"
            )
        
        # 如果已经有分享链接，直接返回现有的
        if mindmap.is_public and mindmap.share_token:
            return JSONResponse(content={
                "success": True,
                "share_token": mindmap.share_token,
                "share_url": f"/share/{mindmap.share_token}",
                "is_existing": True,
                "message": "使用现有分享链接"
            })
        
        # 生成安全的分享token
        share_token = secrets.token_urlsafe(32)
        
        # 确保token唯一性
        existing_token = db.query(Mindmap).filter(
            Mindmap.share_token == share_token
        ).first()
        
        while existing_token:
            share_token = secrets.token_urlsafe(32)
            existing_token = db.query(Mindmap).filter(
                Mindmap.share_token == share_token
            ).first()
        
        # 更新思维导图的分享状态
        mindmap.is_public = True
        mindmap.share_token = share_token
        mindmap.updated_at = datetime.utcnow()
        
        db.commit()
        
        return JSONResponse(content={
            "success": True,
            "share_token": share_token,
            "share_url": f"/share/{share_token}",
            "is_existing": False,
            "message": "分享链接创建成功"
        })
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"创建分享链接失败: {str(e)}"
        )


@router.get("/share/{share_token}")
async def get_shared_mindmap(
    share_token: str, 
    db: Session = Depends(get_db)
):
    """
    通过分享token获取思维导图（公开接口，无需认证）
    
    Args:
        share_token: 分享令牌
        db: 数据库会话
    
    Returns:
        公开的思维导图数据
    """
    try:
        if not share_token:
            raise HTTPException(status_code=400, detail="分享令牌不能为空")
        
        # 查询公开的思维导图
        mindmap = db.query(Mindmap).join(User).filter(
            Mindmap.share_token == share_token,
            Mindmap.is_public == True
        ).first()
        
        if not mindmap:
            raise HTTPException(
                status_code=404,
                detail="分享链接不存在或已失效"
            )
        
        # 返回公开数据（不包含敏感信息）
        return JSONResponse(content={
            "success": True,
            "mindmap": mindmap.to_public_dict(),
            "share_info": {
                "token": share_token,
                "shared_at": mindmap.updated_at.isoformat() if mindmap.updated_at else None
            }
        })
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"获取分享内容失败: {str(e)}"
        )


@router.delete("/mindmaps/{mindmap_id}/share")
async def disable_share_link(
    mindmap_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    禁用思维导图的分享链接
    
    Args:
        mindmap_id: 思维导图ID
        current_user: 当前登录用户
        db: 数据库会话
    
    Returns:
        操作结果
    """
    try:
        if not mindmap_id:
            raise HTTPException(status_code=400, detail="思维导图ID不能为空")
        
        # 查询思维导图是否存在且属于当前用户
        mindmap = db.query(Mindmap).filter(
            Mindmap.id == mindmap_id,
            Mindmap.user_id == current_user.id
        ).first()
        
        if not mindmap:
            raise HTTPException(
                status_code=404,
                detail="思维导图不存在或无权访问"
            )
        
        if not mindmap.is_public:
            raise HTTPException(
                status_code=400,
                detail="该思维导图未开启分享"
            )
        
        # 禁用分享
        mindmap.is_public = False
        mindmap.share_token = None
        mindmap.updated_at = datetime.utcnow()
        
        db.commit()
        
        return JSONResponse(content={
            "success": True,
            "message": "分享链接已禁用"
        })
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"禁用分享链接失败: {str(e)}"
        )


@router.get("/mindmaps/{mindmap_id}/share")
async def get_mindmap_share_info(
    mindmap_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    获取思维导图的分享信息
    
    Args:
        mindmap_id: 思维导图ID
        current_user: 当前登录用户
        db: 数据库会话
    
    Returns:
        分享信息
    """
    try:
        if not mindmap_id:
            raise HTTPException(status_code=400, detail="思维导图ID不能为空")
        
        # 查询思维导图是否存在且属于当前用户
        mindmap = db.query(Mindmap).filter(
            Mindmap.id == mindmap_id,
            Mindmap.user_id == current_user.id
        ).first()
        
        if not mindmap:
            raise HTTPException(
                status_code=404,
                detail="思维导图不存在或无权访问"
            )
        
        share_info = {
            "is_shared": mindmap.is_public,
            "share_token": mindmap.share_token if mindmap.is_public else None,
            "share_url": f"/share/{mindmap.share_token}" if mindmap.is_public and mindmap.share_token else None,
            "updated_at": mindmap.updated_at.isoformat() if mindmap.updated_at else None
        }
        
        return JSONResponse(content={
            "success": True,
            "share_info": share_info
        })
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"获取分享信息失败: {str(e)}"
        )