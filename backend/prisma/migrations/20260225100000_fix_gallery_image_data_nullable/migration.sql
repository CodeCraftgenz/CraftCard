-- Fix: ensure image_data is nullable (previous migration may not have applied correctly)
ALTER TABLE `gallery_images` MODIFY COLUMN `image_data` MEDIUMTEXT NULL;
