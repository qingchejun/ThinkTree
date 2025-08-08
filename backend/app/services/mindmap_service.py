"""
思维导图服务层 - ThinkSo
处理与Mindmap模型相关的核心业务逻辑
"""

from typing import Optional
import uuid
from sqlalchemy.orm import Session
from uuid import UUID

from ..models.mindmap import Mindmap
from ..models.user import User
from ..api.schemas.mindmap_schemas import MindmapResponse

def get_mindmap_for_user(db: Session, mindmap_id: str, user: User) -> Optional[Mindmap]:
    """
    根据ID和用户获取思维导图，确保权限。
    这是被多个API端点重复使用的核心查询逻辑。
    """
    try:
        mindmap_uuid = uuid.UUID(str(mindmap_id))
    except Exception:
        return None

    return db.query(Mindmap).filter(
        Mindmap.id == mindmap_uuid,
        Mindmap.user_id == user.id
    ).first()

def convert_mindmap_to_response(mindmap: Mindmap) -> MindmapResponse:
    """
    将Mindmap SQLAlchemy对象转换为Pydantic响应模型。
    这是一个被多个API端点重复使用的转换逻辑。
    """
    return MindmapResponse(
        id=str(mindmap.id),
        title=mindmap.title,
        content=mindmap.content,
        description=mindmap.description,
        tags=mindmap.tags.split(',') if mindmap.tags else [],
        is_public=mindmap.is_public,
        created_at=mindmap.created_at.isoformat(),
        updated_at=mindmap.updated_at.isoformat(),
        user_id=mindmap.user_id
    )
