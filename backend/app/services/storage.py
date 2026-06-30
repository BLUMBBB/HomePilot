"""Storage service: save visit photos (local FS)."""
import os
import uuid
from pathlib import Path

from fastapi import UploadFile

from app.config import get_settings
from app.core.exceptions import AppException

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_SIZE_MB = 10


async def save_visit_photo(
    visit_id,
    file: UploadFile,
    checklist_item_id=None,
) -> tuple[str, int | None, str | None]:
    """Save file to UPLOAD_DIR, return (file_path, file_size, content_type)."""
    if file.content_type and file.content_type not in ALLOWED_CONTENT_TYPES:
        raise AppException("Допустимые форматы: JPEG, PNG, WebP", status_code=400)
    settings = get_settings()
    size_limit = (settings.MAX_UPLOAD_SIZE_MB or MAX_SIZE_MB) * 1024 * 1024
    content = await file.read()
    if len(content) > size_limit:
        raise AppException(f"Максимальный размер файла: {settings.MAX_UPLOAD_SIZE_MB} MB", status_code=400)
    upload_dir = Path(settings.UPLOAD_DIR) / "visits" / str(visit_id)
    upload_dir.mkdir(parents=True, exist_ok=True)
    ext = Path(file.filename or "img").suffix or ".jpg"
    name = f"{uuid.uuid4().hex}{ext}"
    path = upload_dir / name
    path.write_bytes(content)
    relative = str(path.relative_to(settings.UPLOAD_DIR))
    return relative, len(content), file.content_type
