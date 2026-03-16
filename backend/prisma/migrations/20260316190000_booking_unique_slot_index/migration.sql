-- Prevent double-booking: unique constraint on (profileId, date, time)
-- Ignore if already uniquely constrained (idempotent)
ALTER TABLE `bookings`
  ADD CONSTRAINT `bookings_profile_id_date_time_key`
  UNIQUE (`profile_id`, `date`, `time`);

-- Index for cron reminder query: status + reminderSentAt + date
CREATE INDEX `bookings_status_reminder_sent_at_date_idx`
  ON `bookings` (`status`, `reminder_sent_at`, `date`);
