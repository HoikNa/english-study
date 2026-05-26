from collections import defaultdict, deque
from time import monotonic
from typing import Callable

from fastapi import HTTPException, Request, status

from app.config import get_settings
from app.services.security import decode_access_token

Clock = Callable[[], float]

_request_log: dict[str, deque[float]] = defaultdict(deque)


def _client_identifier(request: Request) -> str:
    auth_header = request.headers.get("authorization", "")
    scheme, _, token = auth_header.partition(" ")
    if scheme.lower() == "bearer" and token:
        try:
            payload = decode_access_token(token)
            subject = payload.get("sub")
            if isinstance(subject, str) and subject:
                return f"user:{subject}"
        except ValueError:
            pass

    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return f"ip:{forwarded_for.split(',')[0].strip()}"

    host = request.client.host if request.client else "unknown"
    return f"ip:{host}"


def check_rate_limit(
    identifier: str,
    *,
    now: float,
    window_seconds: int,
    max_requests: int,
) -> None:
    if window_seconds <= 0 or max_requests <= 0:
        return

    cutoff = now - window_seconds
    entries = _request_log[identifier]
    while entries and entries[0] <= cutoff:
        entries.popleft()

    if len(entries) >= max_requests:
        retry_after = max(1, int(window_seconds - (now - entries[0])))
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"AI request limit exceeded. Please retry after {retry_after} seconds.",
            headers={"Retry-After": str(retry_after)},
        )

    entries.append(now)


def ai_rate_limit(request: Request) -> None:
    settings = get_settings()
    check_rate_limit(
        _client_identifier(request),
        now=monotonic(),
        window_seconds=settings.ai_rate_limit_window_seconds,
        max_requests=settings.ai_rate_limit_max_requests,
    )


def reset_rate_limits_for_tests() -> None:
    _request_log.clear()
