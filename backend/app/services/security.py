from __future__ import annotations

import base64
import hashlib
import hmac
import json
import secrets
from datetime import timedelta
from uuid import uuid4

from app.config import get_settings
from app.schemas import utc_now


def _base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _base64url_decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 210_000)
    return f"pbkdf2_sha256${salt}${digest.hex()}"


def verify_password(password: str, password_hash: str | None) -> bool:
    if not password_hash:
        return False

    try:
        algorithm, salt, expected_hex = password_hash.split("$", 2)
    except ValueError:
        return False

    if algorithm != "pbkdf2_sha256":
        return False

    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 210_000)
    return hmac.compare_digest(digest.hex(), expected_hex)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _create_token(subject: str, token_type: str, expire_minutes: int, token_id: str | None = None) -> str:
    settings = get_settings()
    now = utc_now()
    header = {"alg": settings.jwt_algorithm, "typ": "JWT"}
    payload = {
        "sub": subject,
        "type": token_type,
        "jti": token_id or str(uuid4()),
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=expire_minutes)).timestamp()),
    }

    signing_input = ".".join(
        [
            _base64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8")),
            _base64url_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8")),
        ]
    )
    signature = hmac.new(settings.jwt_secret.encode("utf-8"), signing_input.encode("ascii"), hashlib.sha256).digest()
    return f"{signing_input}.{_base64url_encode(signature)}"


def create_access_token(subject: str) -> str:
    settings = get_settings()
    return _create_token(subject, "access", settings.jwt_expire_minutes)


def create_refresh_token(subject: str, token_id: str | None = None) -> str:
    settings = get_settings()
    return _create_token(subject, "refresh", settings.jwt_refresh_expire_minutes, token_id)


def decode_token(token: str, expected_type: str = "access") -> dict:
    settings = get_settings()
    try:
        header_b64, payload_b64, signature_b64 = token.split(".", 2)
        signing_input = f"{header_b64}.{payload_b64}"
        expected_signature = hmac.new(
            settings.jwt_secret.encode("utf-8"),
            signing_input.encode("ascii"),
            hashlib.sha256,
        ).digest()
        signature = _base64url_decode(signature_b64)
        if not hmac.compare_digest(signature, expected_signature):
            raise ValueError("Invalid token signature")

        header = json.loads(_base64url_decode(header_b64))
        if header.get("alg") != settings.jwt_algorithm:
            raise ValueError("Unsupported token algorithm")

        payload = json.loads(_base64url_decode(payload_b64))
        if payload.get("type") != expected_type:
            raise ValueError("Invalid token type")
        if int(payload.get("exp", 0)) < int(utc_now().timestamp()):
            raise ValueError("Token expired")
        return payload
    except Exception as exc:
        raise ValueError("Invalid access token") from exc


def decode_access_token(token: str) -> dict:
    return decode_token(token, "access")


def decode_refresh_token(token: str) -> dict:
    return decode_token(token, "refresh")
