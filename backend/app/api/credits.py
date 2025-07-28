"""
积分管理 API 路由
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import Optional

from ..core.database import get_db
from ..models.user import User
from ..services.credit_service import get_credit_service
from .auth import get_current_user

router = APIRouter()


@router.get("/balance")
async def get_credit_balance(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    获取用户当前积分余额
    """
    credit_service = get_credit_service(db)
    
    balance = credit_service.get_user_credits(current_user.id)
    is_admin = credit_service.is_admin_user(current_user.id)
    
    return JSONResponse(content={
        "success": True,
        "balance": balance,
        "is_admin": is_admin,
        "user_id": current_user.id
    })


@router.get("/history")
async def get_credit_history(
    limit: int = Query(20, ge=1, le=100, description="返回记录数量"),
    offset: int = Query(0, ge=0, description="偏移量"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    获取用户积分变动历史
    """
    credit_service = get_credit_service(db)
    
    try:
        history = credit_service.get_credit_history(
            user_id=current_user.id,
            limit=limit,
            offset=offset
        )
        
        return JSONResponse(content={
            "success": True,
            "data": history,
            "pagination": {
                "limit": limit,
                "offset": offset,
                "total": len(history)
            }
        })
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"获取积分历史失败: {str(e)}"
        )


@router.get("/statistics")
async def get_credit_statistics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    获取用户积分统计信息
    """
    credit_service = get_credit_service(db)
    
    try:
        stats = credit_service.get_credit_statistics(current_user.id)
        
        return JSONResponse(content={
            "success": True,
            "data": stats
        })
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"获取积分统计失败: {str(e)}"
        )


@router.post("/estimate")
async def estimate_credits(
    text: Optional[str] = None,
    file_size: Optional[int] = None,
    file_type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    估算处理内容所需的积分
    """
    credit_service = get_credit_service(db)
    
    if text:
        # 估算文本处理积分
        estimated = credit_service.estimate_credits_for_text(text)
        content_type = "text"
        content_info = f"{len(text)} 字符"
    elif file_size and file_type:
        # 估算文件处理积分
        estimated = credit_service.estimate_credits_for_file(file_size, file_type)
        content_type = "file"
        content_info = f"{file_size} bytes, {file_type}"
    else:
        raise HTTPException(
            status_code=400,
            detail="请提供文本内容或文件信息"
        )
    
    # 检查用户当前积分是否充足
    is_sufficient, current_balance = credit_service.check_sufficient_credits(
        user_id=current_user.id,
        required_credits=estimated
    )
    
    return JSONResponse(content={
        "success": True,
        "estimated_credits": estimated,
        "content_type": content_type,
        "content_info": content_info,
        "user_balance": current_balance,
        "is_sufficient": is_sufficient,
        "shortfall": max(0, estimated - current_balance) if not is_sufficient else 0,
        "is_admin": credit_service.is_admin_user(current_user.id)
    })