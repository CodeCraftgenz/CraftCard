import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('MAIL_HOST');
    const port = this.config.get<number>('MAIL_PORT');
    const user = this.config.get<string>('MAIL_USER');
    const pass = this.config.get<string>('MAIL_PASS');
    this.from = this.config.get<string>('MAIL_FROM') || user || 'noreply@craftcard.com';

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: port || 587,
        secure: port === 465,
        auth: { user, pass },
      });
      this.logger.log('Mail transporter configured');
    } else {
      this.logger.warn('MAIL_* env vars not configured — email notifications disabled');
    }
  }

  async sendNewMessageNotification(ownerEmail: string, senderName: string, preview: string) {
    if (!this.transporter) return;
    try {
      await this.transporter.sendMail({
        from: this.from,
        to: ownerEmail,
        subject: `Nova mensagem de ${senderName} — CraftCard`,
        html: this.buildHtml(
          'Nova Mensagem Recebida',
          `<p><strong>${this.escapeHtml(senderName)}</strong> enviou uma mensagem para voce:</p>
           <blockquote style="border-left:3px solid #00E4F2;padding-left:12px;color:#ccc;">${this.escapeHtml(preview)}</blockquote>
           <p>Acesse o painel do CraftCard para responder.</p>`,
        ),
      });
      this.logger.log(`Message notification sent to ${ownerEmail}`);
    } catch (err) {
      this.logger.warn(`Failed to send message notification: ${err}`);
    }
  }

  async sendNewTestimonialNotification(ownerEmail: string, authorName: string, preview: string) {
    if (!this.transporter) return;
    try {
      await this.transporter.sendMail({
        from: this.from,
        to: ownerEmail,
        subject: `Novo depoimento de ${authorName} — CraftCard`,
        html: this.buildHtml(
          'Novo Depoimento Recebido',
          `<p><strong>${this.escapeHtml(authorName)}</strong> deixou um depoimento:</p>
           <blockquote style="border-left:3px solid #00E4F2;padding-left:12px;color:#ccc;">${this.escapeHtml(preview)}</blockquote>
           <p>Acesse o painel do CraftCard para aprovar ou rejeitar.</p>`,
        ),
      });
      this.logger.log(`Testimonial notification sent to ${ownerEmail}`);
    } catch (err) {
      this.logger.warn(`Failed to send testimonial notification: ${err}`);
    }
  }

  private buildHtml(title: string, body: string): string {
    return `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;background:#1A1A2E;color:#E0E0E0;padding:24px;border-radius:8px;">
        <h2 style="color:#00E4F2;margin-top:0;">${title}</h2>
        ${body}
        <hr style="border:none;border-top:1px solid #333;margin:20px 0;" />
        <p style="font-size:12px;color:#888;">CraftCard — Seu cartao digital profissional</p>
      </div>
    `;
  }

  private escapeHtml(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
}
