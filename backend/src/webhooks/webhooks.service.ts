import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AppException } from '../common/exceptions/app.exception';
import { randomBytes, createHmac } from 'crypto';
import * as https from 'https';
import * as http from 'http';

export type WebhookEvent = 'new_message' | 'new_booking' | 'new_testimonial' | 'new_view' | 'lead_status_changed';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, data: { url: string; events: WebhookEvent[] }) {
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

  async list(userId: string) {
    const webhooks = await this.prisma.webhook.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return webhooks.map((w) => ({
      ...w,
      events: JSON.parse(w.events) as WebhookEvent[],
      // Don't expose full secret, only first 8 chars
      secret: w.secret.slice(0, 8) + '...',
    }));
  }

  async update(userId: string, id: string, data: { url?: string; events?: WebhookEvent[]; isActive?: boolean }) {
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

  /** Fire-and-forget: dispatch event to all matching webhooks for a user */
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

  /** List delivery logs for a specific webhook */
  async getLogs(userId: string, webhookId: string, take = 50) {
    const webhook = await this.prisma.webhook.findFirst({ where: { id: webhookId, userId } });
    if (!webhook) throw AppException.notFound('Webhook');

    return this.prisma.webhookLog.findMany({
      where: { webhookId },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }

  /** Send a test event to a specific webhook */
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

  /** Send webhook and log the result to WebhookLog */
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

  private async sendWebhook(
    url: string,
    secret: string,
    event: string,
    payload: Record<string, unknown>,
    retries = 3,
  ): Promise<{ statusCode: number | null; success: boolean; error: string | null }> {
    const body = JSON.stringify({ event, data: payload, timestamp: new Date().toISOString() });
    const signature = createHmac('sha256', secret).update(body).digest('hex');

    const parsed = new URL(url);
    const client = parsed.protocol === 'https:' ? https : http;

    let lastError: string | null = null;
    let lastStatusCode: number | null = null;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const result = await new Promise<{ statusCode: number }>((resolve, reject) => {
          const req = client.request(
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
