-- Sprint 14-17: Push subscriptions, webhooks, custom form fields

CREATE TABLE `push_subscriptions` (
  `id` VARCHAR(191) NOT NULL,
  `user_id` VARCHAR(191) NOT NULL,
  `endpoint` VARCHAR(500) NOT NULL,
  `p256dh` VARCHAR(200) NOT NULL,
  `auth` VARCHAR(100) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  UNIQUE INDEX `push_subscriptions_endpoint_key`(`endpoint`),
  INDEX `push_subscriptions_user_id_idx`(`user_id`),
  CONSTRAINT `push_subscriptions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `webhooks` (
  `id` VARCHAR(191) NOT NULL,
  `user_id` VARCHAR(191) NOT NULL,
  `url` VARCHAR(500) NOT NULL,
  `events` TEXT NOT NULL,
  `secret` VARCHAR(100) NOT NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  INDEX `webhooks_user_id_idx`(`user_id`),
  CONSTRAINT `webhooks_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `custom_form_fields` (
  `id` VARCHAR(191) NOT NULL,
  `profile_id` VARCHAR(191) NOT NULL,
  `label` VARCHAR(100) NOT NULL,
  `type` VARCHAR(20) NOT NULL,
  `options` TEXT NULL,
  `required` BOOLEAN NOT NULL DEFAULT false,
  `order` INT NOT NULL DEFAULT 0,

  PRIMARY KEY (`id`),
  INDEX `custom_form_fields_profile_id_idx`(`profile_id`),
  CONSTRAINT `custom_form_fields_profile_id_fkey` FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `custom_domains` (
  `id` VARCHAR(191) NOT NULL,
  `profile_id` VARCHAR(191) NOT NULL,
  `domain` VARCHAR(255) NOT NULL,
  `verified` BOOLEAN NOT NULL DEFAULT false,
  `verify_token` VARCHAR(100) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  UNIQUE INDEX `custom_domains_profile_id_key`(`profile_id`),
  UNIQUE INDEX `custom_domains_domain_key`(`domain`),
  CONSTRAINT `custom_domains_profile_id_fkey` FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
