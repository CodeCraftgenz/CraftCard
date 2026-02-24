import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { AppException } from '../common/exceptions/app.exception';
import { randomBytes } from 'crypto';

type OrgRole = 'OWNER' | 'ADMIN' | 'MEMBER';

@Injectable()
export class OrganizationsService {
  private readonly logger = new Logger(OrganizationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  // --- Organization CRUD ---

  async create(userId: string, data: { name: string; slug: string }) {
    // Check slug uniqueness
    const existing = await this.prisma.organization.findUnique({ where: { slug: data.slug } });
    if (existing) throw AppException.conflict('Slug da organizacao ja esta em uso');

    return this.prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: data.name,
          slug: data.slug,
        },
      });

      // Creator becomes OWNER
      await tx.organizationMember.create({
        data: { orgId: org.id, userId, role: 'OWNER' },
      });

      return org;
    });
  }

  async getMyOrganizations(userId: string) {
    const memberships = await this.prisma.organizationMember.findMany({
      where: { userId },
      include: {
        org: {
          select: {
            id: true, name: true, slug: true, logoUrl: true,
            primaryColor: true, brandingActive: true,
            _count: { select: { members: true } },
          },
        },
      },
    });

    return memberships.map((m) => ({
      ...m.org,
      memberCount: m.org._count.members,
      role: m.role,
    }));
  }

  async getById(orgId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      include: { _count: { select: { members: true, profiles: true } } },
    });
    if (!org) throw AppException.notFound('Organizacao');

    return { ...org, memberCount: org._count.members, profileCount: org._count.profiles };
  }

  async update(orgId: string, data: {
    name?: string;
    logoUrl?: string | null;
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
    brandingActive?: boolean;
  }) {
    return this.prisma.organization.update({
      where: { id: orgId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl }),
        ...(data.primaryColor !== undefined && { primaryColor: data.primaryColor }),
        ...(data.secondaryColor !== undefined && { secondaryColor: data.secondaryColor }),
        ...(data.fontFamily !== undefined && { fontFamily: data.fontFamily }),
        ...(data.brandingActive !== undefined && { brandingActive: data.brandingActive }),
      },
    });
  }

  async delete(orgId: string) {
    // Unlink profiles from org before deletion
    await this.prisma.profile.updateMany({
      where: { orgId },
      data: { orgId: null },
    });

    await this.prisma.organization.delete({ where: { id: orgId } });
    return { deleted: true };
  }

  // --- Members ---

  async getMembers(orgId: string) {
    return this.prisma.organizationMember.findMany({
      where: { orgId },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
      orderBy: { joinedAt: 'asc' },
    });
  }

  async updateMemberRole(orgId: string, memberId: string, callerUserId: string, newRole: string) {
    const member = await this.prisma.organizationMember.findUnique({ where: { id: memberId } });
    if (!member || member.orgId !== orgId) throw AppException.notFound('Membro');

    // Cannot change owner role (must transfer ownership explicitly)
    if (member.role === 'OWNER') throw AppException.badRequest('Nao e possivel alterar o role do proprietario');

    // Only owner can promote to ADMIN or OWNER
    if (newRole === 'ADMIN' || newRole === 'OWNER') {
      await this.requireRole(orgId, callerUserId, 'OWNER');
    }

    return this.prisma.organizationMember.update({
      where: { id: memberId },
      data: { role: newRole },
    });
  }

  async removeMember(orgId: string, memberId: string) {
    const member = await this.prisma.organizationMember.findUnique({ where: { id: memberId } });
    if (!member || member.orgId !== orgId) throw AppException.notFound('Membro');
    if (member.role === 'OWNER') throw AppException.badRequest('Nao e possivel remover o proprietario');

    // Unlink profiles from org
    await this.prisma.profile.updateMany({
      where: { userId: member.userId, orgId },
      data: { orgId: null },
    });

    await this.prisma.organizationMember.delete({ where: { id: memberId } });
    return { removed: true };
  }

  // --- Invites ---

  async createInvite(orgId: string, userId: string, data: { email: string; role?: string }) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      include: { _count: { select: { members: true } } },
    });
    if (!org) throw AppException.notFound('Organizacao');
    if (org._count.members >= org.maxMembers) {
      throw AppException.badRequest(`Limite de ${org.maxMembers} membros atingido`);
    }

    // Check if already a member
    const existingUser = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      const existingMember = await this.prisma.organizationMember.findUnique({
        where: { orgId_userId: { orgId, userId: existingUser.id } },
      });
      if (existingMember) throw AppException.conflict('Usuario ja e membro da organizacao');
    }

    // Check for pending invite
    const existingInvite = await this.prisma.organizationInvite.findFirst({
      where: { orgId, email: data.email, usedAt: null, expiresAt: { gt: new Date() } },
    });
    if (existingInvite) throw AppException.conflict('Convite pendente ja existe para este email');

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invite = await this.prisma.organizationInvite.create({
      data: {
        orgId,
        email: data.email,
        role: data.role || 'MEMBER',
        token,
        expiresAt,
      },
    });

    // Send invite email (fire-and-forget)
    const inviter = await this.prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
    this.mailService.sendOrgInvite(data.email, org.name, inviter?.name || 'Admin', token).catch(() => {});

    return { id: invite.id, token: invite.token, expiresAt: invite.expiresAt };
  }

  async getPendingInvites(orgId: string) {
    return this.prisma.organizationInvite.findMany({
      where: { orgId, usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async acceptInvite(token: string, userId: string) {
    const invite = await this.prisma.organizationInvite.findUnique({ where: { token } });
    if (!invite) throw AppException.notFound('Convite');
    if (invite.usedAt) throw AppException.badRequest('Convite ja foi utilizado');
    if (invite.expiresAt < new Date()) throw AppException.badRequest('Convite expirado');

    // Check user email matches invite email
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.email.toLowerCase() !== invite.email.toLowerCase()) {
      throw AppException.forbidden('Este convite foi enviado para outro email');
    }

    // Check not already a member
    const existingMember = await this.prisma.organizationMember.findUnique({
      where: { orgId_userId: { orgId: invite.orgId, userId } },
    });
    if (existingMember) throw AppException.conflict('Voce ja e membro desta organizacao');

    return this.prisma.$transaction(async (tx) => {
      await tx.organizationInvite.update({
        where: { id: invite.id },
        data: { usedAt: new Date() },
      });

      await tx.organizationMember.create({
        data: { orgId: invite.orgId, userId, role: invite.role },
      });

      const org = await tx.organization.findUnique({
        where: { id: invite.orgId },
        select: { id: true, name: true, slug: true },
      });

      return { joined: true, organization: org };
    });
  }

  async revokeInvite(orgId: string, inviteId: string) {
    const invite = await this.prisma.organizationInvite.findUnique({ where: { id: inviteId } });
    if (!invite || invite.orgId !== orgId) throw AppException.notFound('Convite');

    await this.prisma.organizationInvite.delete({ where: { id: inviteId } });
    return { revoked: true };
  }

  // --- Consolidated Analytics ---

  async getConsolidatedAnalytics(orgId: string) {
    const profiles = await this.prisma.profile.findMany({
      where: { orgId },
      select: { id: true, displayName: true, slug: true, viewCount: true },
    });

    const profileIds = profiles.map((p) => p.id);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const dailyViews = await this.prisma.profileView.findMany({
      where: { profileId: { in: profileIds }, date: { gte: thirtyDaysAgo } },
      orderBy: { date: 'asc' },
    });

    // Aggregate daily views
    const viewsByDate = new Map<string, number>();
    for (const v of dailyViews) {
      const key = v.date.toISOString().split('T')[0];
      viewsByDate.set(key, (viewsByDate.get(key) || 0) + v.count);
    }

    const totalViews = profiles.reduce((sum, p) => sum + p.viewCount, 0);

    const totalMessages = await this.prisma.contactMessage.count({
      where: { profile: { orgId } },
    });

    const totalBookings = await this.prisma.booking.count({
      where: { profile: { orgId } },
    });

    return {
      totalViews,
      totalMessages,
      totalBookings,
      memberProfiles: profiles.map((p) => ({
        id: p.id,
        displayName: p.displayName,
        slug: p.slug,
        viewCount: p.viewCount,
      })),
      dailyViews: Array.from(viewsByDate.entries()).map(([date, count]) => ({ date, count })),
    };
  }

  // --- Consolidated Leads ---

  async getConsolidatedLeads(orgId: string) {
    return this.prisma.contactMessage.findMany({
      where: { profile: { orgId } },
      include: {
        profile: { select: { displayName: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async exportLeadsCsv(orgId: string): Promise<string> {
    const messages = await this.prisma.contactMessage.findMany({
      where: { profile: { orgId } },
      include: {
        profile: { select: { displayName: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const header = 'Nome,Email,Mensagem,Cartao,Lido,Data\n';
    const rows = messages.map((m) => {
      const name = csvEscape(m.senderName);
      const email = csvEscape(m.senderEmail || '');
      const msg = csvEscape(m.message);
      const card = csvEscape(m.profile.displayName);
      const read = m.isRead ? 'Sim' : 'Nao';
      const date = m.createdAt.toISOString();
      return `${name},${email},${msg},${card},${read},${date}`;
    }).join('\n');

    return header + rows;
  }

  // --- Link profiles to org ---

  async linkProfile(orgId: string, profileId: string) {
    const profile = await this.prisma.profile.findFirst({
      where: { id: profileId },
      include: { user: { select: { id: true } } },
    });
    if (!profile) throw AppException.notFound('Perfil');

    // Verify profile owner is a member
    const isMember = await this.prisma.organizationMember.findUnique({
      where: { orgId_userId: { orgId, userId: profile.user.id } },
    });
    if (!isMember) throw AppException.badRequest('O dono do perfil nao e membro da organizacao');

    await this.prisma.profile.update({
      where: { id: profileId },
      data: { orgId },
    });

    return { linked: true };
  }

  async unlinkProfile(orgId: string, profileId: string) {
    await this.prisma.profile.update({
      where: { id: profileId },
      data: { orgId: null },
    });

    return { unlinked: true };
  }

  // --- Helpers ---

  private async requireRole(orgId: string, userId: string, minRole: OrgRole) {
    const member = await this.prisma.organizationMember.findUnique({
      where: { orgId_userId: { orgId, userId } },
    });

    if (!member) throw AppException.forbidden('Voce nao e membro desta organizacao');

    const hierarchy: Record<string, number> = { OWNER: 3, ADMIN: 2, MEMBER: 1 };
    if ((hierarchy[member.role] || 0) < (hierarchy[minRole] || 0)) {
      throw AppException.forbidden('Permissao insuficiente');
    }
  }
}

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
