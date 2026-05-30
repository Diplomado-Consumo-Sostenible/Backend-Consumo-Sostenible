import { Injectable, Logger } from '@nestjs/common';
import { MailProvider } from './providers/mail.provider';
import { ConfigService } from '@nestjs/config';
import { WeeklySummaryDto } from '../notifications/dto/weekly-summary.dto';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly mailProvider: MailProvider,
    private readonly configService: ConfigService,
  ) {}


  async sendPasswordResetOtp(email: string, otp: string) {
    const logoUrl = this.configService.get<string>('LOGOEXT_URL');
    await this.mailProvider.sendMail(
      email,
      'Tu código de recuperación',
      'password-reset',
      { otp, logoUrl },
    );
  }


  async sendBusinessWelcome(email: string, businessName: string) {
    try {
      const logoUrl = this.configService.get<string>('LOGOEXT_URL');
      await this.mailProvider.sendMail(
        email,
        'Solicitud de registro recibida - EcoVida',
        'business-welcome',
        { businessName, logoUrl },
      );
    } catch (err) {
      this.logger.warn(`sendBusinessWelcome falló para ${email}: ${(err as Error).message}`);
    }
  }

  async sendBusinessResubmitted(email: string, businessName: string) {
    try {
      const logoUrl = this.configService.get<string>('LOGOEXT_URL');
      await this.mailProvider.sendMail(
        email,
        'Tu negocio está en revisión nuevamente ',
        'business-resubmitted',
        { businessName, logoUrl },
      );
    } catch (err) {
      this.logger.warn(`sendBusinessResubmitted falló para ${email}: ${(err as Error).message}`);
    }
  }

  async sendBusinessStatusChange(
    email: string,
    businessName: string,
    status: string,
    rejectionReason?: string,
  ) {
    try {
      const logoUrl = this.configService.get<string>('LOGOEXT_URL');
      const isApproved = status === 'Active';
      const subject = isApproved
        ? '¡Tu negocio ha sido aprobado! 🎉'
        : 'Actualización sobre tu negocio en EcoVida';
      await this.mailProvider.sendMail(email, subject, 'business-status', {
        businessName,
        isApproved,
        rejectionReason,
        logoUrl,
      });
    } catch (err) {
      this.logger.warn(`sendBusinessStatusChange falló para ${email}: ${(err as Error).message}`);
    }
  }

  async sendBusinessToggle(
    email: string,
    businessName: string,
    isActive: boolean,
  ) {
    try {
      const logoUrl = this.configService.get<string>('LOGOEXT_URL');
      const subject = isActive
        ? 'Tu negocio ha sido reactivado'
        : 'Aviso: Tu negocio ha sido desactivado';
      await this.mailProvider.sendMail(email, subject, 'business-toggle', {
        businessName,
        isActive,
        logoUrl,
      });
    } catch (err) {
      this.logger.warn(`sendBusinessToggle falló para ${email}: ${(err as Error).message}`);
    }
  }

  async sendNegativeReviewAlert(
    email: string,
    businessName: string,
    comment: string,
  ) {
    try {
      const logoUrl = this.configService.get<string>('LOGOEXT_URL');
      await this.mailProvider.sendMail(
        email,
        'Alerta de reseña negativa',
        'negative-review-alert',
        { businessName, logoUrl, comment },
      );
    } catch (err) {
      this.logger.warn(`sendNegativeReviewAlert falló para ${email}: ${(err as Error).message}`);
    }
  }

  async sendReviewDeletedAlert(email: string, businessName: string) {
    try {
      const logoUrl = this.configService.get<string>('LOGOEXT_URL');
      await this.mailProvider.sendMail(
        email,
        'Aviso de moderación: Tu reseña ha sido eliminada',
        'review-deleted',
        { businessName, logoUrl },
      );
    } catch (err) {
      this.logger.warn(`sendReviewDeletedAlert falló para ${email}: ${(err as Error).message}`);
    }
  }

  async sendCriticalRatingAlert(
    email: string,
    businessName: string,
    currentRating: number,
  ) {
    try {
      const logoUrl = this.configService.get<string>('LOGOEXT_URL');
      await this.mailProvider.sendMail(
        email,
        'Alerta: Tu calificación general ha bajado',
        'critical-rating-alert',
        { businessName, logoUrl, currentRating },
      );
    } catch (err) {
      this.logger.warn(`sendCriticalRatingAlert falló para ${email}: ${(err as Error).message}`);
    }
  }

  async sendAccumulatedNegativesAlert(
    email: string,
    businessName: string,
    totalNegatives: number,
  ) {
    try {
      const logoUrl = this.configService.get<string>('LOGOEXT_URL');
      await this.mailProvider.sendMail(
        email,
        'Aviso sobre la percepción de tus clientes',
        'accumulated-negatives-alert',
        { businessName, logoUrl, totalNegatives },
      );
    } catch (err) {
      this.logger.warn(`sendAccumulatedNegativesAlert falló para ${email}: ${(err as Error).message}`);
    }
  }

  async sendWeeklyReport(email: string, summary: WeeklySummaryDto) {
    const logoUrl = this.configService.get<string>('LOGOEXT_URL');
    const { stats, aiSummary, businessName, weekStart, weekEnd } = summary;

    const weekStartStr = weekStart.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'long',
    });
    const weekEndStr = weekEnd.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    const pctPos =
      stats.total > 0 ? Math.round((stats.positive / stats.total) * 100) : 0;
    const pctNeg =
      stats.total > 0 ? Math.round((stats.negative / stats.total) * 100) : 0;
    const pctNeu =
      stats.total > 0 ? Math.round((stats.neutral / stats.total) * 100) : 0;

    const trendLabel =
      stats.trend === 'improving'
        ? '📈 Mejorando'
        : stats.trend === 'declining'
          ? '📉 Empeorando'
          : '➡️ Estable';
    const trendColor =
      stats.trend === 'improving'
        ? '#2e7d32'
        : stats.trend === 'declining'
          ? '#c62828'
          : '#f57c00';

    const aiSummaryHtml = aiSummary
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');

    await this.mailProvider.sendMail(
      email,
      `Reporte semanal de tu negocio — ${weekEndStr}`,
      'weekly-report',
      {
        businessName,
        logoUrl,
        weekStartStr,
        weekEndStr,
        stats: { ...stats, pctPos, pctNeg, pctNeu },
        trendLabel,
        trendColor,
        aiSummaryHtml,
      },
    );
  }
}
