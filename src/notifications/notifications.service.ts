import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationRepository } from '../shared/repositories/notification.repository';
import { NotificationAlertType } from '../shared/entities/notification.entity';

export interface CreateNotificationInput {
  ownerId: number;
  businessId?: number | null;
  alertType: NotificationAlertType;
  payload: Record<string, any>;
}

@Injectable()
export class NotificationsService {
  constructor(private readonly notificationRepo: NotificationRepository) {}

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
    return { data, total, page, limit };
  }

  async markRead(id: number, user: any) {
    const notification = await this.notificationRepo.findOne({
      where: { id },
    });
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
}
