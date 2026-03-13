-- AlterTable
ALTER TABLE `users` ADD COLUMN `totp_secret` VARCHAR(191) NULL,
    ADD COLUMN `totp_enabled` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `totp_backup_codes` TEXT NULL;
