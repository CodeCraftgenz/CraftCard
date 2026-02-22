-- AlterTable: Add cover photo fields to profiles
ALTER TABLE `profiles` ADD COLUMN `cover_photo_url` VARCHAR(191) NULL;
ALTER TABLE `profiles` ADD COLUMN `cover_photo_data` MEDIUMTEXT NULL;

-- CreateTable: profile_views for daily view tracking
CREATE TABLE `profile_views` (
    `id` VARCHAR(191) NOT NULL,
    `profile_id` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `count` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `profile_views_profile_id_date_key`(`profile_id`, `date`),
    INDEX `profile_views_profile_id_idx`(`profile_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: link_clicks for daily click tracking
CREATE TABLE `link_clicks` (
    `id` VARCHAR(191) NOT NULL,
    `social_link_id` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `count` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `link_clicks_social_link_id_date_key`(`social_link_id`, `date`),
    INDEX `link_clicks_social_link_id_idx`(`social_link_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `profile_views` ADD CONSTRAINT `profile_views_profile_id_fkey` FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `link_clicks` ADD CONSTRAINT `link_clicks_social_link_id_fkey` FOREIGN KEY (`social_link_id`) REFERENCES `social_links`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
