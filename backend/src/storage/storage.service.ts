import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuid } from 'uuid';
import { AppException } from '../common/exceptions/app.exception';
import type { EnvConfig } from '../common/config/env.config';

const CONTENT_TYPES: Record<string, string> = {
  webp: 'image/webp',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  png: 'image/png',
  pdf: 'application/pdf',
  mp4: 'video/mp4',
};

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor(private readonly configService: ConfigService<EnvConfig>) {
    const accountId = this.configService.get('R2_ACCOUNT_ID', { infer: true });

    this.s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: this.configService.get('R2_ACCESS_KEY_ID', { infer: true })!,
        secretAccessKey: this.configService.get('R2_SECRET_ACCESS_KEY', { infer: true })!,
      },
    });

    this.bucket = this.configService.get('R2_BUCKET_NAME', { infer: true })!;
    this.publicUrl = this.configService.get('R2_PUBLIC_URL', { infer: true })!.replace(/\/$/, '');
  }

  async uploadFile(
    buffer: Buffer,
    folder: string,
    userId: string,
    extension: string,
  ): Promise<string> {
    const fileName = `${uuid()}.${extension}`;
    const key = `${folder}/${userId}/${fileName}`;
    const contentType = CONTENT_TYPES[extension.toLowerCase()] || 'application/octet-stream';

    try {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: buffer,
          ContentType: contentType,
        }),
      );

      const publicUrl = `${this.publicUrl}/${key}`;
      this.logger.log(`File uploaded to R2: ${key}`);
      return publicUrl;
    } catch (error) {
      this.logger.error(`R2 upload failed: ${key}`, error);
      throw AppException.internal('Falha no upload do arquivo');
    }
  }

  async deleteFile(fileUrl: string): Promise<void> {
    if (!fileUrl) return;

    // Only delete files hosted on R2
    if (!fileUrl.startsWith(this.publicUrl)) {
      this.logger.debug(`Skipping delete for non-R2 URL: ${fileUrl}`);
      return;
    }

    const key = fileUrl.replace(`${this.publicUrl}/`, '');

    try {
      await this.s3.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
      this.logger.log(`File deleted from R2: ${key}`);
    } catch (error) {
      this.logger.warn(`R2 delete failed (may not exist): ${key}`);
    }
  }
}
