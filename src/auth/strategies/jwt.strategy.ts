import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/shared/entities/user.entity';


@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly usuarioRepo: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_SECRET') ||
        'fallback_secret_key_123456789',
    });
  }

  async validate(payload: any) {
    //depuración: mostrar el payload recibido
    //console.log('Payload del JWT recibido en backend:', payload);
    const user = await this.usuarioRepo.findOne({
      where: { id_usuario: payload.sub },
      relations: ['rol'],
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado o token inválido');
    }

    return user;
  }
}
