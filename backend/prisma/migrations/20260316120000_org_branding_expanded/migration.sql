-- Add cover and background image to organizations for expanded branding
ALTER TABLE `organizations` ADD COLUMN `cover_url` VARCHAR(500) NULL;
ALTER TABLE `organizations` ADD COLUMN `background_image_url` VARCHAR(500) NULL;
