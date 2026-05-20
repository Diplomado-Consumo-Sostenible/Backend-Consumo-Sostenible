import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SentimentNotificationDto } from './dto/sentiment-notification.dto';
import { WeeklySummaryDto } from './dto/weekly-summary.dto';
import { NotificationsService } from './notifications.service';
import { NotificationAlertType } from '../shared/entities/notification.entity';
import { BusinessRepository } from '../shared/repositories/business.repository';

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: '/notifications',
})
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly businessRepository: BusinessRepository,
  ) {}

  afterInit() {
    this.logger.log('🔌 WebSocket Gateway de notificaciones iniciado');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente desconectado: ${client.id}`);
  }

  @SubscribeMessage('join_business_room')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { businessId: number },
  ) {
    const room = `business_${payload.businessId}`;
    client.join(room);
    this.logger.log(`Cliente ${client.id} se unió al room: ${room}`);
    return { event: 'joined', room };
  }

  @SubscribeMessage('leave_business_room')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { businessId: number },
  ) {
    const room = `business_${payload.businessId}`;
    client.leave(room);
    this.logger.log(`Cliente ${client.id} salió del room: ${room}`);
  }

  /** Obtiene el id del owner de un negocio (con caché inline para el gateway). */
  private async getOwnerId(businessId: number): Promise<number | null> {
    try {
      const biz = await this.businessRepository.findOne({
        where: { id_business: businessId },
        relations: ['user'],
      });
      return biz?.user?.id_usuario ?? null;
    } catch {
      return null;
    }
  }

  @OnEvent('sentiment.review.created')
  handleSentimentReviewCreated(payload: SentimentNotificationDto) {
    // Panel en vivo para admins
    this.server.emit('sentiment:update', payload);

    // Alerta al dueño del negocio si es urgente — también se persiste
    if (payload.urgency === 'high') {
      const alertPayload = { ...payload, alertType: 'negative_review' };
      this.server
        .to(`business_${payload.businessId}`)
        .emit('sentiment:alert', alertPayload);

      // Persistir sin bloquear el hilo principal
      this.getOwnerId(payload.businessId).then((ownerId) => {
        if (!ownerId) return;
        this.notificationsService.create({
          ownerId,
          businessId: payload.businessId,
          alertType: NotificationAlertType.NEGATIVE_REVIEW,
          payload: alertPayload,
        }).catch((err) => this.logger.error('Error persistiendo negative_review:', err));
      });
    }
  }

  @OnEvent('sentiment.review.suspicious')
  handleSuspiciousReview(payload: SentimentNotificationDto) {
    const alertPayload = { ...payload, alertType: 'suspicious_review' };
    this.server.emit('sentiment:alert', alertPayload);
    this.server
      .to(`business_${payload.businessId}`)
      .emit('sentiment:alert', alertPayload);

    this.getOwnerId(payload.businessId).then((ownerId) => {
      if (!ownerId) return;
      this.notificationsService.create({
        ownerId,
        businessId: payload.businessId,
        alertType: NotificationAlertType.SUSPICIOUS_REVIEW,
        payload: alertPayload,
      }).catch((err) => this.logger.error('Error persistiendo suspicious_review:', err));
    });
  }

  @OnEvent('sentiment.alert.critical_rating')
  handleCriticalRating(payload: SentimentNotificationDto) {
    const alertPayload = { ...payload, alertType: 'critical_rating' };

    this.server
      .to(`business_${payload.businessId}`)
      .emit('sentiment:alert', alertPayload);
    this.server.emit('sentiment:update', alertPayload);

    this.getOwnerId(payload.businessId).then((ownerId) => {
      if (!ownerId) return;
      this.notificationsService.create({
        ownerId,
        businessId: payload.businessId,
        alertType: NotificationAlertType.CRITICAL_RATING,
        payload: alertPayload,
      }).catch((err) => this.logger.error('Error persistiendo critical_rating:', err));
    });
  }

  @OnEvent('sentiment.alert.accumulated_negatives')
  handleAccumulatedNegatives(payload: SentimentNotificationDto) {
    const alertPayload = { ...payload, alertType: 'accumulated_negatives' };

    this.server
      .to(`business_${payload.businessId}`)
      .emit('sentiment:alert', alertPayload);
    this.server.emit('sentiment:update', alertPayload);

    this.getOwnerId(payload.businessId).then((ownerId) => {
      if (!ownerId) return;
      this.notificationsService.create({
        ownerId,
        businessId: payload.businessId,
        alertType: NotificationAlertType.ACCUMULATED_NEGATIVES,
        payload: alertPayload,
      }).catch((err) => this.logger.error('Error persistiendo accumulated_negatives:', err));
    });
  }

  @OnEvent('sentiment.weekly.summary')
  handleWeeklySummary(payload: WeeklySummaryDto) {
    this.server
      .to(`business_${payload.businessId}`)
      .emit('sentiment:weekly_summary', payload);

    this.logger.log(
      `📊 Resumen semanal emitido al room business_${payload.businessId}`,
    );
  }

  @OnEvent('sentiment.general.summary')
  handleGeneralSummary(payload: any) {
    this.server
      .to(`business_${payload.businessId}`)
      .emit('sentiment:general_summary', payload);
  }
}
