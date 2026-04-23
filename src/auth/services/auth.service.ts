import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { MailService } from 'src/mail/mail.service';
import { UserRepository } from 'src/shared/repositories/user.repository';
import { MoreThan } from 'typeorm';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userRepository: UserRepository,
    private readonly mailService: MailService,
  ) {}

  async validateUser(email: string, plainPassword: string) {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['rol', 'perfil'],
    });
    if (!user) return null;

    const valid = await bcrypt.compare(plainPassword, user.password);
    if (!valid) return null;

    if (!user.isActive)
      throw new UnauthorizedException(
        'Tu cuenta ha sido desactivada. Contacta a un administrador.',
      );

    const { password, ...result } = user;
    return result;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    if (!user) throw new UnauthorizedException('Credenciales incorrectas');
    if (!user.rol)
      throw new BadRequestException('El usuario no tiene un rol asignado');

    const payload = {
      sub: user.id_usuario,
      email: user.email,
      rol: user.rol.nombre,
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id_usuario,
        email: user.email,
        nombre: user.perfil?.nombre ?? null,
        rol: user.rol.nombre,
      },
    };
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async requestPasswordReset(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user)
      throw new BadRequestException('No existe un usuario con ese email');

    user.passwordResetOTP = this.generateOtp();
    user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);
    await this.userRepository.save(user);

    await this.mailService.sendPasswordResetOtp(email, user.passwordResetOTP);
    return { message: 'Se ha enviado un código OTP a tu correo.' };
  }

  async resendPasswordResetOtp(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) throw new BadRequestException('El usuario no existe.');

    user.passwordResetOTP = this.generateOtp();
    user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);
    await this.userRepository.save(user);

    await this.mailService.sendPasswordResetOtp(email, user.passwordResetOTP);
    return { message: 'Se ha reenviado el código OTP.' };
  }

  async resetPassword(otp: string, newPassword: string) {
    const user = await this.userRepository.findOne({
      where: {
        passwordResetOTP: otp,
        passwordResetExpires: MoreThan(new Date()),
      },
    });
    if (!user) throw new BadRequestException('Código OTP inválido o expirado');

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.passwordResetOTP = null;
    user.passwordResetExpires = null;

    await this.userRepository.save(user);
    return { message: 'Contraseña restablecida correctamente' };
  }
}
