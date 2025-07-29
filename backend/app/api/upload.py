"""
文件上传 API 路由
"""

import os
import math
import uuid
import time
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

# 临时文件存储 - 使用内存缓存，生产环境可考虑使用Redis
file_cache: Dict[str, Dict] = {}

def store_file_data(user_id: int, filename: str, content: str, file_type: str) -> str:
    """
    临时存储文件数据，返回文件token
    
    Args:
        user_id: 用户ID
        filename: 文件名
        content: 解析后的文本内容
        file_type: 文件类型
        
    Returns:
        str: 文件token标识
    """
    file_token = str(uuid.uuid4())
    file_cache[file_token] = {
        'user_id': user_id,
        'filename': filename,
        'content': content,
        'file_type': file_type,
        'timestamp': time.time(),
        'expires_at': time.time() + 3600  # 1小时后过期
    }
    return file_token

def get_file_data(file_token: str, user_id: int) -> Optional[Dict]:
    """
    根据token获取文件数据
    
    Args:
        file_token: 文件token
        user_id: 用户ID（验证权限）
        
    Returns:
        Dict: 文件数据，如果不存在或已过期则返回None
    """
    if file_token not in file_cache:
        return None
    
    file_data = file_cache[file_token]
    
    # 检查是否过期
    if time.time() > file_data['expires_at']:
        del file_cache[file_token]
        return None
    
    # 检查权限
    if file_data['user_id'] != user_id:
        return None
    
    return file_data

def cleanup_expired_files():
    """清理过期的文件缓存"""
    current_time = time.time()
    expired_tokens = [
        token for token, data in file_cache.items() 
        if current_time > data['expires_at']
    ]
    for token in expired_tokens:
        del file_cache[token]

def calculate_credit_cost(text: str) -> int:
    """
    根据文本长度计算积分成本（用于直接文本输入）
    计费规则：每100个字符消耗1个积分（向上取整）
    
    Args:
        text: 输入文本
        
    Returns:
        int: 需要消耗的积分数量
    """
    text_length = len(text.strip())
    if text_length == 0:
        return 0
    # 每100个字符1积分，向上取整
    return math.ceil(text_length / 100)

def calculate_file_credit_cost(text: str) -> int:
    """
    根据文件文本长度计算积分成本（用于文件上传）
    计费规则：每500个字符消耗1个积分（向上取整）
    
    Args:
        text: 从文件解析出的文本内容
        
    Returns:
        int: 需要消耗的积分数量
    """
    text_length = len(text.strip())
    if text_length == 0:
        return 0
    # 每500个字符1积分，向上取整
    return math.ceil(text_length / 500)

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
    文件分析与成本预估
    上传文件，解析内容，计算生成思维导图所需积分，返回文件token
    """
    # 清理过期文件
    cleanup_expired_files()
    
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
        
        # 计算积分成本（使用文件专用计费规则）
        credit_cost = calculate_file_credit_cost(parsed_content)
        
        # 获取用户当前积分余额
        user_credits = CreditService.get_user_credits(db, current_user.id)
        current_balance = user_credits.balance if user_credits else 0
        
        # 存储文件数据，生成token
        file_token = store_file_data(
            user_id=current_user.id,
            filename=file.filename,
            content=parsed_content,
            file_type=file_ext
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
                "pricing_rule": "每500个字符消耗1积分（向上取整）"
            },
            "expires_in": 3600  # 1小时后过期
        })
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"文件分析失败: {str(e)}"
        )