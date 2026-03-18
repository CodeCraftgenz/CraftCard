/**
 * Serviço de autenticação do CraftCard.
 *
 * Suporta dois métodos de login:
 * - Google OAuth (principal) — verifica o ID token do Google e cria/vincula conta
 * - Email/senha (nativo) — com bcrypt para hash de senha
 *
 * Funcionalidades de segurança:
 * - JWT access token (curta duração, ~15min) + refresh token (longa duração, ~7d)
 * - Refresh tokens armazenados como hash SHA-256 no banco
 * - Detecção de replay: reutilização de refresh token revoga TODAS as sessões
 * - 2FA/TOTP com códigos de backup descartáveis
 * - Reset de senha via token com expiração de 1 hora
 *
 * Vinculação de contas: se o email já existe (Google ou nativo),
 * o outro método de login é vinculado à conta existente.
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import { createHash, randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import * as OTPAuth from 'otpauth';
import * as QRCode from 'qrcode';
import { PrismaService } from '../common/prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { AppException } from '../common/exceptions/app.exception';
import type { EnvConfig } from '../common/config/env.config';

// 12 rounds de bcrypt — bom equilíbrio entre segurança e performance
const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly googleClient: OAuth2Client;

  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
    private readonly orgService: OrganizationsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<EnvConfig>,
  ) {
    // Client OAuth2 do Google — usado para verificar ID tokens
    this.googleClient = new OAuth2Client(this.configService.get('GOOGLE_CLIENT_ID', { infer: true }));
  }

  /**
   * Login via Google OAuth.
   *
   * Fluxo:
   * 1. Verifica o ID token do Google (assinatura + audience)
   * 2. Procura usuário pelo Google ID
   * 3. Se não encontrar: verifica se email já existe (conta nativa) → vincula Google
   * 4. Se email não existe: cria novo usuário com perfil padrão e slug único
   * 5. Envia email de boas-vindas para novos usuários
   * 6. Gera par access token + refresh token
   */
  async loginWithGoogle(credential: string) {
    const googlePayload = await this.verifyGoogleToken(credential);

    let user = await this.usersService.findByGoogleId(googlePayload.sub);

    if (!user) {
      // Se já existe conta nativa com este email, vincula o Google ID
      const existingByEmail = await this.usersService.findByEmail(googlePayload.email!);
      if (existingByEmail) {
        await this.usersService.addGoogleIdToUser(existingByEmail.id, googlePayload.sub, googlePayload.picture);
        user = (await this.usersService.findById(existingByEmail.id))!;
        this.logger.log(`Linked Google account to existing user: ${user.email}`);
      } else {
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

        // Send welcome email (fire-and-forget)
        this.mailService.sendWelcome(user.email, user.name).catch(() => {});
      }
    }

    const accessToken = this.generateAccessToken(user.id, user.email, user.role);
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

  /**
   * Registro de novo usuário via email/senha.
   * Se o email já existe com conta Google (sem senha), vincula a senha à conta existente.
   * Se inviteToken for fornecido, aceita automaticamente o convite de organização.
   */
  async register(email: string, name: string, password: string, inviteToken?: string) {
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const existing = await this.usersService.findByEmail(email);

    let user: { id: string; email: string; name: string; avatarUrl: string | null; role: string };

    if (existing) {
      if (existing.passwordHash) {
        throw AppException.conflict('Email já cadastrado');
      }
      // Has Google account but no password → link (add password)
      await this.usersService.addPasswordToUser(existing.id, passwordHash);
      user = existing;
      this.logger.log(`Linked password to existing Google user: ${email}`);
    } else {
      // Brand new native user
      user = await this.usersService.createNative({ email, name, passwordHash });

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

      this.logger.log(`New native user created: ${email}`);
      this.mailService.sendWelcome(email, name).catch(() => {});
    }

    const accessToken = this.generateAccessToken(user.id, user.email, user.role);
    const refreshToken = await this.generateRefreshToken(user.id);

    // Auto-consume invite token if provided
    let joinedOrg: { id: string; name: string; slug: string } | undefined;
    if (inviteToken) {
      try {
        const result = await this.orgService.acceptInvite(inviteToken, user.id);
        joinedOrg = result.organization as { id: string; name: string; slug: string };
        this.logger.log(`User ${email} auto-joined org via invite`);
      } catch (err) {
        this.logger.warn(`Auto-join invite failed for ${email}: ${(err as Error).message}`);
      }
    }

    return {
      user: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl },
      accessToken,
      refreshToken,
      joinedOrg,
    };
  }

  /**
   * Login via email/senha.
   * Se o usuário tem 2FA ativo, retorna requires2FA=true sem emitir tokens —
   * o frontend deve chamar loginWith2FA com o código TOTP.
   */
  async loginWithPassword(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw AppException.unauthorized('Credenciais invalidas');
    }

    if (!user.passwordHash) {
      throw AppException.unauthorized('Use o login com Google para está conta');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw AppException.unauthorized('Credenciais invalidas');
    }

    // Se 2FA está ativo, retornar flag sem emitir tokens
    if (user.totpEnabled) {
      return {
        requires2FA: true,
        user: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl },
        accessToken: null,
        refreshToken: null,
      };
    }

    const accessToken = this.generateAccessToken(user.id, user.email, user.role);
    const refreshToken = await this.generateRefreshToken(user.id);

    return {
      requires2FA: false,
      user: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Inicia o fluxo de recuperação de senha.
   * Gera um token aleatório (64 chars hex), armazena o hash SHA-256 no banco
   * e envia o link de reset por email. Token expira em 1 hora.
   *
   * Se o email não existe, retorna silenciosamente (não revela se email é cadastrado).
   */
  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) return; // Não revela se o email existe no sistema

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.usersService.setPasswordResetToken(user.id, tokenHash, expiresAt);

    const frontendUrl = this.configService.get('FRONTEND_URL', { infer: true }) || 'https://craftcardgenz.com';
    await this.mailService.sendPasswordReset(user.email, `${frontendUrl}/reset-password?token=${rawToken}`);

    this.logger.log(`Password reset email sent to ${email}`);
  }

  /** Conclui o reset de senha: valida o token, atualiza a senha e revoga todas as sessões por segurança */
  async resetPassword(token: string, newPassword: string) {
    const tokenHash = this.hashToken(token);
    const user = await this.usersService.findByPasswordResetToken(tokenHash);

    if (!user) {
      throw AppException.badRequest('Token inválido ou expirado');
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.usersService.updatePassword(user.id, passwordHash);
    await this.usersService.clearPasswordResetToken(user.id);

    // Revoke all refresh tokens for security
    await this.revokeAllUserTokens(user.id);

    this.logger.log(`Password reset completed for ${user.email}`);
  }

  /**
   * Rotação de tokens (refresh token rotation).
   *
   * Segurança: implementa detecção de replay — se um token já revogado
   * for reutilizado (ex: roubo), TODAS as sessões do usuário são encerradas.
   * Isso força o atacante e o usuário legítimo a fazer login novamente.
   */
  async refreshTokens(currentRefreshToken: string) {
    const tokenHash = this.hashToken(currentRefreshToken);

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!storedToken) {
      throw AppException.unauthorized('Token inválido');
    }

    // Detecção de replay: token já revogado sendo reutilizado → possível roubo
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
    const accessToken = this.generateAccessToken(storedToken.user.id, storedToken.user.email, storedToken.user.role);
    const newRefreshToken = await this.generateRefreshToken(storedToken.userId);

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  /** Logout: revoga o refresh token atual (o access token expira naturalmente) */
  async logout(refreshToken: string) {
    if (!refreshToken) return;
    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /** Verifica o ID token do Google (assinatura RSA + audience match) */
  private async verifyGoogleToken(credential: string) {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: credential,
        audience: this.configService.get('GOOGLE_CLIENT_ID', { infer: true }),
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        throw AppException.unauthorized('Google token inválido');
      }
      return payload;
    } catch (error) {
      if (error instanceof AppException) throw error;
      this.logger.error('Google token verification failed', error);
      throw AppException.unauthorized('Falha na verificacao do Google');
    }
  }

  /** Gera JWT access token de curta duração (padrão 15min) com sub, email e role */
  private generateAccessToken(userId: string, email: string, role: string = 'USER'): string {
    return this.jwtService.sign(
      { sub: userId, email, role },
      {
        secret: this.configService.get('JWT_SECRET', { infer: true }),
        expiresIn: this.configService.get('JWT_EXPIRES_IN', { infer: true }) || '15m',
      },
    );
  }

  /**
   * Gera refresh token de longa duração (padrão 7d).
   * O token bruto é retornado ao cliente; apenas o hash SHA-256 é armazenado no banco.
   * Isso garante que, mesmo com vazamento do banco, os tokens não podem ser usados.
   */
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

  /** Hash SHA-256 de tokens — usado para refresh tokens e tokens de reset de senha */
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /** Revoga todos os refresh tokens do usuário (usado em reset de senha e detecção de replay) */
  private async revokeAllUserTokens(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  // ──────────────────────────────────────────────
  // 2FA / TOTP (Autenticação em Dois Fatores)
  // ──────────────────────────────────────────────

  /**
   * Configura o 2FA para o usuário.
   * Gera um secret TOTP, salva no banco (ainda NÃO ativado) e retorna
   * o QR code para o usuário escanear no app autenticador (Google Authenticator, etc).
   * A ativação acontece após o usuário confirmar com um código válido via verifyAndEnableTotp.
   */
  async setupTotp(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw AppException.notFound('Usuário');

    if (user.totpEnabled) {
      throw AppException.conflict('2FA já está ativado');
    }

    const secret = new OTPAuth.Secret({ size: 20 });
    const totp = new OTPAuth.TOTP({
      issuer: 'CraftCard',
      label: user.email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret,
    });

    // Salvar o secret (aindanão ativado — será ativado apos verificar código)
    await this.usersService.setTotpSecret(userId, secret.base32);

    const otpauthUrl = totp.toString();
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    return {
      secret: secret.base32,
      qrCode: qrCodeDataUrl,
      otpauthUrl,
    };
  }

  /**
   * Verifica o código TOTP e ativa o 2FA.
   * Gera 8 códigos de backup descartáveis para caso o usuário perca o celular.
   * Window=1 permite 1 período de tolerância (30s antes/depois).
   */
  async verifyAndEnableTotp(userId: string, code: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw AppException.notFound('Usuário');
    if (user.totpEnabled) throw AppException.conflict('2FA já está ativado');
    if (!user.totpSecret) throw AppException.badRequest('Configure o 2FA primeiro (POST /auth/setup-2fa)');

    const totp = new OTPAuth.TOTP({
      issuer: 'CraftCard',
      label: user.email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(user.totpSecret),
    });

    const delta = totp.validate({ token: code, window: 1 });
    if (delta === null) {
      throw AppException.unauthorized('Código TOTP inválido');
    }

    // Gerar 8 códigos de backup
    const backupCodes = Array.from({ length: 8 }, () =>
      randomBytes(4).toString('hex'),
    );

    await this.usersService.enableTotp(userId, backupCodes);

    this.logger.log(`2FA enabled for user ${user.email}`);

    return { enabled: true, backupCodes };
  }

  /** Desativa o 2FA — exige um código TOTP válido para confirmar a identidade */
  async disableTotp(userId: string, code: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw AppException.notFound('Usuário');
    if (!user.totpEnabled) throw AppException.badRequest('2FAnão está ativado');

    // Verificar código antes de desativar
    const totp = new OTPAuth.TOTP({
      issuer: 'CraftCard',
      label: user.email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(user.totpSecret!),
    });

    const delta = totp.validate({ token: code, window: 1 });
    if (delta === null) {
      throw AppException.unauthorized('Código TOTP inválido');
    }

    await this.usersService.disableTotp(userId);
    this.logger.log(`2FA disabled for user ${user.email}`);

    return { disabled: true };
  }

  /**
   * Login com segundo fator (2FA).
   * Aceita código TOTP (6 dígitos) OU código de backup (hex 8 chars).
   * Códigos de backup são descartáveis — consumidos após o uso.
   */
  async loginWith2FA(email: string, code: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.totpEnabled) {
      throw AppException.unauthorized('Credenciais invalidas');
    }

    // Tentar como código TOTP (6 digitos)
    if (/^\d{6}$/.test(code)) {
      const totp = new OTPAuth.TOTP({
        issuer: 'CraftCard',
        label: user.email,
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(user.totpSecret!),
      });

      const delta = totp.validate({ token: code, window: 1 });
      if (delta === null) {
        throw AppException.unauthorized('Código TOTP inválido');
      }
    } else {
      // Tentar como código de backup
      const backupCodes: string[] = user.totpBackupCodes ? JSON.parse(user.totpBackupCodes) : [];
      const codeIndex = backupCodes.indexOf(code);

      if (codeIndex === -1) {
        throw AppException.unauthorized('Código inválido');
      }

      // Consumir o código de backup (one-time use)
      backupCodes.splice(codeIndex, 1);
      await this.usersService.consumeBackupCode(user.id, backupCodes);
      this.logger.log(`Backup code used for ${user.email}, ${backupCodes.length} remaining`);
    }

    const accessToken = this.generateAccessToken(user.id, user.email, user.role);
    const refreshToken = await this.generateRefreshToken(user.id);

    return {
      user: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Login de desenvolvimento — cria ou reutiliza um usuário fake.
   * BLOQUEADO em produção. Usado apenas para testes locais sem OAuth real.
   */
  async devLogin(email: string, name: string) {
    if (process.env.NODE_ENV === 'production') {
      throw AppException.forbidden('Dev loginnão disponivel em producao');
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

    const accessToken = this.generateAccessToken(user.id, user.email, user.role);
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

  /** Gera slug a partir do nome: remove acentos, caracteres especiais, normaliza espaços */
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

  /** Garante slug único: tenta base, depois base-2, base-3... até base-100, depois fallback com hex aleatório */
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
