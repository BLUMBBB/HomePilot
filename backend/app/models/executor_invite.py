from typing import Optional
"""ExecutorInvite model."""
import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, String, ForeignKey
from sqlalchemy import Uuid as UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class ExecutorInvite(Base):
    __tablename__ = "executor_invites"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(), primary_key=True, default=uuid.uuid4
    )
    code: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    created_by_id: Mapped[uuid.UUID] = mapped_column(
        UUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    used_by_id: Mapped[uuid.Optional[UUID]] = mapped_column(
        UUID(), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    used_at: Optional[Mapped[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
