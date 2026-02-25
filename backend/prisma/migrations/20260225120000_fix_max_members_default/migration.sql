-- Update existing orgs with old default (50) to new default (10)
UPDATE `organizations` SET `max_members` = 10 WHERE `max_members` = 50;

-- Change column default
ALTER TABLE `organizations` ALTER COLUMN `max_members` SET DEFAULT 10;
