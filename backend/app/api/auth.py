"""
用户认证 API 路由
"""

from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional

from ..core.database import get_db
from ..models.user import User
from ..models.invitation import InvitationCode
from ..utils.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_user_id_from_token,
    validate_email,
    validate_password
)
from ..utils.email_service import email_service
from ..utils.invitation_utils import validate_invitation_code, use_invitation_code

router = APIRouter()
security = HTTPBearer()


@router.post("/admin-verify")
async def admin_verify_direct(db: Session = Depends(get_db)):
    """
    直接验证管理员账户（仅用于初始化）
    """
    # 查找管理员用户
    admin_user = db.query(User).filter(User.email == "admin@thinktree.com").first()
    
    if not admin_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="管理员账户不存在"
        )
    
    if admin_user.is_verified:
        return {"success": True, "message": "管理员账户已经是验证状态"}
    
    # 直接设置为已验证
    admin_user.is_verified = True
    db.commit()
    
    return {"success": True, "message": "管理员账户验证成功"}


# Pydantic 模型用于请求验证
class UserRegister(BaseModel):
    """用户注册请求模型"""
    email: EmailStr
    password: str
    invitation_code: str
    display_name: Optional[str] = None


class UserLogin(BaseModel):
    """用户登录请求模型"""
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """用户响应模型"""
    id: int
    email: str
    display_name: Optional[str] = None
    is_active: bool
    is_verified: bool
    created_at: str


class TokenResponse(BaseModel):
    """令牌响应模型"""
    access_token: str
    token_type: str
    user: UserResponse


class VerifyEmailRequest(BaseModel):
    """邮箱验证请求模型"""
    token: str


class VerifyEmailResponse(BaseModel):
    """邮箱验证响应模型"""
    success: bool
    message: str
    user: Optional[UserResponse] = None


# 依赖注入：获取当前用户
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    从 JWT 令牌获取当前用户
    """
    token = credentials.credentials
    user_id = get_user_id_from_token(token)
    
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的访问令牌",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户不存在",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户账户已被禁用",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user


class RegisterResponse(BaseModel):
    """注册响应模型"""
    success: bool
    message: str
    user_id: Optional[int] = None
    email: str


@router.post("/register", response_model=RegisterResponse)
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """
    用户注册 - 需要邀请码，注册后发送验证邮件
    """
    # 邮箱格式验证（Pydantic EmailStr 已处理）
    if not validate_email(user_data.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="邮箱格式无效"
        )
    
    # 密码强度验证
    is_valid, error_message = validate_password(user_data.password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_message
        )
    
    # 验证邀请码
    is_code_valid, code_error, invitation = validate_invitation_code(db, user_data.invitation_code)
    if not is_code_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"邀请码无效: {code_error}"
        )
    
    # 检查邮箱是否已存在
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该邮箱已被注册"
        )
    
    try:
        # 创建新用户 (未验证状态)
        hashed_password = get_password_hash(user_data.password)
        new_user = User(
            email=user_data.email,
            password_hash=hashed_password,
            display_name=user_data.display_name,
            is_active=True,
            is_verified=False  # 需要邮箱验证
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        # 标记邀请码为已使用
        use_invitation_code(db, user_data.invitation_code, new_user.id)
        
        # 发送验证邮件
        email_sent = await email_service.send_verification_email(
            email=new_user.email,
            user_name=new_user.display_name
        )
        
        if not email_sent:
            # 邮件发送失败，但用户已创建，给出提示
            return RegisterResponse(
                success=True,
                message="注册成功，但验证邮件发送失败。请联系客服获取帮助。",
                user_id=new_user.id,
                email=new_user.email
            )
        
        return RegisterResponse(
            success=True,
            message="注册成功！请检查邮箱并点击验证链接完成账户激活。",
            user_id=new_user.id,
            email=new_user.email
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"注册失败: {str(e)}"
        )


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """
    用户登录
    """
    # 查找用户
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="邮箱或密码错误"
        )
    
    # 验证密码
    if not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="邮箱或密码错误"
        )
    
    # 检查用户状态
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户账户已被禁用"
        )
    
    # 生成访问令牌
    access_token = create_access_token(data={"sub": str(user.id)})
    
    # 构造响应
    user_response = UserResponse(
        id=user.id,
        email=user.email,
        display_name=user.display_name,
        is_active=user.is_active,
        is_verified=user.is_verified,
        created_at=user.created_at.isoformat()
    )
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=user_response
    )


@router.get("/profile", response_model=UserResponse)
async def get_profile(current_user: User = Depends(get_current_user)):
    """
    获取当前用户信息
    """
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        display_name=current_user.display_name,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        created_at=current_user.created_at.isoformat()
    )


@router.get("/verify-token")
async def verify_token(current_user: User = Depends(get_current_user)):
    """
    验证访问令牌有效性
    """
    return {
        "valid": True,
        "user_id": current_user.id,
        "email": current_user.email
    }


@router.post("/verify-email", response_model=VerifyEmailResponse)
async def verify_email(request: VerifyEmailRequest, db: Session = Depends(get_db)):
    """
    验证邮箱地址
    """
    try:
        # 验证令牌并获取邮箱
        email = email_service.verify_verification_token(request.token)
        
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="验证令牌无效或已过期"
            )
        
        # 查找用户
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="用户不存在"
            )
        
        # 检查是否已经验证过
        if user.is_verified:
            user_response = UserResponse(
                id=user.id,
                email=user.email,
                display_name=user.display_name,
                is_active=user.is_active,
                is_verified=user.is_verified,
                created_at=user.created_at.isoformat()
            )
            
            return VerifyEmailResponse(
                success=True,
                message="邮箱已经验证过了",
                user=user_response
            )
        
        # 标记为已验证
        user.is_verified = True
        db.commit()
        db.refresh(user)
        
        # 发送欢迎邮件
        try:
            await email_service.send_welcome_email(
                email=user.email,
                user_name=user.display_name
            )
        except Exception as e:
            print(f"发送欢迎邮件失败: {str(e)}")
            # 不因为欢迎邮件失败而影响验证结果
        
        # 构造响应
        user_response = UserResponse(
            id=user.id,
            email=user.email,
            display_name=user.display_name,
            is_active=user.is_active,
            is_verified=user.is_verified,
            created_at=user.created_at.isoformat()
        )
        
        return VerifyEmailResponse(
            success=True,
            message="邮箱验证成功！欢迎加入 ThinkTree！",
            user=user_response
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"邮箱验证失败: {str(e)}"
        )