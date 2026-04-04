import { Injectable } from '@nestjs/common';
import { MailProvider } from './providers/mail.provider';

@Injectable()
export class MailService {
  constructor(private readonly mailProvider: MailProvider) {}

  async sendPasswordResetOtp(email: string, otp: string) {
    await this.mailProvider.sendMail(
      email,
      'Tu código de recuperación',
      'password-reset',
      { otp },
    );
  }
}
