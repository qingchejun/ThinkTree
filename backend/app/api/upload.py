"""
文件上传 API 路由
"""

import os
from pathlib import Path
from fastapi import APIRouter, File, UploadFile, HTTPException, BackgroundTasks, Depends, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.file_parser import file_parser
from app.core.ai_processor import ai_processor
from app.core.database import get_db
from app.models.user import User
from app.services.credit_service import get_credit_service
from app.models.credit_history import CreditReason
from typing import Optional

router = APIRouter()

# 导入认证依赖
from .auth import get_current_user

# 请求体模型
class TextProcessRequest(BaseModel):
    text: str
    format_type: Optional[str] = "standard"

# 确保上传目录存在
os.makedirs(settings.upload_dir, exist_ok=True)

@router.post("/upload")
async def upload_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    format_type: str = "standard",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    文件上传和处理API
    支持的格式: txt, md, docx, pdf, srt
    """
    # 添加调试日志
    import logging
    logger = logging.getLogger(__name__)
    
    logger.debug(f"🔍 DEBUG: 开始处理文件上传 - 用户ID: {current_user.id}, 用户邮箱: {current_user.email}")
    logger.debug(f"🔍 DEBUG: 当前用户对象 - credits: {current_user.credits}, is_active: {current_user.is_active}")
    
    # 初始化积分服务
    credit_service = get_credit_service(db)
    
    # 验证文件类型
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in settings.allowed_file_types:
        raise HTTPException(
            status_code=400,
            detail=f"不支持的文件类型: {file_ext}。支持的类型: {', '.join(settings.allowed_file_types)}"
        )
    
    # 验证文件大小
    file_content = await file.read()
    if len(file_content) > settings.max_file_size:
        raise HTTPException(
            status_code=400,
            detail=f"文件过大。最大支持 {settings.max_file_size // (1024*1024)} MB"
        )
    
    logger.debug(f"🔍 DEBUG: 文件验证通过 - 文件名: {file.filename}, 类型: {file_ext}, 大小: {len(file_content)} bytes")
    
    # ========== 积分系统集成 ==========
    # 1. 估算所需积分
    required_credits = credit_service.estimate_credits_for_file(
        file_size=len(file_content),
        file_type=file.content_type or file_ext
    )
    
    logger.debug(f"🔍 DEBUG: 积分估算完成 - 需要积分: {required_credits}")
    
    # 2. 检查积分是否充足
    is_sufficient, current_balance = credit_service.check_sufficient_credits(
        user_id=current_user.id, 
        required_credits=required_credits
    )
    
    logger.debug(f"🔍 DEBUG: 积分检查完成 - 充足: {is_sufficient}, 余额: {current_balance}")
    
    # 3. 如果不是管理员且积分不足，返回错误
    is_admin = credit_service.is_admin_user(current_user.id)
    logger.debug(f"🔍 DEBUG: 管理员检查 - 是否管理员: {is_admin}")
    
    if not is_admin and not is_sufficient:
        error_detail = {
            "error": "积分不足",
            "message": f"处理此文件需要 {required_credits} 积分，当前余额：{current_balance} 积分",
            "required_credits": required_credits,
            "current_balance": current_balance,
            "shortfall": required_credits - current_balance,
            "user_id": current_user.id,
            "user_email": current_user.email
        }
        logger.error(f"❌ DEBUG: 积分不足错误 - {error_detail}")
        
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=error_detail
        )
    
    try:
        # 解析文件内容
        parsed_content = file_parser.parse_from_bytes(file_content, file.filename)
        
        if not parsed_content:
            raise HTTPException(
                status_code=400,
                detail="文件解析失败，请检查文件内容"
            )
        
        # 4. 扣除积分（在AI处理前）
        deduct_success, deduct_message, balance_after = credit_service.deduct_credits(
            user_id=current_user.id,
            amount=required_credits,
            reason=CreditReason.PROCESS_FILE,
            description=f"处理文件: {file.filename} ({file_ext}, {len(file_content)} bytes)",
            related_id=f"file_{file.filename}_{current_user.id}"
        )
        
        if not deduct_success:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail={
                    "error": "积分扣除失败",
                    "message": deduct_message,
                    "required_credits": required_credits
                }
            )
        
        # 5. 生成思维导图结构（积分已扣除）
        mindmap_result = await ai_processor.generate_mindmap_structure(
            parsed_content, 
            format_type
        )
        
        if not mindmap_result["success"]:
            # AI处理失败，考虑退还积分（可选）
            # 这里可以添加退还积分的逻辑
            raise HTTPException(
                status_code=500,
                detail=f"思维导图生成失败: {mindmap_result.get('error', 'Unknown error')}"
            )
        
        return JSONResponse(content={
            "success": True,
            "filename": file.filename,
            "file_type": file_ext,
            "content_preview": parsed_content[:200] + "..." if len(parsed_content) > 200 else parsed_content,
            "data": mindmap_result["data"],
            "format": "markdown",
            # 积分相关信息
            "credits_info": {
                "consumed": required_credits,
                "balance_after": balance_after,
                "is_admin": credit_service.is_admin_user(current_user.id)
            }
        })
        
    except HTTPException:
        # 重新抛出HTTP异常
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"处理失败: {str(e)}"
        )

@router.post("/process-text")
async def process_text(
    request: TextProcessRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    直接处理文本内容生成思维导图
    """
    if not request.text.strip():
        raise HTTPException(
            status_code=400,
            detail="文本内容不能为空"
        )
    
    # 初始化积分服务
    credit_service = get_credit_service(db)
    
    # ========== 积分系统集成 ==========
    # 1. 估算所需积分
    required_credits = credit_service.estimate_credits_for_text(request.text)
    
    # 2. 检查积分是否充足
    is_sufficient, current_balance = credit_service.check_sufficient_credits(
        user_id=current_user.id, 
        required_credits=required_credits
    )
    
    # 3. 如果不是管理员且积分不足，返回错误
    if not credit_service.is_admin_user(current_user.id) and not is_sufficient:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail={
                "error": "积分不足",
                "message": f"处理此文本需要 {required_credits} 积分，当前余额：{current_balance} 积分",
                "required_credits": required_credits,
                "current_balance": current_balance,
                "shortfall": required_credits - current_balance
            }
        )
    
    try:
        # 4. 扣除积分（在AI处理前）
        deduct_success, deduct_message, balance_after = credit_service.deduct_credits(
            user_id=current_user.id,
            amount=required_credits,
            reason=CreditReason.PROCESS_TEXT,
            description=f"处理文本内容 ({len(request.text)} 字符)",
            related_id=f"text_{current_user.id}_{len(request.text)}"
        )
        
        if not deduct_success:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail={
                    "error": "积分扣除失败",
                    "message": deduct_message,
                    "required_credits": required_credits
                }
            )
        
        # 5. 生成思维导图结构（积分已扣除）
        mindmap_result = await ai_processor.generate_mindmap_structure(
            request.text, 
            request.format_type
        )
        
        if not mindmap_result["success"]:
            # AI处理失败，考虑退还积分（可选）
            # 这里可以添加退还积分的逻辑
            raise HTTPException(
                status_code=500,
                detail=f"思维导图生成失败: {mindmap_result.get('error', 'Unknown error')}"
            )
        
        return JSONResponse(content={
            "success": True,
            "content_preview": request.text[:200] + "..." if len(request.text) > 200 else request.text,
            "data": mindmap_result["data"],
            "format": "markdown",
            # 积分相关信息
            "credits_info": {
                "consumed": required_credits,
                "balance_after": balance_after,
                "is_admin": credit_service.is_admin_user(current_user.id)
            }
        })
        
    except HTTPException:
        # 重新抛出HTTP异常
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"处理失败: {str(e)}"
        )