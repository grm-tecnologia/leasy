CREATE TABLE `activity_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`action` varchar(64) NOT NULL,
	`entityType` varchar(64),
	`entityId` varchar(255),
	`details` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activity_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `favorites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`categoryId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `favorites_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_activity_user` ON `activity_log` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_activity_action` ON `activity_log` (`action`);--> statement-breakpoint
CREATE INDEX `idx_activity_created` ON `activity_log` (`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_favorites_user` ON `favorites` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_favorites_category` ON `favorites` (`categoryId`);