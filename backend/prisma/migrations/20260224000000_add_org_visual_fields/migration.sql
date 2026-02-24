-- AlterTable
ALTER TABLE `organizations` ADD COLUMN `card_theme` VARCHAR(20) NULL DEFAULT 'default',
    ADD COLUMN `link_style` VARCHAR(20) NULL DEFAULT 'rounded',
    ADD COLUMN `link_animation` VARCHAR(20) NULL DEFAULT 'none',
    ADD COLUMN `background_type` VARCHAR(20) NULL DEFAULT 'theme',
    ADD COLUMN `background_gradient` VARCHAR(200) NULL;
