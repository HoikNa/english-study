import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { apiClient, USE_MOCK } from '@/lib/api';
import {
  mockCategoryProgress,
  mockExpressions,
  mockReviewQueue,
  mockSituations,
  mockStats,
  mockStreak,
} from '@/lib/mocks/expressions.mock';
import { mockWeeklyReport } from '@/lib/mocks/reports.mock';
import type { Category, CategoryProgress, Expression, ExpressionLevel, GptFeedback, ReviewGrade, ReviewItem, Session, SituationItem } from '@/types';
import type { PronunciationResult } from './useAzurePronunciation';
import { calculateSm2 } from './useSmScheduler';

interface PaginatedResponse<T> {
  items: T[];
  total: number;
}

interface ReviewTodayResponse {
  items: ReviewItem[];
  count: number;
}

interface ApiExpression {
  id: string;
  category: Category;
  situation: string;
  situation_ko?: string;
  situationKo?: string;
  level: ExpressionLevel;
  text_en?: string;
  textEn?: string;
  text_ko?: string;
  textKo?: string;
  audio_url?: string | null;
  audioUrl?: string;
  chunks: string[];
}

interface ApiSituationItem {
  id: string;
  idx: string;
  name: string;
  name_en?: string;
  nameEn?: string;
  total_expressions?: number;
  totalExpressions?: number;
  completed_expressions?: number;
  completedExpressions?: number;
  best_score?: number | null;
  bestScore?: number;
}

interface ApiCategoryProgress {
  category: Category;
  name: string;
  total: number;
  completed: number;
  situations: Array<SituationItem | ApiSituationItem>;
}

interface ApiReviewItem {
  id: string;
  expression_id?: string;
  expressionId?: string;
  expression: Expression | ApiExpression;
  interval?: number;
  interval_days?: number;
  repetition: number;
  ef?: number;
  ease_factor?: number;
  next_review_at?: string;
  nextReviewAt?: string;
  last_score?: number | null;
  lastScore?: number;
}

export interface ProgressStats {
  pronScore: number;
  weeklyChange: number;
  totalExpressions: number;
  streak: typeof mockStreak;
  categories: CategoryProgress[];
}

export interface WeeklyReportPattern {
  rank: string;
  bad: string;
  good: string;
  why: string;
  category: string;
}

export interface WeeklyReportData {
  weekRange: string;
  totalSessions: number;
  expressionsPracticed: number;
  avgScore: number;
  scoreChange: number;
  topCategory: string;
  patterns: WeeklyReportPattern[];
  goals: { mark: string; text: string }[];
}

interface ApiProgressStats {
  pronScore?: number;
  pron_score?: number;
  weeklyChange?: number;
  weekly_change?: number;
  totalExpressions?: number;
  total_expressions?: number;
  streak: typeof mockStreak;
  categories: ApiCategoryProgress[];
}

interface ApiWeeklyReport {
  week_range?: string;
  total_sessions?: number;
  expressions_practiced?: number;
  avg_score?: number;
  score_change?: number;
  top_category?: string;
  patterns?: WeeklyReportPattern[];
  goals?: string[];
}

