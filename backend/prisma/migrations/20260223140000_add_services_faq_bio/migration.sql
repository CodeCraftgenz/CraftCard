-- Sprint 6: Services, FAQ, expanded bio fields

-- Expanded bio fields on profiles
ALTER TABLE `profiles` ADD COLUMN `location` VARCHAR(100) NULL;
ALTER TABLE `profiles` ADD COLUMN `pronouns` VARCHAR(30) NULL;
ALTER TABLE `profiles` ADD COLUMN `working_hours` VARCHAR(100) NULL;
ALTER TABLE `profiles` ADD COLUMN `tagline` VARCHAR(200) NULL;
ALTER TABLE `profiles` ADD COLUMN `sections_order` TEXT NULL;

-- Services table
CREATE TABLE `services` (
  `id` VARCHAR(191) NOT NULL,
  `profile_id` VARCHAR(191) NOT NULL,
  `title` VARCHAR(150) NOT NULL,
  `description` TEXT NULL,
  `price` VARCHAR(50) NULL,
  `order` INTEGER NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  INDEX `services_profile_id_idx`(`profile_id`),
  CONSTRAINT `services_profile_id_fkey` FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- FAQ items table
CREATE TABLE `faq_items` (
  `id` VARCHAR(191) NOT NULL,
  `profile_id` VARCHAR(191) NOT NULL,
  `question` VARCHAR(300) NOT NULL,
  `answer` TEXT NOT NULL,
  `order` INTEGER NOT NULL DEFAULT 0,

  PRIMARY KEY (`id`),
  INDEX `faq_items_profile_id_idx`(`profile_id`),
  CONSTRAINT `faq_items_profile_id_fkey` FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
