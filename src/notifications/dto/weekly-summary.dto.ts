export type SummaryTrend = 'improving' | 'stable' | 'declining';

export class WeeklySummaryStatsDto {
  total: number;
  positive: number;
  neutral: number;
  negative: number;
  averageRating: number;
  trend: SummaryTrend;
}

export class WeeklySummaryDto {
  businessId: number;
  businessName: string;
  weekStart: Date;
  weekEnd: Date;
  stats: WeeklySummaryStatsDto;
  aiSummary: string;
  generalReview: string | null;
}
