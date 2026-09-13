from collections import defaultdict, deque
from time import monotonic

from fastapi import Request
from fastapi.responses import JSONResponse

from flycatch_api.config import settings


class SlidingWindowLimiter:
    def __init__(self) -> None:
        self._hits: dict[str, deque[float]] = defaultdict(deque)

    def allow(self, key: str, limit: int, window_seconds: int) -> bool:
        now = monotonic()
        bucket = self._hits[key]
        cutoff = now - window_seconds
        while bucket and bucket[0] <= cutoff:
            bucket.popleft()
        if len(bucket) >= limit:
            return False
        bucket.append(now)
        return True


limiter = SlidingWindowLimiter()


async def public_write_rate_limit(request: Request, call_next):
    if request.method in {"POST", "PUT", "PATCH", "DELETE"} and request.url.path.startswith(
        "/api/v1/public/"
    ):
        client = request.client.host if request.client else "unknown"
        if not limiter.allow(
            f"{client}:{request.url.path}",
            settings.public_write_rate_limit,
            settings.public_write_rate_window_seconds,
        ):
            return JSONResponse(
                status_code=429,
                content={"code": "rate_limited", "message_key": "public.rate_limited"},
            )
    return await call_next(request)
