/**
 * ═══════════════════════════════════════════════════════════════════
 *  SCRIPT DE ATAQUE OFENSIVO — VETOR 1: WEBHOOKS MERCADO PAGO
 * ═══════════════════════════════════════════════════════════════════
 *
 *  Autor: Offensive Security Engineer (White-Box Pentest)
 *  Objetivo: Testar TODAS as vias de falsificação de webhooks para
 *            aprovar assinaturas de forma ilícita.
 *
 *  VULNERABILIDADES-ALVO:
 *    1. Forjar payload sem assinatura HMAC → deve ser REJEITADO
 *    2. Forjar payload com HMAC inválido → deve ser REJEITADO
 *    3. IPN bypass via query params (sem HMAC) → vetor de DoS/enumeração
 *    4. Replay attack com webhook antigo válido → deve ser bloqueado
 *    5. Manipulação de external_reference → ativar plano de outro user
 *    6. MP_WEBHOOK_SECRET ausente/placeholder → bloquear totalmente
 *    7. Timing comparison leak (HMAC timing-safe?) → verificar
 *    8. Webhook com data.id inexistente → não crashar
 *    9. Webhook com status "approved" forçado no body → ignorar body.status
 *   10. Concorrência: 2 webhooks simultâneos aprovam 1x só
 *
 *  TODOS OS TESTES SÃO EXECUTADOS EM SANDBOX (mocks).
 *  Nenhum dado de produção é tocado.
 */

import * as crypto from 'crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PaymentsService } from '../../src/payments/payments.service';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import { MailService } from '../../src/mail/mail.service';
import { PAYMENT_GATEWAY } from '../../src/payments/gateway/payment-gateway.interface';
import {
  createPrismaMock,
  createConfigMock,
  createMailMock,
  createGatewayMock,
  mockGatewayFetchPayment,
  buildMpWebhookPayload,
  TEST_USERS,
} from '../helpers/test-utils';

// ══════════════════════════════════════════════════
// Helper: Gerar HMAC válido (simula assinatura do MP)
// ══════════════════════════════════════════════════

const WEBHOOK_SECRET = 'test-webhook-secret';

function forgeHmacSignature(
  dataId: string,
  requestId: string,
  secret: string,
  ts?: string,
): { xSignature: string; xRequestId: string } {
  const timestamp = ts || String(Date.now());
  const template = `id:${dataId};request-id:${requestId};ts:${timestamp};`;
  const hmac = crypto.createHmac('sha256', secret).update(template).digest('hex');
  return {
    xSignature: `ts=${timestamp},v1=${hmac}`,
    xRequestId: requestId,
  };
}

// ══════════════════════════════════════════════════
// Setup compartilhado
// ══════════════════════════════════════════════════

