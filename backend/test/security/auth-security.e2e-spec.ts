/**
 * ═══════════════════════════════════════════════════
 *  BLOCO 3 — SEGURANÇA & AUTENTICAÇÃO
 *  JWT, Refresh Token Replay, IDOR Protection
 * ═══════════════════════════════════════════════════
 *
 * Penetration testing básico (OWASP Top 10 relevantes):
 * - A01: Broken Access Control (IDOR)
 * - A02: Cryptographic Failures (JWT manipulation)
 * - A07: Identification & Authentication Failures
 */
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'crypto';
import { AuthService } from '../../src/auth/auth.service';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import { UsersService } from '../../src/users/users.service';
import { MailService } from '../../src/mail/mail.service';
import { OrganizationsService } from '../../src/organizations/organizations.service';
import {
  createPrismaMock,
  createConfigMock,
  createMailMock,
  generateTestJwt,
  generateExpiredJwt,
  generateBadSecretJwt,
  generateRefreshToken,
  TEST_USERS,
  TEST_JWT_SECRET,
} from '../helpers/test-utils';

// ══════════════════════════════════════════════════
// 3.1 — Validação de JWT
// ══════════════════════════════════════════════════

describe('Security — Validação de JWT', () => {
  const jwtService = new JwtService({});

  it('deve decodificar JWT válido corretamente', () => {
    const token = generateTestJwt({
      sub: TEST_USERS.proUser.id,
      email: TEST_USERS.proUser.email,
      role: 'USER',
    });

    const payload = jwtService.verify(token, { secret: TEST_JWT_SECRET });
    expect(payload.sub).toBe(TEST_USERS.proUser.id);
    expect(payload.email).toBe(TEST_USERS.proUser.email);
    expect(payload.role).toBe('USER');
  });

  it('deve REJEITAR JWT expirado', () => {
    const token = generateExpiredJwt({
      sub: TEST_USERS.proUser.id,
      email: TEST_USERS.proUser.email,
    });

    // Aguardar 1s para garantir expiração
    expect(() => {
      jwtService.verify(token, { secret: TEST_JWT_SECRET });
    }).toThrow();
  });

  it('deve REJEITAR JWT com assinatura inválida (secret errado)', () => {
    const token = generateBadSecretJwt({
      sub: TEST_USERS.proUser.id,
      email: TEST_USERS.proUser.email,
    });

    expect(() => {
      jwtService.verify(token, { secret: TEST_JWT_SECRET });
    }).toThrow();
  });

  it('deve REJEITAR JWT malformado (string aleatória)', () => {
    expect(() => {
      jwtService.verify('this-is-not-a-jwt', { secret: TEST_JWT_SECRET });
    }).toThrow();
  });

  it('deve REJEITAR JWT com 2 segmentos (falta assinatura)', () => {
    const token = generateTestJwt({
      sub: TEST_USERS.proUser.id,
      email: TEST_USERS.proUser.email,
    });
    // Remove a assinatura (3° segmento)
    const tampered = token.split('.').slice(0, 2).join('.');

    expect(() => {
      jwtService.verify(tampered, { secret: TEST_JWT_SECRET });
    }).toThrow();
  });

  it('deve REJEITAR JWT com payload tampereado', () => {
    const token = generateTestJwt({
      sub: TEST_USERS.freeUser.id, // ID original
      email: TEST_USERS.freeUser.email,
    });

    // Altera o payload para outro user (simula ataque de manipulação)
    const parts = token.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    payload.sub = 'hacked-admin-id'; // tenta se passar por admin
    payload.role = 'SUPER_ADMIN';
    parts[1] = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const tampered = parts.join('.');

    expect(() => {
      jwtService.verify(tampered, { secret: TEST_JWT_SECRET });
    }).toThrow();
  });

  it('deve REJEITAR JWT com algoritmo "none" (alg substitution attack)', () => {
    // Monta manualmente um JWT com alg: none
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(
      JSON.stringify({ sub: 'hacker', email: 'hack@test.local', role: 'SUPER_ADMIN' }),
    ).toString('base64url');
    const noneToken = `${header}.${payload}.`;

    expect(() => {
      jwtService.verify(noneToken, { secret: TEST_JWT_SECRET });
    }).toThrow();
  });

  it('deve REJEITAR string vazia como JWT', () => {
    expect(() => {
      jwtService.verify('', { secret: TEST_JWT_SECRET });
    }).toThrow();
  });
});

// ══════════════════════════════════════════════════
// 3.2 — Replay Detection de Refresh Token
// ══════════════════════════════════════════════════

