-- AlterTable: add photo_data column for base64 storage
ALTER TABLE `profiles` ADD COLUMN `photo_data` MEDIUMTEXT NULL;
