"""
Pydantic模型 - 思维导图相关
"""

from pydantic import BaseModel, validator
from typing import List, Optional

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

class MindmapUpdateRequest(BaseModel):
    """部分更新思维导图的请求模型"""
    title: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[str] = None
    is_public: Optional[bool] = None
    
    @validator('title')
    def validate_title(cls, v):
        if v is not None:
            if not v or not v.strip():
                raise ValueError('标题不能为空')
            if len(v.strip()) > 200:
                raise ValueError('标题长度不能超过200字符')
            return v.strip()
        return v

class FileGenerateRequest(BaseModel):
    """从文件生成思维导图的请求模型"""
    file_token: str
