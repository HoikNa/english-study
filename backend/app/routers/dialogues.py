from fastapi import APIRouter

from app.schemas import Dialogue
from app.services import repository

router = APIRouter(prefix="/dialogues", tags=["dialogues"])


@router.get("/today", response_model=Dialogue)
def get_today_dialogue() -> Dialogue:
    return repository.pick_today_dialogue()


@router.get("/{dialogue_id}", response_model=Dialogue)
def get_dialogue(dialogue_id: str) -> Dialogue:
    return repository.get_dialogue(dialogue_id)


@router.get("", response_model=list[Dialogue])
def list_dialogues() -> list[Dialogue]:
    return repository.list_dialogues()
