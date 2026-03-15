-- Add billing cycle and seats to payments
ALTER TABLE `payments` ADD COLUMN `billing_cycle` VARCHAR(10) NULL DEFAULT 'YEARLY';
ALTER TABLE `payments` ADD COLUMN `seats_count` INT NOT NULL DEFAULT 1;

-- Add API key to users
ALTER TABLE `users` ADD COLUMN `api_key` VARCHAR(64) NULL;
CREATE UNIQUE INDEX `users_api_key_key` ON `users`(`api_key`);
