"""
思维导图相关 API 路由
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from typing import Dict, Any, List
import uuid
from datetime import datetime

router = APIRouter()

# 临时内存存储（后续会替换为数据库）
mindmaps_storage = {}

@router.post("/mindmaps")
async def create_mindmap(mindmap_data: Dict[str, Any]):
    """创建新的思维导图"""
    try:
        mindmap_id = str(uuid.uuid4())
        mindmap = {
            "id": mindmap_id,
            "title": mindmap_data.get("title", "未命名思维导图"),
            "content": mindmap_data.get("content", {}),
            "format_type": mindmap_data.get("format", "tree"),
            "is_public": mindmap_data.get("is_public", False),
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        mindmaps_storage[mindmap_id] = mindmap
        
        return JSONResponse(content={
            "success": True,
            "mindmap": mindmap
        })
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"创建思维导图失败: {str(e)}"
        )

@router.get("/mindmaps/{mindmap_id}")
async def get_mindmap(mindmap_id: str):
    """获取指定思维导图"""
    if mindmap_id not in mindmaps_storage:
        raise HTTPException(
            status_code=404,
            detail="思维导图不存在"
        )
    
    return JSONResponse(content={
        "success": True,
        "mindmap": mindmaps_storage[mindmap_id]
    })

@router.put("/mindmaps/{mindmap_id}")
async def update_mindmap(mindmap_id: str, mindmap_data: Dict[str, Any]):
    """更新思维导图"""
    if mindmap_id not in mindmaps_storage:
        raise HTTPException(
            status_code=404,
            detail="思维导图不存在"
        )
    
    try:
        mindmap = mindmaps_storage[mindmap_id]
        
        # 更新字段
        if "title" in mindmap_data:
            mindmap["title"] = mindmap_data["title"]
        if "content" in mindmap_data:
            mindmap["content"] = mindmap_data["content"]
        if "format_type" in mindmap_data:
            mindmap["format_type"] = mindmap_data["format_type"]
        if "is_public" in mindmap_data:
            mindmap["is_public"] = mindmap_data["is_public"]
        
        mindmap["updated_at"] = datetime.now().isoformat()
        
        mindmaps_storage[mindmap_id] = mindmap
        
        return JSONResponse(content={
            "success": True,
            "mindmap": mindmap
        })
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"更新思维导图失败: {str(e)}"
        )

@router.delete("/mindmaps/{mindmap_id}")
async def delete_mindmap(mindmap_id: str):
    """删除思维导图"""
    if mindmap_id not in mindmaps_storage:
        raise HTTPException(
            status_code=404,
            detail="思维导图不存在"
        )
    
    del mindmaps_storage[mindmap_id]
    
    return JSONResponse(content={
        "success": True,
        "message": "思维导图已删除"
    })

@router.get("/mindmaps")
async def list_mindmaps():
    """获取所有思维导图列表"""
    mindmaps_list = list(mindmaps_storage.values())
    
    return JSONResponse(content={
        "success": True,
        "mindmaps": mindmaps_list,
        "total": len(mindmaps_list)
    })