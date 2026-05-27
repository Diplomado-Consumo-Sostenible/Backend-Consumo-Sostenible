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
import { FollowRepository } from '../shared/repositories/follow.repository';

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
    private readonly followRepository: FollowRepository,
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

  @SubscribeMessage('join_user_room')
  async handleJoinUserRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { userId: number },
  ) {
    const room = `user_${payload.userId}`;
    client.join(room);
    this.logger.log(`Cliente ${client.id} se unió al room: ${room}`);

    try {
      const { data } = await this.notificationsService.getNotificationsForUser(
        payload.userId,
        1,
        30,
      );
      client.emit('notifications:init', data);
    } catch (err) {
      this.logger.error(
        'Error enviando notificaciones iniciales al usuario:',
        err,
      );
    }

    return { event: 'joined', room };
  }

  @SubscribeMessage('leave_user_room')
  handleLeaveUserRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { userId: number },
  ) {
    const room = `user_${payload.userId}`;
    client.leave(room);
    this.logger.log(`Cliente ${client.id} salió del room: ${room}`);
  }

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
    this.server.emit('sentiment:update', payload);
  }

  @OnEvent('sentiment.review.suspicious')
  handleSuspiciousReview(_payload: SentimentNotificationDto) {}

  @OnEvent('sentiment.alert.critical_rating')
  handleCriticalRating(payload: SentimentNotificationDto) {
    const alertPayload = { ...payload, alertType: 'critical_rating' };

    this.server
      .to(`business_${payload.businessId}`)
      .emit('sentiment:alert', alertPayload);
    this.server.emit('sentiment:update', alertPayload);

    this.getOwnerId(payload.businessId).then((ownerId) => {
      if (!ownerId) return;
      this.notificationsService
        .create({
          ownerId,
          businessId: payload.businessId,
          alertType: NotificationAlertType.CRITICAL_RATING,
          payload: alertPayload,
        })
        .catch((err) =>
          this.logger.error('Error persistiendo critical_rating:', err),
        );
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
      this.notificationsService
        .create({
          ownerId,
          businessId: payload.businessId,
          alertType: NotificationAlertType.ACCUMULATED_NEGATIVES,
          payload: alertPayload,
        })
        .catch((err) =>
          this.logger.error('Error persistiendo accumulated_negatives:', err),
        );
    });
  }

  @OnEvent('sentiment.weekly.summary')
  handleWeeklySummary(payload: WeeklySummaryDto) {
    this.server
      .to(`business_${payload.businessId}`)
      .emit('sentiment:weekly_summary', payload);

    this.logger.log(
      ` Resumen semanal emitido al room business_${payload.businessId}`,
    );
  }

  @OnEvent('sentiment.general.summary')
  handleGeneralSummary(payload: any) {
    this.server
      .to(`business_${payload.businessId}`)
      .emit('sentiment:general_summary', payload);
  }

  @OnEvent('product.created')
  async handleProductCreated(payload: {
    businessId: number;
    businessName: string;
    businessLogo: string | null;
    productId: number;
    productName: string;
    productImage: string | null;
  }) {
    try {
      const follows = await this.followRepository.find({
        where: { followedBusiness: { id_business: payload.businessId } },
        relations: ['follower'],
      });

      if (!follows.length) return;

      const alertPayload = { ...payload, alertType: 'new_product' };

      for (const follow of follows) {
        const followerId = follow.follower?.id_usuario;
        if (!followerId) continue;

        try {
          const saved = await this.notificationsService.create({
            ownerId: followerId,
            businessId: payload.businessId,
            alertType: NotificationAlertType.NEW_PRODUCT,
            payload: alertPayload,
          });

          this.server.to(`user_${followerId}`).emit('product:new', {
            ...alertPayload,
            id: saved.id,
            timestamp: saved.createdAt.toISOString(),
            isRead: false,
          });
        } catch (err) {
          this.logger.error('Error persistiendo new_product:', err);
        }
      }

      this.logger.log(
        `Notificación new_product enviada a ${follows.length} seguidores del negocio ${payload.businessId}`,
      );
    } catch (err) {
      this.logger.error('Error en handleProductCreated:', err);
    }
  }

  @OnEvent('review.hidden')
  async handleReviewHidden(payload: {
    reviewAuthorId: number;
    reviewId: number;
    businessId: number;
    businessName: string;
  }) {
    try {
      const alertPayload = { ...payload, alertType: 'review_hidden' };

      const saved = await this.notificationsService.create({
        ownerId: payload.reviewAuthorId,
        businessId: payload.businessId,
        alertType: NotificationAlertType.REVIEW_HIDDEN,
        payload: alertPayload,
      });

      this.server.to(`user_${payload.reviewAuthorId}`).emit('review:hidden', {
        ...alertPayload,
        id: saved.id,
        timestamp: saved.createdAt.toISOString(),
        isRead: false,
      });

      this.logger.log(
        ` Notificación review_hidden enviada al usuario ${payload.reviewAuthorId} (reseña #${payload.reviewId})`,
      );
    } catch (err) {
      this.logger.error('Error en handleReviewHidden:', err);
    }
  }

  @OnEvent('review.restored_by_moderation')
  async handleReviewRestoredByModeration(payload: {
    reviewAuthorId: number;
    reviewId: number;
    businessId: number;
    businessName: string;
  }) {
    try {
      const alertPayload = { ...payload, alertType: 'review_restored' };

      const saved = await this.notificationsService.create({
        ownerId: payload.reviewAuthorId,
        businessId: payload.businessId,
        alertType: NotificationAlertType.REVIEW_RESTORED,
        payload: alertPayload,
      });

      this.server.to(`user_${payload.reviewAuthorId}`).emit('review:restored', {
        ...alertPayload,
        id: saved.id,
        timestamp: saved.createdAt.toISOString(),
        isRead: false,
      });

      this.logger.log(
        ` Notificación review_restored enviada al usuario ${payload.reviewAuthorId} (reseña #${payload.reviewId})`,
      );
    } catch (err) {
      this.logger.error('Error en handleReviewRestoredByModeration:', err);
    }
  }

  @OnEvent('review.deleted_by_moderation')
  async handleReviewDeletedByModeration(payload: {
    reviewAuthorId: number;
    reviewId: number;
    businessId: number;
    businessName: string;
    penaltyCount: number;
    isBanned: boolean;
  }) {
    try {
      const alertPayload = { ...payload, alertType: 'review_deleted' };

      const saved = await this.notificationsService.create({
        ownerId: payload.reviewAuthorId,
        businessId: payload.businessId,
        alertType: NotificationAlertType.REVIEW_DELETED,
        payload: alertPayload,
      });

      this.server.to(`user_${payload.reviewAuthorId}`).emit('review:deleted', {
        ...alertPayload,
        id: saved.id,
        timestamp: saved.createdAt.toISOString(),
        isRead: false,
      });

      this.logger.log(
        `🗑️ Notificación review_deleted enviada al usuario ${payload.reviewAuthorId} (reseña #${payload.reviewId}, penalizaciones: ${payload.penaltyCount}, baneado: ${payload.isBanned})`,
      );
    } catch (err) {
      this.logger.error('Error en handleReviewDeletedByModeration:', err);
    }
  }

  @OnEvent('business.created')
  async handleBusinessCreated(payload: {
    ownerId: number;
    businessId: number;
    businessName: string;
  }) {
    try {
      const alertPayload = { ...payload, alertType: 'business_created' };

      const saved = await this.notificationsService.create({
        ownerId: payload.ownerId,
        businessId: payload.businessId,
        alertType: NotificationAlertType.BUSINESS_CREATED,
        payload: alertPayload,
      });

      const event = {
        ...alertPayload,
        id: saved.id,
        timestamp: saved.createdAt.toISOString(),
        isRead: false,
      };
      this.server.to(`user_${payload.ownerId}`).emit('business:created', event);
      this.server
        .to(`business_${payload.businessId}`)
        .emit('business:created', event);

      this.logger.log(
        `Notificación business_created enviada al owner ${payload.ownerId}`,
      );
    } catch (err) {
      this.logger.error('Error en handleBusinessCreated:', err);
    }
  }

  @OnEvent('business.approved')
  async handleBusinessApproved(payload: {
    ownerId: number;
    businessId: number;
    businessName: string;
  }) {
    try {
      const alertPayload = { ...payload, alertType: 'business_approved' };

      const saved = await this.notificationsService.create({
        ownerId: payload.ownerId,
        businessId: payload.businessId,
        alertType: NotificationAlertType.BUSINESS_APPROVED,
        payload: alertPayload,
      });

      this.server
        .to(`business_${payload.businessId}`)
        .emit('business:approved', {
          ...alertPayload,
          id: saved.id,
          timestamp: saved.createdAt.toISOString(),
          isRead: false,
        });

      this.logger.log(
        `Notificación business_approved enviada al owner ${payload.ownerId} (negocio #${payload.businessId})`,
      );
    } catch (err) {
      this.logger.error('Error en handleBusinessApproved:', err);
    }
  }

  @OnEvent('business.rejected')
  async handleBusinessRejected(payload: {
    ownerId: number;
    businessId: number;
    businessName: string;
    rejectionReason: string | null;
  }) {
    try {
      const alertPayload = { ...payload, alertType: 'business_rejected' };

      const saved = await this.notificationsService.create({
        ownerId: payload.ownerId,
        businessId: payload.businessId,
        alertType: NotificationAlertType.BUSINESS_REJECTED,
        payload: alertPayload,
      });

      this.server
        .to(`business_${payload.businessId}`)
        .emit('business:rejected', {
          ...alertPayload,
          id: saved.id,
          timestamp: saved.createdAt.toISOString(),
          isRead: false,
        });

      this.logger.log(
        `Notificación business_rejected enviada al owner ${payload.ownerId} (negocio #${payload.businessId})`,
      );
    } catch (err) {
      this.logger.error('Error en handleBusinessRejected:', err);
    }
  }

  @OnEvent('business.resubmitted')
  async handleBusinessResubmitted(payload: {
    ownerId: number;
    businessId: number;
    businessName: string;
  }) {
    try {
      const alertPayload = { ...payload, alertType: 'business_resubmitted' };

      const saved = await this.notificationsService.create({
        ownerId: payload.ownerId,
        businessId: payload.businessId,
        alertType: NotificationAlertType.BUSINESS_RESUBMITTED,
        payload: alertPayload,
      });

      this.server
        .to(`business_${payload.businessId}`)
        .emit('business:resubmitted', {
          ...alertPayload,
          id: saved.id,
          timestamp: saved.createdAt.toISOString(),
          isRead: false,
        });

      this.logger.log(
        `Notificación business_resubmitted enviada al owner ${payload.ownerId} (negocio #${payload.businessId})`,
      );
    } catch (err) {
      this.logger.error('Error en handleBusinessResubmitted:', err);
    }
  }

  @OnEvent('certification.approved')
  async handleCertificationApproved(payload: {
    ownerId: number;
    businessId: number;
    businessName: string;
    certificationName: string;
    issuingEntity: string;
  }) {
    try {
      const alertPayload = { ...payload, alertType: 'certification_approved' };

      const saved = await this.notificationsService.create({
        ownerId: payload.ownerId,
        businessId: payload.businessId,
        alertType: NotificationAlertType.CERTIFICATION_APPROVED,
        payload: alertPayload,
      });

      this.server
        .to(`business_${payload.businessId}`)
        .emit('certification:approved', {
          ...alertPayload,
          id: saved.id,
          timestamp: saved.createdAt.toISOString(),
          isRead: false,
        });

      this.logger.log(
        `Notificación certification_approved enviada al owner ${payload.ownerId} (negocio #${payload.businessId})`,
      );
    } catch (err) {
      this.logger.error('Error en handleCertificationApproved:', err);
    }
  }

  @OnEvent('certification.rejected')
  async handleCertificationRejected(payload: {
    ownerId: number;
    businessId: number;
    businessName: string;
    certificationName: string;
    issuingEntity: string;
  }) {
    try {
      const alertPayload = { ...payload, alertType: 'certification_rejected' };

      const saved = await this.notificationsService.create({
        ownerId: payload.ownerId,
        businessId: payload.businessId,
        alertType: NotificationAlertType.CERTIFICATION_REJECTED,
        payload: alertPayload,
      });

      this.server
        .to(`business_${payload.businessId}`)
        .emit('certification:rejected', {
          ...alertPayload,
          id: saved.id,
          timestamp: saved.createdAt.toISOString(),
          isRead: false,
        });

      this.logger.log(
        `Notificación certification_rejected enviada al owner ${payload.ownerId} (negocio #${payload.businessId})`,
      );
    } catch (err) {
      this.logger.error('Error en handleCertificationRejected:', err);
    }
  }
}
