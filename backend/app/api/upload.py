"""
文件上传 API 路由
"""

import os
import math
import uuid
import time
import asyncio
from pathlib import Path
from fastapi import APIRouter, File, UploadFile, HTTPException, BackgroundTasks, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.file_parser import file_parser
from app.core.ai_processor import ai_processor
from app.core.database import get_db
from app.models.user import User
from app.services.credit_service import CreditService
from app.services.cache_service import FileProcessingCache, CreditCalculationCache
from typing import Optional, Dict

router = APIRouter()

# 导入认证依赖
from .auth import get_current_user

# 请求体模型
class TextProcessRequest(BaseModel):
    text: str
    format_type: Optional[str] = "standard"

class CreditEstimateRequest(BaseModel):
    text: str

class FileGenerateRequest(BaseModel):
    file_token: str
    format_type: Optional[str] = "standard"

# 确保上传目录存在
os.makedirs(settings.upload_dir, exist_ok=True)

# 使用新的高性能缓存系统
# FileProcessingCache 和 CreditCalculationCache 已导入

def store_file_data(user_id: int, filename: str, content: str, file_type: str, 
                   credit_cost: int, ai_preprocessed_data: Optional[Dict] = None) -> str:
    """
    临时存储文件数据，返回文件token
    使用新的高性能缓存系统，包含预处理数据和积分成本缓存
    
    Args:
        user_id: 用户ID
        filename: 文件名
        content: 解析后的文本内容
        file_type: 文件类型
        credit_cost: 积分成本（已计算并缓存）
        ai_preprocessed_data: AI预处理数据
        
    Returns:
        str: 文件token标识
    """
    return FileProcessingCache.store_file_analysis(
        user_id=user_id,
        filename=filename,
        content=content,
        file_type=file_type,
        credit_cost=credit_cost,
        ai_preprocessed_data=ai_preprocessed_data
    )

def get_file_data(file_token: str, user_id: int) -> Optional[Dict]:
    """
    根据token获取文件数据
    使用新的高性能缓存系统
    
    Args:
        file_token: 文件token
        user_id: 用户ID（验证权限）
        
    Returns:
        Dict: 文件数据，如果不存在或已过期则返回None
    """
    return FileProcessingCache.get_file_analysis(file_token, user_id)

def calculate_credit_cost(text: str) -> int:
    """
    根据文本长度计算积分成本（用于直接文本输入）
    计费规则：每100个字符消耗1个积分（向上取整）
    使用缓存优化重复计算
    
    Args:
        text: 输入文本
        
    Returns:
        int: 需要消耗的积分数量
    """
    return CreditCalculationCache.calculate_text_credit_cost_cached(text)

