/**
 * ═══════════════════════════════════════════════════
 *  BLOCO 2 — ORGANIZAÇÕES (B2B) & HERANÇA DE PLANOS
 *  Convites, Herança, Isolamento de dados
 * ═══════════════════════════════════════════════════
 */
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { OrganizationsService } from '../../src/organizations/organizations.service';
import { PaymentsService } from '../../src/payments/payments.service';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import { MailService } from '../../src/mail/mail.service';
import { PAYMENT_GATEWAY } from '../../src/payments/gateway/payment-gateway.interface';
import {
  createPrismaMock,
  createConfigMock,
  createMailMock,
  createGatewayMock,
  TEST_USERS,
  TEST_ORGS,
} from '../helpers/test-utils';

// ══════════════════════════════════════════════════
// 2.1 — Ciclo de Vida do Convite
// ══════════════════════════════════════════════════

describe('Organizations — Ciclo de vida do convite', () => {
  let service: OrganizationsService;
  let prisma: ReturnType<typeof createPrismaMock>;
  let mailMock: ReturnType<typeof createMailMock>;

  beforeEach(async () => {
    prisma = createPrismaMock();
    mailMock = createMailMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        { provide: PrismaService, useValue: prisma },
        { provide: MailService, useValue: mailMock },
      ],
    }).compile();

    service = module.get<OrganizationsService>(OrganizationsService);
  });

  afterEach(() => jest.restoreAllMocks());

  describe('Criação de convite', () => {
    it('deve gerar token único e enviar email', async () => {
      prisma.organization.findUnique.mockResolvedValue({
        ...TEST_ORGS.orgA,
        _count: { members: 2 },
      });
      prisma.user.findUnique
        .mockResolvedValueOnce(null) // target não é membro
        .mockResolvedValueOnce({ name: 'Admin' }); // inviter
      prisma.organizationMember.findUnique.mockResolvedValue(null);
      prisma.organizationInvite.findFirst.mockResolvedValue(null);
      prisma.organizationInvite.create.mockImplementation(async (args: any) => ({
        id: 'invite-1',
        token: args.data.token,
        expiresAt: args.data.expiresAt,
      }));

      const result = await service.createInvite(
        TEST_ORGS.orgA.id,
        TEST_USERS.businessOwner.id,
        { email: 'newmember@test.local', role: 'MEMBER' },
      );

      expect(result.token).toBeDefined();
      expect(result.token.length).toBe(64); // 32 bytes = 64 hex chars
      expect(result.expiresAt).toBeDefined();

      // Verificar que expiresAt é ~7 dias no futuro
      const daysUntilExpiry = (new Date(result.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      expect(daysUntilExpiry).toBeGreaterThan(6.9);
      expect(daysUntilExpiry).toBeLessThan(7.1);

      // Email enviado
      expect(mailMock.sendOrgInvite).toHaveBeenCalledWith(
        'newmember@test.local',
        TEST_ORGS.orgA.name,
        'Admin',
        expect.any(String),
      );
    });

    it('deve rejeitar convite duplicado (pendente)', async () => {
      prisma.organization.findUnique.mockResolvedValue({
        ...TEST_ORGS.orgA,
        _count: { members: 2 },
      });
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.organizationMember.findUnique.mockResolvedValue(null);
      prisma.organizationInvite.findFirst.mockResolvedValue({ id: 'existing-invite' });

      await expect(
        service.createInvite(TEST_ORGS.orgA.id, TEST_USERS.businessOwner.id, {
          email: 'already-invited@test.local',
        }),
      ).rejects.toThrow('Convite pendente ja existe');
    });

    it('deve rejeitar convite se usuário já é membro', async () => {
      prisma.organization.findUnique.mockResolvedValue({
        ...TEST_ORGS.orgA,
        _count: { members: 2 },
      });
      prisma.user.findUnique.mockResolvedValue({ id: 'existing-user-id' });
      prisma.organizationMember.findUnique.mockResolvedValue({ id: 'member-1' });

      await expect(
        service.createInvite(TEST_ORGS.orgA.id, TEST_USERS.businessOwner.id, {
          email: 'already-member@test.local',
        }),
      ).rejects.toThrow('ja e membro');
    });

    it('deve rejeitar quando limite de seats atingido', async () => {
      prisma.organization.findUnique.mockResolvedValue({
        ...TEST_ORGS.orgA,
        maxMembers: 3,
        extraSeats: 0,
        _count: { members: 3 }, // cheio
      });

      await expect(
        service.createInvite(TEST_ORGS.orgA.id, TEST_USERS.businessOwner.id, {
          email: 'overflow@test.local',
        }),
      ).rejects.toThrow('Limite de 3 membros atingido');
    });
  });

  describe('Token expirado', () => {
    it('deve rejeitar previewInvite com token expirado', async () => {
      const expiredDate = new Date(Date.now() - 1000); // 1 segundo atrás
      prisma.organizationInvite.findUnique.mockResolvedValue({
        id: 'inv-1',
        token: 'expired-token',
        usedAt: null,
        expiresAt: expiredDate,
        org: { name: 'Test Org', logoUrl: null, primaryColor: null },
      });

      await expect(service.previewInvite('expired-token')).rejects.toThrow('Convite expirado');
    });

    it('deve rejeitar acceptInvite com token expirado', async () => {
      const expiredDate = new Date(Date.now() - 1000);
      prisma.organizationInvite.findUnique.mockResolvedValue({
        id: 'inv-1',
        orgId: TEST_ORGS.orgA.id,
        email: 'user@test.local',
        token: 'expired-token',
        usedAt: null,
        expiresAt: expiredDate,
      });

      await expect(
        service.acceptInvite('expired-token', TEST_USERS.freeUser.id),
      ).rejects.toThrow('Convite expirado');
    });
  });

  describe('Token já utilizado', () => {
    it('deve rejeitar previewInvite com token já usado', async () => {
      prisma.organizationInvite.findUnique.mockResolvedValue({
        id: 'inv-1',
        token: 'used-token',
        usedAt: new Date(), // já foi usado
        expiresAt: new Date(Date.now() + 86400000),
        org: { name: 'Test Org', logoUrl: null, primaryColor: null },
      });

      await expect(service.previewInvite('used-token')).rejects.toThrow('ja foi utilizado');
    });
  });

  describe('Aceitar convite — Usuário existente', () => {
    it('deve aceitar convite, criar membro, linkar perfis e marcar token como usado', async () => {
      const validExpiry = new Date(Date.now() + 86400000);

      prisma.organizationInvite.findUnique.mockResolvedValue({
        id: 'inv-1',
        orgId: TEST_ORGS.orgA.id,
        email: TEST_USERS.freeUser.email,
        role: 'MEMBER',
        token: 'valid-token',
        usedAt: null,
        expiresAt: validExpiry,
      });
      prisma.user.findUnique.mockResolvedValue({
        id: TEST_USERS.freeUser.id,
        email: TEST_USERS.freeUser.email,
        name: TEST_USERS.freeUser.name,
        avatarUrl: null,
      });
      prisma.organizationMember.findUnique.mockResolvedValue(null); // não é membro

      // Mock da transaction — passa o prisma de volta como tx
      const txMock = {
        organizationInvite: { update: jest.fn() },
        organizationMember: { create: jest.fn() },
        profile: { updateMany: jest.fn(), count: jest.fn().mockResolvedValue(1) },
        organization: {
          findUnique: jest.fn().mockResolvedValue({
            id: TEST_ORGS.orgA.id,
            name: TEST_ORGS.orgA.name,
            slug: TEST_ORGS.orgA.slug,
          }),
        },
      };
      prisma.$transaction.mockImplementation(async (cb: any) => cb(txMock));

      const result = await service.acceptInvite('valid-token', TEST_USERS.freeUser.id);

      expect(result.joined).toBe(true);
      expect(result.organization).toEqual(
        expect.objectContaining({ name: TEST_ORGS.orgA.name }),
      );

      // Token marcado como usado
      expect(txMock.organizationInvite.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'inv-1' },
          data: { usedAt: expect.any(Date) },
        }),
      );

      // Membro criado com role correto
      expect(txMock.organizationMember.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { orgId: TEST_ORGS.orgA.id, userId: TEST_USERS.freeUser.id, role: 'MEMBER' },
        }),
      );

      // Perfis linkados à org
      expect(txMock.profile.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: TEST_USERS.freeUser.id, orgId: null },
          data: { orgId: TEST_ORGS.orgA.id },
        }),
      );
    });

    it('deve rejeitar se email do usuário não bate com email do convite', async () => {
      prisma.organizationInvite.findUnique.mockResolvedValue({
        id: 'inv-1',
        orgId: TEST_ORGS.orgA.id,
        email: 'different@test.local',
        role: 'MEMBER',
        token: 'mismatch-token',
        usedAt: null,
        expiresAt: new Date(Date.now() + 86400000),
      });
      prisma.user.findUnique.mockResolvedValue({
        id: TEST_USERS.freeUser.id,
        email: TEST_USERS.freeUser.email, // diferente de different@test.local
      });

      await expect(
        service.acceptInvite('mismatch-token', TEST_USERS.freeUser.id),
      ).rejects.toThrow('enviado para outro email');
    });
  });
});

