import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'basic-ftp';
import { Readable } from 'stream';
import { v4 as uuid } from 'uuid';
import { AppException } from '../common/exceptions/app.exception';
import type { EnvConfig } from '../common/config/env.config';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(private readonly configService: ConfigService<EnvConfig>) {}

  async uploadFile(
    buffer: Buffer,
    folder: string,
    userId: string,
    extension: string,
  ): Promise<string> {
    const fileName = `${uuid()}.${extension}`;
    const remotePath = `${this.getBasePath()}/${folder}/${userId}/${fileName}`;
    const publicUrl = `${this.getPublicUrl()}/${folder}/${userId}/${fileName}`;

    const client = new Client();

    try {
      await client.access({
        host: this.configService.get('FTP_HOST', { infer: true }),
        user: this.configService.get('FTP_USER', { infer: true }),
        password: this.configService.get('FTP_PASSWORD', { infer: true }),
        secure: false,
      });

      // Ensure directory exists
      await client.ensureDir(`${this.getBasePath()}/${folder}/${userId}`);

      // Upload from buffer
      const stream = Readable.from(buffer);
      await client.uploadFrom(stream, remotePath);

      this.logger.log(`File uploaded: ${remotePath}`);
      return publicUrl;
    } catch (error) {
      this.logger.error(`FTP upload failed: ${remotePath}`, error);
      throw AppException.internal('Falha no upload do arquivo');
    } finally {
      client.close();
    }
  }

  async deleteFile(fileUrl: string): Promise<void> {
    if (!fileUrl) return;

    const publicBase = this.getPublicUrl();
    if (!fileUrl.startsWith(publicBase)) return;

    const relativePath = fileUrl.replace(publicBase, '');
    const remotePath = `${this.getBasePath()}${relativePath}`;

    const client = new Client();

    try {
      await client.access({
        host: this.configService.get('FTP_HOST', { infer: true }),
        user: this.configService.get('FTP_USER', { infer: true }),
        password: this.configService.get('FTP_PASSWORD', { infer: true }),
        secure: false,
      });

      await client.remove(remotePath);
      this.logger.log(`File deleted: ${remotePath}`);
    } catch (error) {
      // File might not exist, just log warning
      this.logger.warn(`FTP delete failed (may not exist): ${remotePath}`);
    } finally {
      client.close();
    }
  }

  private getBasePath(): string {
    return this.configService.get('FTP_BASE_PATH', { infer: true }) || '/public_html/uploads';
  }

  private getPublicUrl(): string {
    return this.configService.get('UPLOADS_PUBLIC_URL', { infer: true }) || '';
  }
}
