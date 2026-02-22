-- AlterTable: add availability fields to profiles
ALTER TABLE `profiles` ADD COLUMN `availability_status` VARCHAR(191) NULL;
ALTER TABLE `profiles` ADD COLUMN `availability_message` VARCHAR(191) NULL;

-- CreateTable: contact_messages
CREATE TABLE `contact_messages` (
    `id` VARCHAR(191) NOT NULL,
    `profile_id` VARCHAR(191) NOT NULL,
    `sender_name` VARCHAR(191) NOT NULL,
    `sender_email` VARCHAR(191) NULL,
    `message` TEXT NOT NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `contact_messages_profile_id_idx`(`profile_id`),
    INDEX `contact_messages_profile_id_is_read_idx`(`profile_id`, `is_read`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `contact_messages` ADD CONSTRAINT `contact_messages_profile_id_fkey` FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
