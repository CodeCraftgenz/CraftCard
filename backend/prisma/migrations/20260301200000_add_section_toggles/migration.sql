-- AlterTable
ALTER TABLE `profiles` ADD COLUMN `resume_enabled` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `contact_form_enabled` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `testimonials_enabled` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `gallery_enabled` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `services_enabled` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `faq_enabled` BOOLEAN NOT NULL DEFAULT true;
