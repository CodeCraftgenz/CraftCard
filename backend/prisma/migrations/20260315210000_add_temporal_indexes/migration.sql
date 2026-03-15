-- Performance indexes for admin dashboard temporal queries
-- Prevents full table scans on groupBy/orderBy createdAt/paidAt

CREATE INDEX `users_created_at_idx` ON `users`(`created_at`);
CREATE INDEX `users_plan_idx` ON `users`(`plan`);
CREATE INDEX `connections_created_at_idx` ON `connections`(`created_at`);
CREATE INDEX `connections_accepted_at_idx` ON `connections`(`accepted_at`);
CREATE INDEX `payments_paid_at_idx` ON `payments`(`paid_at`);
