import { Controller, Post, Body, Res, Req, HttpException, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser, type JwtPayload } from '../common/decorators/current-user.decorator';
import { googleAuthSchema } from './dto/google-auth.dto';
import { registerSchema } from './dto/register.dto';
import { loginSchema } from './dto/login.dto';
import { forgotPasswordSchema, resetPasswordSchema } from './dto/reset-password.dto';
import { verifyTotpSchema, loginTotpSchema, disableTotpSchema } from './dto/totp.dto';

const REFRESH_COOKIE = 'refreshToken';
const isProduction = process.env.NODE_ENV === 'production';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ strict: { limit: 10, ttl: 300000 } })
  @Post('google')
  async googleLogin(@Body() body: unknown, @Res({ passthrough: true }) res: Response) {
    const { credential } = googleAuthSchema.parse(body);
    const result = await this.authService.loginWithGoogle(credential);

    res.cookie(REFRESH_COOKIE, result.refreshToken, COOKIE_OPTIONS);

    return {
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  @Public()
  @Throttle({ strict: { limit: 10, ttl: 300000 } })
  @Post('register')
  async register(@Body() body: unknown, @Res({ passthrough: true }) res: Response) {
    const { email, name, password, inviteToken } = registerSchema.parse(body);
    const result = await this.authService.register(email, name, password, inviteToken);

    res.cookie(REFRESH_COOKIE, result.refreshToken, COOKIE_OPTIONS);

    return {
      user: result.user,
      accessToken: result.accessToken,
      joinedOrg: result.joinedOrg,
    };
  }

  @Public()
  @Throttle({ strict: { limit: 10, ttl: 300000 } })
  @Post('login')
  async login(@Body() body: unknown, @Res({ passthrough: true }) res: Response) {
    const { email, password } = loginSchema.parse(body);
    const result = await this.authService.loginWithPassword(email, password);

    // Se 2FA está ativo, retornar sem tokens (frontend deve chamar /auth/login-2fa)
    if (result.requires2FA) {
      return {
        requires2FA: true,
        user: { email: result.user.email },
      };
    }

    res.cookie(REFRESH_COOKIE, result.refreshToken!, COOKIE_OPTIONS);

    return {
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  @Public()
  @Throttle({ strict: { limit: 5, ttl: 300000 } })
  @Post('forgot-password')
  async forgotPassword(@Body() body: unknown) {
    const { email } = forgotPasswordSchema.parse(body);
    await this.authService.forgotPassword(email);
    return { message: 'Se o email existir, enviaremos um link de recuperacao' };
  }

  @Public()
  @Throttle({ strict: { limit: 5, ttl: 300000 } })
  @Post('reset-password')
  async resetPassword(@Body() body: unknown) {
    const { token, password } = resetPasswordSchema.parse(body);
    await this.authService.resetPassword(token, password);
    return { message: 'Senha redefinida com sucesso' };
  }

  // ── 2FA / TOTP ──────────────────────────────

  @Throttle({ strict: { limit: 5, ttl: 300000 } })
  @Post('setup-2fa')
  async setup2FA(@CurrentUser() user: JwtPayload) {
    return this.authService.setupTotp(user.sub);
  }

  @Throttle({ strict: { limit: 5, ttl: 300000 } })
  @Post('verify-2fa-setup')
  async verify2FASetup(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    const { code } = verifyTotpSchema.parse(body);
    return this.authService.verifyAndEnableTotp(user.sub, code);
  }

  @Throttle({ strict: { limit: 5, ttl: 300000 } })
  @Post('disable-2fa')
  async disable2FA(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    const { code } = disableTotpSchema.parse(body);
    return this.authService.disableTotp(user.sub, code);
  }

  @Public()
  @Throttle({ strict: { limit: 10, ttl: 300000 } })
  @Post('login-2fa')
  async login2FA(@Body() body: unknown, @Res({ passthrough: true }) res: Response) {
    const { email, code } = loginTotpSchema.parse(body);
    const result = await this.authService.loginWith2FA(email, code);

    res.cookie(REFRESH_COOKIE, result.refreshToken, COOKIE_OPTIONS);

    return {
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  @Public()
  @Throttle({ strict: { limit: 15, ttl: 300000 } })
  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const currentToken = req.cookies?.[REFRESH_COOKIE];
    if (!currentToken) {
      throw new HttpException({ code: 'UNAUTHORIZED', message: 'No refresh token' }, HttpStatus.UNAUTHORIZED);
    }

    const result = await this.authService.refreshTokens(currentToken);

    res.cookie(REFRESH_COOKIE, result.refreshToken, COOKIE_OPTIONS);

    return {
      accessToken: result.accessToken,
    };
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const currentToken = req.cookies?.[REFRESH_COOKIE];
    await this.authService.logout(currentToken);
    res.clearCookie(REFRESH_COOKIE, { path: '/' });
    return { message: 'Logout realizado' };
  }
}
