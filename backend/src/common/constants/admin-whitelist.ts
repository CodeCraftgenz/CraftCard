/**
 * Emails that receive full ENTERPRISE access for free (founders / internal accounts).
 * Single source of truth — imported by payments.service.ts and payments.cron.ts.
 *
 * To add/remove accounts, edit this file only.
 */
export const FREE_ACCESS_EMAILS = new Set([
  'ricardocoradini97@gmail.com',
  'paulommc@gmail.com',
  'mfacine@gmail.com',
  'gabriel.gondrone@gmail.com',
  'codecraftgenz@gmail.com',
]);

/** Array form for Prisma `notIn` queries */
export const FREE_ACCESS_EMAILS_ARRAY = [...FREE_ACCESS_EMAILS];
