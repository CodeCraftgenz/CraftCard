import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import sharp from 'sharp';
import { StorageService } from './storage.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { CurrentUser, type JwtPayload } from '../common/decorators/current-user.decorator';

const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_RESUME_SIZE = 10 * 1024 * 1024; // 10MB

@Controller('me')
export class StorageController {
  constructor(
    private readonly storageService: StorageService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('photo-upload')
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

    // Convert to base64 data URL
    const base64 = processed.toString('base64');
    const dataUrl = `data:image/webp;base64,${base64}`;

    // Save to database
    await this.prisma.profile.update({
      where: { userId: user.sub },
      data: { photoUrl: dataUrl, photoData: base64 },
    });

    return { url: dataUrl };
  }

  @Post('resume-upload')
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
