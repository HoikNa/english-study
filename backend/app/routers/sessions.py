from fastapi import APIRouter, Depends, Query

from app.dependencies.auth import CurrentUser, get_current_user
from app.schemas import Session, SessionCreate, SessionPage
from app.services import repository

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.post("", status_code=201, response_model=Session)
def create_session(payload: SessionCreate, current_user: CurrentUser = Depends(get_current_user)) -> Session:
    return repository.create_session(Session(**payload.model_dump()), user_id=current_user.id)


@router.get("", response_model=SessionPage)
def list_sessions(
    expression_id: str | None = None,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: CurrentUser = Depends(get_current_user),
) -> SessionPage:
    items = repository.list_sessions(expression_id, user_id=current_user.id)
    return SessionPage(items=items[skip: skip + limit], total=len(items))
