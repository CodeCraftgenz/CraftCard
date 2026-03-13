/**
 * ═══════════════════════════════════════════════════
 *  E2E — Webhooks CRM Integration
 *  Dispatch, logging, lead_status_changed, getLogs
 * ═══════════════════════════════════════════════════
 */
import { Test, TestingModule } from '@nestjs/testing';
import { WebhooksService } from '../../src/webhooks/webhooks.service';
import { ContactsService } from '../../src/contacts/contacts.service';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import { MailService } from '../../src/mail/mail.service';
import { NotificationsService } from '../../src/notifications/notifications.service';
import { InAppNotificationsService } from '../../src/notifications/in-app-notifications.service';
import { createPrismaMock, createMailMock } from '../helpers/test-utils';
import { randomUUID } from 'crypto';

describe('E2E — Webhooks CRM Integration', () => {
  let webhooksService: WebhooksService;
  let contactsService: ContactsService;
  let prismaMock: any;

  const userId = randomUUID();
  const profileId = randomUUID();
  const webhookId = randomUUID();
  const messageId = randomUUID();

  beforeEach(async () => {
    prismaMock = {
      ...createPrismaMock(),
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
        findMany: jest.fn(),
      },
      contactMessage: {
        ...createPrismaMock().contactMessage,
        create: jest.fn().mockResolvedValue({}),
        findUnique: jest.fn(),
      },
    };

    const mailMock = { ...createMailMock(), sendNewMessageNotification: jest.fn().mockResolvedValue(true) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhooksService,
        ContactsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: MailService, useValue: mailMock },
        { provide: NotificationsService, useValue: { sendToUser: jest.fn().mockResolvedValue(undefined) } },
        { provide: InAppNotificationsService, useValue: { create: jest.fn().mockResolvedValue(undefined) } },
      ],
    }).compile();

    webhooksService = module.get<WebhooksService>(WebhooksService);
    contactsService = module.get<ContactsService>(ContactsService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ──────────────────────────────────────────────
  // dispatch + logging
  // ──────────────────────────────────────────────

  describe('dispatch com webhook logging', () => {
    it('deve registrar log de sucesso apos dispatch', async () => {
      prismaMock.webhook.findMany.mockResolvedValue([{
        id: webhookId,
        userId,
        url: 'https://example.com/hook',
        events: JSON.stringify(['new_message']),
        secret: 'test-secret',
        isActive: true,
      }]);

      // Mock sendWebhook para nao fazer HTTP real
      jest.spyOn(webhooksService as any, 'sendWebhook').mockResolvedValue({
        statusCode: 200,
        success: true,
        error: null,
      });

      await webhooksService.dispatch(userId, 'new_message', { test: true });

      // Aguardar fire-and-forget
      await new Promise((r) => setTimeout(r, 100));

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

    it('deve registrar log de falha apos dispatch', async () => {
      prismaMock.webhook.findMany.mockResolvedValue([{
        id: webhookId,
        userId,
        url: 'https://example.com/hook',
        events: JSON.stringify(['new_message']),
        secret: 'test-secret',
        isActive: true,
      }]);

      jest.spyOn(webhooksService as any, 'sendWebhook').mockResolvedValue({
        statusCode: 500,
        success: false,
        error: 'HTTP 500',
      });

      await webhooksService.dispatch(userId, 'new_message', { data: 'test' });

      await new Promise((r) => setTimeout(r, 100));

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
  });

  // ──────────────────────────────────────────────
  // lead_status_changed via markAsRead
  // ──────────────────────────────────────────────

  describe('lead_status_changed event', () => {
    it('markAsRead deve disparar lead_status_changed', async () => {
      prismaMock.profile.findFirst.mockResolvedValue({ id: profileId });
      prismaMock.contactMessage.findUnique.mockResolvedValue({
        id: messageId,
        profileId,
        senderName: 'Carlos',
        senderEmail: 'carlos@test.com',
        message: 'Ola!',
        isRead: false,
      });
      prismaMock.contactMessage.update.mockResolvedValue({ id: messageId, isRead: true });

      const dispatchSpy = jest.spyOn(webhooksService, 'dispatch').mockResolvedValue(undefined);

      await contactsService.markAsRead(messageId, userId);

      expect(dispatchSpy).toHaveBeenCalledWith(
        userId,
        'lead_status_changed',
        expect.objectContaining({
          messageId,
          senderName: 'Carlos',
          senderEmail: 'carlos@test.com',
          status: 'read',
          readAt: expect.any(String),
        }),
      );
    });
  });

  // ──────────────────────────────────────────────
  // sendMessage envia payload enriquecido
  // ──────────────────────────────────────────────

  describe('new_message com payload enriquecido', () => {
    it('sendMessage deve incluir profile metadata no dispatch', async () => {
      prismaMock.profile.findFirst.mockResolvedValue({
        id: profileId,
        userId,
        isPublished: true,
        slug: 'usuario-pro',
        displayName: 'Designer Pro',
        user: { email: 'pro@test.com' },
      });
      prismaMock.contactMessage.create.mockResolvedValue({});

      const dispatchSpy = jest.spyOn(webhooksService, 'dispatch').mockResolvedValue(undefined);

      await contactsService.sendMessage('usuario-pro', {
        senderName: 'Fernanda',
        senderEmail: 'fernanda@test.com',
        message: 'Preciso de um orcamento',
      });

      expect(dispatchSpy).toHaveBeenCalledWith(
        userId,
        'new_message',
        expect.objectContaining({
          senderName: 'Fernanda',
          senderEmail: 'fernanda@test.com',
          message: 'Preciso de um orcamento',
          profile: { slug: 'usuario-pro', displayName: 'Designer Pro' },
        }),
      );
    });
  });

  // ──────────────────────────────────────────────
  // getLogs endpoint
  // ──────────────────────────────────────────────

  describe('getLogs', () => {
    it('deve retornar logs ordenados por data', async () => {
      prismaMock.webhook.findFirst.mockResolvedValue({ id: webhookId, userId });

      const logs = [
        { id: '1', webhookId, event: 'new_message', statusCode: 200, success: true, error: null, createdAt: new Date('2026-03-13T12:00:00Z') },
        { id: '2', webhookId, event: 'lead_status_changed', statusCode: 200, success: true, error: null, createdAt: new Date('2026-03-13T11:00:00Z') },
        { id: '3', webhookId, event: 'new_message', statusCode: 500, success: false, error: 'HTTP 500', createdAt: new Date('2026-03-13T10:00:00Z') },
      ];
      prismaMock.webhookLog.findMany.mockResolvedValue(logs);

      const result = await webhooksService.getLogs(userId, webhookId);

      expect(result).toHaveLength(3);
      expect(prismaMock.webhookLog.findMany).toHaveBeenCalledWith({
        where: { webhookId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    });

    it('deve rejeitar acesso a webhook de outro usuario', async () => {
      prismaMock.webhook.findFirst.mockResolvedValue(null);

      await expect(
        webhooksService.getLogs(userId, 'other-webhook-id'),
      ).rejects.toThrow();
    });
  });
});
