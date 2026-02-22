import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AppException } from '../common/exceptions/app.exception';
import type { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class ContactsService {
  constructor(private readonly prisma: PrismaService) {}

  async sendMessage(slug: string, data: SendMessageDto) {
    const profile = await this.prisma.profile.findUnique({
      where: { slug },
      select: { id: true, isPublished: true },
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

    return { sent: true };
  }

  async getMessages(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
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
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
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

  async getUnreadCount(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!profile) return { count: 0 };

    const count = await this.prisma.contactMessage.count({
      where: { profileId: profile.id, isRead: false },
    });
    return { count };
  }
}
