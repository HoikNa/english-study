from datetime import datetime, timezone
import unittest

from app.services.sm2_scheduler import calculate_sm2, score_to_grade


class Sm2SchedulerTest(unittest.TestCase):
    def setUp(self) -> None:
        self.now = datetime(2026, 5, 23, tzinfo=timezone.utc)

    def test_score_to_grade(self) -> None:
        self.assertEqual(score_to_grade(95), 5)
        self.assertEqual(score_to_grade(82), 4)
        self.assertEqual(score_to_grade(73), 3)
        self.assertEqual(score_to_grade(61), 2)
        self.assertEqual(score_to_grade(42), 1)

    def test_first_failure_resets_repetition(self) -> None:
        result = calculate_sm2(score=55, repetition=2, interval=6, ef=2.5, now=self.now)
        self.assertEqual(result.grade, 1)
        self.assertEqual(result.repetition, 0)
        self.assertEqual(result.interval, 1)
        self.assertEqual(result.ef, 2.5)

    def test_first_success_reviews_tomorrow(self) -> None:
        result = calculate_sm2(score=82, repetition=0, interval=1, ef=2.5, now=self.now)
        self.assertEqual(result.grade, 4)
        self.assertEqual(result.repetition, 1)
        self.assertEqual(result.interval, 1)
        self.assertEqual(result.ef, 2.5)

    def test_second_success_uses_six_days(self) -> None:
        result = calculate_sm2(score=78, repetition=1, interval=1, ef=2.6, now=self.now)
        self.assertEqual(result.grade, 3)
        self.assertEqual(result.repetition, 2)
        self.assertEqual(result.interval, 6)
        self.assertEqual(result.ef, 2.46)

    def test_later_success_multiplies_interval(self) -> None:
        result = calculate_sm2(score=91, repetition=2, interval=6, ef=2.56, now=self.now)
        self.assertEqual(result.grade, 5)
        self.assertEqual(result.repetition, 3)
        self.assertEqual(result.interval, 15)
        self.assertEqual(result.ef, 2.66)


if __name__ == "__main__":
    unittest.main()