// ══════════════════════════════════════════════════
// 2.2 — Herança de Plano (B2B)
// ══════════════════════════════════════════════════

describe('Organizations — Herança de plano B2B', () => {
  let paymentsService: PaymentsService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: createConfigMock() },
        { provide: MailService, useValue: createMailMock() },
        { provide: PAYMENT_GATEWAY, useValue: createGatewayMock() },
      ],
    }).compile();

    paymentsService = module.get<PaymentsService>(PaymentsService);
  });

  afterEach(() => jest.restoreAllMocks());

  it('MEMBER FREE deve herdar BUSINESS do OWNER', async () => {
    prisma.user.findUnique.mockResolvedValue({
      email: 'member@test.local',
      plan: 'FREE',
    });
    prisma.organizationMember.findMany
      .mockResolvedValueOnce([{ orgId: TEST_ORGS.orgA.id }]) // memberships do user
      .mockResolvedValueOnce([{ user: { plan: 'BUSINESS', email: 'owner@test.local' } }]); // owners da org

    const info = await paymentsService.getUserPlanInfo('member-1');
    expect(info.plan).toBe('BUSINESS');
    expect(info.planLimits.orgDashboard).toBe(true);
    expect(info.planLimits.branding).toBe(true);
    expect(info.planLimits.webhooks).toBe(true);
  });

  it('MEMBER FREE deve herdar ENTERPRISE do OWNER', async () => {
    prisma.user.findUnique.mockResolvedValue({
      email: 'member@test.local',
      plan: 'FREE',
    });
    prisma.organizationMember.findMany
      .mockResolvedValueOnce([{ orgId: TEST_ORGS.orgA.id }])
      .mockResolvedValueOnce([{ user: { plan: 'ENTERPRISE', email: 'owner@test.local' } }]);

    const info = await paymentsService.getUserPlanInfo('member-1');
    expect(info.plan).toBe('ENTERPRISE');
    expect(info.planLimits.customDomain).toBe(true);
  });

  it('NÃO deve herdar de OWNER com PRO (apenas BUSINESS+)', async () => {
    prisma.user.findUnique.mockResolvedValue({
      email: 'member@test.local',
      plan: 'FREE',
    });
    prisma.organizationMember.findMany
      .mockResolvedValueOnce([{ orgId: TEST_ORGS.orgA.id }])
      .mockResolvedValueOnce([{ user: { plan: 'PRO', email: 'owner@test.local' } }]);

    const info = await paymentsService.getUserPlanInfo('member-1');
    expect(info.plan).toBe('FREE');
  });

  it('deve manter plano pessoal se superior ao herdado', async () => {
    const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    prisma.user.findUnique.mockResolvedValue({
      email: 'ent@test.local',
      plan: 'ENTERPRISE',
    });
    prisma.payment.findFirst.mockResolvedValue({ expiresAt: futureDate });
    prisma.organizationMember.findMany
      .mockResolvedValueOnce([{ orgId: TEST_ORGS.orgA.id }])
      .mockResolvedValueOnce([{ user: { plan: 'BUSINESS', email: 'owner@test.local' } }]);

    const info = await paymentsService.getUserPlanInfo('ent-user');
    expect(info.plan).toBe('ENTERPRISE');
  });

  it('herança NÃO deve alterar a coluna plan do membro no banco', async () => {
    prisma.user.findUnique.mockResolvedValue({
      email: 'member@test.local',
      plan: 'FREE',
    });
    prisma.organizationMember.findMany
      .mockResolvedValueOnce([{ orgId: TEST_ORGS.orgA.id }])
      .mockResolvedValueOnce([{ user: { plan: 'BUSINESS', email: 'owner@test.local' } }]);

    await paymentsService.getUserPlanInfo('member-1');

    // CRÍTICO: user.update NÃO deve ser chamado para alterar o plano pessoal
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('deve herdar do OWNER whitelist (ENTERPRISE) mesmo com plan=FREE no DB', async () => {
    prisma.user.findUnique.mockResolvedValue({
      email: 'member@test.local',
      plan: 'FREE',
    });
    prisma.organizationMember.findMany
      .mockResolvedValueOnce([{ orgId: TEST_ORGS.orgA.id }])
      .mockResolvedValueOnce([{
        user: { plan: 'FREE', email: 'ricardocoradini97@gmail.com' }, // whitelist
      }]);

    const info = await paymentsService.getUserPlanInfo('member-1');
    expect(info.plan).toBe('ENTERPRISE');
  });

  it('sem memberships deve retornar plano pessoal (sem herança)', async () => {
    prisma.user.findUnique.mockResolvedValue({
      email: 'solo@test.local',
      plan: 'FREE',
    });
    prisma.organizationMember.findMany.mockResolvedValue([]);

    const info = await paymentsService.getUserPlanInfo('solo-user');
    expect(info.plan).toBe('FREE');
  });
});

