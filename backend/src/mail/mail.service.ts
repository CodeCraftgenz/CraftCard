import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { MAIL_QUEUE, type MailJobData } from './mail.processor';

/**
 * MailService — Enfileira emails via BullMQ (Redis) com 3x retry.
 *
 * RETROCOMPATIBILIDADE: Se Redis não estiver disponível, a queue
 * é injetada como null (@Optional) e o envio cai no fallback SMTP
 * direto — comportamento idêntico ao original, sem retries.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly from: string;
  private readonly frontendUrl: string;
  private fallbackTransporter: Transporter | null = null;
  private readonly useQueue: boolean;

  constructor(
    private readonly config: ConfigService,
    @Optional() @InjectQueue(MAIL_QUEUE) private readonly mailQueue?: Queue<MailJobData>,
  ) {
    const host = this.config.get<string>('MAIL_HOST');
    const portNum = Number(this.config.get('MAIL_PORT')) || 465;
    const user = this.config.get<string>('MAIL_USER');
    const pass = this.config.get<string>('MAIL_PASS');
    this.from = this.config.get<string>('MAIL_FROM') || user || 'noreply@craftcard.com';
    this.frontendUrl = this.config.get<string>('FRONTEND_URL') || 'https://craftcardgenz.com';

    this.useQueue = !!this.mailQueue;

    if (!this.useQueue) {
      if (host && user && pass) {
        this.fallbackTransporter = nodemailer.createTransport({
          host, port: portNum, secure: portNum === 465, auth: { user, pass },
        });
      }
      this.logger.warn('Redis not available — using direct SMTP fallback (no retries)');
    } else {
      this.logger.log('MailService using BullMQ queue with 3x exponential retry');
    }
  }

  // ============================================================
  // Enqueue Helper — tenta fila, cai em SMTP direto se falhar
  // ============================================================

  private async enqueue(to: string, subject: string, html: string, replyTo?: string): Promise<void> {
    const jobData: MailJobData = { to, subject, html, from: `CraftCard <${this.from}>`, replyTo };

    if (this.useQueue && this.mailQueue) {
      try {
        await this.mailQueue.add('send', jobData, {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: { age: 86400 },
          removeOnFail: { age: 604800 },
        });
        return;
      } catch (err) {
        this.logger.warn(`Queue add failed, falling back to direct: ${err}`);
      }
    }

    // Fallback: envio direto (sem retries)
    if (this.fallbackTransporter) {
      try {
        await this.fallbackTransporter.sendMail({
          from: jobData.from, to, subject, html,
          ...(replyTo ? { replyTo } : {}),
        });
      } catch (err) {
        this.logger.warn(`Direct mail failed: ${err}`);
      }
    }
  }

  // --- Contact Message Notification ---

  async sendNewMessageNotification(ownerEmail: string, senderName: string, preview: string, senderEmail?: string) {
    await this.enqueue(
      ownerEmail,
      `Nova mensagem de ${senderName}`,
      this.buildEmail({
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
      senderEmail || undefined,
    );
    this.logger.log(`Message notification queued for ${ownerEmail}`);
  }

  async sendNewTestimonialNotification(ownerEmail: string, authorName: string, preview: string) {
    await this.enqueue(
      ownerEmail,
      `Novo depoimento de ${authorName}`,
      this.buildEmail({
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
    );
    this.logger.log(`Testimonial notification queued for ${ownerEmail}`);
  }

  async sendOrgInvite(toEmail: string, orgName: string, inviterName: string, token: string): Promise<boolean> {
    const joinUrl = `${this.frontendUrl}/org/join/${token}`;
    try {
      await this.enqueue(
        toEmail,
        `${inviterName} convidou você para ${orgName}`,
        this.buildInviteEmail(orgName, inviterName, joinUrl),
      );
      this.logger.log(`Org invite queued for ${toEmail}`);
      return true;
    } catch (err) {
      this.logger.error(`FAILED to queue org invite to ${toEmail}: ${(err as Error).message || err}`);
      return false;
    }
  }

  async sendWelcome(toEmail: string, name: string) {
    await this.enqueue(
      toEmail,
      `Bem-vindo ao CraftCard, ${name}!`,
      this.buildEmail({
          preheader: 'Seu cartão digital profissional está pronto',
          title: `Bem-vindo, ${this.esc(name)}!`,
          icon: '🎉',
          body: `
            <p style="color:#e0e0e0;font-size:15px;line-height:1.6;margin:0 0 16px;">
              Estamos felizes em ter você no CraftCard! Seu cartão digital já está pronto para ser personalizado.
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
    );
    this.logger.log(`Welcome email queued for ${toEmail}`);
  }

  async sendPasswordReset(toEmail: string, resetUrl: string): Promise<boolean> {
    try {
      await this.enqueue(
        toEmail,
        'Redefinir sua senha — CraftCard',
        this.buildEmail({
          preheader: 'Você solicitou a redefinicao da sua senha no CraftCard',
          title: 'Redefinir Senha',
          icon: '🔐',
          body: `
            <p style="color:#e0e0e0;font-size:15px;line-height:1.6;margin:0 0 16px;">
              Recebemos uma solicitação para redefinir a senha da sua conta CraftCard.
            </p>
            <p style="color:#999;font-size:14px;line-height:1.6;margin:0 0 20px;">
              Clique no botao abaixo para criar uma nova senha. Este link expira em <strong style="color:#fff;">1 hora</strong>.
            </p>
            <p style="color:#666;font-size:12px;margin:0;">
              Se vocenão solicitou está alteração, ignore este email — sua senhanão será modificada.
            </p>
          `,
          ctaText: 'Redefinir Senha',
          ctaUrl: resetUrl,
        }),
      );
      this.logger.log(`Password reset queued for ${toEmail}`);
      return true;
    } catch (err) {
      this.logger.error(`FAILED to queue password reset to ${toEmail}: ${(err as Error).message || err}`);
      return false;
    }
  }

  async sendPaymentConfirmation(toEmail: string, name: string, plan: string) {
    await this.enqueue(
      toEmail,
      `Plano ${plan} ativado com sucesso!`,
      this.buildEmail({
          preheader: `Seu plano ${plan} está ativo`,
          title: 'Pagamento Confirmado!',
          icon: '✅',
          body: `
            <p style="color:#e0e0e0;font-size:15px;line-height:1.6;margin:0 0 16px;">
              Ola <strong style="color:#fff;">${this.esc(name)}</strong>, seu plano
              <strong style="color:#00E4F2;">${this.esc(plan)}</strong> foi ativado com sucesso!
            </p>
            <p style="color:#999;font-size:14px;line-height:1.6;margin:0 0 20px;">
              Agora você tem acesso a todas as funcionalidades do plano. Confira o tutorial para aproveitar ao máximo.
            </p>
          `,
          ctaText: 'Ver tutorial',
          ctaUrl: `${this.frontendUrl}/tutorial`,
        }),
    );
    this.logger.log(`Payment confirmation queued for ${toEmail}`);
  }

  async sendBookingConfirmationToGuest(opts: {
    guestEmail: string;
    guestName: string;
    ownerName: string;
    date: string;
    time: string;
    notes?: string;
  }) {
    await this.enqueue(
      opts.guestEmail,
      `Agendamento confirmado com ${opts.ownerName}`,
      this.buildEmail({
        preheader: `Seu agendamento para ${opts.date} as ${opts.time} foi confirmado`,
        title: 'Agendamento Confirmado!',
        icon: '✅',
        body: `
          <p style="color:#e0e0e0;font-size:15px;line-height:1.6;margin:0 0 16px;">
            Ola <strong style="color:#fff;">${this.esc(opts.guestName)}</strong>! Seu agendamento com
            <strong style="color:#00E4F2;">${this.esc(opts.ownerName)}</strong> foi registrado com sucesso.
          </p>
          <div style="background:#0D0D1A;border-radius:12px;padding:16px;margin:0 0 20px;">
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="padding:6px 0;color:#999;font-size:13px;width:80px;">Data</td>
                <td style="padding:6px 0;color:#fff;font-size:14px;font-weight:600;">${this.esc(opts.date)}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#999;font-size:13px;">Horario</td>
                <td style="padding:6px 0;color:#fff;font-size:14px;font-weight:600;">${this.esc(opts.time)}</td>
              </tr>
              ${opts.notes ? `<tr><td style="padding:6px 0;color:#999;font-size:13px;">Obs.</td><td style="padding:6px 0;color:#ccc;font-size:13px;">${this.esc(opts.notes)}</td></tr>` : ''}
            </table>
          </div>
          <p style="color:#999;font-size:13px;line-height:1.5;margin:0;">
            Voce recebera um lembrete 30 minutos antes do horario marcado.
          </p>
        `,
      }),
    );
    this.logger.log(`Guest booking confirmation queued for ${opts.guestEmail}`);
  }

  async sendBookingNotification(ownerEmail: string, guestName: string, date: string, time: string) {
    await this.enqueue(
      ownerEmail,
      `Novo agendamento de ${guestName}`,
      this.buildEmail({
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
    );
    this.logger.log(`Booking notification queued for ${ownerEmail}`);
  }

  /**
   * Booking reminder — sent 30 min before meeting, to both owner and guest
   */
  async sendBookingReminder(opts: {
    ownerEmail: string;
    guestEmail: string;
    guestName: string;
    ownerName?: string;
    date: string;
    time: string;
  }) {
    const buildReminderHtml = (withPerson: string) => this.buildEmail({
      preheader: `Lembrete: reuniao em 30 minutos — ${opts.date} as ${opts.time}`,
      title: 'Lembrete de Agendamento',
      icon: '⏰',
      body: `
        <p style="color:#e0e0e0;font-size:15px;line-height:1.6;margin:0 0 16px;">
          Voce tem uma reuniao em aproximadamente <strong style="color:#00E4F2;">30 minutos</strong>.
        </p>
        <div style="background:#0D0D1A;border-radius:12px;padding:16px;margin:0 0 20px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:6px 0;color:#999;font-size:13px;width:80px;">Com</td>
              <td style="padding:6px 0;color:#fff;font-size:14px;font-weight:600;">${this.esc(withPerson)}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#999;font-size:13px;">Data</td>
              <td style="padding:6px 0;color:#fff;font-size:14px;font-weight:600;">${this.esc(opts.date)}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#999;font-size:13px;">Horario</td>
              <td style="padding:6px 0;color:#fff;font-size:14px;font-weight:600;">${this.esc(opts.time)}</td>
            </tr>
          </table>
        </div>
      `,
      ctaText: 'Ver agendamentos',
      ctaUrl: `${this.frontendUrl}/editor`,
    });

    // To owner: "with guest"
    await this.enqueue(
      opts.ownerEmail,
      `Lembrete: ${opts.guestName} em 30 minutos`,
      buildReminderHtml(opts.guestName),
    );
    // To guest: "with owner"
    await this.enqueue(
      opts.guestEmail,
      `Lembrete: sua reuniao e em 30 minutos`,
      buildReminderHtml(opts.ownerName ?? 'Proprietario do cartao'),
    );
    this.logger.log(`Booking reminder queued for ${opts.guestName} at ${opts.date} ${opts.time}`);
  }

  /**
   * Enterprise welcome email — luxurious design for B2B clients
   * Includes: plan details, seats, org name, setup password link
   */
  async sendEnterpriseWelcome(
    email: string,
    opts: {
      companyName: string;
      seats: number;
      monthlyTotal: string;
      billingCycle: string;
      setupPasswordUrl: string;
    },
  ): Promise<void> {
    const body = `
      <div style="background:linear-gradient(135deg, rgba(139,92,246,0.15), rgba(0,228,242,0.1));border:1px solid rgba(139,92,246,0.25);border-radius:12px;padding:20px;margin-bottom:20px;text-align:center;">
        <p style="color:#8B5CF6;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 8px;">ENTERPRISE</p>
        <p style="color:#fff;font-size:24px;font-weight:800;margin:0 0 4px;">${this.esc(opts.companyName)}</p>
        <p style="color:rgba(255,255,255,0.5);font-size:13px;margin:0;">${opts.seats} licenças · ${opts.billingCycle}</p>
      </div>

      <p style="color:rgba(255,255,255,0.7);font-size:14px;line-height:1.6;margin:0 0 16px;">
        Bem-vindo ao <strong style="color:#fff;">CraftCard Enterprise</strong>! Sua conta foi ativada com sucesso.
      </p>

      <div style="margin:0 0 20px;">
        <div style="display:flex;margin-bottom:8px;">
          <span style="color:rgba(255,255,255,0.4);font-size:12px;width:120px;">Empresa:</span>
          <span style="color:#fff;font-size:12px;font-weight:600;">${this.esc(opts.companyName)}</span>
        </div>
        <div style="display:flex;margin-bottom:8px;">
          <span style="color:rgba(255,255,255,0.4);font-size:12px;width:120px;">Licenças:</span>
          <span style="color:#fff;font-size:12px;font-weight:600;">${opts.seats} membros</span>
        </div>
        <div style="display:flex;margin-bottom:8px;">
          <span style="color:rgba(255,255,255,0.4);font-size:12px;width:120px;">Valor:</span>
          <span style="color:#00E4F2;font-size:12px;font-weight:600;">R$${opts.monthlyTotal}/mês</span>
        </div>
      </div>

      <p style="color:rgba(255,255,255,0.7);font-size:14px;line-height:1.6;margin:0 0 8px;">
        Clique no botão abaixo para definir sua senha e começar a configurar os cartões da sua equipe:
      </p>
    `;

    return this.enqueue(
      email,
      `🏢 Bem-vindo ao CraftCard Enterprise — ${opts.companyName}`,
      this.buildEmail({
        preheader: `Sua conta Enterprise com ${opts.seats} licenças está pronta!`,
        title: 'Sua conta Enterprise está pronta!',
        icon: '🏢',
        body,
        ctaText: 'Definir Senha e Acessar',
        ctaUrl: opts.setupPasswordUrl,
      }),
    );
  }

  /**
   * Email de proposta/orçamento Enterprise — enviado pelo admin com link de pagamento MP
   */
  async sendEnterpriseProposalEmail(
    email: string,
    opts: {
      companyName: string;
      seats: number;
      pricePerSeat: number;
      monthlyTotal: number;
      yearlyTotal: number;
      billingCycle: string;
      discount: number;
      checkoutUrl: string;
    },
  ): Promise<void> {
    const fmtBRL = (v: number) => v.toFixed(2).replace('.', ',');

    const body = `
      <div style="background:linear-gradient(135deg, rgba(139,92,246,0.15), rgba(0,228,242,0.1));border:1px solid rgba(139,92,246,0.25);border-radius:12px;padding:20px;margin-bottom:20px;text-align:center;">
        <p style="color:#8B5CF6;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 8px;">PROPOSTA ENTERPRISE</p>
        <p style="color:#fff;font-size:24px;font-weight:800;margin:0 0 4px;">${this.esc(opts.companyName)}</p>
        <p style="color:rgba(255,255,255,0.5);font-size:13px;margin:0;">${opts.seats} licenças · ${opts.billingCycle}</p>
      </div>

      <p style="color:rgba(255,255,255,0.7);font-size:14px;line-height:1.6;margin:0 0 16px;">
        Olá! Preparamos uma proposta personalizada do <strong style="color:#fff;">CraftCard Enterprise</strong> para a <strong style="color:#8B5CF6;">${this.esc(opts.companyName)}</strong>.
      </p>

      <div style="background:#0D0D1A;border-radius:12px;padding:16px;margin:0 0 20px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:8px 0;color:rgba(255,255,255,0.4);font-size:13px;">Licenças</td>
            <td style="padding:8px 0;color:#fff;font-size:13px;font-weight:600;text-align:right;">${opts.seats} membros</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:rgba(255,255,255,0.4);font-size:13px;">Preço por licença/mês</td>
            <td style="padding:8px 0;color:#fff;font-size:13px;font-weight:600;text-align:right;">R$ ${fmtBRL(opts.pricePerSeat)}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:rgba(255,255,255,0.4);font-size:13px;">Ciclo</td>
            <td style="padding:8px 0;color:#fff;font-size:13px;font-weight:600;text-align:right;">${opts.billingCycle}</td>
          </tr>
          <tr style="border-top:1px solid rgba(255,255,255,0.08);">
            <td style="padding:12px 0 4px;color:rgba(255,255,255,0.6);font-size:14px;font-weight:600;">Total mensal</td>
            <td style="padding:12px 0 4px;color:#00E4F2;font-size:16px;font-weight:800;text-align:right;">R$ ${fmtBRL(opts.monthlyTotal)}/mês</td>
          </tr>
          ${opts.billingCycle === 'Anual' ? `
          <tr>
            <td style="padding:4px 0;color:rgba(255,255,255,0.6);font-size:14px;font-weight:600;">Total anual</td>
            <td style="padding:4px 0;color:#8B5CF6;font-size:16px;font-weight:800;text-align:right;">R$ ${fmtBRL(opts.yearlyTotal)}</td>
          </tr>` : ''}
        </table>
        ${opts.discount > 0 ? `<p style="color:#10B981;font-size:12px;font-weight:600;margin:12px 0 0;text-align:center;">${opts.discount}% de desconto por volume${opts.billingCycle === 'Anual' ? ' + 20% anual' : ''}</p>` : ''}
      </div>

      <p style="color:rgba(255,255,255,0.5);font-size:13px;line-height:1.5;margin:0 0 8px;">
        Inclui: cartões digitais ilimitados, analytics avançado, branding corporativo, suporte prioritário e muito mais.
      </p>

      <p style="color:rgba(255,255,255,0.7);font-size:14px;line-height:1.6;margin:0 0 8px;">
        Clique no botão abaixo para realizar o pagamento seguro. Seu plano será ativado automaticamente após a confirmação.
      </p>
    `;

    return this.enqueue(
      email,
      `Proposta CraftCard Enterprise — ${opts.companyName}`,
      this.buildEmail({
        preheader: `Proposta Enterprise: ${opts.seats} licenças por R$ ${fmtBRL(opts.monthlyTotal)}/mês`,
        title: 'Proposta Enterprise',
        icon: '📋',
        body,
        ctaText: 'Pagar Agora',
        ctaUrl: opts.checkoutUrl,
      }),
    );
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
                CraftCard — Seu cartão digital profissional<br />
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
    return this.buildEmail({
      preheader: `${inviterName} convidou você para a organização ${orgName} no CraftCard`,
      title: 'Você foi convidado!',
      icon: '🏢',
      body: `
        <p style="color:#e0e0e0;font-size:15px;line-height:1.7;margin:0 0 20px;text-align:center;">
          <strong style="color:#fff;">${this.esc(inviterName)}</strong> convidou você para fazer parte da organização
        </p>

        <!-- Org Name Card -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
          <tr>
            <td style="background:#0D0D1A;border:1px solid rgba(139,92,246,0.3);border-radius:14px;padding:20px;text-align:center;">
              <p style="color:#8B5CF6;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 8px;">Organização</p>
              <p style="color:#ffffff;font-size:22px;font-weight:800;margin:0;letter-spacing:-0.3px;">${this.esc(orgName)}</p>
            </td>
          </tr>
        </table>

        <!-- Benefits -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 8px;">
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
              <table cellpadding="0" cellspacing="0"><tr>
                <td style="width:32px;vertical-align:top;padding-top:2px;"><span style="font-size:16px;">✨</span></td>
                <td style="color:#ccc;font-size:14px;line-height:1.5;">Branding corporativo aplicado automaticamente</td>
              </tr></table>
            </td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
              <table cellpadding="0" cellspacing="0"><tr>
                <td style="width:32px;vertical-align:top;padding-top:2px;"><span style="font-size:16px;">📊</span></td>
                <td style="color:#ccc;font-size:14px;line-height:1.5;">Analytics e metricas de visitas</td>
              </tr></table>
            </td>
          </tr>
          <tr>
            <td style="padding:10px 0;">
              <table cellpadding="0" cellspacing="0"><tr>
                <td style="width:32px;vertical-align:top;padding-top:2px;"><span style="font-size:16px;">🚀</span></td>
                <td style="color:#ccc;font-size:14px;line-height:1.5;">Agendamento, galeria, serviços e mais</td>
              </tr></table>
            </td>
          </tr>
        </table>

        <p style="color:#666;font-size:12px;margin:0;text-align:center;">Este convite expira em 7 dias</p>
      `,
      ctaText: 'Aceitar Convite',
      ctaUrl: joinUrl,
    });
  }

  private esc(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
}
