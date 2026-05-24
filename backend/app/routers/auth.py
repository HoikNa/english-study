from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies.auth import CurrentUser, get_current_user
from app.schemas import AuthRequest, AuthResponse, User
from app.services import repository
from app.services.security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


def _auth_response(user: User) -> AuthResponse:
    return AuthResponse(user=user, user_id=user.id, access_token=create_access_token(user.id))


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


@router.post("/refresh")
def refresh(current_user: CurrentUser = Depends(get_current_user)) -> dict[str, str]:
    return {"access_token": create_access_token(current_user.id)}


@router.post("/logout", status_code=204)
def logout() -> None:
    return None
