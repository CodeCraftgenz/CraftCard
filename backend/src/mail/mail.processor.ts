/**
 * BullMQ Mail Processor
 * =====================
 * Consome jobs da fila "mail" e envia via nodemailer.
 * Retries automáticos: 3 tentativas com backoff exponencial.
 *
 * Responsabilidade: APENAS o envio SMTP. A montagem do HTML
 * é feita no MailService antes de enfileirar.
 */
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type { Job } from 'bullmq';

export interface MailJobData {
  to: string;
  subject: string;
  html: string;
  from: string;
  replyTo?: string;
}

export const MAIL_QUEUE = 'mail';

@Processor(MAIL_QUEUE)
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);
  private transporter: Transporter | null = null;

  constructor(private readonly config: ConfigService) {
    super();

    const host = this.config.get<string>('MAIL_HOST');
    const portNum = Number(this.config.get('MAIL_PORT')) || 465;
    const user = this.config.get<string>('MAIL_USER');
    const pass = this.config.get<string>('MAIL_PASS');

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: portNum,
        secure: portNum === 465,
        auth: { user, pass },
      });
      this.logger.log(`Mail processor ready (${host}:${portNum})`);
    } else {
      this.logger.warn('Mail processor: SMTP not configured — jobs will be discarded');
    }
  }

  async process(job: Job<MailJobData>): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(`Discarding mail job ${job.id} — no SMTP configured`);
      return;
    }

    const { to, subject, html, from, replyTo } = job.data;

    await this.transporter.sendMail({
      from,
      to,
      subject,
      html,
      ...(replyTo ? { replyTo } : {}),
    });

    this.logger.log(`Mail sent [${job.id}]: "${subject}" → ${to}`);
  }
}
