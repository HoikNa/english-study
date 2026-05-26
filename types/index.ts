export type Category = 'life' | 'business' | 'it' | 'custom';
export type ExpressionLevel = 1 | 2 | 3 | 4;
export type ReviewGrade = 'hard' | 'ok' | 'easy';

export interface Expression {
  id: string;
  category: Category;
  situation: string;
  situationKo: string;
  level: ExpressionLevel;
  textEn: string;
  textKo: string;
  audioUrl?: string;
  chunks: string[];
}

export interface Session {
  id: string;
  expressionId: string;
  pronScore: number;
  fluencyScore: number;
  prosodyScore: number;
  completenessScore: number;
  totalScore?: number;
  recognizedText?: string;
  wordErrors?: { word: string; accuracyScore: number; errorType: string }[];
  gptFeedback?: GptFeedback;
  createdAt: string;
}

export interface GptFeedback {
  issue: string;
  alternatives: { en: string; ko: string; context: string }[];
  importance: string;
}

export interface ReviewItem {
  id: string;
  expressionId: string;
  expression: Expression;
  interval: number;
  repetition: number;
  ef: number;
  nextReviewAt: string;
  lastScore: number;
}

export interface CategoryProgress {
  category: Category;
  name: string;
  total: number;
  completed: number;
  situations: SituationItem[];
}

export interface SituationItem {
  id: string;
  idx: string;
  name: string;
  nameEn: string;
  totalExpressions: number;
  completedExpressions: number;
  bestScore?: number;
}
