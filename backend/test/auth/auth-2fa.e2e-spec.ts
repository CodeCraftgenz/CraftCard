/**
 * ═══════════════════════════════════════════════════
 *  E2E — Fluxo completo 2FA/TOTP
 *  Setup → Verify → Login → Backup Code → Disable
 * ═══════════════════════════════════════════════════
 */
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as OTPAuth from 'otpauth';
import { AuthService } from '../../src/auth/auth.service';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import { UsersService } from '../../src/users/users.service';
import { MailService } from '../../src/mail/mail.service';
import { OrganizationsService } from '../../src/organizations/organizations.service';
import {
  createPrismaMock,
  createConfigMock,
  createMailMock,
  TEST_USERS,
} from '../helpers/test-utils';

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

describe('E2E — Fluxo completo 2FA', () => {
  let authService: AuthService;
  let prismaMock: ReturnType<typeof createPrismaMock>;

  // Estado mutavel — simula DB in-memory para o fluxo
  let userState: Record<string, any>;

  beforeEach(async () => {
    prismaMock = createPrismaMock();
    const configMock = createConfigMock();
    const mailMock = createMailMock();

    userState = {
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

    // Mock findUnique retorna estado atual
    prismaMock.user.findUnique.mockImplementation(() => Promise.resolve({ ...userState }));
    // Mock update aplica no estado
    prismaMock.user.update.mockImplementation(({ data }: any) => {
      Object.assign(userState, data);
      return Promise.resolve({ ...userState });
    });
    // Mock refreshToken create
    prismaMock.refreshToken.create.mockResolvedValue({});

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
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('fluxo completo: setup → verify → login TOTP → login backup → disable', async () => {
    // 1. SETUP — gerar QR code e secret
    const setupResult = await authService.setupTotp(userState.id);

    expect(setupResult.secret).toBeTruthy();
    expect(setupResult.qrCode).toMatch(/^data:image\/png;base64,/);
    expect(userState.totpSecret).toBe(setupResult.secret);
    expect(userState.totpEnabled).toBe(false); // ainda nao ativado

    // 2. VERIFY — ativar com codigo TOTP valido
    const validCode = generateValidTotp(setupResult.secret);
    const verifyResult = await authService.verifyAndEnableTotp(userState.id, validCode);

    expect(verifyResult.enabled).toBe(true);
    expect(verifyResult.backupCodes).toHaveLength(8);
    expect(userState.totpEnabled).toBe(true);

    const backupCodes: string[] = JSON.parse(userState.totpBackupCodes);
    expect(backupCodes).toHaveLength(8);

    // 3. LOGIN COM TOTP — deve retornar tokens
    const totpCode = generateValidTotp(setupResult.secret);
    const loginResult = await authService.loginWith2FA(userState.email, totpCode);

    expect(loginResult.accessToken).toBeTruthy();
    expect(loginResult.refreshToken).toBeTruthy();
    expect(loginResult.user.email).toBe(userState.email);

    // 4. LOGIN COM BACKUP CODE — deve funcionar e consumir
    const firstBackup = backupCodes[0];
    const backupResult = await authService.loginWith2FA(userState.email, firstBackup);

    expect(backupResult.accessToken).toBeTruthy();
    const remainingCodes: string[] = JSON.parse(userState.totpBackupCodes);
    expect(remainingCodes).toHaveLength(7);
    expect(remainingCodes).not.toContain(firstBackup);

    // 5. MESMO BACKUP CODE — deve ser rejeitado (ja consumido)
    await expect(
      authService.loginWith2FA(userState.email, firstBackup),
    ).rejects.toThrow('Codigo invalido');

    // 6. DISABLE — com codigo TOTP valido
    const disableCode = generateValidTotp(setupResult.secret);
    const disableResult = await authService.disableTotp(userState.id, disableCode);

    expect(disableResult.disabled).toBe(true);
    expect(userState.totpEnabled).toBe(false);
    expect(userState.totpSecret).toBeNull();
    expect(userState.totpBackupCodes).toBeNull();
  });

  it('loginWithPassword retorna requires2FA=true quando 2FA ativo', async () => {
    // Configurar user com 2FA ativo
    const secret = new OTPAuth.Secret({ size: 20 });
    userState.totpEnabled = true;
    userState.totpSecret = secret.base32;

    const bcrypt = require('bcrypt');
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

    const result = await authService.loginWithPassword(userState.email, 'Test@123');

    expect(result.requires2FA).toBe(true);
    expect(result.accessToken).toBeNull();
    expect(result.refreshToken).toBeNull();
    expect(result.user.email).toBe(userState.email);
  });

  it('setup rejeita se 2FA ja esta ativado', async () => {
    userState.totpEnabled = true;

    await expect(authService.setupTotp(userState.id)).rejects.toThrow('2FA ja esta ativado');
  });

  it('verify rejeita codigo invalido', async () => {
    const secret = new OTPAuth.Secret({ size: 20 });
    userState.totpSecret = secret.base32;

    await expect(
      authService.verifyAndEnableTotp(userState.id, '000000'),
    ).rejects.toThrow('Codigo TOTP invalido');
  });

  it('disable rejeita se 2FA nao esta ativado', async () => {
    userState.totpEnabled = false;

    await expect(
      authService.disableTotp(userState.id, '123456'),
    ).rejects.toThrow('2FA nao esta ativado');
  });
});
