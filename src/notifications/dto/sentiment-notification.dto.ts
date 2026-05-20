import { ReviewSentiment } from '../../shared/entities/review.entity';

export type NotificationUrgency = 'low' | 'medium' | 'high';

export type NotificationAlertType =
  | 'critical_rating'
  | 'accumulated_negatives'
  | 'suspicious_review'
  | 'negative_review';

export class SentimentNotificationDto {
  businessId: number;
  businessName: string;
  reviewId: number;
  sentiment: ReviewSentiment;
  aiStars: number;
  probabilidades: {
    positivo: number;
    negativo: number;
    neutro: number;
  };
  urgency: NotificationUrgency;
  comment: string;
  timestamp: Date;
  isSuspicious: boolean;
  alertType?: NotificationAlertType;
  currentRating?: number;
  totalNegatives?: number;
}
