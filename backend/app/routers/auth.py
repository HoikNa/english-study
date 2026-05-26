from uuid import uuid4
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies.auth import CurrentUser, get_current_user
from app.schemas import AccountExport, AuthRequest, AuthResponse, RefreshRequest, User
from app.services import repository
from app.services.security import (
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    hash_password,
    hash_token,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])


def _auth_response(user: User) -> AuthResponse:
    refresh_token, _ = _issue_refresh_token(user.id)
    return AuthResponse(
        user=user,
        user_id=user.id,
        access_token=create_access_token(user.id),
        refresh_token=refresh_token,
    )


def _issue_refresh_token(user_id: str) -> tuple[str, str]:
    token_id = str(uuid4())
    token = create_refresh_token(user_id, token_id=token_id)
    payload = decode_refresh_token(token)
    expires_at = datetime.fromtimestamp(int(payload["exp"]), timezone.utc).isoformat()
    repository.store_refresh_token(
        token_id=token_id,
        user_id=user_id,
        token_hash=hash_token(token),
        expires_at=expires_at,
    )
    return token, token_id


@router.post("/register", status_code=201, response_model=AuthResponse)
def register(payload: AuthRequest) -> AuthResponse:
    user = repository.create_user(
        user_id=str(uuid4()),
        email=payload.email,
        nickname=payload.nickname or payload.email.split("@")[0],
        password_hash=hash_password(payload.password),
    )
    return _auth_response(user)


@router.post("/login", response_model=AuthResponse)
def login(payload: AuthRequest) -> AuthResponse:
    row = repository.get_user_by_email(payload.email)
    if not row or not verify_password(payload.password, row["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    user = User(id=row["id"], email=row["email"], nickname=row["nickname"], level=3)
    return _auth_response(user)


@router.get("/me", response_model=User)
def me(current_user: CurrentUser = Depends(get_current_user)) -> User:
    return User(id=current_user.id, email=current_user.email, nickname=current_user.nickname, level=3)


@router.get("/me/export", response_model=AccountExport)
def export_me(current_user: CurrentUser = Depends(get_current_user)) -> AccountExport:
    user = User(id=current_user.id, email=current_user.email, nickname=current_user.nickname, level=3)
    return AccountExport(
        user=user,
        sessions=repository.list_sessions(user_id=current_user.id),
        review_queue=repository.list_review_queue(user_id=current_user.id),
    )


@router.post("/refresh")
def refresh(payload: RefreshRequest) -> dict[str, str]:
    try:
        token_payload = decode_refresh_token(payload.refresh_token)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token") from exc

    user_id = token_payload.get("sub")
    token_id = token_payload.get("jti")
    if not isinstance(user_id, str) or not isinstance(token_id, str) or not repository.get_user_by_id(user_id):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    if not repository.is_refresh_token_active(token_id, hash_token(payload.refresh_token)):
        repository.revoke_user_refresh_tokens(user_id)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    refresh_token, next_token_id = _issue_refresh_token(user_id)
    repository.revoke_refresh_token(token_id, replaced_by_token_id=next_token_id)

    return {"access_token": create_access_token(user_id), "refresh_token": refresh_token, "token_type": "bearer"}


@router.post("/logout", status_code=204)
def logout(current_user: CurrentUser = Depends(get_current_user)) -> None:
    repository.revoke_user_refresh_tokens(current_user.id)
    return None


@router.delete("/me", status_code=204)
def delete_me(current_user: CurrentUser = Depends(get_current_user)) -> None:
    deleted = repository.delete_user_account(current_user.id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return None
