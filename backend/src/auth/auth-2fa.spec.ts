/**
 * Auth Service — 2FA/TOTP Unit Tests
 * ====================================
 * Testa setup, verify+enable, disable e login com TOTP/backup codes.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as OTPAuth from 'otpauth';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { AppException } from '../common/exceptions/app.exception';
import {
  createPrismaMock,
  createConfigMock,
  createMailMock,
  TEST_USERS,
} from '../../test/helpers/test-utils';

// ── Helper: gerar TOTP valido para um secret ──
function generateValidTotp(secretBase32: string): string {
  const totp = new OTPAuth.TOTP({
    issuer: 'CraftCard',
    label: 'test@test.local',
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secretBase32),
  });
  return totp.generate();
}

describe('AuthService — 2FA/TOTP', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let prismaMock: ReturnType<typeof createPrismaMock>;

  // Real secret para testes
  const testSecret = new OTPAuth.Secret({ size: 20 });
  const testSecretBase32 = testSecret.base32;
  const testBackupCodes = ['a1b2c3d4', 'e5f6a7b8', '11223344', '55667788', 'aabbccdd', 'eeff0011', '99887766', 'ddeeff00'];

  const baseUser = {
    id: TEST_USERS.proUser.id,
    email: TEST_USERS.proUser.email,
    name: TEST_USERS.proUser.name,
    role: 'USER',
    avatarUrl: null,
    passwordHash: '$2b$12$fakehash',
    totpEnabled: false,
    totpSecret: null,
    totpBackupCodes: null,
    profiles: [],
  };

  beforeEach(async () => {
    prismaMock = createPrismaMock();
    const configMock = createConfigMock();
    const mailMock = createMailMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        UsersService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: new JwtService({}) },
        { provide: ConfigService, useValue: configMock },
        { provide: MailService, useValue: mailMock },
        { provide: OrganizationsService, useValue: { acceptInvite: jest.fn() } },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ──────────────────────────────────────────────
  // setupTotp
  // ──────────────────────────────────────────────

  describe('setupTotp', () => {
    it('deve retornar secret, qrCode e otpauthUrl', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ ...baseUser });
      prismaMock.user.update.mockResolvedValue({});

      const result = await authService.setupTotp(baseUser.id);

      expect(result).toHaveProperty('secret');
      expect(result).toHaveProperty('qrCode');
      expect(result).toHaveProperty('otpauthUrl');
      expect(result.secret).toHaveLength(32); // base32 de 20 bytes
      expect(result.qrCode).toMatch(/^data:image\/png;base64,/);
      expect(result.otpauthUrl).toContain('otpauth://totp/');
      expect(result.otpauthUrl).toContain('CraftCard');
    });

    it('deve salvar o secret no banco', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ ...baseUser });
      prismaMock.user.update.mockResolvedValue({});

      await authService.setupTotp(baseUser.id);

      expect(prismaMock.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: baseUser.id },
          data: { totpSecret: expect.any(String) },
        }),
      );
    });

    it('deve rejeitar se usuario nao existe', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(authService.setupTotp('non-existent')).rejects.toThrow(AppException);
    });

    it('deve rejeitar se 2FA ja esta ativado', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ ...baseUser, totpEnabled: true });

      await expect(authService.setupTotp(baseUser.id)).rejects.toThrow('2FA ja esta ativado');
    });
  });

  // ──────────────────────────────────────────────
  // verifyAndEnableTotp
  // ──────────────────────────────────────────────

  describe('verifyAndEnableTotp', () => {
    it('deve ativar 2FA com codigo TOTP valido', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        ...baseUser,
        totpSecret: testSecretBase32,
      });
      prismaMock.user.update.mockResolvedValue({});

      const validCode = generateValidTotp(testSecretBase32);
      const result = await authService.verifyAndEnableTotp(baseUser.id, validCode);

      expect(result.enabled).toBe(true);
      expect(result.backupCodes).toHaveLength(8);
      expect(result.backupCodes[0]).toHaveLength(8); // 4 bytes hex = 8 chars
    });

    it('deve salvar backup codes e habilitar totp', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        ...baseUser,
        totpSecret: testSecretBase32,
      });
      prismaMock.user.update.mockResolvedValue({});

      const validCode = generateValidTotp(testSecretBase32);
      await authService.verifyAndEnableTotp(baseUser.id, validCode);

      expect(prismaMock.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: baseUser.id },
          data: {
            totpEnabled: true,
            totpBackupCodes: expect.any(String),
          },
        }),
      );
    });

    it('deve rejeitar codigo TOTP invalido', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        ...baseUser,
        totpSecret: testSecretBase32,
      });

      await expect(
        authService.verifyAndEnableTotp(baseUser.id, '000000'),
      ).rejects.toThrow('Codigo TOTP invalido');
    });

    it('deve rejeitar se 2FA ja esta ativado', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        ...baseUser,
        totpEnabled: true,
        totpSecret: testSecretBase32,
      });

      await expect(
        authService.verifyAndEnableTotp(baseUser.id, '123456'),
      ).rejects.toThrow('2FA ja esta ativado');
    });

    it('deve rejeitar se nao tem secret configurado', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        ...baseUser,
        totpSecret: null,
      });

      await expect(
        authService.verifyAndEnableTotp(baseUser.id, '123456'),
      ).rejects.toThrow('Configure o 2FA primeiro');
    });
  });

  // ──────────────────────────────────────────────
  // disableTotp
  // ──────────────────────────────────────────────

  describe('disableTotp', () => {
    it('deve desativar 2FA com codigo valido', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        ...baseUser,
        totpEnabled: true,
        totpSecret: testSecretBase32,
      });
      prismaMock.user.update.mockResolvedValue({});

      const validCode = generateValidTotp(testSecretBase32);
      const result = await authService.disableTotp(baseUser.id, validCode);

      expect(result.disabled).toBe(true);
    });

    it('deve limpar secret e backup codes do banco', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        ...baseUser,
        totpEnabled: true,
        totpSecret: testSecretBase32,
      });
      prismaMock.user.update.mockResolvedValue({});

      const validCode = generateValidTotp(testSecretBase32);
      await authService.disableTotp(baseUser.id, validCode);

      expect(prismaMock.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: baseUser.id },
          data: {
            totpEnabled: false,
            totpSecret: null,
            totpBackupCodes: null,
          },
        }),
      );
    });

    it('deve rejeitar codigo invalido', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        ...baseUser,
        totpEnabled: true,
        totpSecret: testSecretBase32,
      });

      await expect(
        authService.disableTotp(baseUser.id, '000000'),
      ).rejects.toThrow('Codigo TOTP invalido');
    });

    it('deve rejeitar se 2FA nao esta ativado', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        ...baseUser,
        totpEnabled: false,
      });

      await expect(
        authService.disableTotp(baseUser.id, '123456'),
      ).rejects.toThrow('2FA nao esta ativado');
    });
  });

  // ──────────────────────────────────────────────
  // loginWith2FA
  // ──────────────────────────────────────────────

  describe('loginWith2FA', () => {
    const userWith2FA = {
      ...baseUser,
      totpEnabled: true,
      totpSecret: testSecretBase32,
      totpBackupCodes: JSON.stringify(testBackupCodes),
    };

    it('deve logar com codigo TOTP valido', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ ...userWith2FA });
      prismaMock.refreshToken.create.mockResolvedValue({});

      const validCode = generateValidTotp(testSecretBase32);
      const result = await authService.loginWith2FA(userWith2FA.email, validCode);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe(userWith2FA.email);
    });

    it('deve logar com backup code valido e consumir o codigo', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ ...userWith2FA });
      prismaMock.user.update.mockResolvedValue({});
      prismaMock.refreshToken.create.mockResolvedValue({});

      const result = await authService.loginWith2FA(userWith2FA.email, testBackupCodes[0]);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');

      // Deve ter consumido o backup code
      expect(prismaMock.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: userWith2FA.id },
          data: {
            totpBackupCodes: expect.not.stringContaining(testBackupCodes[0]),
          },
        }),
      );
    });

    it('deve rejeitar codigo TOTP invalido', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ ...userWith2FA });

      await expect(
        authService.loginWith2FA(userWith2FA.email, '000000'),
      ).rejects.toThrow('Codigo TOTP invalido');
    });

    it('deve rejeitar backup code invalido', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ ...userWith2FA });

      await expect(
        authService.loginWith2FA(userWith2FA.email, 'invalidc'),
      ).rejects.toThrow('Codigo invalido');
    });

    it('deve rejeitar se usuario nao existe', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        authService.loginWith2FA('ghost@test.local', '123456'),
      ).rejects.toThrow('Credenciais invalidas');
    });

    it('deve rejeitar se 2FA nao esta ativado', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ ...baseUser, totpEnabled: false });

      await expect(
        authService.loginWith2FA(baseUser.email, '123456'),
      ).rejects.toThrow('Credenciais invalidas');
    });
  });

  // ──────────────────────────────────────────────
  // loginWithPassword — integration com 2FA
  // ──────────────────────────────────────────────

  describe('loginWithPassword — 2FA integration', () => {
    it('deve retornar requires2FA=true quando 2FA ativo', async () => {
      const hashedPw = '$2b$12$LJ3m4ys3Lk0TdcnOoGBc4eJEpMVDVBGwsVv2O6TXGojBlFmUfmzW'; // bcrypt de "Test@123"
      prismaMock.user.findUnique.mockResolvedValue({
        ...baseUser,
        passwordHash: hashedPw,
        totpEnabled: true,
        totpSecret: testSecretBase32,
      });

      // Mock bcrypt.compare para retornar true
      const bcrypt = require('bcrypt');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      const result = await authService.loginWithPassword(baseUser.email, 'Test@123');

      expect(result.requires2FA).toBe(true);
      expect(result.accessToken).toBeNull();
      expect(result.refreshToken).toBeNull();
    });

    it('deve retornar requires2FA=false e tokens quando 2FA desativado', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ ...baseUser });
      prismaMock.refreshToken.create.mockResolvedValue({});

      const bcrypt = require('bcrypt');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      const result = await authService.loginWithPassword(baseUser.email, 'Test@123');

      expect(result.requires2FA).toBe(false);
      expect(result.accessToken).toBeTruthy();
      expect(result.refreshToken).toBeTruthy();
    });
  });
});
