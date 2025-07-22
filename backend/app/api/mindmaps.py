"""
思维导图API接口 - ThinkTree v2.2.0
处理用户思维导图的CRUD操作
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from pydantic import BaseModel, validator
from typing import List, Optional
from uuid import UUID

from ..core.database import get_db
from ..models.mindmap import Mindmap
from ..models.user import User
from ..api.auth import get_current_user

router = APIRouter()


# Pydantic 模型定义
class MindmapCreate(BaseModel):
    """创建思维导图的请求模型"""
    title: str
    content: str
    description: Optional[str] = None
    tags: Optional[str] = None  # 逗号分隔的标签
    is_public: bool = False
    
    @validator('title')
    def title_must_not_be_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('标题不能为空')
        if len(v.strip()) > 200:
            raise ValueError('标题长度不能超过200字符')
        return v.strip()
    
    @validator('content')
    def content_must_not_be_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('内容不能为空')
        return v.strip()


class MindmapResponse(BaseModel):
    """思维导图响应模型"""
    id: str
    title: str
    content: str
    description: Optional[str]
    tags: List[str]
    is_public: bool
    created_at: str
    updated_at: str
    user_id: int


class MindmapSummaryResponse(BaseModel):
    """思维导图摘要响应模型 (列表显示用)"""
    id: str
    title: str
    description: Optional[str]
    tags: List[str]
    is_public: bool
    created_at: str
    updated_at: str
    content_preview: str


# API 端点实现
@router.post("/", response_model=MindmapResponse, status_code=status.HTTP_201_CREATED)
async def create_mindmap(
    mindmap_data: MindmapCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    创建新的思维导图
    需要JWT认证
    """
    try:
        # 创建新的思维导图记录
        new_mindmap = Mindmap(
            title=mindmap_data.title,
            content=mindmap_data.content,
            description=mindmap_data.description,
            tags=mindmap_data.tags,
            is_public='1' if mindmap_data.is_public else '0',
            user_id=current_user.id
        )
        
        db.add(new_mindmap)
        db.commit()
        db.refresh(new_mindmap)
        
        # 返回创建成功的思维导图
        return MindmapResponse(
            id=str(new_mindmap.id),
            title=new_mindmap.title,
            content=new_mindmap.content,
            description=new_mindmap.description,
            tags=new_mindmap.tags.split(',') if new_mindmap.tags else [],
            is_public=new_mindmap.is_public == '1',
            created_at=new_mindmap.created_at.isoformat(),
            updated_at=new_mindmap.updated_at.isoformat(),
            user_id=new_mindmap.user_id
        )
        
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"数据库操作失败: {str(e)}"
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"创建思维导图失败: {str(e)}"
        )


@router.get("/", response_model=List[MindmapSummaryResponse])
async def get_user_mindmaps(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    """
    获取当前用户的所有思维导图列表
    需要JWT认证
    """
    try:
        # 查询当前用户的思维导图
        mindmaps = db.query(Mindmap).filter(
            Mindmap.user_id == current_user.id
        ).order_by(
            Mindmap.updated_at.desc()
        ).offset(skip).limit(limit).all()
        
        # 转换为摘要响应格式
        return [
            MindmapSummaryResponse(
                id=str(mindmap.id),
                title=mindmap.title,
                description=mindmap.description,
                tags=mindmap.tags.split(',') if mindmap.tags else [],
                is_public=mindmap.is_public == '1',
                created_at=mindmap.created_at.isoformat(),
                updated_at=mindmap.updated_at.isoformat(),
                content_preview=mindmap.content[:100] + "..." if len(mindmap.content) > 100 else mindmap.content
            )
            for mindmap in mindmaps
        ]
        
    except SQLAlchemyError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"数据库查询失败: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取思维导图列表失败: {str(e)}"
        )


@router.get("/{mindmap_id}", response_model=MindmapResponse)
async def get_mindmap(
    mindmap_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    获取指定ID的思维导图详情
    需要JWT认证，只能获取自己的思维导图
    """
    try:
        # 查询思维导图
        mindmap = db.query(Mindmap).filter(
            Mindmap.id == mindmap_id,
            Mindmap.user_id == current_user.id
        ).first()
        
        if not mindmap:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="思维导图不存在或无权访问"
            )
        
        return MindmapResponse(
            id=str(mindmap.id),
            title=mindmap.title,
            content=mindmap.content,
            description=mindmap.description,
            tags=mindmap.tags.split(',') if mindmap.tags else [],
            is_public=mindmap.is_public == '1',
            created_at=mindmap.created_at.isoformat(),
            updated_at=mindmap.updated_at.isoformat(),
            user_id=mindmap.user_id
        )
        
    except HTTPException:
        raise
    except SQLAlchemyError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"数据库查询失败: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取思维导图失败: {str(e)}"
        )


@router.put("/{mindmap_id}", response_model=MindmapResponse)
async def update_mindmap(
    mindmap_id: str,
    mindmap_data: MindmapCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    更新指定ID的思维导图
    需要JWT认证，只能更新自己的思维导图
    """
    try:
        # 查询要更新的思维导图
        mindmap = db.query(Mindmap).filter(
            Mindmap.id == mindmap_id,
            Mindmap.user_id == current_user.id
        ).first()
        
        if not mindmap:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="思维导图不存在或无权修改"
            )
        
        # 更新数据
        mindmap.title = mindmap_data.title
        mindmap.content = mindmap_data.content
        mindmap.description = mindmap_data.description
        mindmap.tags = mindmap_data.tags
        mindmap.is_public = '1' if mindmap_data.is_public else '0'
        
        db.commit()
        db.refresh(mindmap)
        
        return MindmapResponse(
            id=str(mindmap.id),
            title=mindmap.title,
            content=mindmap.content,
            description=mindmap.description,
            tags=mindmap.tags.split(',') if mindmap.tags else [],
            is_public=mindmap.is_public == '1',
            created_at=mindmap.created_at.isoformat(),
            updated_at=mindmap.updated_at.isoformat(),
            user_id=mindmap.user_id
        )
        
    except HTTPException:
        raise
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"数据库更新失败: {str(e)}"
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"更新思维导图失败: {str(e)}"
        )


@router.delete("/{mindmap_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_mindmap(
    mindmap_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    删除指定ID的思维导图
    需要JWT认证，只能删除自己的思维导图
    """
    try:
        # 查询要删除的思维导图
        mindmap = db.query(Mindmap).filter(
            Mindmap.id == mindmap_id,
            Mindmap.user_id == current_user.id
        ).first()
        
        if not mindmap:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="思维导图不存在或无权删除"
            )
        
        # 删除记录
        db.delete(mindmap)
        db.commit()
        
        return  # 204 No Content
        
    except HTTPException:
        raise
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"数据库删除失败: {str(e)}"
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"删除思维导图失败: {str(e)}"
        )