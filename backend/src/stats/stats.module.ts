import { Module } from '@nestjs/common';
import { StatsController } from './stats.controller';

/**
 * Modulo de estatisticas publicas.
 *
 * Registra o StatsController que expoe numeros agregados
 * da plataforma para a landing page.
 *
 * PrismaService ja esta disponivel globalmente via PrismaModule (@Global),
 * entao nao precisa ser importado aqui.
 */
@Module({
  controllers: [StatsController],
})
export class StatsModule {}
