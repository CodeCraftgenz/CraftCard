import {
  Controller,
  Get,
  Post,
  Param,
  Res,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import * as sharp from 'sharp';
import { StorageService } from './storage.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { CurrentUser, type JwtPayload } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { AppException } from '../common/exceptions/app.exception';

const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_RESUME_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 20 * 1024 * 1024; // 20MB

@Controller()
export class StorageController {
  constructor(
    private readonly storageService: StorageService,
    private readonly prisma: PrismaService,
  ) {}

  // ── Serve photo (legacy base64 fallback) ──────────────────────────
  @Public()
  @Get('photos/:userId')
  async servePhoto(@Param('userId') userId: string, @Res() res: Response) {
    const profile = await this.prisma.profile.findFirst({
      where: { userId, isPrimary: true },
      select: { photoData: true },
    });
    if (!profile?.photoData) {
      throw AppException.notFound('Foto');
    }
    const buffer = Buffer.from(profile.photoData, 'base64');
    res.set({
      'Content-Type': 'image/webp',
      'Content-Length': buffer.length.toString(),
      'Cache-Control': 'public, max-age=86400',
    });
    res.send(buffer);
  }

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

    // Delete old R2 photo if exists
    if (profile.photoUrl?.startsWith('http')) {
      this.storageService.deleteFile(profile.photoUrl).catch(() => {});
    }

    // Upload to R2
    const photoUrl = await this.storageService.uploadFile(processed, 'photos', user.sub, 'webp');

    await this.prisma.profile.update({
      where: { id: profile.id },
      data: { photoUrl, photoData: null },
    });

    return { url: photoUrl };
  }

  // ── Serve cover (legacy base64 fallback) ──────────────────────────
  @Public()
  @Get('covers/:userId')
  async serveCover(@Param('userId') userId: string, @Res() res: Response) {
    const profile = await this.prisma.profile.findFirst({
      where: { userId, isPrimary: true },
      select: { coverPhotoData: true },
    });
    if (!profile?.coverPhotoData) {
      throw AppException.notFound('Capa');
    }
    const buffer = Buffer.from(profile.coverPhotoData, 'base64');
    res.set({
      'Content-Type': 'image/webp',
      'Content-Length': buffer.length.toString(),
      'Cache-Control': 'public, max-age=86400',
    });
    res.send(buffer);
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

    // Delete old R2 cover if exists
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

  // ── Serve resume (legacy base64 fallback) ─────────────────────────
  @Public()
  @Get('resume/:slug')
  async serveResume(@Param('slug') slug: string, @Res() res: Response) {
    const profile = await this.prisma.profile.findUnique({
      where: { slug },
      select: { resumeData: true, resumeType: true, displayName: true },
    });
    if (!profile?.resumeData) {
      throw AppException.notFound('Curriculo');
    }
    const buffer = Buffer.from(profile.resumeData, 'base64');
    const fileName = `${(profile.displayName || 'curriculo').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Length': buffer.length.toString(),
      'Content-Disposition': `inline; filename="${fileName}"`,
      'Cache-Control': 'no-cache, must-revalidate',
    });
    res.send(buffer);
  }

  // ── Upload resume → R2 ───────────────────────────────────────────
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

    // Delete old R2 resume if exists
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

  // ── Upload video → R2 (unchanged) ───────────────────────────────
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
      select: { videoUrl: true },
    });
    if (profile?.videoUrl) {
      await this.storageService.deleteFile(profile.videoUrl);
    }

    const url = await this.storageService.uploadFile(file.buffer, 'videos', user.sub, 'mp4');

    const currentProfile = await this.prisma.profile.findFirst({
      where: { userId: user.sub, isPrimary: true },
      select: { id: true },
    });
    if (!currentProfile) throw AppException.notFound('Perfil');

    await this.prisma.profile.update({
      where: { id: currentProfile.id },
      data: { videoUrl: url },
    });

    return { url };
  }
}
