import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../common/prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { AppException } from '../common/exceptions/app.exception';
import type { EnvConfig } from '../common/config/env.config';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly googleClient: OAuth2Client;

  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<EnvConfig>,
  ) {
    this.googleClient = new OAuth2Client(this.configService.get('GOOGLE_CLIENT_ID', { infer: true }));
  }

  async loginWithGoogle(credential: string) {
    const googlePayload = await this.verifyGoogleToken(credential);

    let user = await this.usersService.findByGoogleId(googlePayload.sub);

    if (!user) {
      user = await this.usersService.createFromGoogle({
        email: googlePayload.email!,
        name: googlePayload.name || googlePayload.email!.split('@')[0],
        googleId: googlePayload.sub,
        avatarUrl: googlePayload.picture,
      });

      // Create initial profile with auto-generated slug
      const baseSlug = this.generateSlugFromName(user.name);
      const uniqueSlug = await this.ensureUniqueSlug(baseSlug);

      await this.prisma.profile.create({
        data: {
          userId: user.id,
          displayName: user.name,
          slug: uniqueSlug,
          photoUrl: user.avatarUrl,
          label: 'Principal',
          isPrimary: true,
        },
      });

      this.logger.log(`New user created: ${user.email}`);
    }

    const accessToken = this.generateAccessToken(user.id, user.email);
    const refreshToken = await this.generateRefreshToken(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
      accessToken,
      refreshToken,
    };
  }

  async refreshTokens(currentRefreshToken: string) {
    const tokenHash = this.hashToken(currentRefreshToken);

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!storedToken) {
      throw AppException.unauthorized('Token invalido');
    }

    // Replay detection: if token was already revoked, revoke all user tokens
    if (storedToken.revokedAt) {
      this.logger.warn(`Refresh token replay detected for user ${storedToken.userId}`);
      await this.revokeAllUserTokens(storedToken.userId);
      throw AppException.unauthorized('Token reutilizado, todas as sessoes foram encerradas');
    }

    if (storedToken.expiresAt < new Date()) {
      throw AppException.unauthorized('Token expirado');
    }

    // Revoke old token
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    // Generate new pair
    const accessToken = this.generateAccessToken(storedToken.user.id, storedToken.user.email);
    const newRefreshToken = await this.generateRefreshToken(storedToken.userId);

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(refreshToken: string) {
    if (!refreshToken) return;
    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async verifyGoogleToken(credential: string) {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: credential,
        audience: this.configService.get('GOOGLE_CLIENT_ID', { infer: true }),
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        throw AppException.unauthorized('Google token invalido');
      }
      return payload;
    } catch (error) {
      if (error instanceof AppException) throw error;
      this.logger.error('Google token verification failed', error);
      throw AppException.unauthorized('Falha na verificacao do Google');
    }
  }

  private generateAccessToken(userId: string, email: string): string {
    return this.jwtService.sign(
      { sub: userId, email },
      {
        secret: this.configService.get('JWT_SECRET', { infer: true }),
        expiresIn: this.configService.get('JWT_EXPIRES_IN', { infer: true }) || '15m',
      },
    );
  }

  private async generateRefreshToken(userId: string): Promise<string> {
    const token = randomBytes(64).toString('hex');
    const tokenHash = this.hashToken(token);

    const expiresIn = this.configService.get('REFRESH_TOKEN_EXPIRES_IN', { infer: true }) || '7d';
    const expiresAt = new Date();
    const days = parseInt(expiresIn.replace('d', ''));
    expiresAt.setDate(expiresAt.getDate() + (isNaN(days) ? 7 : days));

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    return token;
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private async revokeAllUserTokens(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async devLogin(email: string, name: string) {
    if (process.env.NODE_ENV === 'production') {
      throw AppException.forbidden('Dev login nao disponivel em producao');
    }

    const fakeGoogleId = `dev-${createHash('sha256').update(email).digest('hex').slice(0, 16)}`;

    let user = await this.usersService.findByGoogleId(fakeGoogleId);

    if (!user) {
      user = await this.usersService.createFromGoogle({
        email,
        name,
        googleId: fakeGoogleId,
        avatarUrl: undefined,
      });

      const baseSlug = this.generateSlugFromName(name);
      const uniqueSlug = await this.ensureUniqueSlug(baseSlug);

      await this.prisma.profile.create({
        data: {
          userId: user.id,
          displayName: name,
          slug: uniqueSlug,
          label: 'Principal',
          isPrimary: true,
        },
      });

      this.logger.log(`Dev user created: ${email}`);
    }

    const accessToken = this.generateAccessToken(user.id, user.email);
    const refreshToken = await this.generateRefreshToken(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
      accessToken,
      refreshToken,
    };
  }

  private generateSlugFromName(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40);
  }

  private async ensureUniqueSlug(baseSlug: string): Promise<string> {
    let slug = baseSlug || 'user';
    if (slug.length < 3) slug = slug + '-card';

    const existing = await this.prisma.profile.findUnique({ where: { slug } });
    if (!existing) return slug;

    for (let i = 2; i <= 100; i++) {
      const candidate = `${slug}-${i}`;
      const exists = await this.prisma.profile.findUnique({ where: { slug: candidate } });
      if (!exists) return candidate;
    }

    return `${slug}-${randomBytes(3).toString('hex')}`;
  }
}
