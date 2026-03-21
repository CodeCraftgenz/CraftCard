/**
 * prisma.config.ts — Configuracao do Prisma CLI.
 * Substitui a propriedade "prisma" do package.json (depreciada no Prisma 7).
 */
import { defineConfig } from 'prisma/config';

export default defineConfig({
  seed: {
    command: 'ts-node prisma/seed.ts',
  },
});
