import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AppException } from '../common/exceptions/app.exception';
import type { CreateTestimonialDto } from './dto/create-testimonial.dto';

@Injectable()
export class TestimonialsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async submit(slug: string, data: CreateTestimonialDto) {
    const profile = await this.prisma.profile.findFirst({
      where: { slug },
      select: { id: true, userId: true, isPublished: true, user: { select: { email: true } } },
    });
    if (!profile || !profile.isPublished) {
      throw AppException.notFound('Perfil');
    }

    await this.prisma.testimonial.create({
      data: {
        profileId: profile.id,
        authorName: data.authorName,
        authorRole: data.authorRole || null,
        text: data.text,
      },
    });

    // Notify profile owner via email (fire-and-forget)
    if (profile.user?.email) {
      this.mailService.sendNewTestimonialNotification(
        profile.user.email,
        data.authorName,
        data.text.substring(0, 200),
      ).catch(() => {});
    }

    // Push notification (fire-and-forget)
    this.notificationsService.sendToUser(profile.userId, {
      title: 'Novo depoimento!',
      body: `${data.authorName}: "${data.text.substring(0, 80)}"`,
      url: '/editor',
    }).catch(() => {});

    return { sent: true };
  }

  async getApproved(profileId: string) {
    return this.prisma.testimonial.findMany({
      where: { profileId, isApproved: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  }

  async getMine(userId: string) {
    const profile = await this.prisma.profile.findFirst({
      where: { userId, isPrimary: true },
      select: { id: true },
    });
    if (!profile) throw AppException.notFound('Perfil');

    return this.prisma.testimonial.findMany({
      where: { profileId: profile.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async approve(id: string, userId: string) {
    const profile = await this.prisma.profile.findFirst({
      where: { userId, isPrimary: true },
      select: { id: true },
    });
    if (!profile) throw AppException.notFound('Perfil');

    const testimonial = await this.prisma.testimonial.findUnique({
      where: { id },
    });
    if (!testimonial || testimonial.profileId !== profile.id) {
      throw AppException.notFound('Depoimento');
    }

    return this.prisma.testimonial.update({
      where: { id },
      data: { isApproved: true },
    });
  }

  async reject(id: string, userId: string) {
    const profile = await this.prisma.profile.findFirst({
      where: { userId, isPrimary: true },
      select: { id: true },
    });
    if (!profile) throw AppException.notFound('Perfil');

    const testimonial = await this.prisma.testimonial.findUnique({
      where: { id },
    });
    if (!testimonial || testimonial.profileId !== profile.id) {
      throw AppException.notFound('Depoimento');
    }

    return this.prisma.testimonial.delete({ where: { id } });
  }
}
