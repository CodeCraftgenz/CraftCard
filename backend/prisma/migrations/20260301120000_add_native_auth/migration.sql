-- AlterTable: make google_id optional (was required)
ALTER TABLE `users` MODIFY `google_id` VARCHAR(191) NULL;

-- AlterTable: add native auth fields
ALTER TABLE `users` ADD COLUMN `password_hash` VARCHAR(191) NULL;
ALTER TABLE `users` ADD COLUMN `password_reset_token` VARCHAR(191) NULL;
ALTER TABLE `users` ADD COLUMN `password_reset_expires_at` DATETIME(3) NULL;
