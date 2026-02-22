-- AlterTable: Remove unique constraint on user_id, add label and isPrimary
-- Safe/idempotent version using PREPARE/EXECUTE

-- Step 1: Drop unique index on user_id if it exists
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'profiles' AND index_name = 'profiles_user_id_key');
SET @sql = IF(@idx_exists > 0, 'ALTER TABLE `profiles` DROP INDEX `profiles_user_id_key`', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 2: Add label column if not exists
SET @col_exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'profiles' AND column_name = 'label');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `profiles` ADD COLUMN `label` VARCHAR(50) NOT NULL DEFAULT ''Principal''', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 3: Add is_primary column if not exists
SET @col_exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'profiles' AND column_name = 'is_primary');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE `profiles` ADD COLUMN `is_primary` BOOLEAN NOT NULL DEFAULT true', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 4: Create regular index on user_id if not exists
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'profiles' AND index_name = 'profiles_user_id_idx');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX `profiles_user_id_idx` ON `profiles`(`user_id`)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
