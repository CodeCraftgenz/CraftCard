import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AppException } from '../common/exceptions/app.exception';

@Injectable()
export class SectionsService {
  constructor(private readonly prisma: PrismaService) {}

  // --- Helpers ---
  private async getProfileId(userId: string, cardId?: string): Promise<string> {
    const profile = cardId
      ? await this.prisma.profile.findFirst({ where: { id: cardId, userId }, select: { id: true } })
      : await this.prisma.profile.findFirst({ where: { userId, isPrimary: true }, select: { id: true } });
    if (!profile) throw AppException.notFound('Perfil');
    return profile.id;
  }

  // --- Services ---
  async getServices(userId: string, cardId?: string) {
    const profileId = await this.getProfileId(userId, cardId);
    return this.prisma.service.findMany({
      where: { profileId },
      orderBy: { order: 'asc' },
    });
  }

  async createService(userId: string, data: { title: string; description?: string; price?: string }, cardId?: string) {
    const profileId = await this.getProfileId(userId, cardId);
    const count = await this.prisma.service.count({ where: { profileId } });
    if (count >= 20) throw AppException.badRequest('Maximo de 20 servicos atingido');
    return this.prisma.service.create({
      data: {
        profileId,
        title: data.title,
        description: data.description || null,
        price: data.price || null,
        order: count,
      },
    });
  }

  async updateService(userId: string, id: string, data: { title?: string; description?: string; price?: string }) {
    const service = await this.prisma.service.findUnique({ where: { id }, include: { profile: { select: { userId: true } } } });
    if (!service || service.profile.userId !== userId) throw AppException.notFound('Servico');
    return this.prisma.service.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description || null }),
        ...(data.price !== undefined && { price: data.price || null }),
      },
    });
  }

  async deleteService(userId: string, id: string) {
    const service = await this.prisma.service.findUnique({ where: { id }, include: { profile: { select: { userId: true } } } });
    if (!service || service.profile.userId !== userId) throw AppException.notFound('Servico');
    await this.prisma.service.delete({ where: { id } });
    return { deleted: true };
  }

  async reorderServices(userId: string, ids: string[]) {
    const updates = ids.map((id, i) =>
      this.prisma.service.updateMany({
        where: { id, profile: { userId } },
        data: { order: i },
      }),
    );
    await this.prisma.$transaction(updates);
    return { reordered: true };
  }

  // --- FAQ ---
  async getFaqItems(userId: string, cardId?: string) {
    const profileId = await this.getProfileId(userId, cardId);
    return this.prisma.faqItem.findMany({
      where: { profileId },
      orderBy: { order: 'asc' },
    });
  }

  async createFaqItem(userId: string, data: { question: string; answer: string }, cardId?: string) {
    const profileId = await this.getProfileId(userId, cardId);
    const count = await this.prisma.faqItem.count({ where: { profileId } });
    if (count >= 15) throw AppException.badRequest('Maximo de 15 perguntas atingido');
    return this.prisma.faqItem.create({
      data: {
        profileId,
        question: data.question,
        answer: data.answer,
        order: count,
      },
    });
  }

  async updateFaqItem(userId: string, id: string, data: { question?: string; answer?: string }) {
    const item = await this.prisma.faqItem.findUnique({ where: { id }, include: { profile: { select: { userId: true } } } });
    if (!item || item.profile.userId !== userId) throw AppException.notFound('FAQ');
    return this.prisma.faqItem.update({
      where: { id },
      data: {
        ...(data.question !== undefined && { question: data.question }),
        ...(data.answer !== undefined && { answer: data.answer }),
      },
    });
  }

  async deleteFaqItem(userId: string, id: string) {
    const item = await this.prisma.faqItem.findUnique({ where: { id }, include: { profile: { select: { userId: true } } } });
    if (!item || item.profile.userId !== userId) throw AppException.notFound('FAQ');
    await this.prisma.faqItem.delete({ where: { id } });
    return { deleted: true };
  }

  async reorderFaqItems(userId: string, ids: string[]) {
    const updates = ids.map((id, i) =>
      this.prisma.faqItem.updateMany({
        where: { id, profile: { userId } },
        data: { order: i },
      }),
    );
    await this.prisma.$transaction(updates);
    return { reordered: true };
  }

  // --- Custom Form Fields ---
  async getFormFields(userId: string, cardId?: string) {
    const profileId = await this.getProfileId(userId, cardId);
    return this.prisma.customFormField.findMany({
      where: { profileId },
      orderBy: { order: 'asc' },
    });
  }

  async createFormField(userId: string, data: { label: string; type: string; options?: string; required?: boolean }, cardId?: string) {
    const profileId = await this.getProfileId(userId, cardId);
    const count = await this.prisma.customFormField.count({ where: { profileId } });
    if (count >= 10) throw AppException.badRequest('Maximo de 10 campos');

    return this.prisma.customFormField.create({
      data: {
        profileId,
        label: data.label,
        type: data.type,
        options: data.options || null,
        required: data.required || false,
        order: count,
      },
    });
  }

  async updateFormField(userId: string, id: string, data: { label?: string; type?: string; options?: string; required?: boolean }) {
    const field = await this.prisma.customFormField.findUnique({
      where: { id },
      include: { profile: { select: { userId: true } } },
    });
    if (!field || field.profile.userId !== userId) throw AppException.notFound('Campo');

    return this.prisma.customFormField.update({
      where: { id },
      data: {
        ...(data.label !== undefined && { label: data.label }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.options !== undefined && { options: data.options }),
        ...(data.required !== undefined && { required: data.required }),
      },
    });
  }

  async deleteFormField(userId: string, id: string) {
    const field = await this.prisma.customFormField.findUnique({
      where: { id },
      include: { profile: { select: { userId: true } } },
    });
    if (!field || field.profile.userId !== userId) throw AppException.notFound('Campo');
    await this.prisma.customFormField.delete({ where: { id } });
    return { deleted: true };
  }

  async reorderFormFields(userId: string, ids: string[]) {
    const updates = ids.map((id, i) =>
      this.prisma.customFormField.updateMany({
        where: { id, profile: { userId } },
        data: { order: i },
      }),
    );
    await this.prisma.$transaction(updates);
    return { reordered: true };
  }

  /** Get form fields for a public profile (by slug) */
  async getPublicFormFields(slug: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { slug },
      select: { id: true, isPublished: true },
    });
    if (!profile || !profile.isPublished) return [];

    return this.prisma.customFormField.findMany({
      where: { profileId: profile.id },
      orderBy: { order: 'asc' },
      select: { id: true, label: true, type: true, options: true, required: true, order: true },
    });
  }
}
