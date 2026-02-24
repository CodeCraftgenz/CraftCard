-- Sprint 8: Advanced analytics - view events

CREATE TABLE `view_events` (
  `id` VARCHAR(191) NOT NULL,
  `profile_id` VARCHAR(191) NOT NULL,
  `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `country` VARCHAR(50) NULL,
  `city` VARCHAR(100) NULL,
  `device` VARCHAR(20) NULL,
  `browser` VARCHAR(30) NULL,
  `referrer` VARCHAR(100) NULL,
  `utm_source` VARCHAR(100) NULL,
  `utm_medium` VARCHAR(100) NULL,
  `utm_campaign` VARCHAR(100) NULL,

  PRIMARY KEY (`id`),
  INDEX `view_events_profile_id_timestamp_idx`(`profile_id`, `timestamp`),
  INDEX `view_events_profile_id_referrer_idx`(`profile_id`, `referrer`),
  CONSTRAINT `view_events_profile_id_fkey` FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
