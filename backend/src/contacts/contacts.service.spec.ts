import { Test, TestingModule } from '@nestjs/testing';
import { ContactsService } from './contacts.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import { InAppNotificationsService } from '../notifications/in-app-notifications.service';
import { WebhooksService } from '../webhooks/webhooks.service';

const PROFILE_ID = 'profile-1';
const USER_ID = 'user-1';
const MSG_ID = 'msg-1';

function makePrisma() {
  return {
    profile: { findFirst: jest.fn(), findMany: jest.fn() },
    contactMessage: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
  };
}

function makeProfile(overrides = {}) {
  return {
    id: PROFILE_ID,
    userId: USER_ID,
    isPublished: true,
    slug: 'joao',
    displayName: 'Joao Silva',
    user: { email: 'owner@example.com' },
    contactFormEnabled: true,
    ...overrides,
  };
}

function makeMessage(overrides = {}) {
  return {
    id: MSG_ID,
    profileId: PROFILE_ID,
    senderName: 'Alice',
    senderEmail: 'alice@example.com',
    message: 'Ola, tudo bem?',
    isRead: false,
    createdAt: new Date(),
    ...overrides,
  };
}

describe('ContactsService', () => {
  let service: ContactsService;
  let prisma: ReturnType<typeof makePrisma>;
  let mailMock: { sendNewMessageNotification: jest.Mock };
  let notifMock: { sendToUser: jest.Mock };
  let inAppMock: { create: jest.Mock };
  let webhookMock: { dispatch: jest.Mock };

  beforeEach(async () => {
    prisma = makePrisma();
    mailMock = { sendNewMessageNotification: jest.fn().mockResolvedValue(undefined) };
    notifMock = { sendToUser: jest.fn().mockResolvedValue(undefined) };
    inAppMock = { create: jest.fn().mockResolvedValue(undefined) };
    webhookMock = { dispatch: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContactsService,
        { provide: PrismaService, useValue: prisma },
        { provide: MailService, useValue: mailMock },
        { provide: NotificationsService, useValue: notifMock },
        { provide: InAppNotificationsService, useValue: inAppMock },
        { provide: WebhooksService, useValue: webhookMock },
      ],
    }).compile();

    service = module.get(ContactsService);
  });

  // ──────────────────────────────────────────────────────────────
  // sendMessage
  // ──────────────────────────────────────────────────────────────

  describe('sendMessage', () => {
    const DATA = { senderName: 'Alice', senderEmail: 'alice@example.com', message: 'Ola mundo!' };

    beforeEach(() => {
      prisma.profile.findFirst.mockResolvedValue(makeProfile());
      prisma.contactMessage.create.mockResolvedValue(makeMessage());
    });

    it('creates a contact message and returns {sent: true}', async () => {
      const result = await service.sendMessage('joao', DATA);
      expect(prisma.contactMessage.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ sent: true });
    });

    it('throws 404 when profile does not exist', async () => {
      prisma.profile.findFirst.mockResolvedValue(null);
      await expect(service.sendMessage('ghost', DATA)).rejects.toThrow();
    });

    it('throws 404 when profile is not published', async () => {
      prisma.profile.findFirst.mockResolvedValue(makeProfile({ isPublished: false }));
      await expect(service.sendMessage('joao', DATA)).rejects.toThrow();
    });

    it('sends email notification to owner', async () => {
      await service.sendMessage('joao', DATA);
      await new Promise(r => setTimeout(r, 10));
      expect(mailMock.sendNewMessageNotification).toHaveBeenCalledWith(
        'owner@example.com', 'Alice', expect.any(String), 'alice@example.com'
      );
    });

    it('does NOT send email when owner has no email', async () => {
      prisma.profile.findFirst.mockResolvedValue(makeProfile({ user: null }));
      await service.sendMessage('joao', DATA);
      await new Promise(r => setTimeout(r, 10));
      expect(mailMock.sendNewMessageNotification).not.toHaveBeenCalled();
    });

    it('sends push notification to owner', async () => {
      await service.sendMessage('joao', DATA);
      await new Promise(r => setTimeout(r, 10));
      expect(notifMock.sendToUser).toHaveBeenCalledWith(USER_ID, expect.objectContaining({ title: 'Nova mensagem!' }));
    });

    it('dispatches webhook', async () => {
      await service.sendMessage('joao', DATA);
      await new Promise(r => setTimeout(r, 10));
      expect(webhookMock.dispatch).toHaveBeenCalledWith(USER_ID, 'new_message', expect.any(Object));
    });

    it('creates message without email when senderEmail is not provided', async () => {
      await service.sendMessage('joao', { senderName: 'Bob', message: 'Hello' });
      expect(prisma.contactMessage.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ senderEmail: null }) })
      );
    });

    it('truncates email preview to 200 chars', async () => {
      const longMsg = 'x'.repeat(300);
      await service.sendMessage('joao', { senderName: 'Alice', message: longMsg });
      await new Promise(r => setTimeout(r, 10));
      expect(mailMock.sendNewMessageNotification).toHaveBeenCalledWith(
        expect.any(String), expect.any(String), longMsg.substring(0, 200), undefined
      );
    });
  });

  // ──────────────────────────────────────────────────────────────
  // getMessages
  // ──────────────────────────────────────────────────────────────

  describe('getMessages', () => {
    it('returns messages for primary profile', async () => {
      prisma.profile.findFirst.mockResolvedValue(makeProfile());
      prisma.contactMessage.findMany.mockResolvedValue([makeMessage()]);
      const result = await service.getMessages(USER_ID);
      expect(result).toHaveLength(1);
    });

    it('throws 404 when no primary profile', async () => {
      prisma.profile.findFirst.mockResolvedValue(null);
      await expect(service.getMessages(USER_ID)).rejects.toThrow();
    });

    it('returns empty array when no messages', async () => {
      prisma.profile.findFirst.mockResolvedValue(makeProfile());
      prisma.contactMessage.findMany.mockResolvedValue([]);
      expect(await service.getMessages(USER_ID)).toHaveLength(0);
    });
  });

  // ──────────────────────────────────────────────────────────────
  // markAsRead
  // ──────────────────────────────────────────────────────────────

  describe('markAsRead', () => {
    beforeEach(() => {
      prisma.profile.findFirst.mockResolvedValue(makeProfile());
      prisma.contactMessage.findUnique.mockResolvedValue(makeMessage());
      prisma.contactMessage.update.mockResolvedValue(makeMessage({ isRead: true }));
    });

    it('marks message as read', async () => {
      await service.markAsRead(MSG_ID, USER_ID); // signature: markAsRead(messageId, userId)
      expect(prisma.contactMessage.update).toHaveBeenCalledWith({
        where: { id: MSG_ID },
        data: { isRead: true },
      });
    });

    it('throws 404 when message not found', async () => {
      prisma.contactMessage.findUnique.mockResolvedValue(null);
      await expect(service.markAsRead(MSG_ID, USER_ID)).rejects.toThrow();
    });

    it('throws 404 when message belongs to another profile', async () => {
      prisma.contactMessage.findUnique.mockResolvedValue(makeMessage({ profileId: 'other-profile' }));
      await expect(service.markAsRead(MSG_ID, USER_ID)).rejects.toThrow();
    });
  });

  // ──────────────────────────────────────────────────────────────
  // deleteMessage
  // ──────────────────────────────────────────────────────────────

  describe('deleteMessage', () => {
    beforeEach(() => {
      prisma.profile.findMany.mockResolvedValue([makeProfile()]);
      prisma.contactMessage.findUnique.mockResolvedValue(makeMessage());
      prisma.contactMessage.delete.mockResolvedValue(undefined);
    });

    it('deletes a message and returns {deleted: true}', async () => {
      const result = await service.deleteMessage(MSG_ID, USER_ID);
      expect(prisma.contactMessage.delete).toHaveBeenCalledWith({ where: { id: MSG_ID } });
      expect(result).toEqual({ deleted: true });
    });

    it('throws 404 when message not found', async () => {
      prisma.contactMessage.findUnique.mockResolvedValue(null);
      await expect(service.deleteMessage(MSG_ID, USER_ID)).rejects.toThrow();
    });

    it('throws 404 when message belongs to another profile', async () => {
      prisma.profile.findMany.mockResolvedValue([makeProfile()]);
      prisma.contactMessage.findUnique.mockResolvedValue(makeMessage({ profileId: 'other' }));
      await expect(service.deleteMessage(MSG_ID, USER_ID)).rejects.toThrow();
    });
  });

  // ──────────────────────────────────────────────────────────────
  // getUnreadCount
  // ──────────────────────────────────────────────────────────────

  describe('getUnreadCount', () => {
    it('returns unread message count', async () => {
      prisma.profile.findFirst.mockResolvedValue(makeProfile());
      prisma.contactMessage.count.mockResolvedValue(5);
      const result = await service.getUnreadCount(USER_ID);
      expect(result).toEqual({ count: 5 });
    });

    it('returns {count: 0} when no primary profile exists', async () => {
      // getUnreadCount returns {count:0} gracefully instead of throwing
      prisma.profile.findFirst.mockResolvedValue(null);
      const result = await service.getUnreadCount(USER_ID);
      expect(result).toEqual({ count: 0 });
    });
  });
});
