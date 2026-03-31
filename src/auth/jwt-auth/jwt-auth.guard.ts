import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];
    // Depuración: mostrar el header de autorización recibido
    //console.log('Header recibido en backend:', authHeader || 'No llegó header');
    return super.canActivate(context);
  }
}
