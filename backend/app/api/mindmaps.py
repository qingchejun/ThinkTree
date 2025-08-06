"""
思维导图API接口 - ThinkSo v2.2.0
处理用户思维导图的CRUD操作
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from pydantic import BaseModel, validator
from typing import List, Optional
from uuid import UUID

from ..core.database import get_db
from ..core.ai_processor import ai_processor
from ..models.mindmap import Mindmap
from ..models.user import User
from ..services.credit_service import CreditService
from ..services import mindmap_service
from .auth import get_current_user
from .schemas.mindmap_schemas import (
    MindmapCreate, MindmapResponse, MindmapUpdateRequest, FileGenerateRequest
)

router = APIRouter()


# API 端点实现
@router.post("/", response_model=MindmapResponse, status_code=status.HTTP_201_CREATED)
async def create_mindmap(
    request: Request,
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
            is_public=mindmap_data.is_public,
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
            is_public=new_mindmap.is_public,
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


@router.get("/", response_model=List[MindmapResponse])
async def get_user_mindmaps(
    request: Request,
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
        
        # 转换为完整响应格式，包含完整content用于缩略图生成
        return [
            MindmapResponse(
                id=str(mindmap.id),
                title=mindmap.title,
                content=mindmap.content,
                description=mindmap.description,
                tags=mindmap.tags.split(',') if mindmap.tags else [],
                is_public=mindmap.is_public,
                created_at=mindmap.created_at.isoformat(),
                updated_at=mindmap.updated_at.isoformat(),
                user_id=mindmap.user_id
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
    request: Request,
    mindmap_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    获取指定ID的思维导图详情
    需要JWT认证，只能获取自己的思维导图
    """
    mindmap = mindmap_service.get_mindmap_for_user(db, mindmap_id, current_user)
    
    if not mindmap:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="思维导图不存在或无权访问"
        )
    
    return mindmap_service.convert_mindmap_to_response(mindmap)


@router.put("/{mindmap_id}", response_model=MindmapResponse)
async def update_mindmap(
    request: Request,
    mindmap_id: str,
    mindmap_data: MindmapCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    更新指定ID的思维导图
    需要JWT认证，只能更新自己的思维导图
    """
    mindmap = mindmap_service.get_mindmap_for_user(db, mindmap_id, current_user)
    
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
    mindmap.is_public = mindmap_data.is_public
    
    db.commit()
    db.refresh(mindmap)
    
    return mindmap_service.convert_mindmap_to_response(mindmap)


@router.patch("/{mindmap_id}", response_model=MindmapResponse)
async def patch_mindmap(
    request: Request,
    mindmap_id: str,
    mindmap_data: MindmapUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    部分更新指定ID的思维导图（支持只更新标题等字段）
    需要JWT认证，只能更新自己的思维导图
    """
    mindmap = mindmap_service.get_mindmap_for_user(db, mindmap_id, current_user)
    
    if not mindmap:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="思维导图不存在或无权修改"
        )
    
    # 只更新提供的字段
    update_data = mindmap_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(mindmap, key, value)
    
    db.commit()
    db.refresh(mindmap)
    
    return mindmap_service.convert_mindmap_to_response(mindmap)


@router.delete("/{mindmap_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_mindmap(
    request: Request,
    mindmap_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    删除指定ID的思维导图
    需要JWT认证，只能删除自己的思维导图
    """
    mindmap = mindmap_service.get_mindmap_for_user(db, mindmap_id, current_user)
    
    if not mindmap:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="思维导图不存在或无权删除"
        )
    
    # 删除记录
    db.delete(mindmap)
    db.commit()
    
    return  # 204 No Content


# 新的请求模型
class FileGenerateRequest(BaseModel):
    """从文件生成思维导图的请求模型"""
    file_token: str


@router.post("/generate-from-file")
async def generate_from_file(
    request: Request,
    file_request: FileGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    根据文件token生成思维导图，执行完整的积分扣费流程
    """
    # 导入文件缓存函数
    from .upload import get_file_data
    
    # 获取文件数据
    file_data = get_file_data(file_request.file_token, current_user.id)
    if not file_data:
        raise HTTPException(
            status_code=404,
            detail="文件token无效、已过期或无权访问"
        )
    
    parsed_content = file_data['content']
    filename = file_data['filename']
    file_type = file_data['file_type']
    
    # 1. 使用缓存的积分成本
    credit_cost = file_data.get('credit_cost')
    if credit_cost is None:
        # 如果缓存中没有积分成本，重新计算
        from .upload import calculate_credit_cost
        credit_cost = calculate_credit_cost(parsed_content)
    
    # 2. 检查用户积分是否充足
    user_credits = CreditService.get_user_credits(db, current_user.id)
    if not user_credits or user_credits.balance < credit_cost:
        current_balance = user_credits.balance if user_credits else 0
        raise HTTPException(
            status_code=402,  # Payment Required
            detail={
                "message": "积分不足",
                "required_credits": credit_cost,
                "current_balance": current_balance,
                "text_length": len(parsed_content.strip()),
                "filename": filename
            }
        )
    
    # 3. 扣除积分
    deduct_success, deduct_error, remaining_balance = CreditService.deduct_credits(
        db, 
        current_user.id, 
        credit_cost, 
        f"文件生成思维导图 - 文件: {filename}, 文本长度: {len(parsed_content.strip())} 字符"
    )
    
    if not deduct_success:
        raise HTTPException(
            status_code=500,
            detail=f"积分扣除失败: {deduct_error}"
        )
    
    # 4. 调用AI服务生成思维导图
    try:
        # 使用统一的AI生成方法
        mindmap_result = await ai_processor.generate_mindmap_structure(
            parsed_content
        )
        
        if not mindmap_result["success"]:
            # AI生成失败，退还积分
            refund_success, refund_error, new_balance = CreditService.refund_credits(
                db,
                current_user.id,
                credit_cost,
                f"文件AI生成失败退款 - 文件: {filename}, 原因: {mindmap_result.get('error', 'Unknown error')}"
            )
            
            if not refund_success:
                print(f"严重错误: 用户 {current_user.id} 的积分退款失败: {refund_error}")
            
            raise HTTPException(
                status_code=500,
                detail=f"思维导图生成失败: {mindmap_result.get('error', 'Unknown error')}"
            )
        
        # 5. 成功生成，返回结果
        return JSONResponse(content={
            "success": True,
            "filename": filename,
            "file_type": file_type,
            "content_preview": parsed_content[:200] + "..." if len(parsed_content) > 200 else parsed_content,
            "data": mindmap_result["data"],
            "format": "markdown",
            "cost_info": {
                "credits_consumed": credit_cost,
                "remaining_credits": remaining_balance,
                "text_length": len(parsed_content.strip()),
                "pricing_rule": "每100个字符消耗1积分（向上取整）"
            }
        })
        
    except HTTPException:
        # 重新抛出HTTP异常
        raise
    except Exception as ai_error:
        # AI处理异常，退还积分
        refund_success, refund_error, new_balance = CreditService.refund_credits(
            db,
            current_user.id,
            credit_cost,
            f"文件AI处理异常退款 - 文件: {filename}, 错误: {str(ai_error)}"
        )
        
        if not refund_success:
            print(f"严重错误: 用户 {current_user.id} 的积分退款失败: {refund_error}")
        
        raise HTTPException(
            status_code=500,
            detail=f"AI处理失败: {str(ai_error)}"
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"删除思维导图失败: {str(e)}"
        )