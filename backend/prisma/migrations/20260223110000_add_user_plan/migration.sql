-- Add plan column to users table (FREE tier by default)
ALTER TABLE `users` ADD COLUMN `plan` VARCHAR(20) NOT NULL DEFAULT 'FREE';

-- Set existing users with active payments to PRO
UPDATE `users` u
SET u.`plan` = 'PRO'
WHERE u.`id` IN (
  SELECT DISTINCT p.`user_id` FROM `payments` p
  WHERE p.`status` = 'approved'
  AND (p.`expires_at` IS NULL OR p.`expires_at` > NOW())
);
