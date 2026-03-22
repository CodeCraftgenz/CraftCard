import { Injectable, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Guard global de autenticacao JWT.
 * Protege todas as rotas por padrao. Rotas decoradas com @Public() sao liberadas.
 * Usa o Reflector do NestJS para verificar o metadata IS_PUBLIC_KEY.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Verifica se a rota esta marcada como publica (decorator @Public)
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    // Rotas protegidas: delega validacao do JWT para passport
    return super.canActivate(context);
  }
}
