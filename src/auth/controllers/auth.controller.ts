import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { CreateUsuarioDto } from 'src/users/dto/create-usuario.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LoginDto } from '../dto/login.dto';
import { RequestPasswordResetDto } from 'src/mail/dto/request-password-reset.dto';
import { ResendPasswordResetDto } from 'src/mail/dto/resend-password-reset.dto';
import { ResetPasswordDto } from 'src/mail/dto/reset-password.dto';


@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Registrar un nuevo usuario' })
  @ApiResponse({ status: 201, description: 'Usuario registrado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Error al registrar el usuario.' })
  async registerUser(@Body() user: CreateUsuarioDto) {
    return this.authService.registerUser(user);
  }

  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiResponse({ status: 200, description: 'Inicio de sesión exitoso.' })
  @ApiResponse({ status: 401, description: 'Credenciales incorrectas.' })
  async login(@Body() loginDto: LoginDto) {
    const { email, password } = loginDto;
    return this.authService.login(email, password);
  }

  @Post('request-password-reset')
  @ApiOperation({ summary: 'Solicitar restablecimiento de contraseña' })
  @ApiResponse({ status: 200, description: 'OTP enviado al correo electrónico.' })
  @ApiResponse({ status: 400, description: 'Error al solicitar el restablecimiento de contraseña.' })
  async requestReset(@Body() dto: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(dto.email);
  }

  @Post('resend-password-reset')
  @ApiOperation({ summary: 'Reenviar OTP para restablecimiento de contraseña' })
  @ApiResponse({ status: 200, description: 'OTP reenviado al correo electrónico.' })
  @ApiResponse({ status: 400, description: 'Error al reenviar el OTP.' })
  async resendPasswordReset(@Body() dto: ResendPasswordResetDto) {
    return this.authService.resendPasswordResetOtp(dto.email);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Restablecer contraseña' })
  @ApiResponse({ status: 200, description: 'Contraseña restablecida exitosamente.' })
  @ApiResponse({ status: 400, description: 'Error al restablecer la contraseña.' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.otp, dto.newPassword);
  }
}
