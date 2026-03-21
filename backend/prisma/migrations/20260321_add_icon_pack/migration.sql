-- AlterTable: adiciona coluna iconPack ao profiles e organizations
ALTER TABLE `profiles` ADD COLUMN `iconPack` VARCHAR(10) NOT NULL DEFAULT 'lucide';
ALTER TABLE `organizations` ADD COLUMN `iconPack` VARCHAR(10) NOT NULL DEFAULT 'lucide';
