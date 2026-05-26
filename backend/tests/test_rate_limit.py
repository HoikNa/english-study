import pytest
from fastapi import HTTPException

from app.services.rate_limit import check_rate_limit, reset_rate_limits_for_tests


def test_rate_limit_blocks_after_max_requests():
    reset_rate_limits_for_tests()

    check_rate_limit("user:test", now=100, window_seconds=60, max_requests=2)
    check_rate_limit("user:test", now=101, window_seconds=60, max_requests=2)

    with pytest.raises(HTTPException) as exc:
        check_rate_limit("user:test", now=102, window_seconds=60, max_requests=2)

    assert exc.value.status_code == 429
    assert exc.value.headers["Retry-After"] == "58"


def test_rate_limit_allows_after_window_rolls_forward():
    reset_rate_limits_for_tests()

    check_rate_limit("ip:127.0.0.1", now=100, window_seconds=60, max_requests=2)
    check_rate_limit("ip:127.0.0.1", now=101, window_seconds=60, max_requests=2)
    check_rate_limit("ip:127.0.0.1", now=161, window_seconds=60, max_requests=2)


def test_rate_limit_can_be_disabled_for_tests_or_local_ops():
    reset_rate_limits_for_tests()

    for index in range(10):
        check_rate_limit("user:disabled", now=100 + index, window_seconds=60, max_requests=0)
