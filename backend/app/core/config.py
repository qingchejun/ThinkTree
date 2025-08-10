"""
ThinkSo 应用配置
"""

import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# 优先加载 .env.local，并覆盖现有环境变量，确保本地开发环境的正确性
# 这个文件在生产环境中不存在，因此不会影响生产部署
load_dotenv(dotenv_path='.env', override=True)
load_dotenv(dotenv_path='.env.local', override=True)

class Settings(BaseSettings):
    class Config:
        env_file = ('.env.local', '.env')
        env_file_encoding = 'utf-8'
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
    frontend_url: str = os.getenv("FRONTEND_URL", "https://thinkso.io")
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
    
    # Resend 邮件服务配置
    resend_api_key: str = os.getenv("RESEND_API_KEY", "")
    mail_from: str = os.getenv("MAIL_FROM", "noreply@thinkso.io")
    mail_from_name: str = os.getenv("MAIL_FROM_NAME", "ThinkSo")
    
    # 前端URL配置 (用于邮箱验证链接)
    frontend_url: str = os.getenv("FRONTEND_URL", "https://thinkso.io")
    
    # Google reCAPTCHA 配置
    recaptcha_secret_key: str = os.getenv("RECAPTCHA_SECRET_KEY", "")
    recaptcha_score_threshold: float = float(os.getenv("RECAPTCHA_SCORE_THRESHOLD", "0.5"))
    
    # Google OAuth 配置
    google_client_id: str = os.getenv("GOOGLE_CLIENT_ID", "")
    google_client_secret: str = os.getenv("GOOGLE_CLIENT_SECRET", "")

    # 推荐系统参数
    referral_bonus_per_signup: int = int(os.getenv("REFERRAL_BONUS_PER_SIGNUP", "100"))
    referral_max_total_bonus: int = int(os.getenv("REFERRAL_MAX_TOTAL_BONUS", "3000"))

    class Config:
        """Pydantic 配置"""
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"  # 忽略额外的环境变量


# 全局设置实例
settings = Settings()

# 🔍 关键诊断信息：打印应用实际使用的数据库URL（不触发连接）
print("=" * 80)
print("---DIAGNOSTIC-INFO--- DATABASE_URL being used is:")
print(f"原始环境变量: {settings.database_url}")
print(f"修复后的URL: {settings.database_url_fixed}")

# 分析数据库URL问题
if "dpg-" in settings.database_url:
    print("⚠️  检测到 Render 内部数据库主机名，这可能是问题根源")
    print("   建议检查 Render 数据库配置是否使用了外部连接字符串")
    
print("=" * 80)