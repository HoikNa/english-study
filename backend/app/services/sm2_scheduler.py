from datetime import datetime, timedelta, timezone
from dataclasses import dataclass


@dataclass(frozen=True)
class Sm2Result:
    grade: int
    repetition: int
    interval: int
    ef: float
    next_review_at: str


def score_to_grade(score: float) -> int:
    if score >= 90:
        return 5
    if score >= 80:
        return 4
    if score >= 70:
        return 3
    if score >= 60:
        return 2
    return 1


def calculate_sm2(score: float, repetition: int, interval: int, ef: float, now: datetime | None = None) -> Sm2Result:
    current = now or datetime.now(timezone.utc)
    grade = score_to_grade(score)
    next_repetition = repetition
    next_interval = interval
    next_ef = ef

    if grade < 3:
        next_repetition = 0
        next_interval = 1
    else:
        if repetition == 0:
            next_interval = 1
        elif repetition == 1:
            next_interval = 6
        else:
            next_interval = round(interval * ef)

        next_repetition = repetition + 1
        diff = 5 - grade
        next_ef = max(1.3, ef + (0.1 - diff * (0.08 + diff * 0.02)))

    next_date = current + timedelta(days=next_interval)
    return Sm2Result(
        grade=grade,
        repetition=next_repetition,
        interval=next_interval,
        ef=round(next_ef, 2),
        next_review_at=next_date.isoformat(),
    )
