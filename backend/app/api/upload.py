"""
文件上传 API 路由
"""

import os
from pathlib import Path
from fastapi import APIRouter, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from app.core.config import settings
from app.core.file_parser import file_parser
from app.core.ai_processor import ai_processor
from typing import Optional

router = APIRouter()

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
    format_type: str = "standard"
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
        
        # 生成思维导图结构
        mindmap_result = await ai_processor.generate_mindmap_structure(
            parsed_content, 
            format_type
        )
        
        if not mindmap_result["success"]:
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
            "format": "markdown"
        })
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"处理失败: {str(e)}"
        )

@router.post("/process-text")
async def process_text(request: TextProcessRequest):
    """
    直接处理文本内容生成思维导图
    """
    if not request.text.strip():
        raise HTTPException(
            status_code=400,
            detail="文本内容不能为空"
        )
    
    try:
        # 生成思维导图结构
        mindmap_result = await ai_processor.generate_mindmap_structure(
            request.text, 
            request.format_type
        )
        
        if not mindmap_result["success"]:
            raise HTTPException(
                status_code=500,
                detail=f"思维导图生成失败: {mindmap_result.get('error', 'Unknown error')}"
            )
        
        return JSONResponse(content={
            "success": True,
            "content_preview": request.text[:200] + "..." if len(request.text) > 200 else request.text,
            "data": mindmap_result["data"],
            "format": "markdown"
        })
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"处理失败: {str(e)}"
        )