import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { In } from 'typeorm';
import { NotificationRepository } from '../shared/repositories/notification.repository';
import { BusinessRepository } from '../shared/repositories/business.repository';
import { Notification, NotificationAlertType } from '../shared/entities/notification.entity';

export interface CreateNotificationInput {
  ownerId: number;
  businessId?: number | null;
  alertType: NotificationAlertType;
  payload: Record<string, any>;
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly notificationRepo: NotificationRepository,
    private readonly businessRepo: BusinessRepository,
  ) {}

  private async enrichLogos(notifications: Notification[]): Promise<Notification[]> {
    const ids = [
      ...new Set(
        notifications
          .filter((n) => n.alertType === 'new_product' && n.businessId)
          .map((n) => n.businessId as number),
      ),
    ];
    if (!ids.length) return notifications;

    const businesses = await this.businessRepo.find({
      where: { id_business: In(ids) },
      select: ['id_business', 'logo'],
    });
    const logoMap = new Map(businesses.map((b) => [b.id_business, b.logo ?? null]));

    return notifications.map((n) => {
      if (n.alertType === 'new_product' && n.businessId && logoMap.has(n.businessId)) {
        return { ...n, payload: { ...n.payload, businessLogo: logoMap.get(n.businessId) } };
      }
      return n;
    });
  }

  async create(input: CreateNotificationInput) {
    const notification = this.notificationRepo.create({
      owner:     { id_usuario: input.ownerId } as any,
      business:  input.businessId ? ({ id_business: input.businessId } as any) : null,
      alertType: input.alertType,
      payload:   input.payload,
      isRead:    false,
    });
    return this.notificationRepo.save(notification);
  }

  async getMyNotifications(user: any, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await this.notificationRepo.findAndCount({
      where:  { ownerId: user.id_usuario },
      order:  { createdAt: 'DESC' },
      skip,
      take:   limit,
    });
    const enriched = await this.enrichLogos(data);
    return { data: enriched, total, page, limit };
  }

  async getNotificationsForUser(userId: number, page = 1, limit = 30) {
    const skip = (page - 1) * limit;
    const [data, total] = await this.notificationRepo.findAndCount({
      where:  { ownerId: userId },
      order:  { createdAt: 'DESC' },
      skip,
      take:   limit,
    });
    const enriched = await this.enrichLogos(data);
    return { data: enriched, total, page, limit };
  }

  async markRead(id: number, user: any) {
    const notification = await this.notificationRepo.findOne({ where: { id } });
    if (!notification) throw new NotFoundException('Notificación no encontrada.');
    if (notification.ownerId !== user.id_usuario) {
      throw new ForbiddenException('No tienes acceso a esta notificación.');
    }
    notification.isRead = true;
    return this.notificationRepo.save(notification);
  }

  async markAllRead(user: any) {
    await this.notificationRepo
      .createQueryBuilder()
      .update()
      .set({ isRead: true })
      .where('"ownerId" = :id', { id: user.id_usuario })
      .andWhere('"isRead" = false')
      .execute();
    return { message: 'Todas las notificaciones marcadas como leídas.' };
  }

  async deleteNotification(id: number, user: any) {
    const notification = await this.notificationRepo.findOne({ where: { id } });
    if (!notification) throw new NotFoundException('Notificación no encontrada.');
    if (notification.ownerId !== user.id_usuario) {
      throw new ForbiddenException('No tienes acceso a esta notificación.');
    }
    await this.notificationRepo.remove(notification);
    return { message: 'Notificación eliminada correctamente.' };
  }
}
