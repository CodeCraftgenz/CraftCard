-- AlterTable: Remove unique constraint on user_id, add label and isPrimary
-- First drop the unique index
DROP INDEX `profiles_user_id_key` ON `profiles`;

-- Add new columns
ALTER TABLE `profiles` ADD COLUMN `label` VARCHAR(50) NOT NULL DEFAULT 'Principal';
ALTER TABLE `profiles` ADD COLUMN `is_primary` BOOLEAN NOT NULL DEFAULT true;

-- Add regular index on user_id
CREATE INDEX `profiles_user_id_idx` ON `profiles`(`user_id`);
