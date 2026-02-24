-- AlterTable: add role column to users
ALTER TABLE `users` ADD COLUMN `role` VARCHAR(20) NOT NULL DEFAULT 'USER';

-- Seed super admins (founders/team)
UPDATE `users` SET `role` = 'SUPER_ADMIN' WHERE `email` IN (
  'ricardocoradini97@gmail.com',
  'paulommc@gmail.com',
  'mfacine@gmail.com',
  'gabriel.gondrone@gmail.com'
);
