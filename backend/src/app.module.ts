import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './common/prisma/prisma.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProfilesModule } from './profiles/profiles.module';
import { MeModule } from './me/me.module';
import { StorageModule } from './storage/storage.module';
import { PaymentsModule } from './payments/payments.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ContactsModule } from './contacts/contacts.module';
import { TestimonialsModule } from './testimonials/testimonials.module';
import { GalleryModule } from './gallery/gallery.module';
import { BookingsModule } from './bookings/bookings.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { ConnectionsModule } from './connections/connections.module';
import { NotificationsModule } from './notifications/notifications.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { MailModule } from './mail/mail.module';
import { AdminModule } from './admin/admin.module';
import { HackathonModule } from './hackathon/hackathon.module';
import { TagsModule } from './tags/tags.module';
import { EventsModule } from './events/events.module';
import { PublicApiModule } from './public-api/public-api.module';
import { StatsModule } from './stats/stats.module';
import { AppController } from './app.controller';
import configuration from './common/config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),

    // BullMQ — Fila de emails com Redis (só registra se REDIS_HOST estiver configurado)
    // Sem Redis, MailService cai em fallback SMTP direto
    ...(process.env.REDIS_HOST
      ? [
          BullModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
              connection: {
                host: config.get('REDIS_HOST'),
                port: Number(config.get('REDIS_PORT')) || 6379,
                password: config.get('REDIS_PASSWORD') || undefined,
                maxRetriesPerRequest: null, // obrigatório para BullMQ
              },
            }),
          }),
        ]
      : []),

    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 3 },          // 3 req/s — burst protection
      { name: 'medium', ttl: 60000, limit: 100 },       // 100 req/min — general API
      { name: 'strict', ttl: 300000, limit: 10 },       // 10 req/5min — auth anti brute-force
    ]),
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const redisHost = config.get('REDIS_HOST');
        if (redisHost) {
          try {
            // Dynamic import paranão inicializar conexão Redis ao carregar o módulo
            const { redisStore } = await import('cache-manager-redis-yet');
            const store = await redisStore({
              socket: {
                host: redisHost,
                port: Number(config.get('REDIS_PORT')) || 6379,
              },
              password: config.get('REDIS_PASSWORD') || undefined,
              ttl: 300000, // 5 min default TTL (ms)
            });
            return { store, ttl: 300000 };
          } catch {
            // Redis unavailable — fall back to in-memory
            return { ttl: 300000 };
          }
        }
        // No REDIS_HOST configured — use in-memory cache
        return { ttl: 300000 };
      },
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    ProfilesModule,
    MeModule,
    StorageModule,
    PaymentsModule,
    AnalyticsModule,
    ContactsModule,
    TestimonialsModule,
    GalleryModule,
    BookingsModule,
    OrganizationsModule,
    ConnectionsModule,
    NotificationsModule,
    WebhooksModule,
    MailModule,
    AdminModule,
    HackathonModule,
    TagsModule,
    EventsModule,
    PublicApiModule,
    StatsModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
