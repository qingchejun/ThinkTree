"""
思维导图服务层 - 负责业务逻辑与数据访问，便于单元测试
"""

from __future__ import annotations

import base64
import uuid
from dataclasses import dataclass
from datetime import datetime
from typing import List, Optional, Tuple

from sqlalchemy import and_, desc, or_
from sqlalchemy.orm import Session

from ..models.mindmap import Mindmap
from ..models.user import User
from ..api.schemas.mindmap_schemas import MindmapResponse


def _encode_cursor(updated_at: datetime, obj_id: uuid.UUID) -> str:
    raw = f"{updated_at.isoformat()}|{str(obj_id)}".encode("utf-8")
    return base64.urlsafe_b64encode(raw).decode("utf-8")


def _decode_cursor(cursor: str) -> Optional[Tuple[datetime, uuid.UUID]]:
    try:
        raw = base64.urlsafe_b64decode(cursor.encode("utf-8")).decode("utf-8")
        updated_at_str, id_str = raw.split("|", 1)
        return datetime.fromisoformat(updated_at_str), uuid.UUID(id_str)
    except Exception:
        return None


class MindmapService:
    """面向用例的服务类。通过依赖注入提供 db 会话。"""

    def __init__(self, db: Session):
        self.db = db

    # 查询/读取
    def get_for_user(self, mindmap_id: str, user: User) -> Optional[Mindmap]:
        try:
            mindmap_uuid = uuid.UUID(str(mindmap_id))
        except Exception:
            return None

        return (
            self.db.query(Mindmap)
            .filter(Mindmap.id == mindmap_uuid, Mindmap.user_id == user.id)
            .first()
        )

    def list_for_user_paginated(
        self, *, user_id: int, limit: int = 20, cursor: Optional[str] = None
    ) -> Tuple[List[Mindmap], Optional[str], bool]:
        """
        游标分页：按 updated_at DESC, id DESC 稳定排序。
        返回 (items, next_cursor, has_next)。
        """
        limit = max(1, min(limit, 100))

        q = self.db.query(Mindmap).filter(Mindmap.user_id == user_id)

        # 排序：updated_at desc, id desc
        q = q.order_by(desc(Mindmap.updated_at), desc(Mindmap.id))

        if cursor:
            decoded = _decode_cursor(cursor)
            if decoded:
                cur_updated_at, cur_id = decoded
                # 取严格小于当前游标（避免重复）
                q = q.filter(
                    or_(
                        Mindmap.updated_at < cur_updated_at,
                        and_(Mindmap.updated_at == cur_updated_at, Mindmap.id < cur_id),
                    )
                )

        items = q.limit(limit + 1).all()

        has_next = len(items) > limit
        if has_next:
            items = items[:limit]
            last = items[-1]
            next_cursor = _encode_cursor(last.updated_at, last.id)
        else:
            next_cursor = None

        return items, next_cursor, has_next

    # 写入/修改
    def create(self, *, user: User, title: str, content: str, description: Optional[str], tags: Optional[str], is_public: bool) -> Mindmap:
        mindmap = Mindmap(
            title=title.strip(),
            content=content,
            description=(description or None),
            tags=(tags or None),
            is_public=bool(is_public),
            user_id=user.id,
        )
        self.db.add(mindmap)
        self.db.commit()
        self.db.refresh(mindmap)
        return mindmap

    def update_full(self, *, mindmap: Mindmap, title: str, content: str, description: Optional[str], tags: Optional[str], is_public: bool) -> Mindmap:
        mindmap.title = title.strip()
        mindmap.content = content
        mindmap.description = description
        mindmap.tags = tags
        mindmap.is_public = bool(is_public)
        self.db.commit()
        self.db.refresh(mindmap)
        return mindmap

    def patch(self, *, mindmap: Mindmap, updates: dict) -> Mindmap:
        for key, value in updates.items():
            setattr(mindmap, key, value)
        self.db.commit()
        self.db.refresh(mindmap)
        return mindmap

    def delete(self, *, mindmap: Mindmap) -> None:
        self.db.delete(mindmap)
        self.db.commit()


def convert_mindmap_to_response(mindmap: Mindmap) -> MindmapResponse:
    return MindmapResponse(
        id=str(mindmap.id),
        title=mindmap.title,
        content=mindmap.content,
        description=mindmap.description,
        tags=mindmap.tags.split(',') if mindmap.tags else [],
        is_public=mindmap.is_public,
        created_at=mindmap.created_at.isoformat(),
        updated_at=mindmap.updated_at.isoformat(),
        user_id=mindmap.user_id,
    )


# 兼容旧函数名（避免大量改动）
def get_mindmap_for_user(db: Session, mindmap_id: str, user: User) -> Optional[Mindmap]:
    return MindmapService(db).get_for_user(mindmap_id, user)