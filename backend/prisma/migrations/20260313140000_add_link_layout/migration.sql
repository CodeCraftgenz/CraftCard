-- AlterTable: add link_layout to profiles and organizations
ALTER TABLE `profiles` ADD COLUMN `link_layout` VARCHAR(10) NULL DEFAULT 'list';
ALTER TABLE `organizations` ADD COLUMN `link_layout` VARCHAR(10) NULL DEFAULT 'list';
