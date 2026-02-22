-- Add resume_data column to store PDF as base64 in database
ALTER TABLE `profiles` ADD COLUMN `resume_data` LONGTEXT NULL;