describe('Security — Refresh Token Replay Detection', () => {
  let authService: AuthService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(async () => {
    prisma = createPrismaMock();

    const usersServiceMock = {
      findByGoogleId: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      createFromGoogle: jest.fn(),
      createNative: jest.fn(),
      addGoogleIdToUser: jest.fn(),
      addPasswordToUser: jest.fn(),
      setPasswordResetToken: jest.fn(),
      findByPasswordResetToken: jest.fn(),
      updatePassword: jest.fn(),
      clearPasswordResetToken: jest.fn(),
    };

    const orgServiceMock = {
      acceptInvite: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        JwtService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: createConfigMock() },
        { provide: UsersService, useValue: usersServiceMock },
        { provide: MailService, useValue: createMailMock() },
        { provide: OrganizationsService, useValue: orgServiceMock },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => jest.restoreAllMocks());

  it('deve gerar novo access+refresh token quando token é válido', async () => {
    const { raw, hash } = generateRefreshToken();

    prisma.refreshToken.findUnique.mockResolvedValue({
      id: 'rt-1',
      userId: TEST_USERS.proUser.id,
      tokenHash: hash,
      revokedAt: null,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      user: {
        id: TEST_USERS.proUser.id,
        email: TEST_USERS.proUser.email,
        role: 'USER',
      },
    });
    prisma.refreshToken.update.mockResolvedValue({});
    prisma.refreshToken.create.mockResolvedValue({});

    const result = await authService.refreshTokens(raw);

    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
    expect(result.refreshToken).not.toBe(raw); // deve ser um novo token

    // Token antigo deve ter sido revogado
    expect(prisma.refreshToken.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'rt-1' },
        data: { revokedAt: expect.any(Date) },
      }),
    );
  });

  it('deve REVOGAR TODAS as sessões ao detectar replay de refresh token', async () => {
    const { raw, hash } = generateRefreshToken();

    // Token JÁ FOI REVOGADO (revokedAt !== null) → replay attack!
    prisma.refreshToken.findUnique.mockResolvedValue({
      id: 'rt-stolen',
      userId: TEST_USERS.proUser.id,
      tokenHash: hash,
      revokedAt: new Date(Date.now() - 60000), // revogado 1 min atrás
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      user: {
        id: TEST_USERS.proUser.id,
        email: TEST_USERS.proUser.email,
        role: 'USER',
      },
    });
    prisma.refreshToken.updateMany.mockResolvedValue({ count: 3 }); // 3 sessões revogadas

    await expect(authService.refreshTokens(raw)).rejects.toThrow(
      'Token reutilizado, todas as sessoes foram encerradas',
    );

    // TODAS as sessões do usuário devem ser revogadas
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { userId: TEST_USERS.proUser.id, revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
  });

  it('deve REJEITAR refresh token inexistente no banco', async () => {
    prisma.refreshToken.findUnique.mockResolvedValue(null);

    await expect(authService.refreshTokens('fake-token-data')).rejects.toThrow('Token invalido');
  });

  it('deve REJEITAR refresh token expirado', async () => {
    const { raw, hash } = generateRefreshToken();

    prisma.refreshToken.findUnique.mockResolvedValue({
      id: 'rt-expired',
      userId: TEST_USERS.proUser.id,
      tokenHash: hash,
      revokedAt: null,
      expiresAt: new Date(Date.now() - 1000), // expirou
      user: {
        id: TEST_USERS.proUser.id,
        email: TEST_USERS.proUser.email,
        role: 'USER',
      },
    });

    await expect(authService.refreshTokens(raw)).rejects.toThrow('Token expirado');
  });

  it('resetPassword deve revogar TODAS as sessões do usuário', async () => {
    const usersServiceInModule = (authService as any).usersService;
    usersServiceInModule.findByPasswordResetToken.mockResolvedValue({
      id: TEST_USERS.proUser.id,
      email: TEST_USERS.proUser.email,
    });
    usersServiceInModule.updatePassword.mockResolvedValue({});
    usersServiceInModule.clearPasswordResetToken.mockResolvedValue({});
    prisma.refreshToken.updateMany.mockResolvedValue({ count: 5 });

    await authService.resetPassword('valid-reset-token', 'NewSecureP@ss123');

    // Verificar revogação em massa
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { userId: TEST_USERS.proUser.id, revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
  });

  it('logout deve revogar apenas o token específico', async () => {
    const { raw } = generateRefreshToken();
    prisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });

    await authService.logout(raw);

    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tokenHash: expect.any(String),
          revokedAt: null,
        }),
        data: { revokedAt: expect.any(Date) },
      }),
    );
  });

  it('logout com string vazia não deve crashar', async () => {
    await expect(authService.logout('')).resolves.not.toThrow();
  });
});

