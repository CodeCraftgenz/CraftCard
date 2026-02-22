import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AppException } from '../common/exceptions/app.exception';
import type { CreateTestimonialDto } from './dto/create-testimonial.dto';

@Injectable()
export class TestimonialsService {
  constructor(private readonly prisma: PrismaService) {}

  async submit(slug: string, data: CreateTestimonialDto) {
    const profile = await this.prisma.profile.findUnique({
      where: { slug },
      select: { id: true, isPublished: true },
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
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
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
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
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
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
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
