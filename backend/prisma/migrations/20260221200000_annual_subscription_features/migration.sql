-- AlterTable: Add expiresAt to payments for annual subscription
ALTER TABLE `payments` ADD COLUMN `expires_at` DATETIME(3) NULL;

-- AlterTable: Add viewCount and cardTheme to profiles
ALTER TABLE `profiles` ADD COLUMN `view_count` INT NOT NULL DEFAULT 0;
ALTER TABLE `profiles` ADD COLUMN `card_theme` VARCHAR(191) NOT NULL DEFAULT 'default';
