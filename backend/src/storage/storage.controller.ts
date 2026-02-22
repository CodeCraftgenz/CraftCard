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

@Controller()
export class StorageController {
  constructor(
    private readonly storageService: StorageService,
    private readonly prisma: PrismaService,
  ) {}

  @Public()
  @Get('photos/:userId')
  async servePhoto(@Param('userId') userId: string, @Res() res: Response) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
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
    // Resize to 400x400 and convert to WebP with good quality
    const processed = await sharp(file.buffer)
      .resize(400, 400, { fit: 'cover' })
      .webp({ quality: 80 })
      .toBuffer();

    const base64 = processed.toString('base64');

    // Build a short URL that serves the photo via API
    const photoUrl = `/api/photos/${user.sub}`;

    // Save base64 to database, short URL in photoUrl
    await this.prisma.profile.update({
      where: { userId: user.sub },
      data: { photoUrl, photoData: base64 },
    });

    return { url: photoUrl };
  }

  @Public()
  @Get('covers/:userId')
  async serveCover(@Param('userId') userId: string, @Res() res: Response) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
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

    const base64 = processed.toString('base64');
    const coverPhotoUrl = `/api/covers/${user.sub}`;

    await this.prisma.profile.update({
      where: { userId: user.sub },
      data: { coverPhotoUrl, coverPhotoData: base64 },
    });

    return { url: coverPhotoUrl };
  }

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
    // Delete old resume
    const profile = await this.prisma.profile.findUnique({
      where: { userId: user.sub },
      select: { resumeUrl: true },
    });
    if (profile?.resumeUrl) {
      await this.storageService.deleteFile(profile.resumeUrl);
    }

    // Upload new resume
    const url = await this.storageService.uploadFile(file.buffer, 'resumes', user.sub, 'pdf');

    // Update profile
    await this.prisma.profile.update({
      where: { userId: user.sub },
      data: { resumeUrl: url, resumeType: 'pdf' },
    });

    return { url };
  }
}
