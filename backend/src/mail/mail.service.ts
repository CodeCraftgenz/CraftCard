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

  async sendOrgInvite(toEmail: string, orgName: string, inviterName: string, token: string): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn(`Org invite email NOT sent to ${toEmail} — mail transporter not configured`);
      return false;
    }
    const joinUrl = `${this.frontendUrl}/org/join/${token}`;
    try {
      await this.transporter.sendMail({
        from: `CraftCard <${this.from}>`,
        to: toEmail,
        subject: `${inviterName} convidou voce para ${orgName}`,
        html: this.buildInviteEmail(orgName, inviterName, joinUrl),
      });
      this.logger.log(`Org invite email sent to ${toEmail}`);
      return true;
    } catch (err) {
      this.logger.error(`FAILED to send org invite to ${toEmail}: ${(err as Error).message || err}`);
      return false;
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

  // ============================================================
  // Org Invite — Light Elegant Template
  // ============================================================

  private buildInviteEmail(orgName: string, inviterName: string, joinUrl: string): string {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Convite para ${this.esc(orgName)}</title>
</head>
<body style="margin:0;padding:0;background:#f0f0f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#f0f0f5;">${this.esc(inviterName)} convidou voce para a organizacao ${this.esc(orgName)} no CraftCard</div>

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f0f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Gradient Top Bar -->
          <tr><td style="height:5px;background:linear-gradient(90deg,#00E4F2,#8B5CF6,#D12BF2);"></td></tr>

          <!-- Logo -->
          <tr>
            <td style="padding:32px 32px 0;text-align:center;">
              <span style="font-size:24px;font-weight:800;letter-spacing:-0.5px;">
                <span style="color:#00E4F2;">Craft</span><span style="color:#1a1a2e;">Card</span>
              </span>
            </td>
          </tr>

          <!-- Icon -->
          <tr>
            <td style="padding:28px 32px 0;text-align:center;">
              <div style="display:inline-block;width:72px;height:72px;line-height:72px;font-size:36px;background:linear-gradient(135deg,#f0f4ff,#ede9fe);border-radius:50%;">🏢</div>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td style="padding:20px 32px 0;text-align:center;">
              <h1 style="color:#1a1a2e;font-size:22px;font-weight:700;margin:0;line-height:1.3;">Voce foi convidado!</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:16px 32px 0;">
              <p style="color:#4a4a68;font-size:15px;line-height:1.7;margin:0 0 20px;text-align:center;">
                <strong style="color:#1a1a2e;">${this.esc(inviterName)}</strong> convidou voce para fazer parte da organizacao
              </p>

              <!-- Org Name Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr>
                  <td style="background:linear-gradient(135deg,#f8f7ff,#f0edff);border:1px solid #e8e4f8;border-radius:14px;padding:20px;text-align:center;">
                    <p style="color:#8B5CF6;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 8px;">Organizacao</p>
                    <p style="color:#1a1a2e;font-size:22px;font-weight:800;margin:0;letter-spacing:-0.3px;">${this.esc(orgName)}</p>
                  </td>
                </tr>
              </table>

              <!-- Benefits -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f0f0f5;">
                    <table cellpadding="0" cellspacing="0"><tr>
                      <td style="width:32px;vertical-align:top;padding-top:2px;"><span style="font-size:16px;">✨</span></td>
                      <td style="color:#4a4a68;font-size:14px;line-height:1.5;">Branding corporativo aplicado automaticamente</td>
                    </tr></table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f0f0f5;">
                    <table cellpadding="0" cellspacing="0"><tr>
                      <td style="width:32px;vertical-align:top;padding-top:2px;"><span style="font-size:16px;">📊</span></td>
                      <td style="color:#4a4a68;font-size:14px;line-height:1.5;">Analytics e metricas de visitas</td>
                    </tr></table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;">
                    <table cellpadding="0" cellspacing="0"><tr>
                      <td style="width:32px;vertical-align:top;padding-top:2px;"><span style="font-size:16px;">🚀</span></td>
                      <td style="color:#4a4a68;font-size:14px;line-height:1.5;">Agendamento, galeria, servicos e mais</td>
                    </tr></table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding:0 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${joinUrl}" style="display:inline-block;background:linear-gradient(135deg,#00E4F2,#8B5CF6,#D12BF2);color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:16px 48px;border-radius:14px;box-shadow:0 4px 16px rgba(139,92,246,0.3);">Aceitar Convite</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Expiry note -->
          <tr>
            <td style="padding:16px 32px 0;text-align:center;">
              <p style="color:#9ca3af;font-size:12px;margin:0;">Este convite expira em 7 dias</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px 32px;">
              <hr style="border:none;border-top:1px solid #f0f0f5;margin:0 0 20px;" />
              <p style="color:#9ca3af;font-size:12px;line-height:1.5;margin:0;text-align:center;">
                <span style="font-weight:700;"><span style="color:#00E4F2;">Craft</span><span style="color:#6b7280;">Card</span></span> — Seu cartao digital profissional<br />
                <a href="${this.frontendUrl}" style="color:#8B5CF6;text-decoration:none;">craftcardgenz.com</a>
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
