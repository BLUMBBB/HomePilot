"""Простой in-memory rate limiter по IP и маршруту."""
from collections import defaultdict, deque
from dataclasses import dataclass
from threading import Lock
from time import time


@dataclass(frozen=True)
class RateLimitRule:
    path: str
    limit: int


class InMemoryRateLimiter:
    def __init__(self, window_seconds: int):
        self.window_seconds = window_seconds
        self._buckets: dict[tuple[str, str], deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def is_allowed(self, key: tuple[str, str], limit: int) -> bool:
        now = time()
        threshold = now - self.window_seconds
        with self._lock:
            bucket = self._buckets[key]
            while bucket and bucket[0] < threshold:
                bucket.popleft()
            if len(bucket) >= limit:
                return False
            bucket.append(now)
            return True
