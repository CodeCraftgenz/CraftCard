/**
 * Serviço de armazenamento de arquivos via Cloudflare R2 (API compatível com S3).
 *
 * Usado para armazenar fotos de perfil, covers, backgrounds, currículos e vídeos.
 * Arquivos são organizados em pastas: {folder}/{userId}/{uuid}.{ext}
 * URLs públicas são servidas via CDN do R2 (R2_PUBLIC_URL).
 *
 * O R2 foi escolhido por ter egress gratuito (sem custo de transferência),
 * diferente do S3 que cobra por GB transferido.
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuid } from 'uuid';
import { AppException } from '../common/exceptions/app.exception';
import type { EnvConfig } from '../common/config/env.config';

// Mapeamento de extensão para Content-Type (enviado ao R2 para servir corretamente)
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

    // Cliente S3 apontando para o endpoint do Cloudflare R2
    this.s3 = new S3Client({
      region: 'auto', // R2 usa 'auto' como região
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: this.configService.get('R2_ACCESS_KEY_ID', { infer: true })!,
        secretAccessKey: this.configService.get('R2_SECRET_ACCESS_KEY', { infer: true })!,
      },
    });

    this.bucket = this.configService.get('R2_BUCKET_NAME', { infer: true })!;
    // Remove trailing slash para montar URLs corretas
    this.publicUrl = this.configService.get('R2_PUBLIC_URL', { infer: true })!.replace(/\/$/, '');
  }

  /**
   * Faz upload de arquivo para o R2.
   * Gera nome único via UUID para evitar colisões.
   * Retorna a URL pública do arquivo no CDN.
   */
  async uploadFile(
    buffer: Buffer,
    folder: string,
    userId: string,
    extension: string,
  ): Promise<string> {
    // Nome único: UUID garante que não há colisão mesmo com uploads simultâneos
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

  /**
   * Deleta arquivo do R2 pela URL pública.
   * Ignora URLs que não pertencem ao R2 (ex: URLs do Google para avatars).
   * Falha silenciosa se o arquivo não existir (pode já ter sido deletado).
   */
  async deleteFile(fileUrl: string): Promise<void> {
    if (!fileUrl) return;

    // Só deleta arquivos hospedados no R2 — ignora URLs externas (Google, etc.)
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
