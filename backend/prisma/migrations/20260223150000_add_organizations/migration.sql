-- Sprint 7: B2B Organizations system

-- Organizations table
CREATE TABLE `organizations` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(100) NOT NULL,
  `logo_url` VARCHAR(500) NULL,
  `primary_color` VARCHAR(9) NOT NULL DEFAULT '#00E4F2',
  `secondary_color` VARCHAR(9) NOT NULL DEFAULT '#D12BF2',
  `font_family` VARCHAR(50) NOT NULL DEFAULT 'Inter',
  `domain` VARCHAR(200) NULL,
  `max_members` INTEGER NOT NULL DEFAULT 50,
  `branding_active` BOOLEAN NOT NULL DEFAULT false,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  PRIMARY KEY (`id`),
  UNIQUE INDEX `organizations_slug_key`(`slug`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Organization members
CREATE TABLE `organization_members` (
  `id` VARCHAR(191) NOT NULL,
  `org_id` VARCHAR(191) NOT NULL,
  `user_id` VARCHAR(191) NOT NULL,
  `role` VARCHAR(20) NOT NULL DEFAULT 'MEMBER',
  `joined_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  UNIQUE INDEX `organization_members_org_id_user_id_key`(`org_id`, `user_id`),
  INDEX `organization_members_user_id_idx`(`user_id`),
  CONSTRAINT `organization_members_org_id_fkey` FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `organization_members_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Organization invites
CREATE TABLE `organization_invites` (
  `id` VARCHAR(191) NOT NULL,
  `org_id` VARCHAR(191) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `role` VARCHAR(20) NOT NULL DEFAULT 'MEMBER',
  `token` VARCHAR(100) NOT NULL,
  `expires_at` DATETIME(3) NOT NULL,
  `used_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  UNIQUE INDEX `organization_invites_token_key`(`token`),
  INDEX `organization_invites_email_idx`(`email`),
  CONSTRAINT `organization_invites_org_id_fkey` FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Add org_id to profiles (optional link to organization)
ALTER TABLE `profiles` ADD COLUMN `org_id` VARCHAR(191) NULL;
ALTER TABLE `profiles` ADD CONSTRAINT `profiles_org_id_fkey` FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
