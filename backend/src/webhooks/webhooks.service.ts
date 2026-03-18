/**
 * Serviço de webhooks do CraftCard.
 *
 * Permite que usuários PRO+ configurem webhooks para receber notificações
 * em tempo real sobre eventos do seu cartão (novas mensagens, bookings, etc.).
 *
 * Segurança:
 * - Proteção contra SSRF: URLs devem ser HTTPS e não podem apontar para
 *   endereços internos (localhost, IPs privados, metadata services)
 * - Assinatura HMAC-SHA256 em cada request para o receptor validar autenticidade
 * - Limite de 5 webhooks por usuário
 * - Retry com backoff exponencial (3 tentativas)
 * - Logs de entrega salvos no banco para debugging
 */
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AppException } from '../common/exceptions/app.exception';
import { randomBytes, createHmac } from 'crypto';
import * as https from 'https';

/**
 * Proteção contra SSRF (Server-Side Request Forgery).
 * Valida que a URL de webhook é segura antes de registrar ou disparar.
 * Bloqueia: localhost, loopback, IPs privados (RFC 1918), link-local,
 * e endpoints de metadata de cloud (AWS 169.254.169.254, GCP metadata).
 */
function assertSafeWebhookUrl(rawUrl: string): void {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw AppException.badRequest('URL de webhook inválida');
  }

  if (parsed.protocol !== 'https:') {
    throw AppException.badRequest('Webhook URL deve usar HTTPS');
  }

  const host = parsed.hostname.toLowerCase();

  // Block loopback / well-known internal hostnames
  const blockedHosts = ['localhost', '127.0.0.1', '0.0.0.0', '::1', '[::1]'];
  if (blockedHosts.includes(host)) {
    throw AppException.badRequest('Webhook URL aponta para endereço interno');
  }

  // Block private IPv4 ranges: 10.x, 172.16–31.x, 192.168.x, 169.254.x (link-local)
  const privateIPv4 =
    /^(10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|192\.168\.\d+\.\d+|169\.254\.\d+\.\d+)$/;
  if (privateIPv4.test(host)) {
    throw AppException.badRequest('Webhook URL aponta para endereço interno');
  }

  // Block metadata services (AWS, GCP, Azure)
  if (host === '169.254.169.254' || host === 'metadata.google.internal') {
    throw AppException.badRequest('Webhook URL aponta para endereço interno');
  }
}

