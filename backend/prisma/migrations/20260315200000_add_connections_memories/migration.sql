-- AlterTable: Add geo/event fields to connections
ALTER TABLE `connections` ADD COLUMN `latitude` DOUBLE NULL;
ALTER TABLE `connections` ADD COLUMN `longitude` DOUBLE NULL;
ALTER TABLE `connections` ADD COLUMN `location_label` VARCHAR(200) NULL;
ALTER TABLE `connections` ADD COLUMN `event_id` VARCHAR(191) NULL;

-- CreateTable: events
CREATE TABLE `events` (
    `id` VARCHAR(191) NOT NULL,
    `creator_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `cover_url` VARCHAR(500) NULL,
    `start_date` DATETIME(3) NOT NULL,
    `end_date` DATETIME(3) NULL,
    `location` VARCHAR(200) NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `slug` VARCHAR(100) NOT NULL,
    `is_public` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `events_slug_key`(`slug`),
    INDEX `events_creator_id_idx`(`creator_id`),
    INDEX `events_start_date_idx`(`start_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: tags
CREATE TABLE `tags` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(50) NOT NULL,
    `color` VARCHAR(9) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `tags_user_id_name_key`(`user_id`, `name`),
    INDEX `tags_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: connection_tags (join table)
CREATE TABLE `connection_tags` (
    `id` VARCHAR(191) NOT NULL,
    `connection_id` VARCHAR(191) NOT NULL,
    `tag_id` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `connection_tags_connection_id_tag_id_key`(`connection_id`, `tag_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddIndex: connections.event_id
CREATE INDEX `connections_event_id_idx` ON `connections`(`event_id`);

-- AddForeignKey: connections → events
ALTER TABLE `connections` ADD CONSTRAINT `connections_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: tags → users
ALTER TABLE `tags` ADD CONSTRAINT `tags_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: connection_tags → connections
ALTER TABLE `connection_tags` ADD CONSTRAINT `connection_tags_connection_id_fkey` FOREIGN KEY (`connection_id`) REFERENCES `connections`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: connection_tags → tags
ALTER TABLE `connection_tags` ADD CONSTRAINT `connection_tags_tag_id_fkey` FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
