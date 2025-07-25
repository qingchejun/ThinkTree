"""
ThinkSo 应用配置
"""

import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """应用设置"""
    
    # 基础配置
    app_name: str = "ThinkSo API"
    app_version: str = "2.0.0"
    debug: bool = False
    
    # API 配置
    secret_key: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 天
    
    # 前端配置
    next_public_api_url: str = "http://localhost:8000"
    
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
        "https://thinkso.io"
    ]
    
    # 邮件配置
    mail_username: str = os.getenv("MAIL_USERNAME", "")
    mail_password: str = os.getenv("MAIL_PASSWORD", "")
    mail_from: str = os.getenv("MAIL_FROM", "noreply@thinktree.com")
    mail_from_name: str = os.getenv("MAIL_FROM_NAME", "ThinkSo")
    mail_port: int = int(os.getenv("MAIL_PORT", "587"))
    mail_server: str = os.getenv("MAIL_SERVER", "smtp.gmail.com")
    mail_tls: bool = os.getenv("MAIL_STARTTLS", os.getenv("MAIL_TLS", "true")).lower() == "true"
    mail_ssl: bool = os.getenv("MAIL_SSL_TLS", os.getenv("MAIL_SSL", "false")).lower() == "true"
    
    # 前端URL配置 (用于邮箱验证链接)
    frontend_url: str = os.getenv("FRONTEND_URL", "https://thinkso.io")
    
    # Google reCAPTCHA 配置
    recaptcha_secret_key: str = os.getenv("RECAPTCHA_SECRET_KEY", "")
    recaptcha_score_threshold: float = float(os.getenv("RECAPTCHA_SCORE_THRESHOLD", "0.5"))

    class Config:
        """Pydantic 配置"""
        env_file = ".env"
        case_sensitive = False


# 全局设置实例
settings = Settings()