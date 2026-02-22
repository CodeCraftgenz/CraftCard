-- AlterTable
ALTER TABLE `profiles` ADD COLUMN `video_url` VARCHAR(191) NULL;
ALTER TABLE `profiles` ADD COLUMN `lead_capture_enabled` BOOLEAN NOT NULL DEFAULT false;