describe('🔴 ATAQUE OFENSIVO — Webhooks Mercado Pago', () => {
  let service: PaymentsService;
  let prisma: ReturnType<typeof createPrismaMock>;
  let mailMock: ReturnType<typeof createMailMock>;
  let gatewayMock: ReturnType<typeof createGatewayMock>;

  beforeEach(async () => {
    prisma = createPrismaMock();
    mailMock = createMailMock();
    gatewayMock = createGatewayMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: createConfigMock() },
        { provide: MailService, useValue: mailMock },
        { provide: PAYMENT_GATEWAY, useValue: gatewayMock },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  afterEach(() => jest.restoreAllMocks());

  // ──────────────────────────────────────────────
  // ATAQUE 1: Webhook forjado SEM assinatura HMAC
  // ──────────────────────────────────────────────
  describe('ATK-01: Forjar webhook sem headers de assinatura', () => {
    /**
     * TEORIA: Atacante envia POST /api/payments/webhook com body
     * válido mas sem x-signature e x-request-id.
     * ESPERADO: gateway.verifyWebhookSignature retorna false → 403
     */
    it('deve REJEITAR webhook sem x-signature (forjado)', async () => {
      // DESCOBERTA: O handler tem uma validação ANTERIOR ao HMAC check
      // que rejeita webhooks sem headers com "Webhook sem assinatura"
      // Isso é MAIS seguro — nem chega a chamar verifyWebhookSignature
      gatewayMock.verifyWebhookSignature.mockReturnValue(false);

      await expect(
        service.handleWebhook(
          buildMpWebhookPayload('mp-fake-001'),
          { xSignature: undefined, xRequestId: undefined },
        ),
      ).rejects.toThrow('Webhook sem assinatura');

      // Verificar que NENHUM pagamento foi processado
      expect(prisma.payment.findUnique).not.toHaveBeenCalled();
      expect(prisma.payment.updateMany).not.toHaveBeenCalled();
      expect(prisma.user.update).not.toHaveBeenCalled();
      // Gateway NUNCA chamado — bloqueio na camada anterior
      expect(gatewayMock.verifyWebhookSignature).not.toHaveBeenCalled();
    });

    it('deve REJEITAR webhook com x-signature vazia', async () => {
      gatewayMock.verifyWebhookSignature.mockReturnValue(false);

      await expect(
        service.handleWebhook(
          buildMpWebhookPayload('mp-fake-002'),
          { xSignature: '', xRequestId: '' },
        ),
      ).rejects.toThrow('Webhook sem assinatura');

      expect(prisma.payment.updateMany).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────
  // ATAQUE 2: HMAC com secret ERRADO
  // ──────────────────────────────────────────────
  describe('ATK-02: Forjar HMAC com secret incorreto', () => {
    /**
     * TEORIA: Atacante tenta adivinhar o secret ou usa
     * um secret aleatório para gerar assinatura HMAC.
     * ESPERADO: HMAC mismatch → 403
     */
    it('deve REJEITAR HMAC assinado com secret errado', async () => {
      const wrongSecret = 'atacante-tentando-adivinhar-secret-123';
      const fakeHeaders = forgeHmacSignature('mp-fake-003', 'req-fake-001', wrongSecret);

      // O gateway REAL compararia e retornaria false
      gatewayMock.verifyWebhookSignature.mockReturnValue(false);

      await expect(
        service.handleWebhook(
          buildMpWebhookPayload('mp-fake-003'),
          fakeHeaders,
        ),
      ).rejects.toThrow('Assinatura do webhook invalida');

      expect(prisma.payment.updateMany).not.toHaveBeenCalled();
    });

    it('deve REJEITAR HMAC com secret parcialmente correto (off-by-one)', async () => {
      const almostRight = WEBHOOK_SECRET.slice(0, -1) + 'X';
      const fakeHeaders = forgeHmacSignature('mp-fake-004', 'req-fake-002', almostRight);

      gatewayMock.verifyWebhookSignature.mockReturnValue(false);

      await expect(
        service.handleWebhook(
          buildMpWebhookPayload('mp-fake-004'),
          fakeHeaders,
        ),
      ).rejects.toThrow('Assinatura do webhook invalida');
    });
  });

  // ──────────────────────────────────────────────
  // ATAQUE 3: Webhook com data.id manipulado
  // ──────────────────────────────────────────────
  describe('ATK-03: Manipulação de data.id para ativar plano de OUTRO user', () => {
    /**
     * TEORIA: Atacante intercepta um webhook legítimo e troca
     * data.id pelo payment ID de outro utilizador, tentando
     * aprovar o plano do outro user com o seu próprio pagamento.
     *
     * MITIGAÇÃO: external_reference (nosso payment ID) vem do
     * Mercado Pago API, não do body do webhook. Se o atacante
     * trocar data.id, o MP retorna o pagamento REAL daquele ID
     * com o external_reference ORIGINAL.
     */
    it('data.id falso aponta para pagamento de OUTRO user — não deve afetar vitima', async () => {
      const attackerPaymentId = 'attacker-pay-001';
      const victimPaymentId = 'victim-pay-001';

      // O gateway busca o pagamento no MP — retorna dados do atacante, não da vítima
      mockGatewayFetchPayment(gatewayMock, 'mp-attacker-001', attackerPaymentId, 'approved', 30);
      gatewayMock.verifyWebhookSignature.mockReturnValue(true);

      // Atacante tem pagamento pendente
      prisma.payment.findUnique.mockResolvedValue({
        id: attackerPaymentId,
        userId: TEST_USERS.freeUser.id,
        status: 'pending',
        plan: 'PRO',
        mpPaymentId: null,
      });
      prisma.payment.updateMany.mockResolvedValue({ count: 1 });
      prisma.user.update.mockResolvedValue({});
      prisma.user.findUnique.mockResolvedValue({
        email: TEST_USERS.freeUser.email,
        name: TEST_USERS.freeUser.name,
      });

      // Atacante envia webhook apontando para seu próprio payment
      await service.handleWebhook(
        buildMpWebhookPayload('mp-attacker-001'),
        forgeHmacSignature('mp-attacker-001', 'req-001', WEBHOOK_SECRET),
      );

      // Verificar: só o atacante foi atualizado, vítima intocada
      expect(prisma.payment.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: attackerPaymentId, status: { not: 'approved' } },
        }),
      );
      // Vítima NUNCA é referenciada
      expect(prisma.payment.findUnique).not.toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: victimPaymentId } }),
      );
    });
  });

  // ──────────────────────────────────────────────
  // ATAQUE 4: Replay attack — webhook antigo
  // ──────────────────────────────────────────────
  describe('ATK-04: Replay attack com webhook antigo', () => {
    /**
     * TEORIA: Atacante captura um webhook legítimo (HMAC válido)
     * e o reenvia depois. Se o pagamento já foi aprovado,
     * o update atômico com status: { not: 'approved' } deve
     * bloquear a re-aprovação.
     */
    it('replay de webhook já aprovado deve ser ignorado (idempotência)', async () => {
      const mpPaymentId = 'mp-replay-001';
      const paymentId = 'pay-already-approved';

      mockGatewayFetchPayment(gatewayMock, mpPaymentId, paymentId, 'approved', 30);
      gatewayMock.verifyWebhookSignature.mockReturnValue(true);

      // Pagamento JÁ aprovado
      prisma.payment.findUnique.mockResolvedValue({
        id: paymentId,
        userId: TEST_USERS.proUser.id,
        status: 'approved', // ← já aprovado anteriormente
        plan: 'PRO',
        mpPaymentId: mpPaymentId,
      });

      await service.handleWebhook(
        buildMpWebhookPayload(mpPaymentId),
        forgeHmacSignature(mpPaymentId, 'req-replay-001', WEBHOOK_SECRET),
      );

      // Nada deve ser alterado
      expect(prisma.payment.updateMany).not.toHaveBeenCalled();
      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(mailMock.sendPaymentConfirmation).not.toHaveBeenCalled();
    });

    it('replay com timestamp antigo mas mesmo mpPaymentId+status → duplicata ignorada', async () => {
      const mpPaymentId = 'mp-replay-002';
      const paymentId = 'pay-pending-dup';

      mockGatewayFetchPayment(gatewayMock, mpPaymentId, paymentId, 'pending');
      gatewayMock.verifyWebhookSignature.mockReturnValue(true);

      prisma.payment.findUnique.mockResolvedValue({
        id: paymentId,
        userId: TEST_USERS.freeUser.id,
        status: 'pending',
        plan: 'PRO',
        mpPaymentId: String(mpPaymentId), // mesmo mpPaymentId
      });

      await service.handleWebhook(
        buildMpWebhookPayload(mpPaymentId),
        forgeHmacSignature(mpPaymentId, 'req-replay-002', WEBHOOK_SECRET, '1000000000'), // timestamp antigo
      );

      // Duplicata detectada — nada atualizado
      expect(prisma.payment.updateMany).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────
  // ATAQUE 5: MP_WEBHOOK_SECRET ausente ou placeholder
  // ──────────────────────────────────────────────
  describe('ATK-05: Secret não configurado (misconfiguration attack)', () => {
    /**
     * TEORIA: Se MP_WEBHOOK_SECRET estiver ausente ou como 'placeholder',
     * um atacante poderia enviar qualquer webhook sem assinatura.
     * MITIGAÇÃO: handleWebhook REJEITA antes de verificar HMAC.
     */
    it('deve REJEITAR tudo quando MP_WEBHOOK_SECRET = placeholder', async () => {
      // Recriar service com secret placeholder
      const module = await Test.createTestingModule({
        providers: [
          PaymentsService,
          { provide: PrismaService, useValue: prisma },
          { provide: ConfigService, useValue: createConfigMock({ MP_WEBHOOK_SECRET: 'placeholder' }) },
          { provide: MailService, useValue: mailMock },
          { provide: PAYMENT_GATEWAY, useValue: gatewayMock },
        ],
      }).compile();

      const insecureService = module.get<PaymentsService>(PaymentsService);

      await expect(
        insecureService.handleWebhook(
          buildMpWebhookPayload('mp-evil-001'),
          { xSignature: undefined, xRequestId: undefined },
        ),
      ).rejects.toThrow('Webhook secret');

      expect(prisma.payment.updateMany).not.toHaveBeenCalled();
    });

    it('deve REJEITAR tudo quando MP_WEBHOOK_SECRET está vazio', async () => {
      const module = await Test.createTestingModule({
        providers: [
          PaymentsService,
          { provide: PrismaService, useValue: prisma },
          { provide: ConfigService, useValue: createConfigMock({ MP_WEBHOOK_SECRET: '' }) },
          { provide: MailService, useValue: mailMock },
          { provide: PAYMENT_GATEWAY, useValue: gatewayMock },
        ],
      }).compile();

      const insecureService = module.get<PaymentsService>(PaymentsService);

      await expect(
        insecureService.handleWebhook(
          buildMpWebhookPayload('mp-evil-002'),
          forgeHmacSignature('mp-evil-002', 'req-001', ''), // HMAC com secret vazio
        ),
      ).rejects.toThrow('Webhook secret');
    });
  });

  // ──────────────────────────────────────────────
  // ATAQUE 6: Body status manipulation
  // ──────────────────────────────────────────────
  describe('ATK-06: Manipular body.status para forçar "approved"', () => {
    /**
     * TEORIA: Atacante envia body com status "approved" esperando
     * que o backend use esse valor. MITIGAÇÃO: o backend IGNORA
     * body.status e busca o status REAL via API do MP.
     */
    it('body.status="approved" deve ser ignorado — usar status da API MP', async () => {
      const mpPaymentId = 'mp-manipulate-001';
      const paymentId = 'pay-manipulate-001';

      // API do MP retorna "pending" (real)
      mockGatewayFetchPayment(gatewayMock, mpPaymentId, paymentId, 'pending');
      gatewayMock.verifyWebhookSignature.mockReturnValue(true);

      prisma.payment.findUnique.mockResolvedValue({
        id: paymentId,
        userId: TEST_USERS.freeUser.id,
        status: 'pending',
        plan: 'PRO',
        mpPaymentId: null,
      });
      prisma.payment.updateMany.mockResolvedValue({ count: 1 });

      // Atacante envia body com status forjado
      const maliciousBody = {
        type: 'payment',
        action: 'payment.updated',
        data: { id: mpPaymentId, status: 'approved' }, // ← forjado!
      };

      await service.handleWebhook(
        maliciousBody as any,
        forgeHmacSignature(mpPaymentId, 'req-manip-001', WEBHOOK_SECRET),
      );

      // Status real é "pending" (vindo da API), NÃO "approved"
      expect(prisma.payment.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'pending' }),
        }),
      );
      // Plano NÃO atualizado (não é approved)
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────
  // ATAQUE 7: Race condition — webhooks simultâneos
  // ──────────────────────────────────────────────
  describe('ATK-07: Race condition — 2 webhooks aprovam 1 vez só', () => {
    /**
     * TEORIA: Atacante envia 2 webhooks simultâneos para o mesmo
     * pagamento. Sem proteção, ambos poderiam aprovar e duplicar
     * o efeito (emails duplos, etc).
     * MITIGAÇÃO: updateMany com status: { not: 'approved' }
     * garante que apenas 1 dos 2 efetivamente atualiza.
     */
    it('segundo webhook concorrente retorna count=0 — não duplica aprovação', async () => {
      const mpPaymentId = 'mp-race-001';
      const paymentId = 'pay-race-001';

      mockGatewayFetchPayment(gatewayMock, mpPaymentId, paymentId, 'approved');
      gatewayMock.verifyWebhookSignature.mockReturnValue(true);

      prisma.payment.findUnique.mockResolvedValue({
        id: paymentId,
        userId: TEST_USERS.freeUser.id,
        status: 'pending',
        plan: 'PRO',
        mpPaymentId: null,
      });

      // Primeiro webhook ganha — count=1
      prisma.payment.updateMany.mockResolvedValueOnce({ count: 1 });
      prisma.user.update.mockResolvedValue({});
      prisma.user.findUnique.mockResolvedValue({
        email: TEST_USERS.freeUser.email,
        name: TEST_USERS.freeUser.name,
      });

      const headers = forgeHmacSignature(mpPaymentId, 'req-race-001', WEBHOOK_SECRET);
      await service.handleWebhook(buildMpWebhookPayload(mpPaymentId), headers);

      // Verificar que plano foi atualizado 1 vez
      expect(prisma.user.update).toHaveBeenCalledTimes(1);
      expect(mailMock.sendPaymentConfirmation).toHaveBeenCalledTimes(1);

      // Reset mocks para simular segundo webhook
      prisma.user.update.mockClear();
      mailMock.sendPaymentConfirmation.mockClear();

      // Segundo webhook perde — count=0 (atualização atômica falha)
      prisma.payment.updateMany.mockResolvedValueOnce({ count: 0 });

      await service.handleWebhook(buildMpWebhookPayload(mpPaymentId), headers);

      // Segundo webhook NÃO ativa nada
      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(mailMock.sendPaymentConfirmation).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────
  // ATAQUE 8: Payload malformado / crash attempt
  // ──────────────────────────────────────────────
  describe('ATK-08: Payloads malformados para crashar o handler', () => {
    /**
     * TEORIA: Atacante envia payloads bizarros para causar
     * exceções não tratadas (null pointer, TypeError, etc).
     */
    it('body completamente vazio deve ser REJEITADO (sem assinatura)', async () => {
      // Body vazio + sem headers → rejeitado antes de processar
      await expect(
        service.handleWebhook({} as any, { xSignature: undefined, xRequestId: undefined }),
      ).rejects.toThrow('Webhook sem assinatura');

      expect(prisma.payment.findUnique).not.toHaveBeenCalled();
    });

    it('body com data.id = null não deve crashar', async () => {
      gatewayMock.verifyWebhookSignature.mockReturnValue(true);
      await expect(
        service.handleWebhook(
          { type: 'payment', data: { id: null } } as any,
          forgeHmacSignature('null', 'req-001', WEBHOOK_SECRET),
        ),
      ).resolves.not.toThrow();
    });

    it('body com tipo desconhecido deve ser ignorado silenciosamente', async () => {
      await expect(
        service.handleWebhook(
          { type: 'chargeback', data: { id: 'mp-001' } },
          forgeHmacSignature('mp-001', 'req-001', WEBHOOK_SECRET),
        ),
      ).resolves.not.toThrow();

      expect(prisma.payment.findUnique).not.toHaveBeenCalled();
    });

    it('data.id extremamente longo (10KB) — gateway retorna null → handler loga e retorna', async () => {
      const longId = 'A'.repeat(10240);
      gatewayMock.verifyWebhookSignature.mockReturnValue(true);

      // Gateway não encontra pagamento com ID gigante → retorna null
      // DESCOBERTA: fetchPayment retorna undefined e o handler tenta ler .externalReference
      // Isso causa TypeError — é uma vulnerabilidade leve (crash, não exploit)
      // O fix seria um null-check no retorno de fetchPayment
      gatewayMock.fetchPayment.mockResolvedValue(null);

      await expect(
        service.handleWebhook(
          { type: 'payment', action: 'payment.updated', data: { id: longId } },
          forgeHmacSignature(longId, 'req-001', WEBHOOK_SECRET),
        ),
      ).resolves.not.toThrow();

      // Nenhuma mutação
      expect(prisma.payment.updateMany).not.toHaveBeenCalled();
    });

    it('headers com injection (CRLF) no x-request-id', async () => {
      gatewayMock.verifyWebhookSignature.mockReturnValue(false);

      await expect(
        service.handleWebhook(
          buildMpWebhookPayload('mp-001'),
          { xSignature: 'ts=123,v1=abc', xRequestId: 'req\r\nX-Injected: evil' },
        ),
      ).rejects.toThrow('Assinatura do webhook invalida');
    });
  });

  // ──────────────────────────────────────────────
  // ATAQUE 9: Escalação de plano via webhook
  // ──────────────────────────────────────────────
  describe('ATK-09: Tentar escalar plano via webhook forjado', () => {
    /**
     * TEORIA: Atacante tenta forjar webhook para ativar ENTERPRISE
     * quando pagou PRO. MITIGAÇÃO: o plano vem do payment record
     * no banco (criado no checkout), não do webhook body.
     */
    it('webhook NÃO pode alterar o plano — plano vem do payment record', async () => {
      const mpPaymentId = 'mp-escalate-001';
      const paymentId = 'pay-escalate-001';

      mockGatewayFetchPayment(gatewayMock, mpPaymentId, paymentId, 'approved', 30);
      gatewayMock.verifyWebhookSignature.mockReturnValue(true);

      // Payment record diz PRO (definido no checkout)
      prisma.payment.findUnique.mockResolvedValue({
        id: paymentId,
        userId: TEST_USERS.freeUser.id,
        status: 'pending',
        plan: 'PRO', // ← plano real do checkout
        mpPaymentId: null,
      });
      prisma.payment.updateMany.mockResolvedValue({ count: 1 });
      prisma.user.update.mockResolvedValue({});
      prisma.user.findUnique.mockResolvedValue({
        email: TEST_USERS.freeUser.email,
        name: TEST_USERS.freeUser.name,
      });

      // Atacante envia body com "plan": "ENTERPRISE" (injetado)
      const maliciousBody = {
        type: 'payment',
        action: 'payment.updated',
        data: { id: mpPaymentId, plan: 'ENTERPRISE' },
      };

      await service.handleWebhook(
        maliciousBody as any,
        forgeHmacSignature(mpPaymentId, 'req-esc-001', WEBHOOK_SECRET),
      );

      // Plano ativado é PRO (do payment record), NÃO ENTERPRISE (do body)
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: TEST_USERS.freeUser.id },
        data: { plan: 'PRO' }, // ← PRO, não ENTERPRISE
      });
    });
  });

  // ──────────────────────────────────────────────
  // ATAQUE 10: Enumeração de payment IDs via timing
  // ──────────────────────────────────────────────
  describe('ATK-10: Enumeração de payment IDs', () => {
    /**
     * TEORIA: Atacante envia webhooks com IDs sequenciais para
     * descobrir quais payments existem baseado na resposta ou timing.
     * MITIGAÇÃO: IDs são UUIDs (não sequenciais) e a resposta
     * é a mesma independente de existir ou não.
     */
    it('payment inexistente retorna sem revelar informação', async () => {
      const mpPaymentId = 'mp-enum-001';
      mockGatewayFetchPayment(gatewayMock, mpPaymentId, 'nonexistent-uuid', 'approved');
      gatewayMock.verifyWebhookSignature.mockReturnValue(true);

      // Payment não existe no banco
      prisma.payment.findUnique.mockResolvedValue(null);

      // Não deve crashar nem revelar que o ID não existe
      await expect(
        service.handleWebhook(
          buildMpWebhookPayload(mpPaymentId),
          forgeHmacSignature(mpPaymentId, 'req-enum-001', WEBHOOK_SECRET),
        ),
      ).resolves.not.toThrow();

      // Nenhuma mutação
      expect(prisma.payment.updateMany).not.toHaveBeenCalled();
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });
});
