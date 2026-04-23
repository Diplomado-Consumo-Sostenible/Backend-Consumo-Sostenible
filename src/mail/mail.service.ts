import { Injectable } from '@nestjs/common';
import { MailProvider } from './providers/mail.provider';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  constructor(
    private readonly mailProvider: MailProvider,
    private readonly configService: ConfigService
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
    const logoUrl = this.configService.get<string>('LOGOEXT_URL');
    
    await this.mailProvider.sendMail(
      email,
      'Solicitud de registro recibida - EcoVida',
      'business-welcome', 
      { businessName, logoUrl },
    );
  }

  async sendBusinessResubmitted(email: string, businessName: string) {
    const logoUrl = this.configService.get<string>('LOGOEXT_URL');
    
    await this.mailProvider.sendMail(
      email,
      'Tu negocio está en revisión nuevamente ',
      'business-resubmitted', 
      { businessName, logoUrl },
    );
  }

  async sendBusinessStatusChange(email: string, businessName: string, status: string, rejectionReason?: string) {
    const logoUrl = this.configService.get<string>('LOGOEXT_URL');
    const isApproved = status === 'Active';
    const subject = isApproved 
      ? '¡Tu negocio ha sido aprobado! 🎉' 
      : 'Actualización sobre tu negocio en EcoVida';
      
    await this.mailProvider.sendMail(
      email, subject, 'business-status',
      { businessName, isApproved, rejectionReason, logoUrl },
    );
  }

  async sendBusinessToggle(email: string, businessName: string, isActive: boolean) {
    const logoUrl = this.configService.get<string>('LOGOEXT_URL');
    const subject = isActive 
      ? 'Tu negocio ha sido reactivado' 
      : 'Aviso: Tu negocio ha sido desactivado';

    await this.mailProvider.sendMail(
      email, subject, 'business-toggle',
      { businessName, isActive, logoUrl },
    );
  }
}
