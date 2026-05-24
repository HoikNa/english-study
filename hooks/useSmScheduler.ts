import { useMemo } from 'react';

export interface Sm2Input {
  score: number;
  repetition: number;
  interval: number;
  ef: number;
  now?: Date;
}

export interface Sm2Result {
  grade: 1 | 2 | 3 | 4 | 5;
  repetition: number;
  interval: number;
  ef: number;
  nextReviewAt: string;
}

export function scoreToGrade(score: number): Sm2Result['grade'] {
  if (score >= 90) return 5;
  if (score >= 80) return 4;
  if (score >= 70) return 3;
  if (score >= 60) return 2;
  return 1;
}

export function calculateSm2({ score, repetition, interval, ef, now = new Date() }: Sm2Input): Sm2Result {
  const grade = scoreToGrade(score);
  let nextRepetition = repetition;
  let nextInterval = interval;
  let nextEf = ef;

  if (grade < 3) {
    nextRepetition = 0;
    nextInterval = 1;
  } else {
    if (repetition === 0) {
      nextInterval = 1;
    } else if (repetition === 1) {
      nextInterval = 6;
    } else {
      nextInterval = Math.round(interval * ef);
    }

    nextRepetition = repetition + 1;
    const diff = 5 - grade;
    nextEf = Math.max(1.3, ef + (0.1 - diff * (0.08 + diff * 0.02)));
  }

  const nextDate = new Date(now.getTime() + nextInterval * 86400000);

  return {
    grade,
    repetition: nextRepetition,
    interval: nextInterval,
    ef: Number(nextEf.toFixed(2)),
    nextReviewAt: nextDate.toISOString(),
  };
}

export function useSmScheduler(input: Sm2Input) {
  return useMemo(() => calculateSm2(input), [input.score, input.repetition, input.interval, input.ef, input.now]);
}
