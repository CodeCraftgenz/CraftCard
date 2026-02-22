-- Add booking_enabled column to profiles
ALTER TABLE `profiles` ADD COLUMN `booking_enabled` BOOLEAN NOT NULL DEFAULT false;