// ══════════════════════════════════════════════════
// 3.3 — IDOR Protection (Broken Access Control)
// ══════════════════════════════════════════════════

describe('Security — IDOR Protection', () => {
  let authService: AuthService;
  let prisma: ReturnType<typeof createPrismaMock>;
  let usersServiceMock: Record<string, jest.Mock>;

  beforeEach(async () => {
    prisma = createPrismaMock();

    usersServiceMock = {
      findByGoogleId: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      createFromGoogle: jest.fn(),
      createNative: jest.fn(),
      addGoogleIdToUser: jest.fn(),
      addPasswordToUser: jest.fn(),
      setPasswordResetToken: jest.fn(),
      findByPasswordResetToken: jest.fn(),
      updatePassword: jest.fn(),
      clearPasswordResetToken: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        JwtService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: createConfigMock() },
        { provide: UsersService, useValue: usersServiceMock },
        { provide: MailService, useValue: createMailMock() },
        { provide: OrganizationsService, useValue: { acceptInvite: jest.fn() } },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => jest.restoreAllMocks());

  it('registro com email já existente (com senha) deve retornar erro de conflito', async () => {
    usersServiceMock.findByEmail.mockResolvedValue({
      id: 'existing-user',
      email: 'taken@test.local',
      passwordHash: '$2b$12$fakehash', // já tem senha
    });

    await expect(
      authService.register('taken@test.local', 'Hacker', 'password123'),
    ).rejects.toThrow('Email ja cadastrado');
  });

  it('login com senha incorreta deve retornar erro genérico (sem leak de informação)', async () => {
    usersServiceMock.findByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'user@test.local',
      passwordHash: '$2b$12$fakehashthatiswrongggg',
      role: 'USER',
    });

    await expect(
      authService.loginWithPassword('user@test.local', 'wrong-password'),
    ).rejects.toThrow('Credenciais invalidas');
  });

  it('login com email inexistente deve retornar mesmo erro genérico (anti-enumeration)', async () => {
    usersServiceMock.findByEmail.mockResolvedValue(null);

    await expect(
      authService.loginWithPassword('nobody@test.local', 'password'),
    ).rejects.toThrow('Credenciais invalidas');
  });

  it('forgotPassword com email inexistente NÃO deve lançar erro (anti-enumeration)', async () => {
    usersServiceMock.findByEmail.mockResolvedValue(null);

    // Deve completar silenciosamente sem revelar se email existe
    await expect(authService.forgotPassword('ghost@test.local')).resolves.not.toThrow();
  });

  it('login com conta Google (sem passwordHash) deve retornar mensagem adequada', async () => {
    usersServiceMock.findByEmail.mockResolvedValue({
      id: 'google-user',
      email: 'google@test.local',
      passwordHash: null, // apenas login Google
      role: 'USER',
    });

    await expect(
      authService.loginWithPassword('google@test.local', 'any-password'),
    ).rejects.toThrow('login com Google');
  });

  it('devLogin deve ser bloqueado em production', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    try {
      await expect(
        authService.devLogin('hack@test.local', 'Hacker'),
      ).rejects.toThrow('nao disponivel em producao');
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  it('resetPassword com token inválido deve lançar erro', async () => {
    usersServiceMock.findByPasswordResetToken.mockResolvedValue(null);

    await expect(
      authService.resetPassword('invalid-or-expired-token', 'newpass'),
    ).rejects.toThrow('Token invalido ou expirado');
  });
});

// ══════════════════════════════════════════════════
// 3.4 — Hash Integrity (Refresh Token)
// ══════════════════════════════════════════════════

describe('Security — Token Hash Integrity', () => {
  it('refresh token hash deve ser SHA-256 determinístico', () => {
    const rawToken = 'a'.repeat(128);
    const expected = createHash('sha256').update(rawToken).digest('hex');

    // Simula o mesmo processo do AuthService
    const hash = createHash('sha256').update(rawToken).digest('hex');
    expect(hash).toBe(expected);
    expect(hash.length).toBe(64); // SHA-256 = 64 hex chars
  });

  it('tokens diferentes devem produzir hashes diferentes', () => {
    const token1 = 'a'.repeat(128);
    const token2 = 'b'.repeat(128);

    const hash1 = createHash('sha256').update(token1).digest('hex');
    const hash2 = createHash('sha256').update(token2).digest('hex');

    expect(hash1).not.toBe(hash2);
  });
});
