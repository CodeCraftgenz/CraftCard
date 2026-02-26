import { Controller, Post, Body, Res, Req, HttpException, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { Public } from '../common/decorators/public.decorator';
import { googleAuthSchema } from './dto/google-auth.dto';

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
  @Throttle({ medium: { limit: 5, ttl: 60000 } })
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
  @Post('dev')
  async devLogin(@Body() body: { email?: string; name?: string }, @Res({ passthrough: true }) res: Response) {
    const email = body.email || 'dev@craftcard.local';
    const name = body.name || 'Dev User';
    const result = await this.authService.devLogin(email, name);

    res.cookie(REFRESH_COOKIE, result.refreshToken, COOKIE_OPTIONS);

    return {
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  @Public()
  @Throttle({ medium: { limit: 5, ttl: 60000 } })
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
