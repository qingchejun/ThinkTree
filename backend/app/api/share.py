"""
分享功能 API 路由
"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import Dict, Any
import uuid
import hashlib
from datetime import datetime

from ..core.database import get_db
from ..models.mindmap import Mindmap
from ..models.user import User
from ..api.auth import get_current_user

router = APIRouter()

# 分享链接存储 (临时使用内存存储，后续可改为数据库)
share_links_storage = {}

@router.post("/mindmaps/{mindmap_id}/share")
async def create_share_link(
    mindmap_id: str, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    share_config: Dict[str, Any] = None
):
    """为思维导图创建分享链接"""
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
    
    try:
        # 生成分享token
        share_token = hashlib.md5(f"{mindmap_id}_{datetime.now().timestamp()}".encode()).hexdigest()[:16]
        
        share_info = {
            "token": share_token,
            "mindmap_id": mindmap_id,
            "created_at": datetime.now().isoformat(),
            "access_count": 0,
            "is_active": True
        }
        
        if share_config:
            share_info.update(share_config)
        
        share_links_storage[share_token] = share_info
        
        # 更新思维导图的公开状态
        mindmap.is_public = '1'
        db.commit()
        
        return JSONResponse(content={
            "success": True,
            "share_token": share_token,
            "share_url": f"/share/{share_token}",
            "message": "分享链接创建成功"
        })
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"创建分享链接失败: {str(e)}"
        )

@router.get("/share/{share_token}")
async def get_shared_mindmap(share_token: str, db: Session = Depends(get_db)):
    """通过分享token获取思维导图"""
    if share_token not in share_links_storage:
        raise HTTPException(
            status_code=404,
            detail="分享链接不存在或已失效"
        )
    
    share_info = share_links_storage[share_token]
    
    if not share_info["is_active"]:
        raise HTTPException(
            status_code=403,
            detail="分享链接已被禁用"
        )
    
    mindmap_id = share_info["mindmap_id"]
    
    # 从数据库查询思维导图
    mindmap = db.query(Mindmap).filter(Mindmap.id == mindmap_id).first()
    
    if not mindmap:
        raise HTTPException(
            status_code=404,
            detail="思维导图不存在"
        )
    
    # 增加访问计数
    share_links_storage[share_token]["access_count"] += 1
    
    return JSONResponse(content={
        "success": True,
        "mindmap": {
            "id": str(mindmap.id),
            "title": mindmap.title,
            "content": mindmap.content,
            "description": mindmap.description,
            "tags": mindmap.tags.split(',') if mindmap.tags else [],
            "created_at": mindmap.created_at.isoformat(),
            "updated_at": mindmap.updated_at.isoformat()
        },
        "share_info": {
            "token": share_token,
            "created_at": share_info["created_at"],
            "access_count": share_info["access_count"]
        }
    })

@router.delete("/share/{share_token}")
async def disable_share_link(share_token: str):
    """禁用分享链接"""
    if share_token not in share_links_storage:
        raise HTTPException(
            status_code=404,
            detail="分享链接不存在"
        )
    
    share_links_storage[share_token]["is_active"] = False
    
    return JSONResponse(content={
        "success": True,
        "message": "分享链接已禁用"
    })

@router.get("/mindmaps/{mindmap_id}/shares")
async def get_mindmap_shares(
    mindmap_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取思维导图的所有分享链接"""
    # 验证思维导图是否存在且属于当前用户
    mindmap = db.query(Mindmap).filter(
        Mindmap.id == mindmap_id,
        Mindmap.user_id == current_user.id
    ).first()
    
    if not mindmap:
        raise HTTPException(
            status_code=404,
            detail="思维导图不存在或无权访问"
        )
    
    # 查找该思维导图的所有分享链接
    shares = []
    for token, share_info in share_links_storage.items():
        if share_info["mindmap_id"] == mindmap_id:
            shares.append(share_info)
    
    return JSONResponse(content={
        "success": True,
        "shares": shares,
        "total": len(shares)
    })