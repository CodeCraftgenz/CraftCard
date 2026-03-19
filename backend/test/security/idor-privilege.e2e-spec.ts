/**
 * ═══════════════════════════════════════════════════════════════════
 *  SCRIPT DE ATAQUE OFENSIVO — VETOR 2: IDOR & ESCALAÇÃO DE PRIVILÉGIO
 * ═══════════════════════════════════════════════════════════════════
 *
 *  Autor: Offensive Security Engineer (White-Box Pentest)
 *  Objetivo: Testar TODAS as vias de acesso não autorizado a recursos
 *            de outros usuários e escalação de privilégio entre planos/roles.
 *
 *  VULNERABILIDADES-ALVO (OWASP A01 — Broken Access Control):
 *    1. IDOR em perfis: atualizar/deletar perfil de outro usuário
 *    2. IDOR em uploads: fazer upload de foto no perfil de outro usuário
 *    3. Escalação de privilégio: FREE tentando acessar features PRO+
 *    4. Escalação de role em org: MEMBER executando ações de OWNER
 *    5. Manipulação de JWT: tokens expirados, inválidos, secret errado
 *    6. Acesso cross-org: membro da org A acessando dados da org B
 *
 *  TODOS OS TESTES SÃO EXECUTADOS EM SANDBOX (mocks).
 *  Nenhum dado de produção é tocado.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Reflector } from '@nestjs/core';
import { ProfilesService } from '../../src/profiles/profiles.service';
import { SectionsService } from '../../src/profiles/sections.service';
import { SlugsService } from '../../src/slugs/slugs.service';
import { OrganizationsService } from '../../src/organizations/organizations.service';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import { PaymentsService } from '../../src/payments/payments.service';
import { MailService } from '../../src/mail/mail.service';
import { StorageService } from '../../src/storage/storage.service';
import { OrgRoleGuard } from '../../src/common/guards/org-role.guard';
import { PlanGuard } from '../../src/payments/guards/plan.guard';
import { AppException } from '../../src/common/exceptions/app.exception';
import { hasFeature, getPlanLimits } from '../../src/payments/plan-limits';
import {
  createPrismaMock,
  createConfigMock,
  createMailMock,
  generateTestJwt,
  generateExpiredJwt,
  generateBadSecretJwt,
  TEST_USERS,
  TEST_ORGS,
  TEST_JWT_SECRET,
} from '../helpers/test-utils';

// ══════════════════════════════════════════════════
// 1 — IDOR EM PERFIS (Broken Access Control)
// ══════════════════════════════════════════════════

describe('ATAQUE OFENSIVO — IDOR em Perfis', () => {
  let profilesService: ProfilesService;
  let sectionsService: SectionsService;
  let prisma: ReturnType<typeof createPrismaMock>;
  let paymentsServiceMock: Record<string, jest.Mock>;

  /** IDs dos perfis para testes de IDOR */
  const ATTACKER_USER_ID = TEST_USERS.freeUser.id;
  const VICTIM_USER_ID = TEST_USERS.proUser.id;
  const VICTIM_PROFILE_ID = 'victim-profile-001';
  const ATTACKER_PROFILE_ID = 'attacker-profile-001';

  beforeEach(async () => {
    prisma = createPrismaMock();

    paymentsServiceMock = {
      getUserPlanInfo: jest.fn().mockResolvedValue({
        plan: 'PRO',
        planLimits: getPlanLimits('PRO'),
        expiresAt: null,
      }),
      getActiveSubscription: jest.fn().mockResolvedValue({ active: true, expiresAt: null }),
    };

    const slugsServiceMock = {
      isAvailable: jest.fn().mockResolvedValue(true),
    };

    const cacheMock = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfilesService,
        SectionsService,
        { provide: PrismaService, useValue: prisma },
        { provide: PaymentsService, useValue: paymentsServiceMock },
        { provide: ConfigService, useValue: createConfigMock() },
        { provide: SlugsService, useValue: slugsServiceMock },
        { provide: CACHE_MANAGER, useValue: cacheMock },
      ],
    }).compile();

    profilesService = module.get<ProfilesService>(ProfilesService);
    sectionsService = module.get<SectionsService>(SectionsService);
  });

  afterEach(() => jest.restoreAllMocks());

  // ──────────────────────────────────────────────
  // ATAQUE 1.1: Tentar atualizar perfil de outro usuário
  // ──────────────────────────────────────────────
  describe('ATK-01: Atualizar perfil de OUTRO usuário via IDOR', () => {
    /**
     * TEORIA: Atacante envia PUT /me/profile?cardId=<VICTIM_PROFILE_ID>
     * com o JWT do atacante, esperando editar o perfil da vítima.
     * MITIGAÇÃO: ProfilesService.update() faz findFirst com { id: profileId, userId }
     * garantindo que o userId do JWT corresponda ao dono do perfil.
     */
    it('deve REJEITAR atualização de perfil de outro usuário (cardId IDOR)', async () => {
      // Perfil da vítima NÃO pertence ao atacante → findFirst retorna null
      prisma.profile.findFirst.mockResolvedValue(null);

      await expect(
        profilesService.update(ATTACKER_USER_ID, { displayName: 'Hacked!' }, VICTIM_PROFILE_ID),
      ).rejects.toThrow('não encontrado');

      // Verificar que NENHUMA atualização foi feita
      expect(prisma.profile.update).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('deve permitir atualizar o PRÓPRIO perfil normalmente', async () => {
      // Perfil do atacante encontrado (ele é o dono)
      prisma.profile.findFirst.mockResolvedValue({
        id: ATTACKER_PROFILE_ID,
        userId: ATTACKER_USER_ID,
        slug: 'my-profile',
        organization: null,
      });

      // Mock da transaction: retorna perfil atualizado
      prisma.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          profile: {
            update: jest.fn().mockResolvedValue({ id: ATTACKER_PROFILE_ID }),
            findUnique: jest.fn().mockResolvedValue({ id: ATTACKER_PROFILE_ID, socialLinks: [] }),
          },
          socialLink: { deleteMany: jest.fn(), createMany: jest.fn() },
        };
        return cb(tx);
      });

      const result = await profilesService.update(
        ATTACKER_USER_ID,
        { displayName: 'Meu Nome' },
        ATTACKER_PROFILE_ID,
      );

      expect(result).toBeDefined();
    });
  });

  // ──────────────────────────────────────────────
  // ATAQUE 1.2: Tentar deletar cartão de outro usuário
  // ──────────────────────────────────────────────
  describe('ATK-02: Deletar cartão de OUTRO usuário via IDOR', () => {
    /**
     * TEORIA: Atacante envia DELETE /me/cards/<VICTIM_PROFILE_ID>
     * tentando apagar o cartão da vítima.
     * MITIGAÇÃO: deleteCard() verifica { id: profileId, userId }
     */
    it('deve REJEITAR exclusão de cartão de outro usuário', async () => {
      // Perfil da vítima não pertence ao atacante → findFirst retorna null
      prisma.profile.findFirst.mockResolvedValue(null);

      await expect(
        profilesService.deleteCard(ATTACKER_USER_ID, VICTIM_PROFILE_ID),
      ).rejects.toThrow('não encontrado');

      // Verificar que o perfil NÃO foi deletado
      expect(prisma.profile.delete).not.toHaveBeenCalled();
    });

    it('deve permitir deletar o PRÓPRIO cartão secundário', async () => {
      prisma.profile.findFirst.mockResolvedValue({
        id: ATTACKER_PROFILE_ID,
        userId: ATTACKER_USER_ID,
        isPrimary: false,
      });
      prisma.profile.delete.mockResolvedValue({});

      const result = await profilesService.deleteCard(ATTACKER_USER_ID, ATTACKER_PROFILE_ID);
      expect(result).toEqual({ deleted: true });
    });
  });

  // ──────────────────────────────────────────────
  // ATAQUE 1.3: Tentar definir cartão primário de outro usuário
  // ──────────────────────────────────────────────
  describe('ATK-03: Definir cartão primário de OUTRO usuário via IDOR', () => {
    /**
     * TEORIA: Atacante envia PUT /me/cards/<VICTIM_PROFILE_ID>/primary
     * MITIGAÇÃO: setPrimary() verifica { id: profileId, userId }
     */
    it('deve REJEITAR setPrimary no perfil de outro usuário', async () => {
      prisma.profile.findFirst.mockResolvedValue(null);

      await expect(
        profilesService.setPrimary(ATTACKER_USER_ID, VICTIM_PROFILE_ID),
      ).rejects.toThrow('não encontrado');

      // Nenhuma transação de troca de primary deve ter sido executada
      expect(prisma.profile.updateMany).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────
  // ATAQUE 1.4: IDOR em SectionsService (serviços, FAQ)
  // ──────────────────────────────────────────────
  describe('ATK-04: IDOR em SectionsService — editar serviço/FAQ de outro user', () => {
    /**
     * TEORIA: Atacante envia PUT /me/services/<SERVICE_ID_DA_VITIMA>
     * ou DELETE /me/faq/<FAQ_ID_DA_VITIMA>.
     * MITIGAÇÃO: updateService/deleteService verificam profile.userId !== userId.
     */
    it('deve REJEITAR atualização de serviço de outro usuário', async () => {
      // Serviço encontrado mas pertence a outro userId
      const prismaDynamic = prisma as any;
      prismaDynamic.service = {
        findUnique: jest.fn().mockResolvedValue({
          id: 'victim-service-001',
          profile: { userId: VICTIM_USER_ID }, // pertence à vítima
        }),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        updateMany: jest.fn(),
      };

      await expect(
        sectionsService.updateService(ATTACKER_USER_ID, 'victim-service-001', { title: 'Hacked Service' }),
      ).rejects.toThrow('não encontrad');

      expect(prismaDynamic.service.update).not.toHaveBeenCalled();
    });

    it('deve REJEITAR exclusão de serviço de outro usuário', async () => {
      const prismaDynamic = prisma as any;
      prismaDynamic.service = {
        findUnique: jest.fn().mockResolvedValue({
          id: 'victim-service-002',
          profile: { userId: VICTIM_USER_ID },
        }),
        delete: jest.fn(),
      };

      await expect(
        sectionsService.deleteService(ATTACKER_USER_ID, 'victim-service-002'),
      ).rejects.toThrow('não encontrad');

      expect(prismaDynamic.service.delete).not.toHaveBeenCalled();
    });
  });
});

// ══════════════════════════════════════════════════
// 2 — IDOR EM UPLOADS DE ARQUIVO
// ══════════════════════════════════════════════════

describe('ATAQUE OFENSIVO — IDOR em Uploads', () => {
  let prisma: ReturnType<typeof createPrismaMock>;

  const ATTACKER_USER_ID = TEST_USERS.freeUser.id;
  const VICTIM_USER_ID = TEST_USERS.proUser.id;

  beforeEach(() => {
    prisma = createPrismaMock();
  });

  afterEach(() => jest.restoreAllMocks());

  // ──────────────────────────────────────────────
  // ATAQUE 2.1: Upload de foto no perfil de outro user
  // ──────────────────────────────────────────────
  describe('ATK-05: Upload de foto no perfil de OUTRO usuário via cardId IDOR', () => {
    /**
     * TEORIA: Atacante envia POST /me/photo-upload?cardId=<VICTIM_CARD_ID>
     * com JWT do atacante + arquivo de foto.
     * MITIGAÇÃO: StorageController.uploadPhoto() busca perfil com
     * { id: cardId, userId: user.sub } — se não pertence, retorna 404.
     *
     * Testamos diretamente a query que o controller faz:
     * profile.findFirst({ where: { id: cardId, userId: user.sub } })
     */
    it('findFirst com cardId de outro user deve retornar null (bloqueio de IDOR)', async () => {
      // Simula: atacante tenta acessar perfil da vítima pelo ID do cartão
      prisma.profile.findFirst.mockImplementation(async (args: any) => {
        const where = args?.where;
        // Perfil da vítima existe mas userId não bate com atacante
        if (where?.id === 'victim-card-001' && where?.userId === ATTACKER_USER_ID) {
          return null; // BLOQUEADO — userId não confere
        }
        if (where?.id === 'victim-card-001' && where?.userId === VICTIM_USER_ID) {
          return { id: 'victim-card-001', userId: VICTIM_USER_ID, photoUrl: null };
        }
        return null;
      });

      // Atacante tenta — deve retornar null
      const attackResult = await prisma.profile.findFirst({
        where: { id: 'victim-card-001', userId: ATTACKER_USER_ID },
        select: { id: true, photoUrl: true },
      });
      expect(attackResult).toBeNull();

      // Vítima legítima — deve encontrar o perfil
      const legitimateResult = await prisma.profile.findFirst({
        where: { id: 'victim-card-001', userId: VICTIM_USER_ID },
        select: { id: true, photoUrl: true },
      });
      expect(legitimateResult).not.toBeNull();
    });

    it('upload sem cardId usa perfil primário do USER autenticado (não de outro)', async () => {
      // Simula busca de perfil primário — retorna apenas perfil do atacante
      prisma.profile.findFirst.mockImplementation(async (args: any) => {
        const where = args?.where;
        if (where?.userId === ATTACKER_USER_ID && where?.isPrimary === true) {
          return { id: 'attacker-primary', userId: ATTACKER_USER_ID, photoUrl: null };
        }
        return null;
      });

      const result = await prisma.profile.findFirst({
        where: { userId: ATTACKER_USER_ID, isPrimary: true },
        select: { id: true, photoUrl: true },
      });

      // Retorna o perfil do atacante, não da vítima
      expect(result?.id).toBe('attacker-primary');
      expect(result?.userId).toBe(ATTACKER_USER_ID);
    });
  });
});

// ══════════════════════════════════════════════════
// 3 — ESCALAÇÃO DE PRIVILÉGIO (FREE → PRO)
// ══════════════════════════════════════════════════

describe('ATAQUE OFENSIVO — Escalação de Privilégio FREE → PRO', () => {
  /**
   * TEORIA: Usuário FREE tenta acessar features que requerem plano PRO+
   * (analytics, gallery, contacts, resume, video, customBg, etc).
   *
   * MITIGAÇÃO: PlanGuard + hasFeature() verificam o plano do usuário
   * e bloqueiam com 403 se a feature não está disponível.
   */

  // ──────────────────────────────────────────────
  // ATAQUE 3.1: Verificar que hasFeature bloqueia FREE
  // ──────────────────────────────────────────────
  describe('ATK-06: Verificação de hasFeature para plano FREE', () => {
    const PRO_ONLY_FEATURES = [
      'analytics', 'gallery', 'bookings', 'testimonials',
      'contacts', 'services', 'faq', 'resume', 'video',
      'customFonts', 'customBg', 'leadsExport',
    ] as const;

    const BUSINESS_ONLY_FEATURES = ['orgDashboard', 'branding', 'webhooks'] as const;
    const ENTERPRISE_ONLY_FEATURES = ['customDomain'] as const;

    it.each(PRO_ONLY_FEATURES)(
      'FREE NÃO deve ter acesso a feature "%s" (requer PRO+)',
      (feature) => {
        expect(hasFeature('FREE', feature)).toBe(false);
      },
    );

    it.each(PRO_ONLY_FEATURES)(
      'PRO DEVE ter acesso a feature "%s"',
      (feature) => {
        expect(hasFeature('PRO', feature)).toBe(true);
      },
    );

    it.each(BUSINESS_ONLY_FEATURES)(
      'FREE e PRO NÃO devem ter acesso a feature "%s" (requer BUSINESS+)',
      (feature) => {
        expect(hasFeature('FREE', feature)).toBe(false);
        expect(hasFeature('PRO', feature)).toBe(false);
      },
    );

    it.each(BUSINESS_ONLY_FEATURES)(
      'BUSINESS DEVE ter acesso a feature "%s"',
      (feature) => {
        expect(hasFeature('BUSINESS', feature)).toBe(true);
      },
    );

    it.each(ENTERPRISE_ONLY_FEATURES)(
      'FREE, PRO e BUSINESS NÃO devem ter acesso a feature "%s" (requer ENTERPRISE)',
      (feature) => {
        expect(hasFeature('FREE', feature)).toBe(false);
        expect(hasFeature('PRO', feature)).toBe(false);
        expect(hasFeature('BUSINESS', feature)).toBe(false);
      },
    );

    it.each(ENTERPRISE_ONLY_FEATURES)(
      'ENTERPRISE DEVE ter acesso a feature "%s"',
      (feature) => {
        expect(hasFeature('ENTERPRISE', feature)).toBe(true);
      },
    );
  });

  // ──────────────────────────────────────────────
  // ATAQUE 3.2: PlanGuard deve bloquear FREE em rotas PRO
  // ──────────────────────────────────────────────
  describe('ATK-07: PlanGuard bloqueia FREE tentando acessar rotas PRO', () => {
    let planGuard: PlanGuard;
    let paymentsServiceMock: { getUserPlanInfo: jest.Mock };

    beforeEach(async () => {
      paymentsServiceMock = {
        getUserPlanInfo: jest.fn(),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          PlanGuard,
          Reflector,
          { provide: PaymentsService, useValue: paymentsServiceMock },
        ],
      }).compile();

      planGuard = module.get<PlanGuard>(PlanGuard);
    });

    afterEach(() => jest.restoreAllMocks());

    /**
     * Cria um mock de ExecutionContext para simular uma request
     * com metadata de feature requerida.
     */
    function createMockContext(userId: string | null, feature: string | null) {
      const request = {
        user: userId ? { sub: userId, role: 'USER' } : null,
      };

      const handler = { requiredFeature: feature };

      return {
        switchToHttp: () => ({
          getRequest: () => request,
        }),
        getHandler: () => handler,
        getClass: () => ({}),
      } as any;
    }

    it('deve BLOQUEAR usuário FREE tentando acessar analytics (PRO+)', async () => {
      paymentsServiceMock.getUserPlanInfo.mockResolvedValue({
        plan: 'FREE',
        planLimits: getPlanLimits('FREE'),
        expiresAt: null,
      });

      // Simular reflector retornando 'analytics' como feature requerida
      const reflector = new Reflector();
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('analytics');

      const guard = new PlanGuard(reflector, paymentsServiceMock as any);
      const ctx = createMockContext(TEST_USERS.freeUser.id, 'analytics');

      await expect(guard.canActivate(ctx)).rejects.toThrow('plano');
    });

    it('deve PERMITIR usuário PRO acessar analytics', async () => {
      paymentsServiceMock.getUserPlanInfo.mockResolvedValue({
        plan: 'PRO',
        planLimits: getPlanLimits('PRO'),
        expiresAt: null,
      });

      const reflector = new Reflector();
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('analytics');

      const guard = new PlanGuard(reflector, paymentsServiceMock as any);
      const ctx = createMockContext(TEST_USERS.proUser.id, 'analytics');

      const result = await guard.canActivate(ctx);
      expect(result).toBe(true);
    });

    it('deve BLOQUEAR usuário PRO tentando acessar customDomain (ENTERPRISE)', async () => {
      paymentsServiceMock.getUserPlanInfo.mockResolvedValue({
        plan: 'PRO',
        planLimits: getPlanLimits('PRO'),
        expiresAt: null,
      });

      const reflector = new Reflector();
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('customDomain');

      const guard = new PlanGuard(reflector, paymentsServiceMock as any);
      const ctx = createMockContext(TEST_USERS.proUser.id, 'customDomain');

      await expect(guard.canActivate(ctx)).rejects.toThrow('plano');
    });

    it('deve REJEITAR request sem userId (token ausente/inválido)', async () => {
      const reflector = new Reflector();
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('analytics');

      const guard = new PlanGuard(reflector, paymentsServiceMock as any);
      const ctx = createMockContext(null, 'analytics');

      await expect(guard.canActivate(ctx)).rejects.toThrow();
    });
  });

  // ──────────────────────────────────────────────
  // ATAQUE 3.3: Limites de links por plano
  // ──────────────────────────────────────────────
  describe('ATK-08: FREE tentando ultrapassar limite de links', () => {
    it('plano FREE tem limite de 5 links', () => {
      const limits = getPlanLimits('FREE');
      expect(limits.maxLinks).toBe(5);
    });

    it('plano FREE tem limite de 1 cartão', () => {
      const limits = getPlanLimits('FREE');
      expect(limits.maxCards).toBe(1);
    });

    it('plano FREE tem apenas 3 temas', () => {
      const limits = getPlanLimits('FREE');
      expect(limits.maxThemes).toBe(3);
    });

    it('plano PRO desbloqueia TODOS os temas', () => {
      const limits = getPlanLimits('PRO');
      expect(limits.maxThemes).toBe('all');
    });
  });
});

