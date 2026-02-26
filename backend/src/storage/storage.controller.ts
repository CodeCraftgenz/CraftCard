import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as sharp from 'sharp';
import { StorageService } from './storage.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { CurrentUser, type JwtPayload } from '../common/decorators/current-user.decorator';
import { AppException } from '../common/exceptions/app.exception';
import { PlanGuard, RequiresFeature } from '../payments/guards/plan.guard';

const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_RESUME_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 20 * 1024 * 1024; // 20MB

@Controller()
export class StorageController {
  constructor(
    private readonly storageService: StorageService,
    private readonly prisma: PrismaService,
  ) {}

  // ── Upload photo → R2 ────────────────────────────────────────────
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
  ) {
    const processed = await sharp(file.buffer)
      .resize(400, 400, { fit: 'cover' })
      .webp({ quality: 80 })
      .toBuffer();

    const profile = await this.prisma.profile.findFirst({
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

  // ── Upload cover → R2 ────────────────────────────────────────────
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

  // ── Upload resume → R2 (PRO+) ──────────────────────────────────
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

  // ── Upload video → R2 (PRO+) ──────────────────────────────────
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
}