interface ExpressionFilters {
  category?: Category;
  situation?: string;
  level?: ExpressionLevel;
  skip?: number;
  limit?: number;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const learningKeys = {
  expressions: (filters: ExpressionFilters = {}) => ['expressions', filters] as const,
  expression: (id?: string) => ['expression', id] as const,
  todayExpression: ['expression', 'today'] as const,
  situations: (category?: Category) => ['situations', category] as const,
  reviewToday: ['review', 'today'] as const,
  sessions: (expressionId?: string) => ['sessions', expressionId] as const,
  recentSessions: (limit: number) => ['sessions', 'recent', limit] as const,
  progress: ['progress'] as const,
  weeklyReport: (week?: string) => ['weekly-report', week] as const,
};

interface ApiSession {
  id: string;
  expression_id?: string;
  expressionId?: string;
  pron_score?: number;
  pronScore?: number;
  fluency_score?: number;
  fluencyScore?: number;
  prosody_score?: number;
  prosodyScore?: number;
  completeness_score?: number;
  completenessScore?: number;
  total_score?: number;
  totalScore?: number;
  recognized_text?: string;
  recognizedText?: string;
  word_errors_json?: { word: string; accuracy_score?: number; error_type?: string }[];
  wordErrors?: Session['wordErrors'];
  gpt_feedback_json?: GptFeedback;
  gptFeedback?: GptFeedback;
  created_at?: string;
  createdAt?: string;
}

function filterExpressions(filters: ExpressionFilters) {
  return mockExpressions.filter((expression) => {
    if (filters.category && expression.category !== filters.category) return false;
    if (filters.situation && expression.situationKo !== filters.situation && expression.situation !== filters.situation) return false;
    if (filters.level && expression.level !== filters.level) return false;
    return true;
  });
}

function getSituations(category?: Category) {
  if (!category || category === 'life') return mockSituations.slice(0, 7);
  if (category === 'business') return mockSituations.slice(7, 9);
  if (category === 'it') return mockSituations.slice(9);
  return [];
}

function normalizeExpression(expression: Expression | ApiExpression): Expression {
  const apiExpression = expression as ApiExpression;
  return {
    id: expression.id,
    category: expression.category,
    situation: expression.situation,
    situationKo: ('situationKo' in expression ? expression.situationKo : apiExpression.situation_ko) ?? expression.situation,
    level: expression.level,
    textEn: ('textEn' in expression ? expression.textEn : apiExpression.text_en) ?? '',
    textKo: ('textKo' in expression ? expression.textKo : apiExpression.text_ko) ?? '',
    audioUrl: ('audioUrl' in expression ? expression.audioUrl : apiExpression.audio_url) ?? undefined,
    chunks: expression.chunks,
  };
}

function normalizeSituation(situation: SituationItem | ApiSituationItem): SituationItem {
  const apiSituation = situation as ApiSituationItem;
  return {
    id: situation.id,
    idx: situation.idx,
    name: situation.name,
    nameEn: ('nameEn' in situation ? situation.nameEn : apiSituation.name_en) ?? '',
    totalExpressions: ('totalExpressions' in situation ? situation.totalExpressions : apiSituation.total_expressions) ?? 0,
    completedExpressions: ('completedExpressions' in situation ? situation.completedExpressions : apiSituation.completed_expressions) ?? 0,
    bestScore: ('bestScore' in situation ? situation.bestScore : apiSituation.best_score) ?? undefined,
  };
}

function normalizeCategoryProgress(category: CategoryProgress | ApiCategoryProgress): CategoryProgress {
  return {
    category: category.category,
    name: category.name,
    total: category.total,
    completed: category.completed,
    situations: category.situations.map(normalizeSituation),
  };
}

function normalizeReviewItem(item: ReviewItem | ApiReviewItem): ReviewItem {
  if ('expressionId' in item && 'nextReviewAt' in item && 'lastScore' in item) return item as ReviewItem;

  return {
    id: item.id,
    expressionId: item.expression_id ?? item.expressionId ?? '',
    expression: normalizeExpression(item.expression),
    interval: item.interval ?? item.interval_days ?? 1,
    repetition: item.repetition,
    ef: item.ef ?? item.ease_factor ?? 2.5,
    nextReviewAt: item.next_review_at ?? item.nextReviewAt ?? new Date().toISOString(),
    lastScore: item.last_score ?? item.lastScore ?? 0,
  };
}

function normalizeProgressStats(stats: ProgressStats | ApiProgressStats): ProgressStats {
  return {
    pronScore: ('pronScore' in stats ? stats.pronScore : stats.pron_score) ?? 0,
    weeklyChange: ('weeklyChange' in stats ? stats.weeklyChange : stats.weekly_change) ?? 0,
    totalExpressions: ('totalExpressions' in stats ? stats.totalExpressions : stats.total_expressions) ?? 0,
    streak: stats.streak,
    categories: stats.categories.map(normalizeCategoryProgress),
  };
}

function normalizeSession(session: Session | ApiSession): Session {
  if ('expressionId' in session && 'pronScore' in session) return session as Session;

  return {
    id: session.id,
    expressionId: session.expression_id ?? '',
    pronScore: session.pron_score ?? 0,
    fluencyScore: session.fluency_score ?? 0,
    prosodyScore: session.prosody_score ?? 0,
    completenessScore: session.completeness_score ?? 0,
    totalScore: session.total_score ?? session.totalScore,
    recognizedText: session.recognized_text ?? session.recognizedText,
    wordErrors: (session.word_errors_json ?? session.wordErrors ?? []).map((word) => ({
      word: word.word,
      accuracyScore: 'accuracyScore' in word ? word.accuracyScore : word.accuracy_score ?? 0,
      errorType: 'errorType' in word ? word.errorType : word.error_type ?? 'None',
    })),
    gptFeedback: session.gpt_feedback_json,
    createdAt: session.created_at ?? new Date().toISOString(),
  };
}

function normalizeWeeklyReport(report: WeeklyReportData | ApiWeeklyReport): WeeklyReportData {
  if ('weekRange' in report) return report;

  const goals = (report.goals ?? []).map((text, index) => ({
    mark: `${String(index + 1).padStart(2, '0')}`,
    text,
  }));

  return {
    weekRange: report.week_range ?? '',
    totalSessions: report.total_sessions ?? 0,
    expressionsPracticed: report.expressions_practiced ?? 0,
    avgScore: report.avg_score ?? 0,
    scoreChange: report.score_change ?? 0,
    topCategory: report.top_category ?? '',
    patterns: report.patterns ?? [],
    goals,
  };
}

function mockWeeklyReportData(): WeeklyReportData {
  return {
    weekRange: '5월 16일 - 22일',
    totalSessions: 12,
    expressionsPracticed: mockWeeklyReport.completedExpressions,
    avgScore: mockWeeklyReport.averageScore,
    scoreChange: 8,
    topCategory: 'IT 미팅',
    patterns: mockWeeklyReport.topWeakPatterns.map((why: string, index: number) => ({
      rank: String(index + 1).padStart(2, '0'),
      bad: mockWeeklyReport.recommendedExpressions[index] ?? 'I think it is maybe possible',
      good: mockWeeklyReport.recommendedExpressions[index] ?? 'I think it is maybe possible',
      why,
      category: index === 0 ? 'Leadership tone' : index === 1 ? 'Technical precision' : 'Confidence register',
    })),
    goals: mockWeeklyReport.recommendedExpressions.slice(0, 3).map((text: string, index: number) => ({
      mark: String(index + 1).padStart(2, '0'),
      text,
    })),
  };
}

export function useExpressions(filters: ExpressionFilters = {}) {
  return useQuery({
    queryKey: learningKeys.expressions(filters),
    queryFn: async () => {
      if (USE_MOCK) {
        await wait(180);
        const items = filterExpressions(filters);
        return { items, total: items.length };
      }

      const res = await apiClient.get<PaginatedResponse<Expression | ApiExpression>>('/expressions', { params: filters });
      return { items: res.data.items.map(normalizeExpression), total: res.data.total };
    },
  });
}

export function useExpression(id?: string) {
  return useQuery({
    queryKey: learningKeys.expression(id),
    enabled: Boolean(id),
    queryFn: async () => {
      if (USE_MOCK) {
        await wait(120);
        return mockExpressions.find((expression) => expression.id === id) ?? mockExpressions[0];
      }

      const res = await apiClient.get<Expression | ApiExpression>(`/expressions/${id}`);
      return normalizeExpression(res.data);
    },
  });
}

export function useTodayExpression() {
  return useQuery({
    queryKey: learningKeys.todayExpression,
    queryFn: async () => {
      if (USE_MOCK) {
        await wait(120);
        return mockExpressions.find((expression) => expression.id === 'exp-011') ?? mockExpressions[0];
      }

      const res = await apiClient.get<Expression | ApiExpression>('/expressions/today');
      return normalizeExpression(res.data);
    },
  });
}

export function useSituations(category?: Category) {
  return useQuery({
    queryKey: learningKeys.situations(category),
    queryFn: async () => {
      if (USE_MOCK) {
        await wait(120);
        return getSituations(category);
      }

      const res = await apiClient.get<ProgressStats | ApiProgressStats>('/reports/progress');
      const progress = normalizeProgressStats(res.data);
      if (!category) {
        return progress.categories.flatMap((item) => item.situations);
      }

      return progress.categories.find((item) => item.category === category)?.situations ?? [];
    },
  });
}

export function useReviewToday() {
  return useQuery({
    queryKey: learningKeys.reviewToday,
    queryFn: async () => {
      if (USE_MOCK) {
        await wait(160);
        return { items: mockReviewQueue, count: mockReviewQueue.length };
      }

      const res = await apiClient.get<{ items: Array<ReviewItem | ApiReviewItem>; count: number }>('/review/today');
      return { items: res.data.items.map(normalizeReviewItem), count: res.data.count };
    },
  });
}

export function useProgressStats() {
  return useQuery({
    queryKey: learningKeys.progress,
    queryFn: async (): Promise<ProgressStats> => {
      if (USE_MOCK) {
        await wait(140);
        return {
          ...mockStats,
          streak: mockStreak,
          categories: mockCategoryProgress,
        };
      }

      const res = await apiClient.get<ProgressStats | ApiProgressStats>('/reports/progress');
      return normalizeProgressStats(res.data);
    },
  });
}

export function useWeeklyReport(week?: string) {
  return useQuery({
    queryKey: learningKeys.weeklyReport(week),
    queryFn: async (): Promise<WeeklyReportData> => {
      if (USE_MOCK) {
        await wait(160);
        return mockWeeklyReportData();
      }

      const res = await apiClient.get<ApiWeeklyReport>('/reports/weekly', { params: { week } });
      return normalizeWeeklyReport(res.data);
    },
  });
}

export function useSessions(expressionId?: string) {
  return useQuery({
    queryKey: learningKeys.sessions(expressionId),
    enabled: Boolean(expressionId),
    queryFn: async () => {
      if (USE_MOCK) {
        await wait(120);
        return { items: [] as Session[], total: 0 };
      }

      const res = await apiClient.get<PaginatedResponse<Session | ApiSession>>('/sessions', {
        params: { expression_id: expressionId },
      });
      return { items: res.data.items.map(normalizeSession), total: res.data.total };
    },
  });
}

export function useRecentSessions(limit = 5) {
  return useQuery({
    queryKey: learningKeys.recentSessions(limit),
    queryFn: async () => {
      if (USE_MOCK) {
        await wait(120);
        return { items: [] as Session[], total: 0 };
      }

      const res = await apiClient.get<PaginatedResponse<Session | ApiSession>>('/sessions', {
        params: { limit },
      });
      return { items: res.data.items.map(normalizeSession), total: res.data.total };
    },
  });
}

export function useUpdateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ item, grade }: { item: ReviewItem; grade: ReviewGrade }) => {
      const scoreByGrade: Record<ReviewGrade, number> = { hard: 55, ok: 76, easy: 92 };
      const next = calculateSm2({
        score: scoreByGrade[grade],
        repetition: item.repetition,
        interval: item.interval,
        ef: item.ef,
      });

      if (USE_MOCK) {
        await wait(160);
        return { ...item, ...next };
      }

      const res = await apiClient.patch<ReviewItem | ApiReviewItem>(`/review/${item.expressionId}/update`, {
        grade: next.grade,
        score: scoreByGrade[grade],
        repetition: next.repetition,
        interval_days: next.interval,
        ease_factor: next.ef,
        next_review_at: next.nextReviewAt,
      });
      return normalizeReviewItem(res.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: learningKeys.reviewToday });
      queryClient.invalidateQueries({ queryKey: learningKeys.progress });
    },
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      expressionId,
      pronResult,
      feedback,
    }: {
      expressionId: string;
      pronResult: PronunciationResult;
      feedback?: GptFeedback;
    }) => {
      if (USE_MOCK) {
        await wait(180);
        return {
          id: `session-${Date.now()}`,
          expressionId,
          pronScore: pronResult.accuracyScore,
          fluencyScore: pronResult.fluencyScore,
          prosodyScore: pronResult.prosodyScore,
          completenessScore: pronResult.completenessScore,
          gptFeedback: feedback,
          createdAt: new Date().toISOString(),
        } satisfies Session;
      }

      const res = await apiClient.post<Session | ApiSession>('/sessions', {
        expression_id: expressionId,
        pron_score: pronResult.accuracyScore,
        fluency_score: pronResult.fluencyScore,
        prosody_score: pronResult.prosodyScore,
        completeness_score: pronResult.completenessScore,
        total_score: pronResult.totalScore,
        recognized_text: pronResult.recognizedText,
        gpt_feedback_json: feedback,
      });

      if (pronResult.totalScore < 85) {
        try {
          await apiClient.post(`/review/${expressionId}/enqueue`, {
            score: pronResult.totalScore,
          });
        } catch (err) {
          if (!axios.isAxiosError(err) || err.response?.status !== 409) {
            throw err;
          }
        }
      }

      return normalizeSession(res.data);
    },
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: learningKeys.sessions(session.expressionId) });
      queryClient.invalidateQueries({ queryKey: learningKeys.reviewToday });
      queryClient.invalidateQueries({ queryKey: learningKeys.progress });
    },
  });
}