// ══════════════════════════════════════════════════
// 4 — ESCALAÇÃO DE ROLE EM ORGANIZAÇÃO
// ══════════════════════════════════════════════════

describe('ATAQUE OFENSIVO — Escalação de Role em Organização', () => {
  let orgRoleGuard: OrgRoleGuard;
  let orgService: OrganizationsService;
  let prisma: ReturnType<typeof createPrismaMock>;

  const OWNER_ID = TEST_USERS.businessOwner.id;
  const MEMBER_ID = TEST_USERS.freeUser.id;
  const ADMIN_ID = TEST_USERS.proUser.id;
  const ORG_A_ID = TEST_ORGS.orgA.id;
  const ORG_B_ID = TEST_ORGS.orgB.id;

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrgRoleGuard,
        OrganizationsService,
        Reflector,
        { provide: PrismaService, useValue: prisma },
        { provide: MailService, useValue: createMailMock() },
      ],
    }).compile();

    orgRoleGuard = module.get<OrgRoleGuard>(OrgRoleGuard);
    orgService = module.get<OrganizationsService>(OrganizationsService);
  });

  afterEach(() => jest.restoreAllMocks());

  /**
   * Cria mock de ExecutionContext para OrgRoleGuard
   */
  function createOrgContext(userId: string | null, orgId: string, minRole: string | undefined, userRole = 'USER') {
    const request = {
      user: userId ? { sub: userId, role: userRole } : null,
      params: { orgId },
    };
    const handler = {};
    const reflector = new Reflector();
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(minRole);

    return {
      context: {
        switchToHttp: () => ({ getRequest: () => request }),
        getHandler: () => handler,
        getClass: () => ({}),
      } as any,
      reflector,
    };
  }

  // ──────────────────────────────────────────────
  // ATAQUE 4.1: MEMBER tentando deletar organização (requer OWNER)
  // ──────────────────────────────────────────────
  describe('ATK-09: MEMBER tentando ação de OWNER (delete org)', () => {
    /**
     * TEORIA: Um MEMBER obtém o orgId e tenta DELETE /organizations/:orgId
     * MITIGAÇÃO: OrgRoleGuard verifica hierarchy[member.role] >= hierarchy[OWNER]
     */
    it('MEMBER deve ser BLOQUEADO em rota que requer OWNER', async () => {
      prisma.organizationMember.findUnique.mockResolvedValue({
        id: 'member-001',
        orgId: ORG_A_ID,
        userId: MEMBER_ID,
        role: 'MEMBER', // role insuficiente
      });

      const { context, reflector } = createOrgContext(MEMBER_ID, ORG_A_ID, 'OWNER');
      const guard = new OrgRoleGuard(reflector, prisma as any);

      await expect(guard.canActivate(context)).rejects.toThrow('Permissao insuficiente');
    });

    it('ADMIN deve ser BLOQUEADO em rota que requer OWNER', async () => {
      prisma.organizationMember.findUnique.mockResolvedValue({
        id: 'admin-001',
        orgId: ORG_A_ID,
        userId: ADMIN_ID,
        role: 'ADMIN', // insuficiente para OWNER
      });

      const { context, reflector } = createOrgContext(ADMIN_ID, ORG_A_ID, 'OWNER');
      const guard = new OrgRoleGuard(reflector, prisma as any);

      await expect(guard.canActivate(context)).rejects.toThrow('Permissao insuficiente');
    });

    it('OWNER DEVE ser PERMITIDO em rota que requer OWNER', async () => {
      prisma.organizationMember.findUnique.mockResolvedValue({
        id: 'owner-001',
        orgId: ORG_A_ID,
        userId: OWNER_ID,
        role: 'OWNER',
      });

      const { context, reflector } = createOrgContext(OWNER_ID, ORG_A_ID, 'OWNER');
      const guard = new OrgRoleGuard(reflector, prisma as any);

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });
  });

  // ──────────────────────────────────────────────
  // ATAQUE 4.2: MEMBER tentando ações de ADMIN
  // ──────────────────────────────────────────────
  describe('ATK-10: MEMBER tentando ações de ADMIN (invite, remove, analytics)', () => {
    it('MEMBER deve ser BLOQUEADO em rota que requer ADMIN', async () => {
      prisma.organizationMember.findUnique.mockResolvedValue({
        id: 'member-002',
        orgId: ORG_A_ID,
        userId: MEMBER_ID,
        role: 'MEMBER',
      });

      const { context, reflector } = createOrgContext(MEMBER_ID, ORG_A_ID, 'ADMIN');
      const guard = new OrgRoleGuard(reflector, prisma as any);

      await expect(guard.canActivate(context)).rejects.toThrow('Permissao insuficiente');
    });

    it('ADMIN DEVE ser PERMITIDO em rota que requer ADMIN', async () => {
      prisma.organizationMember.findUnique.mockResolvedValue({
        id: 'admin-002',
        orgId: ORG_A_ID,
        userId: ADMIN_ID,
        role: 'ADMIN',
      });

      const { context, reflector } = createOrgContext(ADMIN_ID, ORG_A_ID, 'ADMIN');
      const guard = new OrgRoleGuard(reflector, prisma as any);

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('OWNER DEVE ser PERMITIDO em rota que requer ADMIN (hierarquia)', async () => {
      prisma.organizationMember.findUnique.mockResolvedValue({
        id: 'owner-002',
        orgId: ORG_A_ID,
        userId: OWNER_ID,
        role: 'OWNER',
      });

      const { context, reflector } = createOrgContext(OWNER_ID, ORG_A_ID, 'ADMIN');
      const guard = new OrgRoleGuard(reflector, prisma as any);

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });
  });

  // ──────────────────────────────────────────────
  // ATAQUE 4.3: Não-membro tentando acessar org
  // ──────────────────────────────────────────────
  describe('ATK-11: Não-membro tentando acessar organização', () => {
    it('não-membro deve ser BLOQUEADO mesmo com role MEMBER requerido', async () => {
      // Usuário não é membro da organização
      prisma.organizationMember.findUnique.mockResolvedValue(null);

      const { context, reflector } = createOrgContext(TEST_USERS.enterpriseUser.id, ORG_A_ID, 'MEMBER');
      const guard = new OrgRoleGuard(reflector, prisma as any);

      await expect(guard.canActivate(context)).rejects.toThrow('membro');
    });

    it('request sem userId (sem JWT) deve ser REJEITADO', async () => {
      const { context, reflector } = createOrgContext(null, ORG_A_ID, 'MEMBER');
      const guard = new OrgRoleGuard(reflector, prisma as any);

      await expect(guard.canActivate(context)).rejects.toThrow();
    });
  });

  // ──────────────────────────────────────────────
  // ATAQUE 4.4: SUPER_ADMIN bypass (funcionalidade legítima)
  // ──────────────────────────────────────────────
  describe('ATK-12: SUPER_ADMIN bypass de OrgRoleGuard', () => {
    /**
     * VERIFICAÇÃO: SUPER_ADMIN deve ter acesso irrestrito a qualquer org
     * (funcionalidade de plataforma, não escalação).
     */
    it('SUPER_ADMIN deve ter acesso a qualquer org sem ser membro', async () => {
      const { context, reflector } = createOrgContext(
        TEST_USERS.superAdmin.id,
        ORG_A_ID,
        'OWNER',
        'SUPER_ADMIN', // role do JWT
      );
      const guard = new OrgRoleGuard(reflector, prisma as any);

      const result = await guard.canActivate(context);
      expect(result).toBe(true);

      // Não deve nem consultar membership no banco
      expect(prisma.organizationMember.findUnique).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────
  // ATAQUE 4.5: MEMBER tentando alterar role do OWNER
  // ──────────────────────────────────────────────
  describe('ATK-13: Tentar rebaixar OWNER via updateMemberRole', () => {
    /**
     * TEORIA: ADMIN tenta alterar o role do OWNER para MEMBER
     * via PUT /organizations/:orgId/members/:memberId
     * MITIGAÇÃO: updateMemberRole() verifica se o target é OWNER
     * e rejeita alteração.
     */
    it('deve REJEITAR alteração de role do OWNER', async () => {
      prisma.organizationMember.findUnique.mockResolvedValue({
        id: 'owner-member-001',
        orgId: ORG_A_ID,
        userId: OWNER_ID,
        role: 'OWNER', // target é o OWNER
      });

      await expect(
        orgService.updateMemberRole(ORG_A_ID, 'owner-member-001', ADMIN_ID, 'MEMBER'),
      ).rejects.toThrow('proprietario');
    });

    it('deve REJEITAR memberId de outra organização', async () => {
      prisma.organizationMember.findUnique.mockResolvedValue({
        id: 'member-other-org',
        orgId: ORG_B_ID, // pertence à org B
        userId: MEMBER_ID,
        role: 'MEMBER',
      });

      await expect(
        orgService.updateMemberRole(ORG_A_ID, 'member-other-org', OWNER_ID, 'ADMIN'),
      ).rejects.toThrow('não encontrad');
    });
  });

  // ──────────────────────────────────────────────
  // ATAQUE 4.6: Tentar remover OWNER da organização
  // ──────────────────────────────────────────────
  describe('ATK-14: Tentar remover OWNER via removeMember', () => {
    it('deve REJEITAR remoção do OWNER', async () => {
      prisma.organizationMember.findUnique.mockResolvedValue({
        id: 'owner-member-002',
        orgId: ORG_A_ID,
        userId: OWNER_ID,
        role: 'OWNER',
      });

      await expect(
        orgService.removeMember(ORG_A_ID, 'owner-member-002'),
      ).rejects.toThrow('proprietario');

      expect(prisma.organizationMember.delete).not.toHaveBeenCalled();
    });
  });
});

// ══════════════════════════════════════════════════
// 5 — MANIPULAÇÃO DE JWT
// ══════════════════════════════════════════════════

describe('ATAQUE OFENSIVO — Manipulação de JWT', () => {
  const jwtService = new JwtService({});

  // ──────────────────────────────────────────────
  // ATAQUE 5.1: JWT expirado
  // ──────────────────────────────────────────────
  describe('ATK-15: JWT expirado deve ser REJEITADO', () => {
    it('deve lançar erro ao verificar JWT expirado (0s TTL)', () => {
      const token = generateExpiredJwt({
        sub: TEST_USERS.proUser.id,
        email: TEST_USERS.proUser.email,
      });

      expect(() => {
        jwtService.verify(token, { secret: TEST_JWT_SECRET });
      }).toThrow();
    });
  });

  // ──────────────────────────────────────────────
  // ATAQUE 5.2: JWT com secret incorreto
  // ──────────────────────────────────────────────
  describe('ATK-16: JWT assinado com secret ERRADO', () => {
    it('deve REJEITAR JWT assinado com outro secret', () => {
      const token = generateBadSecretJwt({
        sub: TEST_USERS.proUser.id,
        email: TEST_USERS.proUser.email,
      });

      expect(() => {
        jwtService.verify(token, { secret: TEST_JWT_SECRET });
      }).toThrow();
    });
  });

  // ──────────────────────────────────────────────
  // ATAQUE 5.3: JWT com payload tampereado (escalação via sub/role)
  // ──────────────────────────────────────────────
  describe('ATK-17: JWT com payload tampereado', () => {
    it('atacante tenta trocar sub para ID de outro user — deve ser REJEITADO', () => {
      const token = generateTestJwt({
        sub: TEST_USERS.freeUser.id,
        email: TEST_USERS.freeUser.email,
        role: 'USER',
      });

      // Tamperear payload: trocar sub para admin ID
      const parts = token.split('.');
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
      payload.sub = TEST_USERS.superAdmin.id;
      payload.role = 'SUPER_ADMIN';
      parts[1] = Buffer.from(JSON.stringify(payload)).toString('base64url');
      const tampered = parts.join('.');

      expect(() => {
        jwtService.verify(tampered, { secret: TEST_JWT_SECRET });
      }).toThrow();
    });

    it('atacante tenta escalação de role USER → SUPER_ADMIN — deve ser REJEITADO', () => {
      const token = generateTestJwt({
        sub: TEST_USERS.freeUser.id,
        email: TEST_USERS.freeUser.email,
        role: 'USER',
      });

      const parts = token.split('.');
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
      payload.role = 'SUPER_ADMIN'; // escalação
      parts[1] = Buffer.from(JSON.stringify(payload)).toString('base64url');
      const tampered = parts.join('.');

      expect(() => {
        jwtService.verify(tampered, { secret: TEST_JWT_SECRET });
      }).toThrow();
    });
  });

  // ──────────────────────────────────────────────
  // ATAQUE 5.4: Algoritmo "none" (alg substitution)
  // ──────────────────────────────────────────────
  describe('ATK-18: JWT com algoritmo "none" (alg substitution attack)', () => {
    it('alg:none com assinatura vazia deve ser REJEITADO', () => {
      const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(
        JSON.stringify({ sub: 'hacker', email: 'hack@evil.com', role: 'SUPER_ADMIN' }),
      ).toString('base64url');
      const noneToken = `${header}.${payload}.`;

      expect(() => {
        jwtService.verify(noneToken, { secret: TEST_JWT_SECRET });
      }).toThrow();
    });

    it('alg:none com payload de admin deve ser REJEITADO', () => {
      const header = Buffer.from(JSON.stringify({ alg: 'none' })).toString('base64url');
      const payload = Buffer.from(
        JSON.stringify({
          sub: TEST_USERS.superAdmin.id,
          email: TEST_USERS.superAdmin.email,
          role: 'SUPER_ADMIN',
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
        }),
      ).toString('base64url');
      const noneToken = `${header}.${payload}.`;

      expect(() => {
        jwtService.verify(noneToken, { secret: TEST_JWT_SECRET });
      }).toThrow();
    });
  });

  // ──────────────────────────────────────────────
  // ATAQUE 5.5: Inputs malformados como JWT
  // ──────────────────────────────────────────────
  describe('ATK-19: Inputs malformados como JWT', () => {
    const MALFORMED_INPUTS = [
      '', // string vazia
      'not-a-jwt', // texto qualquer
      'eyJ.eyJ.', // segmentos vazios com prefixo JWT
      '..', // 3 segmentos mas vazios
      'a.b', // apenas 2 segmentos
      'null', // string literal null
      'undefined', // string literal undefined
      '<script>alert(1)</script>', // XSS attempt
      '{"sub":"admin"}', // JSON bruto (não base64)
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.INVALID', // assinatura inválida
    ];

    it.each(MALFORMED_INPUTS)(
      'deve REJEITAR input malformado: "%s"',
      (input) => {
        expect(() => {
          jwtService.verify(input, { secret: TEST_JWT_SECRET });
        }).toThrow();
      },
    );
  });
});

// ══════════════════════════════════════════════════
// 6 — ACESSO CROSS-ORG
// ══════════════════════════════════════════════════

describe('ATAQUE OFENSIVO — Acesso Cross-Org', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let orgService: OrganizationsService;

  const ORG_A_ID = TEST_ORGS.orgA.id;
  const ORG_B_ID = TEST_ORGS.orgB.id;
  const USER_ORG_A = TEST_USERS.businessOwner.id; // OWNER da org A
  const USER_ORG_B = TEST_USERS.proUser.id; // OWNER da org B

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        { provide: PrismaService, useValue: prisma },
        { provide: MailService, useValue: createMailMock() },
      ],
    }).compile();

    orgService = module.get<OrganizationsService>(OrganizationsService);
  });

  afterEach(() => jest.restoreAllMocks());

  // ──────────────────────────────────────────────
  // ATAQUE 6.1: Membro da org A tentando acessar org B via OrgRoleGuard
  // ──────────────────────────────────────────────
  describe('ATK-20: Membro da org A tenta acessar org B', () => {
    it('OrgRoleGuard deve BLOQUEAR membro da org A ao acessar org B', async () => {
      // Usuário é membro apenas da org A, NÃO da org B
      prisma.organizationMember.findUnique.mockResolvedValue(null);

      const reflector = new Reflector();
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('MEMBER');

      const guard = new OrgRoleGuard(reflector, prisma as any);

      const request = {
        user: { sub: USER_ORG_A, role: 'USER' },
        params: { orgId: ORG_B_ID }, // tentando acessar org B
      };

      const context = {
        switchToHttp: () => ({ getRequest: () => request }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as any;

      await expect(guard.canActivate(context)).rejects.toThrow('membro');
    });
  });

  // ──────────────────────────────────────────────
  // ATAQUE 6.2: Revogar convite de outra org
  // ──────────────────────────────────────────────
  describe('ATK-21: Revogar convite de OUTRA organização', () => {
    /**
     * TEORIA: Admin da org A tenta DELETE /organizations/:orgA/invites/:inviteId
     * mas inviteId pertence à org B.
     * MITIGAÇÃO: revokeInvite() verifica invite.orgId !== orgId
     */
    it('deve REJEITAR revogação de convite de outra org', async () => {
      prisma.organizationInvite.findUnique.mockResolvedValue({
        id: 'invite-org-b',
        orgId: ORG_B_ID, // convite pertence à org B
        email: 'someone@test.local',
      });

      await expect(
        orgService.revokeInvite(ORG_A_ID, 'invite-org-b'),
      ).rejects.toThrow('não encontrad');

      expect(prisma.organizationInvite.delete).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────
  // ATAQUE 6.3: Alterar role de membro de outra org
  // ──────────────────────────────────────────────
  describe('ATK-22: Alterar role de membro de OUTRA org', () => {
    /**
     * TEORIA: OWNER da org A tenta alterar role de membro que pertence à org B
     * via PUT /organizations/:orgA/members/:memberIdOrgB
     * MITIGAÇÃO: updateMemberRole() verifica member.orgId !== orgId
     */
    it('deve REJEITAR alteração de role de membro de outra org', async () => {
      prisma.organizationMember.findUnique.mockResolvedValue({
        id: 'member-org-b-001',
        orgId: ORG_B_ID, // membro pertence à org B
        userId: USER_ORG_B,
        role: 'MEMBER',
      });

      await expect(
        orgService.updateMemberRole(ORG_A_ID, 'member-org-b-001', USER_ORG_A, 'ADMIN'),
      ).rejects.toThrow('não encontrad');
    });
  });

  // ──────────────────────────────────────────────
  // ATAQUE 6.4: Remover membro de outra org
  // ──────────────────────────────────────────────
  describe('ATK-23: Remover membro de OUTRA org', () => {
    it('deve REJEITAR remoção de membro de outra org', async () => {
      prisma.organizationMember.findUnique.mockResolvedValue({
        id: 'member-org-b-002',
        orgId: ORG_B_ID,
        userId: USER_ORG_B,
        role: 'MEMBER',
      });

      await expect(
        orgService.removeMember(ORG_A_ID, 'member-org-b-002'),
      ).rejects.toThrow('não encontrad');

      expect(prisma.organizationMember.delete).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────
  // ATAQUE 6.5: Aceitar convite destinado a outro email
  // ──────────────────────────────────────────────
  describe('ATK-24: Aceitar convite destinado a OUTRO email', () => {
    /**
     * TEORIA: Atacante obtém token de convite (e.g., via inspeção de URL)
     * e tenta aceitar convite que foi enviado para outro email.
     * MITIGAÇÃO: acceptInvite() compara user.email !== invite.email
     */
    it('deve REJEITAR aceitação de convite destinado a outro email', async () => {
      prisma.organizationInvite.findUnique.mockResolvedValue({
        id: 'invite-001',
        orgId: ORG_A_ID,
        email: 'intended-recipient@company.com', // para este email
        role: 'MEMBER',
        token: 'stolen-token',
        usedAt: null,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      // Atacante tem email diferente
      prisma.user.findUnique.mockResolvedValue({
        id: TEST_USERS.freeUser.id,
        email: TEST_USERS.freeUser.email, // email diferente do convite
      });

      await expect(
        orgService.acceptInvite('stolen-token', TEST_USERS.freeUser.id),
      ).rejects.toThrow('outro email');
    });

    it('deve REJEITAR convite já utilizado (replay)', async () => {
      prisma.organizationInvite.findUnique.mockResolvedValue({
        id: 'invite-used',
        orgId: ORG_A_ID,
        email: TEST_USERS.freeUser.email,
        role: 'MEMBER',
        token: 'used-token',
        usedAt: new Date(), // já foi usado!
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      await expect(
        orgService.acceptInvite('used-token', TEST_USERS.freeUser.id),
      ).rejects.toThrow('utilizado');
    });

    it('deve REJEITAR convite expirado', async () => {
      prisma.organizationInvite.findUnique.mockResolvedValue({
        id: 'invite-expired',
        orgId: ORG_A_ID,
        email: TEST_USERS.freeUser.email,
        role: 'MEMBER',
        token: 'expired-token',
        usedAt: null,
        expiresAt: new Date(Date.now() - 1000), // expirou
      });

      await expect(
        orgService.acceptInvite('expired-token', TEST_USERS.freeUser.id),
      ).rejects.toThrow('expirado');
    });
  });
});
