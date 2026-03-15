/**
 * WebhooksService — Unit Tests
 * ==============================
 * Testa CRUD, dispatch com logging, e getLogs.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { WebhooksService } from './webhooks.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { AppException } from '../common/exceptions/app.exception';
import { createPrismaMock } from '../../test/helpers/test-utils';
import { randomUUID } from 'crypto';

describe('WebhooksService', () => {
  let service: WebhooksService;
  let prismaMock: ReturnType<typeof createPrismaMock> & { webhook: any; webhookLog: any };

  const userId = randomUUID();
  const webhookId = randomUUID();

  const mockWebhook = {
    id: webhookId,
    userId,
    url: 'https://example.com/hook',
    events: JSON.stringify(['new_message', 'lead_status_changed']),
    secret: 'a'.repeat(64),
    isActive: true,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const baseMock = createPrismaMock();
    prismaMock = {
      ...baseMock,
      webhook: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      webhookLog: {
        create: jest.fn().mockResolvedValue({}),
        createMany: jest.fn().mockResolvedValue({}),
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhooksService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<WebhooksService>(WebhooksService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ──────────────────────────────────────────────
  // CRUD
  // ──────────────────────────────────────────────

  describe('create', () => {
    it('deve criar webhook quando abaixo do limite', async () => {
      prismaMock.webhook.count.mockResolvedValue(2);
      prismaMock.webhook.create.mockResolvedValue(mockWebhook);

      const result = await service.create(userId, { url: 'https://example.com/hook', events: ['new_message'] });

      expect(result).toEqual(mockWebhook);
      expect(prismaMock.webhook.create).toHaveBeenCalled();
    });

    it('deve rejeitar quando atingiu limite de 5', async () => {
      prismaMock.webhook.count.mockResolvedValue(5);

      await expect(
        service.create(userId, { url: 'https://example.com/hook', events: ['new_message'] }),
      ).rejects.toThrow('Máximo de 5 webhooks');
    });
  });

  describe('list', () => {
    it('deve listar webhooks e parsear events JSON', async () => {
      prismaMock.webhook.findMany.mockResolvedValue([mockWebhook]);

      const result = await service.list(userId);

      expect(result).toHaveLength(1);
      expect(result[0].events).toEqual(['new_message', 'lead_status_changed']);
      // Secret deve estar mascarado
      expect(result[0].secret).toMatch(/^.{8}\.\.\.$/);
    });
  });

  describe('update', () => {
    it('deve atualizar webhook existente', async () => {
      prismaMock.webhook.findFirst.mockResolvedValue(mockWebhook);
      prismaMock.webhook.update.mockResolvedValue({ ...mockWebhook, isActive: false });

      const result = await service.update(userId, webhookId, { isActive: false });

      expect(result.isActive).toBe(false);
    });

    it('deve rejeitar se webhooknão pertence ao usuário', async () => {
      prismaMock.webhook.findFirst.mockResolvedValue(null);

      await expect(
        service.update(userId, webhookId, { isActive: false }),
      ).rejects.toThrow(AppException);
    });
  });

  describe('remove', () => {
    it('deve deletar webhook existente', async () => {
      prismaMock.webhook.findFirst.mockResolvedValue(mockWebhook);
      prismaMock.webhook.delete.mockResolvedValue({});

      const result = await service.remove(userId, webhookId);

      expect(result).toEqual({ deleted: true });
    });

    it('deve rejeitar se webhooknão existe', async () => {
      prismaMock.webhook.findFirst.mockResolvedValue(null);

      await expect(service.remove(userId, webhookId)).rejects.toThrow(AppException);
    });
  });

  // ──────────────────────────────────────────────
  // dispatch
  // ──────────────────────────────────────────────

  describe('dispatch', () => {
    it('deve filtrar webhooks por evento', async () => {
      const webhookNoMatch = {
        ...mockWebhook,
        id: randomUUID(),
        events: JSON.stringify(['new_booking']),
      };

      prismaMock.webhook.findMany.mockResolvedValue([mockWebhook, webhookNoMatch]);

      // Mock sendWebhookWithLog paranão fazer HTTP real
      const sendSpy = jest.spyOn(service as any, 'sendWebhookWithLog').mockResolvedValue(undefined);

      await service.dispatch(userId, 'new_message', { test: true });

      // Deve chamar sendWebhookWithLog apenas para o webhook que tem 'new_message'
      expect(sendSpy).toHaveBeenCalledTimes(1);
      expect(sendSpy).toHaveBeenCalledWith(
        mockWebhook.id,
        mockWebhook.url,
        mockWebhook.secret,
        'new_message',
        { test: true },
      );
    });

    it('deve suportar evento lead_status_changed', async () => {
      prismaMock.webhook.findMany.mockResolvedValue([mockWebhook]);

      const sendSpy = jest.spyOn(service as any, 'sendWebhookWithLog').mockResolvedValue(undefined);

      await service.dispatch(userId, 'lead_status_changed', { messageId: '123', status: 'read' });

      expect(sendSpy).toHaveBeenCalledTimes(1);
      expect(sendSpy).toHaveBeenCalledWith(
        mockWebhook.id,
        mockWebhook.url,
        mockWebhook.secret,
        'lead_status_changed',
        { messageId: '123', status: 'read' },
      );
    });

    it('não deve disparar para webhooks inativos', async () => {
      prismaMock.webhook.findMany.mockResolvedValue([]); // query already filters isActive

      const sendSpy = jest.spyOn(service as any, 'sendWebhookWithLog').mockResolvedValue(undefined);

      await service.dispatch(userId, 'new_message', {});

      expect(sendSpy).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────
  // getLogs
  // ──────────────────────────────────────────────

  describe('getLogs', () => {
    it('deve retornar logs do webhook', async () => {
      prismaMock.webhook.findFirst.mockResolvedValue(mockWebhook);
      const logs = [
        { id: '1', webhookId, event: 'new_message', statusCode: 200, success: true, error: null, createdAt: new Date() },
        { id: '2', webhookId, event: 'new_message', statusCode: 500, success: false, error: 'HTTP 500', createdAt: new Date() },
      ];
      prismaMock.webhookLog.findMany.mockResolvedValue(logs);

      const result = await service.getLogs(userId, webhookId);

      expect(result).toHaveLength(2);
      expect(result[0].success).toBe(true);
      expect(result[1].success).toBe(false);
    });

    it('deve rejeitar se webhooknão pertence ao usuário', async () => {
      prismaMock.webhook.findFirst.mockResolvedValue(null);

      await expect(service.getLogs(userId, 'non-existent')).rejects.toThrow(AppException);
    });
  });

  // ──────────────────────────────────────────────
  // sendWebhook (retorno com status)
  // ──────────────────────────────────────────────

  describe('sendWebhook (internal)', () => {
    it('deve retornar success=false apos retries esgotados', async () => {
      // Acessar metodo privado via any
      const result = await (service as any).sendWebhook(
        'http://127.0.0.1:1/unreachable', // porta invalida
        'secret',
        'new_message',
        { test: true },
        1, // apenas 1 retry paranão demorar
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  // ──────────────────────────────────────────────
  // sendWebhookWithLog
  // ──────────────────────────────────────────────

  describe('sendWebhookWithLog', () => {
    it('deve salvar log apos envio', async () => {
      jest.spyOn(service as any, 'sendWebhook').mockResolvedValue({
        statusCode: 200,
        success: true,
        error: null,
      });

      await (service as any).sendWebhookWithLog(webhookId, 'https://example.com', 'secret', 'new_message', {});

      expect(prismaMock.webhookLog.create).toHaveBeenCalledWith({
        data: {
          webhookId,
          event: 'new_message',
          statusCode: 200,
          success: true,
          error: null,
        },
      });
    });

    it('deve salvar log de falha', async () => {
      jest.spyOn(service as any, 'sendWebhook').mockResolvedValue({
        statusCode: 500,
        success: false,
        error: 'HTTP 500',
      });

      await (service as any).sendWebhookWithLog(webhookId, 'https://example.com', 'secret', 'new_message', {});

      expect(prismaMock.webhookLog.create).toHaveBeenCalledWith({
        data: {
          webhookId,
          event: 'new_message',
          statusCode: 500,
          success: false,
          error: 'HTTP 500',
        },
      });
    });

    it('devenão quebrar se log falhar ao salvar', async () => {
      jest.spyOn(service as any, 'sendWebhook').mockResolvedValue({
        statusCode: 200,
        success: true,
        error: null,
      });
      prismaMock.webhookLog.create.mockRejectedValue(new Error('DB error'));

      // Não deve lancar exception
      await expect(
        (service as any).sendWebhookWithLog(webhookId, 'https://example.com', 'secret', 'new_message', {}),
      ).resolves.not.toThrow();
    });
  });
});