def calculate_file_credit_cost(text: str) -> int:
    """
    根据文件文本长度计算积分成本（用于文件上传）
    计费规则：每500个字符消耗1个积分（向上取整）
    使用缓存优化重复计算
    
    Args:
        text: 从文件解析出的文本内容
        
    Returns:
        int: 需要消耗的积分数量
    """
    return CreditCalculationCache.calculate_file_credit_cost_cached(text)

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
    
    try:
        # 解析文件内容
        parsed_content = file_parser.parse_from_bytes(file_content, file.filename)
        
        if not parsed_content:
            raise HTTPException(
                status_code=400,
                detail="文件解析失败，请检查文件内容"
            )
        
        # 1. 计算积分成本（基于解析后的文本内容）
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
                    "filename": file.filename
                }
            )
        
        # 3. 扣除积分
        deduct_success, deduct_error, remaining_balance = CreditService.deduct_credits(
            db, 
            current_user.id, 
            credit_cost, 
            f"文件生成思维导图 - 文件: {file.filename}, 文本长度: {len(parsed_content.strip())} 字符"
        )
        
        if not deduct_success:
            raise HTTPException(
                status_code=500,
                detail=f"积分扣除失败: {deduct_error}"
            )
        
        # 4. 调用AI服务生成思维导图（使用try-except处理失败情况）
        try:
            mindmap_result = await ai_processor.generate_mindmap_structure(
                parsed_content, 
                format_type
            )
            
            if not mindmap_result["success"]:
                # AI生成失败，退还积分
                refund_success, refund_error, new_balance = CreditService.refund_credits(
                    db,
                    current_user.id,
                    credit_cost,
                    f"文件AI生成失败退款 - 文件: {file.filename}, 原因: {mindmap_result.get('error', 'Unknown error')}"
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
                "filename": file.filename,
                "file_type": file_ext,
                "content_preview": parsed_content[:200] + "..." if len(parsed_content) > 200 else parsed_content,
                "data": mindmap_result["data"],
                "format": "markdown",
                "cost_info": {
                    "credits_consumed": credit_cost,
                    "remaining_credits": remaining_balance,
                    "text_length": len(parsed_content.strip())
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
                f"文件AI处理异常退款 - 文件: {file.filename}, 错误: {str(ai_error)}"
            )
            
            if not refund_success:
                print(f"严重错误: 用户 {current_user.id} 的积分退款失败: {refund_error}")
            
            raise HTTPException(
                status_code=500,
                detail=f"AI处理失败: {str(ai_error)}"
            )
        
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
    包含积分检查和扣除逻辑
    """
    if not request.text.strip():
        raise HTTPException(
            status_code=400,
            detail="文本内容不能为空"
        )
    
    # 1. 计算积分成本
    credit_cost = calculate_credit_cost(request.text)
    
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
                "text_length": len(request.text.strip())
            }
        )
    
    # 3. 扣除积分
    deduct_success, deduct_error, remaining_balance = CreditService.deduct_credits(
        db, 
        current_user.id, 
        credit_cost, 
        f"生成思维导图 - 文本长度: {len(request.text.strip())} 字符"
    )
    
    if not deduct_success:
        raise HTTPException(
            status_code=500,
            detail=f"积分扣除失败: {deduct_error}"
        )
    
    # 4. 调用AI服务生成思维导图（使用try-except处理失败情况）
    try:
        mindmap_result = await ai_processor.generate_mindmap_structure(
            request.text, 
            request.format_type
        )
        
        if not mindmap_result["success"]:
            # AI生成失败，退还积分
            refund_success, refund_error, new_balance = CreditService.refund_credits(
                db,
                current_user.id,
                credit_cost,
                f"AI生成失败退款 - 原因: {mindmap_result.get('error', 'Unknown error')}"
            )
            
            if not refund_success:
                # 记录退款失败的严重错误
                print(f"严重错误: 用户 {current_user.id} 的积分退款失败: {refund_error}")
            
            raise HTTPException(
                status_code=500,
                detail=f"思维导图生成失败: {mindmap_result.get('error', 'Unknown error')}"
            )
        
        # 5. 成功生成，返回结果
        return JSONResponse(content={
            "success": True,
            "content_preview": request.text[:200] + "..." if len(request.text) > 200 else request.text,
            "data": mindmap_result["data"],
            "format": "markdown",
            "cost_info": {
                "credits_consumed": credit_cost,
                "remaining_credits": remaining_balance,
                "text_length": len(request.text.strip())
            }
        })
        
    except HTTPException:
        # 重新抛出HTTP异常（包括AI生成失败的情况）
        raise
    except Exception as e:
        # 处理其他未预期的异常，退还积分
        refund_success, refund_error, new_balance = CreditService.refund_credits(
            db,
            current_user.id,
            credit_cost,
            f"系统异常退款 - 错误: {str(e)}"
        )
        
        if not refund_success:
            print(f"严重错误: 用户 {current_user.id} 的积分退款失败: {refund_error}")
        
        raise HTTPException(
            status_code=500,
            detail=f"处理失败: {str(e)}"
        )

@router.post("/estimate-credit-cost")
async def estimate_credit_cost(
    request: CreditEstimateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    预估生成思维导图所需的积分成本
    """
    if not request.text.strip():
        return JSONResponse(content={
            "text_length": 0,
            "estimated_cost": 0,
            "user_balance": 0,
            "sufficient_credits": True
        })
    
    # 计算积分成本
    credit_cost = calculate_credit_cost(request.text)
    
    # 获取用户当前积分余额
    user_credits = CreditService.get_user_credits(db, current_user.id)
    current_balance = user_credits.balance if user_credits else 0
    
    return JSONResponse(content={
        "text_length": len(request.text.strip()),
        "estimated_cost": credit_cost,
        "user_balance": current_balance,
        "sufficient_credits": current_balance >= credit_cost,
        "pricing_rule": "每100个字符消耗1积分（向上取整）"
    })

@router.post("/upload/analyze")
async def analyze_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    文件分析与成本预估 - 优化版本
    上传文件，解析内容，预处理AI数据，计算积分成本，返回文件token
    
    优化点：
    1. 使用高性能缓存系统
    2. 异步预处理AI数据，加速后续生成
    3. 缓存积分计算结果
    """
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
    
    try:
        # 1. 解析文件内容
        parsed_content = file_parser.parse_from_bytes(file_content, file.filename)
        
        if not parsed_content:
            raise HTTPException(
                status_code=400,
                detail="文件解析失败，请检查文件内容"
            )
        
        # 2. 计算积分成本（使用缓存优化）
        credit_cost = calculate_file_credit_cost(parsed_content)
        
        # 3. 获取用户当前积分余额
        user_credits = CreditService.get_user_credits(db, current_user.id)
        current_balance = user_credits.balance if user_credits else 0
        
        # 4. 异步预处理AI数据（关键优化：在分析阶段就准备AI需要的数据）
        ai_preprocessed_data = None
        try:
            # 这个异步操作可以在后台进行，不阻塞响应
            ai_preprocessed_data = await FileProcessingCache.preprocess_for_ai(
                parsed_content, "standard"
            )
        except Exception as e:
            print(f"AI预处理警告: {e}")  # 预处理失败不影响主流程
        
        # 5. 存储文件数据到高性能缓存，包含预处理结果和积分成本
        file_token = store_file_data(
            user_id=current_user.id,
            filename=file.filename,
            content=parsed_content,
            file_type=file_ext,
            credit_cost=credit_cost,
            ai_preprocessed_data=ai_preprocessed_data
        )
        
        return JSONResponse(content={
            "success": True,
            "file_token": file_token,
            "filename": file.filename,
            "file_type": file_ext,
            "content_preview": parsed_content[:200] + "..." if len(parsed_content) > 200 else parsed_content,
            "analysis": {
                "text_length": len(parsed_content.strip()),
                "estimated_cost": credit_cost,
                "user_balance": current_balance,
                "sufficient_credits": current_balance >= credit_cost,
                "pricing_rule": "每500个字符消耗1积分（向上取整）",
                "has_ai_preprocessing": ai_preprocessed_data is not None
            },
            "expires_in": 3600  # 1小时后过期
        })
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"文件分析失败: {str(e)}"
        )