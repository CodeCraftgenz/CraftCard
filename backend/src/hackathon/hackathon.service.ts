import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AppException } from '../common/exceptions/app.exception';
import { randomBytes } from 'crypto';

const MAX_TEAM_SIZE = 5;

@Injectable()
export class HackathonService {
  private readonly logger = new Logger(HackathonService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── Team CRUD ─────────────────────────────────────────

  async createTeam(userId: string, name: string) {
    // Check user is a hackathon participant
    await this.requireHackathonParticipant(userId);

    // Check user doesn't already own/belong to a team
    const existing = await this.getMyTeam(userId);
    if (existing) throw AppException.badRequest('Voce ja faz parte de uma equipe');

    const slug = `hackathon-${Date.now().toString(36)}`;

    return this.prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name,
          slug,
          maxMembers: MAX_TEAM_SIZE,
          // Mark as hackathon team via primaryColor convention
          primaryColor: '#004B87',
        },
      });

      await tx.organizationMember.create({
        data: { orgId: org.id, userId, role: 'OWNER' },
      });

      return { id: org.id, name: org.name, slug: org.slug };
    });
  }

  async getMyTeam(userId: string) {
    const membership = await this.prisma.organizationMember.findFirst({
      where: {
        userId,
        org: { slug: { startsWith: 'hackathon-' } },
      },
      include: {
        org: {
          select: {
            id: true, name: true, slug: true, logoUrl: true,
            maxMembers: true,
            members: {
              include: {
                user: {
                  select: {
                    id: true, name: true, email: true, avatarUrl: true,
                    profiles: {
                      where: { isPrimary: true },
                      select: {
                        slug: true, displayName: true, photoUrl: true,
                        socialLinks: { where: { linkType: 'hackathon_meta' }, select: { metadata: true } },
                      },
                      take: 1,
                    },
                  },
                },
              },
              orderBy: { joinedAt: 'asc' as const },
            },
          },
        },
      },
    });

    if (!membership) return null;

    const org = membership.org;
    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      logoUrl: org.logoUrl,
      maxMembers: org.maxMembers,
      myRole: membership.role,
      members: org.members.map((m) => {
        const profile = m.user.profiles[0];
        return {
          id: m.id,
          role: m.role,
          joinedAt: m.joinedAt,
          userId: m.user.id,
          name: m.user.name,
          displayName: profile?.displayName || m.user.name,
          photoUrl: profile?.photoUrl || m.user.avatarUrl,
          slug: profile?.slug || null,
          hackathonMeta: profile?.socialLinks[0]?.metadata || null,
        };
      }),
    };
  }

  async updateTeam(userId: string, data: { name?: string; logoUrl?: string | null }) {
    const team = await this.getMyTeam(userId);
    if (!team) throw AppException.notFound('Equipe');
    if (team.myRole !== 'OWNER') throw AppException.forbidden('Apenas o lider pode editar a equipe');

    return this.prisma.organization.update({
      where: { id: team.id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl }),
      },
      select: { id: true, name: true, logoUrl: true },
    });
  }

  // ── Invites ───────────────────────────────────────────

  async inviteByProfileSlug(userId: string, targetSlug: string) {
    const team = await this.getMyTeam(userId);
    if (!team) throw AppException.badRequest('Voce precisa criar uma equipe primeiro');

    // Check team size
    if (team.members.length >= team.maxMembers) {
      throw AppException.badRequest(`Equipe cheia (maximo ${team.maxMembers} membros)`);
    }

    // Find target user by profile slug
    const targetProfile = await this.prisma.profile.findUnique({
      where: { slug: targetSlug },
      include: { user: { select: { id: true, email: true } } },
    });
    if (!targetProfile) throw AppException.notFound('Perfil');

    // Check target is a hackathon participant
    const hasHackathonMeta = await this.prisma.socialLink.findFirst({
      where: { profileId: targetProfile.id, linkType: 'hackathon_meta' },
    });
    if (!hasHackathonMeta) throw AppException.badRequest('Esta pessoa nao e participante do hackathon');

    // Check not already a member
    const alreadyMember = await this.prisma.organizationMember.findUnique({
      where: { orgId_userId: { orgId: team.id, userId: targetProfile.user.id } },
    });
    if (alreadyMember) throw AppException.conflict('Esta pessoa ja faz parte da equipe');

    // Check target not in another team
    const targetInTeam = await this.prisma.organizationMember.findFirst({
      where: {
        userId: targetProfile.user.id,
        org: { slug: { startsWith: 'hackathon-' } },
      },
    });
    if (targetInTeam) throw AppException.conflict('Esta pessoa ja faz parte de outra equipe');

    // Check for pending invite
    const existingInvite = await this.prisma.organizationInvite.findFirst({
      where: { orgId: team.id, email: targetProfile.user.email, usedAt: null, expiresAt: { gt: new Date() } },
    });
    if (existingInvite) throw AppException.conflict('Convite pendente ja existe para esta pessoa');

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invite = await this.prisma.organizationInvite.create({
      data: {
        orgId: team.id,
        email: targetProfile.user.email,
        role: 'MEMBER',
        token,
        expiresAt,
      },
    });

    this.logger.log(`Hackathon invite: ${targetProfile.user.email} → team ${team.name}`);

    return { id: invite.id, targetSlug, teamName: team.name };
  }

  async getMyInvites(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (!user) return [];

    const invites = await this.prisma.organizationInvite.findMany({
      where: {
        email: user.email,
        usedAt: null,
        expiresAt: { gt: new Date() },
        org: { slug: { startsWith: 'hackathon-' } },
      },
      include: {
        org: {
          select: {
            id: true, name: true, logoUrl: true,
            _count: { select: { members: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return invites.map((inv) => ({
      id: inv.id,
      teamName: inv.org.name,
      teamLogoUrl: inv.org.logoUrl,
      memberCount: inv.org._count.members,
      maxMembers: MAX_TEAM_SIZE,
      createdAt: inv.createdAt,
      expiresAt: inv.expiresAt,
    }));
  }

  async acceptInvite(userId: string, inviteId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true } });
    if (!user) throw AppException.notFound('Usuario');

    const invite = await this.prisma.organizationInvite.findUnique({
      where: { id: inviteId },
      include: { org: { select: { slug: true, maxMembers: true, _count: { select: { members: true } } } } },
    });
    if (!invite) throw AppException.notFound('Convite');
    if (invite.usedAt) throw AppException.badRequest('Convite ja foi utilizado');
    if (invite.expiresAt < new Date()) throw AppException.badRequest('Convite expirado');
    if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
      throw AppException.forbidden('Este convite foi enviado para outro email');
    }
    if (!invite.org.slug.startsWith('hackathon-')) {
      throw AppException.badRequest('Este convite nao e de equipe do hackathon');
    }

    // Check team not full
    if (invite.org._count.members >= invite.org.maxMembers) {
      throw AppException.badRequest('Equipe ja esta cheia');
    }

    // Check user not already in a hackathon team
    const existingTeam = await this.prisma.organizationMember.findFirst({
      where: { userId, org: { slug: { startsWith: 'hackathon-' } } },
    });
    if (existingTeam) throw AppException.badRequest('Voce ja faz parte de uma equipe');

    return this.prisma.$transaction(async (tx) => {
      await tx.organizationInvite.update({
        where: { id: invite.id },
        data: { usedAt: new Date() },
      });

      // IMPORTANT: Only create membership — do NOT link profiles to org
      await tx.organizationMember.create({
        data: { orgId: invite.orgId, userId, role: 'MEMBER' },
      });

      return { joined: true };
    });
  }

  async declineInvite(userId: string, inviteId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (!user) throw AppException.notFound('Usuario');

    const invite = await this.prisma.organizationInvite.findUnique({ where: { id: inviteId } });
    if (!invite || user.email.toLowerCase() !== invite.email.toLowerCase()) {
      throw AppException.notFound('Convite');
    }

    await this.prisma.organizationInvite.delete({ where: { id: inviteId } });
    return { declined: true };
  }

  async leaveTeam(userId: string) {
    const membership = await this.prisma.organizationMember.findFirst({
      where: { userId, org: { slug: { startsWith: 'hackathon-' } } },
      include: { org: { select: { id: true, _count: { select: { members: true } } } } },
    });
    if (!membership) throw AppException.notFound('Equipe');

    if (membership.role === 'OWNER') {
      // If owner leaves and there are other members, transfer ownership
      if (membership.org._count.members > 1) {
        const nextMember = await this.prisma.organizationMember.findFirst({
          where: { orgId: membership.org.id, userId: { not: userId } },
          orderBy: { joinedAt: 'asc' },
        });
        if (nextMember) {
          await this.prisma.organizationMember.update({
            where: { id: nextMember.id },
            data: { role: 'OWNER' },
          });
        }
      } else {
        // Last member — delete the team
        await this.prisma.organizationMember.delete({ where: { id: membership.id } });
        await this.prisma.organizationInvite.deleteMany({ where: { orgId: membership.org.id } });
        await this.prisma.organization.delete({ where: { id: membership.org.id } });
        return { left: true, teamDeleted: true };
      }
    }

    await this.prisma.organizationMember.delete({ where: { id: membership.id } });
    return { left: true };
  }

  // ── Participants ──────────────────────────────────────

  async getParticipants() {
    // Find all profiles that have a hackathon_meta social link
    const profiles = await this.prisma.profile.findMany({
      where: {
        isPublished: true,
        socialLinks: { some: { linkType: 'hackathon_meta' } },
      },
      select: {
        id: true,
        slug: true,
        displayName: true,
        photoUrl: true,
        bio: true,
        userId: true,
        socialLinks: {
          where: { linkType: 'hackathon_meta' },
          select: { metadata: true },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Check which users are already in a hackathon team
    const userIds = profiles.map((p) => p.userId);
    const memberships = await this.prisma.organizationMember.findMany({
      where: {
        userId: { in: userIds },
        org: { slug: { startsWith: 'hackathon-' } },
      },
      select: { userId: true, org: { select: { name: true } } },
    });
    const teamMap = new Map(memberships.map((m) => [m.userId, m.org.name]));

    return profiles.map((p) => ({
      slug: p.slug,
      displayName: p.displayName,
      photoUrl: p.photoUrl,
      bio: p.bio,
      hackathonMeta: p.socialLinks[0]?.metadata || null,
      teamName: teamMap.get(p.userId) || null,
    }));
  }

  // ── Helpers ───────────────────────────────────────────

  private async requireHackathonParticipant(userId: string) {
    const hasHackathonMeta = await this.prisma.socialLink.findFirst({
      where: {
        linkType: 'hackathon_meta',
        profile: { userId, isPrimary: true },
      },
    });
    if (!hasHackathonMeta) {
      throw AppException.forbidden('Voce nao e participante do hackathon');
    }
  }
}
