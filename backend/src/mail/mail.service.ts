import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;
  private readonly from: string;
  private readonly frontendUrl: string;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('MAIL_HOST');
    const port = this.config.get<number>('MAIL_PORT');
    const user = this.config.get<string>('MAIL_USER');
    const pass = this.config.get<string>('MAIL_PASS');
    this.from = this.config.get<string>('MAIL_FROM') || user || 'noreply@craftcard.com';
    this.frontendUrl = this.config.get<string>('FRONTEND_URL') || 'https://craftcardgenz.com';

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: port || 465,
        secure: (port || 465) === 465,
        auth: { user, pass },
      });
      this.logger.log('Mail transporter configured');
    } else {
      this.logger.warn('MAIL_* env vars not configured — email notifications disabled');
    }
  }

  // --- Contact Message Notification ---

  async sendNewMessageNotification(ownerEmail: string, senderName: string, preview: string, senderEmail?: string) {
    if (!this.transporter) return;
    try {
      await this.transporter.sendMail({
        from: `CraftCard <${this.from}>`,
        replyTo: senderEmail || undefined,
        to: ownerEmail,
        subject: `Nova mensagem de ${senderName}`,
        html: this.buildEmail({
          preheader: `${senderName} enviou uma mensagem pelo seu cartao`,
          title: 'Nova Mensagem',
          icon: '💬',
          body: `
            <p style="color:#e0e0e0;font-size:15px;line-height:1.6;margin:0 0 16px;">
              <strong style="color:#fff;">${this.esc(senderName)}</strong> enviou uma mensagem pelo seu cartao:
            </p>
            <div style="background:#0D0D1A;border-left:3px solid #00E4F2;padding:16px;border-radius:0 8px 8px 0;margin:0 0 20px;">
              <p style="color:#ccc;font-size:14px;line-height:1.6;margin:0;font-style:italic;">"${this.esc(preview)}"</p>
            </div>
            ${senderEmail ? `<p style="color:#999;font-size:13px;margin:0 0 20px;">Email: <a href="mailto:${this.esc(senderEmail)}" style="color:#00E4F2;">${this.esc(senderEmail)}</a></p>` : ''}
          `,
          ctaText: 'Ver mensagens',
          ctaUrl: `${this.frontendUrl}/editor`,
        }),
      });
      this.logger.log(`Message notification sent to ${ownerEmail}`);
    } catch (err) {
      this.logger.warn(`Failed to send message notification: ${err}`);
    }
  }

  // --- Testimonial Notification ---

  async sendNewTestimonialNotification(ownerEmail: string, authorName: string, preview: string) {
    if (!this.transporter) return;
    try {
      await this.transporter.sendMail({
        from: `CraftCard <${this.from}>`,
        to: ownerEmail,
        subject: `Novo depoimento de ${authorName}`,
        html: this.buildEmail({
          preheader: `${authorName} deixou um depoimento no seu cartao`,
          title: 'Novo Depoimento',
          icon: '⭐',
          body: `
            <p style="color:#e0e0e0;font-size:15px;line-height:1.6;margin:0 0 16px;">
              <strong style="color:#fff;">${this.esc(authorName)}</strong> deixou um depoimento:
            </p>
            <div style="background:#0D0D1A;border-left:3px solid #D12BF2;padding:16px;border-radius:0 8px 8px 0;margin:0 0 20px;">
              <p style="color:#ccc;font-size:14px;line-height:1.6;margin:0;font-style:italic;">"${this.esc(preview)}"</p>
            </div>
          `,
          ctaText: 'Aprovar depoimento',
          ctaUrl: `${this.frontendUrl}/editor`,
        }),
      });
      this.logger.log(`Testimonial notification sent to ${ownerEmail}`);
    } catch (err) {
      this.logger.warn(`Failed to send testimonial notification: ${err}`);
    }
  }

  // --- Organization Invite ---

  async sendOrgInvite(toEmail: string, orgName: string, inviterName: string, token: string) {
    if (!this.transporter) return;
    const joinUrl = `${this.frontendUrl}/org/join/${token}`;
    try {
      await this.transporter.sendMail({
        from: `CraftCard <${this.from}>`,
        to: toEmail,
        subject: `Voce foi convidado para ${orgName}`,
        html: this.buildEmail({
          preheader: `${inviterName} convidou voce para a organizacao ${orgName}`,
          title: 'Convite de Organizacao',
          icon: '🏢',
          body: `
            <p style="color:#e0e0e0;font-size:15px;line-height:1.6;margin:0 0 16px;">
              <strong style="color:#fff;">${this.esc(inviterName)}</strong> convidou voce para fazer parte da organizacao
              <strong style="color:#00E4F2;">${this.esc(orgName)}</strong> no CraftCard.
            </p>
            <p style="color:#999;font-size:14px;line-height:1.6;margin:0 0 8px;">
              Com o CraftCard Business, voce tera um cartao digital profissional com:
            </p>
            <ul style="color:#ccc;font-size:14px;line-height:1.8;margin:0 0 20px;padding-left:20px;">
              <li>Branding da empresa aplicado automaticamente</li>
              <li>Analytics e metricas de visitas</li>
              <li>Agendamento, galeria, servicos e mais</li>
            </ul>
            <p style="color:#666;font-size:13px;margin:0 0 4px;">O convite expira em 7 dias.</p>
          `,
          ctaText: 'Aceitar Convite',
          ctaUrl: joinUrl,
        }),
      });
      this.logger.log(`Org invite email sent to ${toEmail}`);
    } catch (err) {
      this.logger.warn(`Failed to send org invite email: ${err}`);
    }
  }

  // --- Welcome Email ---

  async sendWelcome(toEmail: string, name: string) {
    if (!this.transporter) return;
    try {
      await this.transporter.sendMail({
        from: `CraftCard <${this.from}>`,
        to: toEmail,
        subject: `Bem-vindo ao CraftCard, ${name}!`,
        html: this.buildEmail({
          preheader: 'Seu cartao digital profissional esta pronto',
          title: `Bem-vindo, ${this.esc(name)}!`,
          icon: '🎉',
          body: `
            <p style="color:#e0e0e0;font-size:15px;line-height:1.6;margin:0 0 16px;">
              Estamos felizes em ter voce no CraftCard! Seu cartao digital ja esta pronto para ser personalizado.
            </p>
            <div style="background:#0D0D1A;border-radius:12px;padding:20px;margin:0 0 20px;">
              <p style="color:#fff;font-size:14px;font-weight:600;margin:0 0 12px;">Proximos passos:</p>
              <table style="width:100%;border-collapse:collapse;">
                <tr>
                  <td style="padding:8px 12px 8px 0;color:#00E4F2;font-size:20px;vertical-align:top;width:32px;">1</td>
                  <td style="padding:8px 0;color:#ccc;font-size:14px;">Edite seu nome, bio e foto de perfil</td>
                </tr>
                <tr>
                  <td style="padding:8px 12px 8px 0;color:#00E4F2;font-size:20px;vertical-align:top;">2</td>
                  <td style="padding:8px 0;color:#ccc;font-size:14px;">Adicione seus links (WhatsApp, Instagram, LinkedIn...)</td>
                </tr>
                <tr>
                  <td style="padding:8px 12px 8px 0;color:#00E4F2;font-size:20px;vertical-align:top;">3</td>
                  <td style="padding:8px 0;color:#ccc;font-size:14px;">Publique e compartilhe seu cartao!</td>
                </tr>
              </table>
            </div>
          `,
          ctaText: 'Acessar meu cartao',
          ctaUrl: `${this.frontendUrl}/editor`,
        }),
      });
      this.logger.log(`Welcome email sent to ${toEmail}`);
    } catch (err) {
      this.logger.warn(`Failed to send welcome email: ${err}`);
    }
  }

  // --- Payment Confirmation ---

  async sendPaymentConfirmation(toEmail: string, name: string, plan: string) {
    if (!this.transporter) return;
    try {
      await this.transporter.sendMail({
        from: `CraftCard <${this.from}>`,
        to: toEmail,
        subject: `Plano ${plan} ativado com sucesso!`,
        html: this.buildEmail({
          preheader: `Seu plano ${plan} esta ativo`,
          title: 'Pagamento Confirmado!',
          icon: '✅',
          body: `
            <p style="color:#e0e0e0;font-size:15px;line-height:1.6;margin:0 0 16px;">
              Ola <strong style="color:#fff;">${this.esc(name)}</strong>, seu plano
              <strong style="color:#00E4F2;">${this.esc(plan)}</strong> foi ativado com sucesso!
            </p>
            <p style="color:#999;font-size:14px;line-height:1.6;margin:0 0 20px;">
              Agora voce tem acesso a todas as funcionalidades do plano. Confira o tutorial para aproveitar ao maximo.
            </p>
          `,
          ctaText: 'Ver tutorial',
          ctaUrl: `${this.frontendUrl}/tutorial`,
        }),
      });
      this.logger.log(`Payment confirmation sent to ${toEmail}`);
    } catch (err) {
      this.logger.warn(`Failed to send payment confirmation: ${err}`);
    }
  }

  // --- Booking Notification ---

  async sendBookingNotification(ownerEmail: string, guestName: string, date: string, time: string) {
    if (!this.transporter) return;
    try {
      await this.transporter.sendMail({
        from: `CraftCard <${this.from}>`,
        to: ownerEmail,
        subject: `Novo agendamento de ${guestName}`,
        html: this.buildEmail({
          preheader: `${guestName} agendou para ${date} as ${time}`,
          title: 'Novo Agendamento',
          icon: '📅',
          body: `
            <p style="color:#e0e0e0;font-size:15px;line-height:1.6;margin:0 0 16px;">
              <strong style="color:#fff;">${this.esc(guestName)}</strong> fez um agendamento pelo seu cartao.
            </p>
            <div style="background:#0D0D1A;border-radius:12px;padding:16px;margin:0 0 20px;">
              <table style="width:100%;border-collapse:collapse;">
                <tr>
                  <td style="padding:6px 0;color:#999;font-size:13px;width:80px;">Data</td>
                  <td style="padding:6px 0;color:#fff;font-size:14px;font-weight:600;">${this.esc(date)}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#999;font-size:13px;">Horario</td>
                  <td style="padding:6px 0;color:#fff;font-size:14px;font-weight:600;">${this.esc(time)}</td>
                </tr>
              </table>
            </div>
          `,
          ctaText: 'Ver agendamentos',
          ctaUrl: `${this.frontendUrl}/editor`,
        }),
      });
      this.logger.log(`Booking notification sent to ${ownerEmail}`);
    } catch (err) {
      this.logger.warn(`Failed to send booking notification: ${err}`);
    }
  }

  // ============================================================
  // Email Template Builder
  // ============================================================

  private buildEmail(opts: {
    preheader: string;
    title: string;
    icon: string;
    body: string;
    ctaText?: string;
    ctaUrl?: string;
  }): string {
    const cta = opts.ctaText && opts.ctaUrl
      ? `<table style="width:100%;margin:0 0 24px;" cellpadding="0" cellspacing="0">
           <tr>
             <td align="center">
               <a href="${opts.ctaUrl}" style="display:inline-block;background:linear-gradient(135deg,#00E4F2,#D12BF2);color:#000;text-decoration:none;font-weight:700;font-size:14px;padding:14px 32px;border-radius:12px;">${opts.ctaText}</a>
             </td>
           </tr>
         </table>`
      : '';

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${this.esc(opts.title)}</title>
</head>
<body style="margin:0;padding:0;background:#0D0D1A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#0D0D1A;">${this.esc(opts.preheader)}</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0D0D1A;padding:24px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#141428;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.06);">
          <tr><td style="height:4px;background:linear-gradient(90deg,#00E4F2,#D12BF2);"></td></tr>
          <tr>
            <td style="padding:28px 32px 0;text-align:center;">
              <span style="font-size:22px;font-weight:800;letter-spacing:-0.5px;">
                <span style="color:#00E4F2;">Craft</span><span style="color:#fff;">Card</span>
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 0;text-align:center;">
              <div style="font-size:36px;margin-bottom:12px;">${opts.icon}</div>
              <h1 style="color:#fff;font-size:20px;font-weight:700;margin:0 0 4px;line-height:1.3;">${opts.title}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 0;">
              ${opts.body}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 0;">
              ${cta}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 28px;">
              <hr style="border:none;border-top:1px solid rgba(255,255,255,0.06);margin:0 0 16px;" />
              <p style="color:#666;font-size:12px;line-height:1.5;margin:0;text-align:center;">
                CraftCard — Seu cartao digital profissional<br />
                <a href="${this.frontendUrl}" style="color:#00E4F2;text-decoration:none;">craftcardgenz.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  private esc(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
}
