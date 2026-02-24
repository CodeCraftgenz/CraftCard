-- Add link_type and metadata to social_links for expanded link types
ALTER TABLE `social_links` ADD COLUMN `link_type` VARCHAR(20) NULL DEFAULT 'link';
ALTER TABLE `social_links` ADD COLUMN `metadata` TEXT NULL;
