import { Injectable } from '@nestjs/common';
import * as sharp from 'sharp';
import { PrismaService } from '../common/prisma/prisma.service';
import { AppException } from '../common/exceptions/app.exception';

const MAX_GALLERY_IMAGES = 12;

@Injectable()
export class GalleryService {
  constructor(private readonly prisma: PrismaService) {}

  async getByProfileId(profileId: string) {
    return this.prisma.galleryImage.findMany({
      where: { profileId },
      orderBy: { order: 'asc' },
      select: { id: true, caption: true, order: true, imageData: true, createdAt: true },
    });
  }

  async getMine(userId: string) {
    const profile = await this.prisma.profile.findFirst({
      where: { userId, isPrimary: true },
      select: { id: true },
    });
    if (!profile) return [];
    return this.getByProfileId(profile.id);
  }

  async upload(userId: string, file: Buffer, caption?: string) {
    const profile = await this.prisma.profile.findFirst({
      where: { userId, isPrimary: true },
      select: { id: true },
    });
    if (!profile) throw AppException.notFound('Perfil');

    const count = await this.prisma.galleryImage.count({
      where: { profileId: profile.id },
    });
    if (count >= MAX_GALLERY_IMAGES) {
      throw AppException.badRequest(`Maximo de ${MAX_GALLERY_IMAGES} imagens atingido`);
    }

    const processed = await sharp(file)
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    const imageData = processed.toString('base64');

    return this.prisma.galleryImage.create({
      data: {
        profileId: profile.id,
        imageData,
        caption: caption || null,
        order: count,
      },
      select: { id: true, caption: true, order: true, createdAt: true },
    });
  }

  async updateCaption(userId: string, imageId: string, caption: string) {
    const image = await this.findOwnedImage(userId, imageId);
    return this.prisma.galleryImage.update({
      where: { id: image.id },
      data: { caption },
      select: { id: true, caption: true, order: true, createdAt: true },
    });
  }

  async updateOrder(userId: string, imageIds: string[]) {
    const profile = await this.prisma.profile.findFirst({
      where: { userId, isPrimary: true },
      select: { id: true },
    });
    if (!profile) throw AppException.notFound('Perfil');

    await this.prisma.$transaction(
      imageIds.map((id, index) =>
        this.prisma.galleryImage.updateMany({
          where: { id, profileId: profile.id },
          data: { order: index },
        }),
      ),
    );

    return { reordered: true };
  }

  async delete(userId: string, imageId: string) {
    const image = await this.findOwnedImage(userId, imageId);
    await this.prisma.galleryImage.delete({ where: { id: image.id } });
    return { deleted: true };
  }

  private async findOwnedImage(userId: string, imageId: string) {
    const profile = await this.prisma.profile.findFirst({
      where: { userId, isPrimary: true },
      select: { id: true },
    });
    if (!profile) throw AppException.notFound('Perfil');

    const image = await this.prisma.galleryImage.findUnique({
      where: { id: imageId },
    });
    if (!image || image.profileId !== profile.id) {
      throw AppException.notFound('Imagem');
    }
    return image;
  }
}
