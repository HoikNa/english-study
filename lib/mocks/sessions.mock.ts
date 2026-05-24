import { Session } from '@/types';
import { mockExpressions } from './expressions.mock';

export const mockSessions: Session[] = mockExpressions.slice(0, 8).map((expression, index) => ({
  id: `session-${String(index + 1).padStart(3, '0')}`,
  expressionId: expression.id,
  pronScore: 68 + (index % 5) * 5,
  fluencyScore: 65 + (index % 4) * 6,
  prosodyScore: 62 + (index % 6) * 4,
  completenessScore: 78 + (index % 3) * 6,
  createdAt: new Date(Date.now() - index * 86400000).toISOString(),
}));
