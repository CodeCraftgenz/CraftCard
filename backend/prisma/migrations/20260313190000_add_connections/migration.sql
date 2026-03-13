-- AlterTable: add connections_enabled to profiles
ALTER TABLE `profiles` ADD COLUMN `connections_enabled` BOOLEAN NOT NULL DEFAULT true;

-- CreateTable: connections
CREATE TABLE `connections` (
    `id` VARCHAR(191) NOT NULL,
    `requester_id` VARCHAR(191) NOT NULL,
    `addressee_id` VARCHAR(191) NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `accepted_at` DATETIME(3) NULL,

    UNIQUE INDEX `connections_requester_id_addressee_id_key`(`requester_id`, `addressee_id`),
    INDEX `connections_addressee_id_status_idx`(`addressee_id`, `status`),
    INDEX `connections_requester_id_status_idx`(`requester_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `connections` ADD CONSTRAINT `connections_requester_id_fkey` FOREIGN KEY (`requester_id`) REFERENCES `profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `connections` ADD CONSTRAINT `connections_addressee_id_fkey` FOREIGN KEY (`addressee_id`) REFERENCES `profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
