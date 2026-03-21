-- AlterTable: adiciona coluna iconPack ao Profile e Organization
ALTER TABLE `Profile` ADD COLUMN `iconPack` VARCHAR(10) NOT NULL DEFAULT 'lucide';
ALTER TABLE `Organization` ADD COLUMN `iconPack` VARCHAR(10) NOT NULL DEFAULT 'lucide';
