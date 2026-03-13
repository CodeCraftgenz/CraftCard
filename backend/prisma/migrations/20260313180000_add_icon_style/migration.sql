-- AlterTable: add icon_style to profiles
ALTER TABLE `profiles` ADD COLUMN `icon_style` VARCHAR(20) NULL DEFAULT 'default';

-- AlterTable: add icon_style to organizations
ALTER TABLE `organizations` ADD COLUMN `icon_style` VARCHAR(20) NULL DEFAULT 'default';
