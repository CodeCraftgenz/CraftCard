import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import { InAppNotificationsService } from '../notifications/in-app-notifications.service';
import { AppException } from '../common/exceptions/app.exception';
import type { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class ContactsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly notificationsService: NotificationsService,
    private readonly inAppService: InAppNotificationsService,
  ) {}

  async sendMessage(slug: string, data: SendMessageDto) {
    const profile = await this.prisma.profile.findFirst({
      where: { slug },
      select: { id: true, userId: true, isPublished: true, user: { select: { email: true } } },
    });
    if (!profile || !profile.isPublished) {
      throw AppException.notFound('Perfil');
    }

    await this.prisma.contactMessage.create({
      data: {
        profileId: profile.id,
        senderName: data.senderName,
        senderEmail: data.senderEmail || null,
        message: data.message,
      },
    });

    // Notify profile owner via email (fire-and-forget)
    if (profile.user?.email) {
      this.mailService.sendNewMessageNotification(
        profile.user.email,
        data.senderName,
        data.message.substring(0, 200),
        data.senderEmail || undefined,
      ).catch(() => {});
    }

    // Push notification (fire-and-forget)
    this.notificationsService.sendToUser(profile.userId, {
      title: 'Nova mensagem!',
      body: `${data.senderName}: ${data.message.substring(0, 80)}`,
      url: '/editor',
    }).catch(() => {});

    // In-app notification (fire-and-forget)
    this.inAppService.create(profile.userId, {
      type: 'new_message',
      title: 'Nova mensagem!',
      message: `${data.senderName}: ${data.message.substring(0, 80)}`,
      metadata: { senderName: data.senderName, senderEmail: data.senderEmail },
    }).catch(() => {});

    return { sent: true };
  }

  async getMessages(userId: string) {
    const profile = await this.prisma.profile.findFirst({
      where: { userId, isPrimary: true },
      select: { id: true },
    });
    if (!profile) throw AppException.notFound('Perfil');

    return this.prisma.contactMessage.findMany({
      where: { profileId: profile.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markAsRead(messageId: string, userId: string) {
    const profile = await this.prisma.profile.findFirst({
      where: { userId, isPrimary: true },
      select: { id: true },
    });
    if (!profile) throw AppException.notFound('Perfil');

    const message = await this.prisma.contactMessage.findUnique({
      where: { id: messageId },
    });
    if (!message || message.profileId !== profile.id) {
      throw AppException.notFound('Mensagem');
    }

    return this.prisma.contactMessage.update({
      where: { id: messageId },
      data: { isRead: true },
    });
  }

  async exportMessagesCsv(userId: string): Promise<string> {
    const profiles = await this.prisma.profile.findMany({
      where: { userId },
      select: { id: true, displayName: true },
    });
    const profileIds = profiles.map((p) => p.id);
    const profileMap = new Map(profiles.map((p) => [p.id, p.displayName]));

    const messages = await this.prisma.contactMessage.findMany({
      where: { profileId: { in: profileIds } },
      orderBy: { createdAt: 'desc' },
    });

    const header = 'Nome,Email,Mensagem,Cartao,Lido,Data\n';
    const rows = messages.map((m) => {
      const name = csvEscape(m.senderName);
      const email = csvEscape(m.senderEmail || '');
      const msg = csvEscape(m.message);
      const card = csvEscape(profileMap.get(m.profileId) || '');
      const read = m.isRead ? 'Sim' : 'Nao';
      const date = m.createdAt.toISOString();
      return `${name},${email},${msg},${card},${read},${date}`;
    }).join('\n');

    return header + rows;
  }

  async getUnreadCount(userId: string) {
    const profile = await this.prisma.profile.findFirst({
      where: { userId, isPrimary: true },
      select: { id: true },
    });
    if (!profile) return { count: 0 };

    const count = await this.prisma.contactMessage.count({
      where: { profileId: profile.id, isRead: false },
    });
    return { count };
  }
}

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
