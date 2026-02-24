-- AlterTable: add imageUrl to gallery_images (nullable, for FTP storage migration)
ALTER TABLE `gallery_images` ADD COLUMN `image_url` VARCHAR(500) NULL;

-- Make imageData nullable (backward compat: new uploads use FTP URL, old ones keep base64)
ALTER TABLE `gallery_images` MODIFY COLUMN `image_data` MEDIUMTEXT NULL;