// ══════════════════════════════════════════════════
// 2.3 — Isolamento de Dados entre Organizações
// ══════════════════════════════════════════════════

describe('Organizations — Isolamento de dados (Org A vs Org B)', () => {
  let service: OrganizationsService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        { provide: PrismaService, useValue: prisma },
        { provide: MailService, useValue: createMailMock() },
      ],
    }).compile();

    service = module.get<OrganizationsService>(OrganizationsService);
  });

  afterEach(() => jest.restoreAllMocks());

  it('markLeadRead deve rejeitar lead que pertence a outra org', async () => {
    prisma.contactMessage.findFirst.mockResolvedValue(null); // lead não pertence à org

    await expect(
      service.markLeadRead(TEST_ORGS.orgA.id, 'lead-from-org-b', true),
    ).rejects.toThrow('nao encontrado');
  });

  it('revokeInvite deve rejeitar convite que pertence a outra org', async () => {
    prisma.organizationInvite.findUnique.mockResolvedValue({
      id: 'invite-org-b',
      orgId: TEST_ORGS.orgB.id, // pertence à Org B
    });

    await expect(
      service.revokeInvite(TEST_ORGS.orgA.id, 'invite-org-b'),
    ).rejects.toThrow('nao encontrado');
  });

  it('removeMember deve rejeitar membro que pertence a outra org', async () => {
    prisma.organizationMember.findUnique.mockResolvedValue({
      id: 'member-org-b',
      orgId: TEST_ORGS.orgB.id, // pertence à Org B
      role: 'MEMBER',
    });

    await expect(
      service.removeMember(TEST_ORGS.orgA.id, 'member-org-b'),
    ).rejects.toThrow('nao encontrado');
  });

  it('updateMemberRole deve rejeitar membro de outra org', async () => {
    prisma.organizationMember.findUnique.mockResolvedValue({
      id: 'member-org-b',
      orgId: TEST_ORGS.orgB.id, // outra org
      role: 'MEMBER',
    });

    await expect(
      service.updateMemberRole(TEST_ORGS.orgA.id, 'member-org-b', TEST_USERS.businessOwner.id, 'ADMIN'),
    ).rejects.toThrow('nao encontrado');
  });

  it('NÃO deve ser possível remover o OWNER de uma org', async () => {
    prisma.organizationMember.findUnique.mockResolvedValue({
      id: 'owner-member-id',
      orgId: TEST_ORGS.orgA.id,
      role: 'OWNER',
    });

    await expect(
      service.removeMember(TEST_ORGS.orgA.id, 'owner-member-id'),
    ).rejects.toThrow('Nao e possivel remover o proprietario');
  });

  it('NÃO deve alterar o role do OWNER', async () => {
    prisma.organizationMember.findUnique.mockResolvedValue({
      id: 'owner-member-id',
      orgId: TEST_ORGS.orgA.id,
      role: 'OWNER',
    });

    await expect(
      service.updateMemberRole(TEST_ORGS.orgA.id, 'owner-member-id', TEST_USERS.businessOwner.id, 'ADMIN'),
    ).rejects.toThrow('Nao e possivel alterar o role do proprietario');
  });
});
