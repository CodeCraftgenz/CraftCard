-- Add visual customization fields to profiles
ALTER TABLE `profiles` ADD COLUMN `font_family` VARCHAR(50) NULL;
ALTER TABLE `profiles` ADD COLUMN `font_size_scale` DOUBLE NULL DEFAULT 1.0;
ALTER TABLE `profiles` ADD COLUMN `background_type` VARCHAR(20) NULL DEFAULT 'theme';
ALTER TABLE `profiles` ADD COLUMN `background_gradient` VARCHAR(200) NULL;
ALTER TABLE `profiles` ADD COLUMN `background_image_url` VARCHAR(500) NULL;
ALTER TABLE `profiles` ADD COLUMN `background_overlay` DOUBLE NULL DEFAULT 0.7;
ALTER TABLE `profiles` ADD COLUMN `background_pattern` VARCHAR(30) NULL;
ALTER TABLE `profiles` ADD COLUMN `link_style` VARCHAR(20) NULL DEFAULT 'rounded';
ALTER TABLE `profiles` ADD COLUMN `link_animation` VARCHAR(20) NULL DEFAULT 'none';
