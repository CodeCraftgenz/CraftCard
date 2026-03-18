import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { Public } from '../common/decorators/public.decorator';

/**
 * Controller de estatisticas publicas da plataforma.
 *
 * Fornece numeros agregados (cards publicados, visualizacoes totais,
 * usuarios cadastrados) para exibicao na landing page.
 * Nao requer autenticacao — qualquer visitante pode consultar.
 *
 * Os dados sao cacheados em memoria por 5 minutos para evitar
 * consultas desnecessarias ao banco em cada requisicao.
 */

/** Formato da resposta do endpoint de estatisticas */
interface PublicStats {
  totalCards: number;
  totalViews: number;
  totalUsers: number;
}

/** Cache simples em memoria com TTL de 5 minutos */
let cachedStats: PublicStats | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

@Controller('stats')
export class StatsController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * GET /api/stats/public
   *
   * Retorna estatisticas agregadas da plataforma:
   * - totalCards: quantidade de perfis publicados (isPublished = true)
   * - totalViews: soma de viewCount de todos os perfis publicados
   * - totalUsers: quantidade total de usuarios cadastrados
   *
   * Resultado cacheado por 5 minutos para performance.
   */
  @Public()
  @Get('public')
  async getPublicStats(): Promise<PublicStats> {
    const now = Date.now();

    // Retorna cache se ainda estiver valido (dentro do TTL de 5 min)
    if (cachedStats && now - cacheTimestamp < CACHE_TTL_MS) {
      return cachedStats;
    }

    // Consulta agregada: conta perfis publicados e soma visualizacoes
    const [cardStats, totalUsers] = await Promise.all([
      this.prisma.profile.aggregate({
        where: { isPublished: true },
        _count: { id: true },
        _sum: { viewCount: true },
      }),
      this.prisma.user.count(),
    ]);

    // Monta o objeto de resposta com valores seguros (fallback para 0)
    const stats: PublicStats = {
      totalCards: cardStats._count.id ?? 0,
      totalViews: cardStats._sum.viewCount ?? 0,
      totalUsers,
    };

    // Atualiza o cache em memoria
    cachedStats = stats;
    cacheTimestamp = now;

    return stats;
  }
}
