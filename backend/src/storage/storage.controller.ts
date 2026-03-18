/**
 * Controller de upload de arquivos do usuário.
 *
 * Todos os uploads vão para o Cloudflare R2 (compatível com S3).
 * Imagens são processadas com sharp (resize + WebP) antes do upload
 * para economizar storage e melhorar performance no frontend.
 *
 * Features por plano:
 * - FREE: foto de perfil e cover
 * - PRO+: currículo (PDF), vídeo (MP4), background customizado
 *
 * Segurança:
 * - Rate limit: 10 uploads/min por usuário (previne esgotamento de storage)
 * - Validação de tipo e tamanho via ParseFilePipe do NestJS
 * - Arquivo antigo é deletado do R2 antes de salvar o novo (fire-and-forget)
 */
import {
  Controller,
  Delete,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { FileInterceptor } from '@nestjs/platform-express';
import * as sharp from 'sharp';
import { StorageService } from './storage.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { CurrentUser, type JwtPayload } from '../common/decorators/current-user.decorator';
import { AppException } from '../common/exceptions/app.exception';
import { PlanGuard, RequiresFeature } from '../payments/guards/plan.guard';

// Limites de tamanho por tipo de arquivo (validados antes do processamento)
const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5MB — sharp comprime para WebP 400x400
const MAX_BG_SIZE = 8 * 1024 * 1024; // 8MB — sharp comprime para WebP 1920x1080
const MAX_RESUME_SIZE = 10 * 1024 * 1024; // 10MB — PDF enviado sem processamento
const MAX_VIDEO_SIZE = 20 * 1024 * 1024; // 20MB — MP4 enviado sem processamento

// Máximo de 10 uploads por minuto por usuário (previne abuso de storage)
@Throttle({ default: { ttl: 60000, limit: 10 } })
@Controller()
export class StorageController {
  constructor(
    private readonly storageService: StorageService,
    private readonly prisma: PrismaService,
  ) {}

  // ── Upload de foto de perfil → R2 (disponível para todos os planos) ──
  @Post('me/photo-upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPhoto(
    @CurrentUser() user: JwtPayload,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_PHOTO_SIZE }),
          new FileTypeValidator({ fileType: /(jpeg|jpg|png|webp)$/i }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Query('cardId') cardId?: string,
  ) {
    const processed = await sharp(file.buffer)
      .resize(400, 400, { fit: 'cover' })
      .webp({ quality: 80 })
      .toBuffer();

    const profile = cardId
      ? await this.prisma.profile.findFirst({
          where: { id: cardId, userId: user.sub },
          select: { id: true, photoUrl: true },
        })
      : await this.prisma.profile.findFirst({
          where: { userId: user.sub, isPrimary: true },
          select: { id: true, photoUrl: true },
        });
    if (!profile) throw AppException.notFound('Perfil');

    if (profile.photoUrl?.startsWith('http')) {
      this.storageService.deleteFile(profile.photoUrl).catch(() => {});
    }

    const photoUrl = await this.storageService.uploadFile(processed, 'photos', user.sub, 'webp');

    await this.prisma.profile.update({
      where: { id: profile.id },
      data: { photoUrl, photoData: null },
    });

    return { url: photoUrl };
  }

  // ── Upload de cover/capa → R2 (disponível para todos os planos) ──
  @Post('me/cover-upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCover(
    @CurrentUser() user: JwtPayload,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_PHOTO_SIZE }),
          new FileTypeValidator({ fileType: /(jpeg|jpg|png|webp)$/i }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const processed = await sharp(file.buffer)
      .resize(1200, 400, { fit: 'cover' })
      .webp({ quality: 80 })
      .toBuffer();

    const profile = await this.prisma.profile.findFirst({
      where: { userId: user.sub, isPrimary: true },
      select: { id: true, coverPhotoUrl: true },
    });
    if (!profile) throw AppException.notFound('Perfil');

    if (profile.coverPhotoUrl?.startsWith('http')) {
      this.storageService.deleteFile(profile.coverPhotoUrl).catch(() => {});
    }

    const coverPhotoUrl = await this.storageService.uploadFile(
      processed,
      'covers',
      user.sub,
      'webp',
    );

    await this.prisma.profile.update({
      where: { id: profile.id },
      data: { coverPhotoUrl, coverPhotoData: null },
    });

    return { url: coverPhotoUrl };
  }

  // ── Upload de currículo PDF → R2 (requer plano PRO+) ──────────────
  @UseGuards(PlanGuard)
  @RequiresFeature('resume')
  @Post('me/resume-upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadResume(
    @CurrentUser() user: JwtPayload,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_RESUME_SIZE }),
          new FileTypeValidator({ fileType: /pdf$/i }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const profile = await this.prisma.profile.findFirst({
      where: { userId: user.sub, isPrimary: true },
      select: { id: true, slug: true, resumeUrl: true },
    });
    if (!profile) throw AppException.notFound('Perfil');

    if (profile.resumeUrl?.startsWith('http')) {
      this.storageService.deleteFile(profile.resumeUrl).catch(() => {});
    }

    const resumeUrl = await this.storageService.uploadFile(
      file.buffer,
      'resumes',
      profile.slug,
      'pdf',
    );

    await this.prisma.profile.update({
      where: { id: profile.id },
      data: { resumeUrl, resumeData: null, resumeType: 'pdf' },
    });

    return { url: resumeUrl };
  }

  // ── Upload de vídeo MP4 → R2 (requer plano PRO+) ──────────────────
  @UseGuards(PlanGuard)
  @RequiresFeature('video')
  @Post('me/video-upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadVideo(
    @CurrentUser() user: JwtPayload,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_VIDEO_SIZE }),
          new FileTypeValidator({ fileType: /mp4$/i }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const profile = await this.prisma.profile.findFirst({
      where: { userId: user.sub, isPrimary: true },
      select: { id: true, videoUrl: true },
    });
    if (!profile) throw AppException.notFound('Perfil');

    if (profile.videoUrl) {
      this.storageService.deleteFile(profile.videoUrl).catch(() => {});
    }

    const videoUrl = await this.storageService.uploadFile(file.buffer, 'videos', user.sub, 'mp4');

    await this.prisma.profile.update({
      where: { id: profile.id },
      data: { videoUrl },
    });

    return { url: videoUrl };
  }

  // ── Upload de imagem de background → R2 (requer plano PRO+ com feature customBg) ──
  @UseGuards(PlanGuard)
  @RequiresFeature('customBg')
  @Post('me/background-upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadBackground(
    @CurrentUser() user: JwtPayload,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_BG_SIZE }),
          new FileTypeValidator({ fileType: /(jpeg|jpg|png|webp)$/i }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const processed = await sharp(file.buffer)
      .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    const profile = await this.prisma.profile.findFirst({
      where: { userId: user.sub, isPrimary: true },
      select: { id: true, backgroundImageUrl: true },
    });
    if (!profile) throw AppException.notFound('Perfil');

    if (profile.backgroundImageUrl?.startsWith('http')) {
      this.storageService.deleteFile(profile.backgroundImageUrl).catch(() => {});
    }

    const backgroundImageUrl = await this.storageService.uploadFile(
      processed,
      'backgrounds',
      user.sub,
      'webp',
    );

    await this.prisma.profile.update({
      where: { id: profile.id },
      data: { backgroundImageUrl, backgroundType: 'image' },
    });

    return { url: backgroundImageUrl };
  }

  // ── Exclusão de imagem de background (requer PRO+ com feature customBg) ──
  // Reseta para o tema padrão com overlay de 0.7
  @UseGuards(PlanGuard)
  @RequiresFeature('customBg')
  @Delete('me/background')
  async deleteBackground(@CurrentUser() user: JwtPayload) {
    const profile = await this.prisma.profile.findFirst({
      where: { userId: user.sub, isPrimary: true },
      select: { id: true, backgroundImageUrl: true },
    });
    if (!profile) throw AppException.notFound('Perfil');

    if (profile.backgroundImageUrl?.startsWith('http')) {
      this.storageService.deleteFile(profile.backgroundImageUrl).catch(() => {});
    }

    await this.prisma.profile.update({
      where: { id: profile.id },
      data: { backgroundImageUrl: null, backgroundType: 'theme', backgroundOverlay: 0.7 },
    });

    return { deleted: true };
  }
}
