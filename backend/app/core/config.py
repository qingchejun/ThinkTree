"""
ThinkTree 应用配置
"""

import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """应用设置"""
    
    # 基础配置
    app_name: str = "ThinkTree API"
    app_version: str = "2.0.0"
    debug: bool = False
    
    # API 配置
    secret_key: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 天
    
    # Google Gemini AI
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    
    # 数据库配置
    database_url: str = os.getenv(
        "DATABASE_URL", 
        "sqlite:///./thinktree.db"  # 本地开发默认使用 SQLite
    )
    
    # 如果是 PostgreSQL URL，确保格式正确
    @property
    def database_url_fixed(self) -> str:
        """修复 Render PostgreSQL URL 格式"""
        if self.database_url.startswith("postgres://"):
            return self.database_url.replace("postgres://", "postgresql://", 1)
        return self.database_url
    
    # 文件上传配置
    max_file_size: int = 10 * 1024 * 1024  # 10MB
    upload_dir: str = "uploads"
    allowed_file_types: list = [".txt", ".md", ".docx", ".pdf", ".srt"]
    
    # CORS 配置
    allowed_origins: list = [
        "http://localhost:3000",
        "https://thinktree-frontend.onrender.com"
    ]

    class Config:
        """Pydantic 配置"""
        env_file = ".env"
        case_sensitive = False


# 全局设置实例
settings = Settings()