/** Tipos de eventos que podem ser enviados via webhook */
export type WebhookEvent = 'new_message' | 'new_booking' | 'new_testimonial' | 'new_view' | 'lead_status_changed';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria um novo webhook para o usuário.
   * Gera um secret aleatório (32 bytes hex) para assinatura HMAC.
   * Limite: 5 webhooks por usuário.
   */
  async create(userId: string, data: { url: string; events: WebhookEvent[] }) {
    // Valida URL contra SSRF antes de salvar
    assertSafeWebhookUrl(data.url);

    const count = await this.prisma.webhook.count({ where: { userId } });
    if (count >= 5) {
      throw AppException.badRequest('Máximo de 5 webhooks');
    }

    const secret = randomBytes(32).toString('hex');

    return this.prisma.webhook.create({
      data: {
        userId,
        url: data.url,
        events: JSON.stringify(data.events),
        secret,
      },
    });
  }

  /** Lista webhooks do usuário — secret é mascarado (apenas 8 primeiros chars) por segurança */
  async list(userId: string) {
    const webhooks = await this.prisma.webhook.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return webhooks.map((w) => ({
      ...w,
      events: JSON.parse(w.events) as WebhookEvent[],
      // Não expõe o secret completo — apenas prefixo para identificação
      secret: w.secret.slice(0, 8) + '...',
    }));
  }

  async update(userId: string, id: string, data: { url?: string; events?: WebhookEvent[]; isActive?: boolean }) {
    if (data.url !== undefined) assertSafeWebhookUrl(data.url);

    const webhook = await this.prisma.webhook.findFirst({ where: { id, userId } });
    if (!webhook) throw AppException.notFound('Webhook');

    return this.prisma.webhook.update({
      where: { id },
      data: {
        ...(data.url !== undefined && { url: data.url }),
        ...(data.events !== undefined && { events: JSON.stringify(data.events) }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
  }

  async remove(userId: string, id: string) {
    const webhook = await this.prisma.webhook.findFirst({ where: { id, userId } });
    if (!webhook) throw AppException.notFound('Webhook');

    await this.prisma.webhook.delete({ where: { id } });
    return { deleted: true };
  }

  /**
   * Dispara evento para todos os webhooks ativos do usuário que escutam o evento.
   * Execução fire-and-forget — erros de entrega não afetam o fluxo principal.
   * Cada webhook é disparado independentemente com logging.
   */
  async dispatch(userId: string, event: WebhookEvent, payload: Record<string, unknown>) {
    const webhooks = await this.prisma.webhook.findMany({
      where: { userId, isActive: true },
    });

    for (const webhook of webhooks) {
      const events = JSON.parse(webhook.events) as WebhookEvent[];
      if (!events.includes(event)) continue;

      this.sendWebhookWithLog(webhook.id, webhook.url, webhook.secret, event, payload).catch((err) => {
        this.logger.warn(`Webhook delivery failed for ${webhook.id}: ${err}`);
      });
    }
  }

  /** Lista logs de entrega de um webhook específico (para debugging pelo usuário) */
  async getLogs(userId: string, webhookId: string, take = 50) {
    const webhook = await this.prisma.webhook.findFirst({ where: { id: webhookId, userId } });
    if (!webhook) throw AppException.notFound('Webhook');

    return this.prisma.webhookLog.findMany({
      where: { webhookId },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }

  /** Envia evento de teste para um webhook (para o usuário validar a integração) */
  async test(userId: string, id: string) {
    const webhook = await this.prisma.webhook.findFirst({ where: { id, userId } });
    if (!webhook) throw AppException.notFound('Webhook');

    await this.sendWebhookWithLog(webhook.id, webhook.url, webhook.secret, 'new_message', {
      type: 'test',
      message: 'This is a test event from CraftCard',
      timestamp: new Date().toISOString(),
    });

    return { sent: true };
  }

  /** Envia webhook e salva o resultado no WebhookLog (status code, sucesso, erro) */
  private async sendWebhookWithLog(
    webhookId: string,
    url: string,
    secret: string,
    event: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const { statusCode, success, error } = await this.sendWebhook(url, secret, event, payload);

    await this.prisma.webhookLog.create({
      data: { webhookId, event, statusCode, success, error },
    }).catch((err) => {
      this.logger.warn(`Failed to save webhook log: ${err}`);
    });
  }

  /**
   * Envia POST HTTPS para a URL do webhook com retry e backoff.
   *
   * Headers enviados:
   * - X-CraftCard-Signature: HMAC-SHA256 do body (para o receptor validar autenticidade)
   * - X-CraftCard-Event: tipo do evento (para roteamento no receptor)
   *
   * Retry: 3 tentativas com backoff linear (1s, 2s, 3s).
   * Timeout: 10 segundos por tentativa.
   */
  private async sendWebhook(
    url: string,
    secret: string,
    event: string,
    payload: Record<string, unknown>,
    retries = 3,
  ): Promise<{ statusCode: number | null; success: boolean; error: string | null }> {
    const body = JSON.stringify({ event, data: payload, timestamp: new Date().toISOString() });
    // Assinatura HMAC-SHA256 — o receptor deve recriar este hash para validar
    const signature = createHmac('sha256', secret).update(body).digest('hex');

    const parsed = new URL(url);

    let lastError: string | null = null;
    let lastStatusCode: number | null = null;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const result = await new Promise<{ statusCode: number }>((resolve, reject) => {
          const req = https.request(
            {
              hostname: parsed.hostname,
              port: parsed.port,
              path: parsed.pathname + parsed.search,
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-CraftCard-Signature': signature,
                'X-CraftCard-Event': event,
              },
              timeout: 10000,
            },
            (res) => {
              res.resume();
              if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                resolve({ statusCode: res.statusCode });
              } else {
                reject(new Error(`HTTP ${res.statusCode}`));
              }
            },
          );
          req.on('error', reject);
          req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
          req.write(body);
          req.end();
        });
        return { statusCode: result.statusCode, success: true, error: null };
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        lastError = errMsg;
        const statusMatch = errMsg.match(/HTTP (\d+)/);
        lastStatusCode = statusMatch ? parseInt(statusMatch[1], 10) : null;

        if (attempt < retries - 1) {
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1))); // backoff
        }
      }
    }

    return { statusCode: lastStatusCode, success: false, error: lastError };
  }
}
