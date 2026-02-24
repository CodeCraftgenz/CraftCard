import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service';
import type { EnvConfig } from '../common/config/env.config';
import * as webPush from 'web-push';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private vapidConfigured = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService<EnvConfig>,
  ) {
    this.initVapid();
  }

  private initVapid() {
    const publicKey = this.configService.get('VAPID_PUBLIC_KEY', { infer: true });
    const privateKey = this.configService.get('VAPID_PRIVATE_KEY', { infer: true });
    const subject = this.configService.get('VAPID_SUBJECT', { infer: true }) || 'mailto:contato@craftcardgenz.com';

    if (publicKey && privateKey) {
      webPush.setVapidDetails(subject, publicKey, privateKey);
      this.vapidConfigured = true;
      this.logger.log('VAPID keys configured for push notifications');
    } else {
      this.logger.warn('VAPID keys not configured — push notifications disabled. Generate with: npx web-push generate-vapid-keys');
    }
  }

  /** Get the public VAPID key for the frontend */
  getPublicKey(): string | null {
    return this.configService.get('VAPID_PUBLIC_KEY', { infer: true }) || null;
  }

  /** Subscribe a user to push notifications */
  async subscribe(userId: string, subscription: { endpoint: string; keys: { p256dh: string; auth: string } }) {
    // Upsert: if endpoint already exists, update keys
    await this.prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        userId,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      create: {
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    });
    return { subscribed: true };
  }

  /** Unsubscribe from push notifications */
  async unsubscribe(userId: string, endpoint: string) {
    await this.prisma.pushSubscription.deleteMany({
      where: { userId, endpoint },
    });
    return { unsubscribed: true };
  }

  /** Send push notification to a user (fire-and-forget) */
  async sendToUser(userId: string, payload: { title: string; body: string; url?: string; icon?: string }) {
    if (!this.vapidConfigured) return;

    const subscriptions = await this.prisma.pushSubscription.findMany({
      where: { userId },
    });

    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url || '/',
      icon: payload.icon || '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
    });

    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        webPush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          notificationPayload,
        ),
      ),
    );

    // Clean up expired subscriptions (410 Gone)
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === 'rejected') {
        const err = result.reason as { statusCode?: number };
        if (err.statusCode === 410 || err.statusCode === 404) {
          await this.prisma.pushSubscription.delete({
            where: { id: subscriptions[i].id },
          }).catch(() => {});
        }
      }
    }
  }

  /** Generate VAPID keys helper (for setup) */
  static generateVapidKeys() {
    return webPush.generateVAPIDKeys();
  }
}
