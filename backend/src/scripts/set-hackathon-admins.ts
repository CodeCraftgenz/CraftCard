/**
 * Script para promover contas especificas a SUPER_ADMIN.
 *
 * Uso:  npx ts-node src/scripts/set-hackathon-admins.ts
 *
 * E-mails promovidos:
 *   - ricardocoradini97@gmail.com  (fundador)
 *   - paulommc@gmail.com
 *   - highstake.facine@gmail.com
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ADMIN_EMAILS = [
  'ricardocoradini97@gmail.com',
  'paulommc@gmail.com',
  'highstake.facine@gmail.com',
];

async function main() {
  console.log('🔧 Promovendo contas para SUPER_ADMIN...\n');

  for (const email of ADMIN_EMAILS) {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      console.log(`  ⚠  ${email} —não encontrado no banco (crie a conta primeiro)`);
      continue;
    }

    if (user.role === 'SUPER_ADMIN') {
      console.log(`  ✓  ${email} — já e SUPER_ADMIN`);
      continue;
    }

    await prisma.user.update({
      where: { email },
      data: { role: 'SUPER_ADMIN' },
    });

    console.log(`  ✅ ${email} — promovido para SUPER_ADMIN (antes: ${user.role})`);
  }

  console.log('\n✅ Concluido!');
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
