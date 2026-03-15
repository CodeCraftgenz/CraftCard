import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AppException } from '../common/exceptions/app.exception';

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, name: string, color?: string) {
    const existing = await this.prisma.tag.findUnique({
      where: { userId_name: { userId, name: name.trim() } },
    });
    if (existing) throw AppException.conflict('Tag ja existe');

    return this.prisma.tag.create({
      data: { userId, name: name.trim(), color: color || null },
    });
  }

  async getAll(userId: string) {
    const tags = await this.prisma.tag.findMany({
      where: { userId },
      include: { _count: { select: { connections: true } } },
      orderBy: { name: 'asc' },
    });

    return tags.map((t) => ({
      id: t.id,
      name: t.name,
      color: t.color,
      connectionCount: t._count.connections,
      createdAt: t.createdAt,
    }));
  }

  async update(userId: string, tagId: string, data: { name?: string; color?: string }) {
    const tag = await this.prisma.tag.findFirst({ where: { id: tagId, userId } });
    if (!tag) throw AppException.notFound('Tag');

    return this.prisma.tag.update({
      where: { id: tagId },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.color !== undefined && { color: data.color }),
      },
    });
  }

  async delete(userId: string, tagId: string) {
    const tag = await this.prisma.tag.findFirst({ where: { id: tagId, userId } });
    if (!tag) throw AppException.notFound('Tag');

    await this.prisma.tag.delete({ where: { id: tagId } });
    return { deleted: true };
  }

  async assignToConnection(userId: string, connectionId: string, tagId: string) {
    // Verify tag belongs to user
    const tag = await this.prisma.tag.findFirst({ where: { id: tagId, userId } });
    if (!tag) throw AppException.notFound('Tag');

    // Verify connection belongs to user (via profile)
    const connection = await this.prisma.connection.findFirst({
      where: {
        id: connectionId,
        OR: [
          { requester: { userId } },
          { addressee: { userId } },
        ],
      },
    });
    if (!connection) throw AppException.notFound('Conexao');

    // Check if already assigned
    const existing = await this.prisma.connectionTag.findUnique({
      where: { connectionId_tagId: { connectionId, tagId } },
    });
    if (existing) return existing;

    return this.prisma.connectionTag.create({
      data: { connectionId, tagId },
    });
  }

  async removeFromConnection(userId: string, connectionId: string, tagId: string) {
    const tag = await this.prisma.tag.findFirst({ where: { id: tagId, userId } });
    if (!tag) throw AppException.notFound('Tag');

    await this.prisma.connectionTag.deleteMany({
      where: { connectionId, tagId },
    });
    return { removed: true };
  }
}
