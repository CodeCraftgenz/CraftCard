import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

/** All achievement types and their thresholds */
const ACHIEVEMENT_DEFS: Array<{
  type: string;
  label: string;
  description: string;
  icon: string;
  check: (ctx: AchievementContext) => boolean;
}> = [
  { type: 'first_view', label: 'Primeira Visita', description: 'Seu cartão recebeu a primeira visualizacao', icon: '👀', check: (c) => c.viewCount >= 1 },
  { type: '10_views', label: '10 Visitas', description: 'Seu cartão já tem 10 visualizações', icon: '🔟', check: (c) => c.viewCount >= 10 },
  { type: '100_views', label: '100 Visitas', description: 'Seu cartão atingiu 100 visualizações!', icon: '💯', check: (c) => c.viewCount >= 100 },
  { type: '500_views', label: '500 Visitas', description: 'Impressionante! 500 visualizações!', icon: '🔥', check: (c) => c.viewCount >= 500 },
  { type: '1000_views', label: '1000 Visitas', description: 'Mil visualizações! Você e uma referencia!', icon: '🏆', check: (c) => c.viewCount >= 1000 },
  { type: 'first_lead', label: 'Primeira Mensagem', description: 'Você recebeu sua primeira mensagem', icon: '💬', check: (c) => c.messageCount >= 1 },
  { type: 'first_booking', label: 'Primeiro Agendamento', description: 'Alguem agendou com voce', icon: '📅', check: (c) => c.bookingCount >= 1 },
  { type: 'first_testimonial', label: 'Primeiro Depoimento', description: 'Você recebeu um depoimento', icon: '⭐', check: (c) => c.testimonialCount >= 1 },
  { type: 'profile_complete', label: 'Perfil Completo', description: 'Foto, bio, links e tema configurados', icon: '✅', check: (c) => c.profileComplete },
  { type: 'published', label: 'Publicado!', description: 'Seu cartão está no ar!', icon: '🚀', check: (c) => c.isPublished },
];

interface AchievementContext {
  viewCount: number;
  messageCount: number;
  bookingCount: number;
  testimonialCount: number;
  profileComplete: boolean;
  isPublished: boolean;
}

@Injectable()
export class AchievementsService {
  private readonly logger = new Logger(AchievementsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Check and award new achievements (fire-and-forget) */
  async checkAndAward(userId: string): Promise<string[]> {
    try {
      const profile = await this.prisma.profile.findFirst({
        where: { userId, isPrimary: true },
        select: {
          viewCount: true,
          isPublished: true,
          displayName: true,
          bio: true,
          photoUrl: true,
          photoData: true,
          _count: {
            select: {
              socialLinks: true,
              contactMessages: true,
              bookings: true,
              testimonials: true,
            },
          },
        },
      });

      if (!profile) return [];

      const ctx: AchievementContext = {
        viewCount: profile.viewCount,
        messageCount: profile._count.contactMessages,
        bookingCount: profile._count.bookings,
        testimonialCount: profile._count.testimonials,
        profileComplete: !!(profile.displayName && profile.bio && (profile.photoUrl || profile.photoData) && profile._count.socialLinks >= 1),
        isPublished: profile.isPublished,
      };

      // Get existing achievements
      const existing = await this.prisma.achievement.findMany({
        where: { userId },
        select: { type: true },
      });
      const existingTypes = new Set(existing.map((a) => a.type));

      // Check each achievement
      const newAchievements: string[] = [];
      for (const def of ACHIEVEMENT_DEFS) {
        if (!existingTypes.has(def.type) && def.check(ctx)) {
          await this.prisma.achievement.create({
            data: { userId, type: def.type },
          }).catch(() => {}); // ignore duplicate errors
          newAchievements.push(def.type);
        }
      }

      return newAchievements;
    } catch (err) {
      this.logger.warn(`Failed to check achievements for ${userId}: ${err}`);
      return [];
    }
  }

  /** Get all achievements for a user, with metadata */
  async getAchievements(userId: string) {
    const unlocked = await this.prisma.achievement.findMany({
      where: { userId },
      orderBy: { unlockedAt: 'desc' },
    });
    const unlockedTypes = new Set(unlocked.map((a) => a.type));

    return ACHIEVEMENT_DEFS.map((def) => {
      const ach = unlocked.find((a) => a.type === def.type);
      return {
        type: def.type,
        label: def.label,
        description: def.description,
        icon: def.icon,
        unlocked: unlockedTypes.has(def.type),
        unlockedAt: ach?.unlockedAt?.toISOString() ?? null,
      };
    });
  }
}
