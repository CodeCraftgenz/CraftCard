/**
 * Lista de emails com acesso ENTERPRISE gratuito (fundadores / contas internas).
 *
 * Fonte única de verdade — importado por payments.service.ts e payments.cron.ts.
 * Esses emails recebem plano ENTERPRISE sem precisar pagar, com limites ilimitados.
 *
 * Para adicionar ou remover contas, edite SOMENTE este arquivo.
 * A verificação é feita em getActiveSubscription() e getUserPlanInfo().
 */
export const FREE_ACCESS_EMAILS = new Set([
  'ricardocoradini97@gmail.com',
  'paulommc@gmail.com',
  'mfacine@gmail.com',
  'gabriel.gondrone@gmail.com',
  'codecraftgenz@gmail.com',
]);

/** Forma em array para queries Prisma que usam `notIn` (ex: cron de expiração) */
export const FREE_ACCESS_EMAILS_ARRAY = [...FREE_ACCESS_EMAILS];
