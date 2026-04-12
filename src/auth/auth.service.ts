import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import bcrypt from 'node_modules/bcryptjs';
import { MailService } from 'src/mail/mail.service';
import { Genero } from 'src/users/genero/entity/genero.entity';
import { Perfil } from 'src/users/perfil/entity/perfil.entity';
import { Rol } from 'src/users/rol/entity/rol.entity';
import { CreateUsuarioDto } from 'src/users/user/dto/create-usuario.dto';
import { User } from 'src/users/user/entity/user.entity';
import { Repository, MoreThan } from 'typeorm';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private usuarioRepository: Repository<User>,
    @InjectRepository(Rol)
    private rolRepository: Repository<Rol>,
    @InjectRepository(Genero)
    private generoRepository: Repository<Genero>,
    @InjectRepository(Perfil)
    private perfilRepository: Repository<Perfil>,
    private readonly mailService: MailService,
  ) {}

  async registerUser(userData: CreateUsuarioDto) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    const rol = await this.rolRepository.findOne({
      where: { id: userData.rolId },
    });
    if (!rol) throw new BadRequestException('El Rol especificado no existe.');

    const existingUser = await this.usuarioRepository.findOne({
      where: { email: userData.email },
    });
    if (existingUser)
      throw new BadRequestException(
        'Ya existe un usuario con este correo electrónico.',
      );

    const newUser = this.usuarioRepository.create({
      email: userData.email,
      password: hashedPassword,
      rol,
    });

    const savedUser = await this.usuarioRepository.save(newUser);

    const genero = await this.generoRepository.findOne({
      where: { id_genero: userData.id_genero },
    });
    if (!genero)
      throw new BadRequestException('El género especificado no existe.');

    const newProfile = this.perfilRepository.create({
      genero: genero,
      nombre: userData.nombre,
    });
    newProfile.user = savedUser;

    await this.perfilRepository.save(newProfile);

    return {
      message: 'Usuario registrado correctamente con perfil asociado.',
      usuario: {
        id: savedUser.id_usuario,
        email: savedUser.email,
        rol: savedUser.rol.nombre,
      },
      perfil: {
        id_perfil: newProfile.id_perfil,
      },
    };
  }

  async validateUser(email: string, plainPassword: string): Promise<any> {
    const user = await this.usuarioRepository.findOne({
      where: { email },
      relations: ['rol'],
    });

    if (user && (await bcrypt.compare(plainPassword, user.password))) {
      if (!user.isActive) {
        throw new UnauthorizedException(
          'Tu cuenta ha sido desactivada. Por favor, contacta a un administrador.',
        );
      }
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async generateToken(user: any): Promise<{ access_token: string }> {
    const payload = {
      sub: user.id_usuario,
      email: user.email,
      rol: user.rol.nombre,
    };
    return { access_token: this.jwtService.sign(payload) };
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    if (!user) throw new UnauthorizedException('Credenciales incorrectas');
    if (!user.rol)
      throw new BadRequestException('El usuario no tiene un rol asignado');
    return this.generateToken(user);
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async requestPasswordReset(email: string) {
    const user = await this.usuarioRepository.findOne({ where: { email } });

    if (!user)
      throw new BadRequestException('No existe un usuario con ese email');

    const otp = this.generateOtp();
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    user.passwordResetOTP = otp;
    user.passwordResetExpires = expires;
    await this.usuarioRepository.save(user);

    await this.mailService.sendPasswordResetOtp(email, otp);

    return { message: 'Se ha enviado un código OTP a tu correo.' };
  }

  async resendPasswordResetOtp(email: string) {
    const user = await this.usuarioRepository.findOne({ where: { email } });

    if (!user) throw new BadRequestException('El usuario no existe.');

    const otp = this.generateOtp();
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    user.passwordResetOTP = otp;
    user.passwordResetExpires = expires;
    await this.usuarioRepository.save(user);

    await this.mailService.sendPasswordResetOtp(email, otp);

    return { message: 'Se ha reenviado el código OTP.' };
  }

  async resetPassword(otp: string, newPassword: string) {
    const user = await this.usuarioRepository.findOne({
      where: {
        passwordResetOTP: otp,
        passwordResetExpires: MoreThan(new Date()),
      },
    });

    if (!user) throw new BadRequestException('Código OTP inválido o expirado');

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newPassword, salt);

    user.password = hashed;
    user.passwordResetOTP = null;
    user.passwordResetExpires = null;

    await this.usuarioRepository.save(user);

    return { message: 'Contraseña restablecida correctamente' };
  }
}
