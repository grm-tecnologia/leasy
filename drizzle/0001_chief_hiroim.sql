CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`description` text,
	`icon` varchar(64),
	`color` varchar(32),
	`fieldDefinitions` json,
	`leadCount` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_name_unique` UNIQUE(`name`),
	CONSTRAINT `categories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `lead_pricing` (
	`id` int AUTO_INCREMENT NOT NULL,
	`categoryId` int NOT NULL,
	`minQuantity` int NOT NULL DEFAULT 1,
	`maxQuantity` int,
	`pricePerLeadCents` int NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lead_pricing_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`categoryId` int NOT NULL,
	`data` json NOT NULL,
	`batchId` varchar(64),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`categoryId` int NOT NULL,
	`filters` json,
	`leadCount` int NOT NULL,
	`priceCents` int NOT NULL,
	`downloadUrl` varchar(1024),
	`downloadKey` varchar(512),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`totalCents` int NOT NULL,
	`status` enum('pending','paid','failed','refunded') NOT NULL DEFAULT 'pending',
	`paymentId` varchar(255),
	`paymentUrl` varchar(1024),
	`paymentDetails` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `upload_batches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`batchId` varchar(64) NOT NULL,
	`categoryId` int NOT NULL,
	`fileName` varchar(512) NOT NULL,
	`fileUrl` varchar(1024),
	`columnMapping` json,
	`suggestedFields` json,
	`status` enum('pending','mapping','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`totalRows` int DEFAULT 0,
	`processedRows` int DEFAULT 0,
	`errorMessage` text,
	`uploadedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `upload_batches_id` PRIMARY KEY(`id`),
	CONSTRAINT `upload_batches_batchId_unique` UNIQUE(`batchId`)
);
--> statement-breakpoint
CREATE INDEX `idx_pricing_category` ON `lead_pricing` (`categoryId`);--> statement-breakpoint
CREATE INDEX `idx_leads_category` ON `leads` (`categoryId`);--> statement-breakpoint
CREATE INDEX `idx_leads_batch` ON `leads` (`batchId`);--> statement-breakpoint
CREATE INDEX `idx_order_items_order` ON `order_items` (`orderId`);--> statement-breakpoint
CREATE INDEX `idx_orders_user` ON `orders` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_orders_status` ON `orders` (`status`);