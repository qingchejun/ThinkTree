"""
配置管理模块
"""

import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    """应用配置类"""
    
    # 基础配置
    PROJECT_NAME: str = "ThinkTree"
    VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # API 配置
    API_V1_PREFIX: str = "/api"
    
    # Google Gemini API 配置
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY")
    
    # 数据库配置
    DATABASE_URL: Optional[str] = os.getenv("DATABASE_URL", "sqlite:///./thinktree.db")
    
    # JWT 配置
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # 文件上传配置
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    UPLOAD_DIR: str = "./uploads"
    ALLOWED_FILE_TYPES: list = [".txt", ".md", ".docx", ".pdf", ".srt"]
    
    # CORS配置
    ALLOWED_HOSTS: list = ["*"]
    
    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "ignore"  # 忽略额外字段

# 创建全局设置实例
settings = Settings()