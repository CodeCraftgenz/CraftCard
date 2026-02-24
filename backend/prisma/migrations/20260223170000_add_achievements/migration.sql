-- Sprint 9: Gamification - Achievements

CREATE TABLE `achievements` (
  `id` VARCHAR(191) NOT NULL,
  `user_id` VARCHAR(191) NOT NULL,
  `type` VARCHAR(50) NOT NULL,
  `unlocked_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  UNIQUE INDEX `achievements_user_id_type_key`(`user_id`, `type`),
  INDEX `achievements_user_id_idx`(`user_id`),
  CONSTRAINT `achievements_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
