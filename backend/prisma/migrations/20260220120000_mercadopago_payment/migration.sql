-- DropIndex
DROP INDEX `payments_stripe_session_id_key` ON `payments`;

-- DropIndex
DROP INDEX `payments_stripe_payment_intent_id_key` ON `payments`;

-- AlterTable: remove Stripe columns, add Mercado Pago columns
ALTER TABLE `payments` DROP COLUMN `stripe_session_id`,
    DROP COLUMN `stripe_payment_intent_id`,
    ADD COLUMN `preference_id` VARCHAR(191) NULL,
    ADD COLUMN `mp_payment_id` VARCHAR(191) NULL,
    ADD COLUMN `payer_email` VARCHAR(191) NULL,
    ADD COLUMN `mp_response_json` TEXT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `payments_mp_payment_id_key` ON `payments`(`mp_payment_id`);

-- CreateIndex
CREATE INDEX `payments_payer_email_idx` ON `payments`(`payer_email`);
