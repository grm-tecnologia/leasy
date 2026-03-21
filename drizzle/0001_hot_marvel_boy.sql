CREATE TABLE `generations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`profileId` int NOT NULL,
	`type` enum('cv_pdf','linkedin_about','linkedin_skills','linkedin_hashtags','full_optimization') NOT NULL,
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`inputData` json,
	`outputData` json,
	`outputUrl` text,
	`tokensUsed` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `generations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `message_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`targetRole` enum('recruiter','manager','director') NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`industry` varchar(100),
	`isDefault` boolean NOT NULL DEFAULT false,
	`usageCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `message_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `plan_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`fromPlan` enum('basic','gold') NOT NULL,
	`toPlan` enum('basic','gold') NOT NULL,
	`reason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `plan_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`formType` enum('basic','gold') NOT NULL DEFAULT 'basic',
	`fullName` varchar(255),
	`email` varchar(320),
	`phone` varchar(30),
	`city` varchar(100),
	`state` varchar(100),
	`country` varchar(100),
	`headline` text,
	`summary` text,
	`currentRole` varchar(255),
	`currentCompany` varchar(255),
	`yearsExperience` int,
	`education` json,
	`experience` json,
	`skills` json,
	`certifications` json,
	`languages` json,
	`targetRole` varchar(255),
	`targetIndustry` varchar(255),
	`salaryExpectation` varchar(100),
	`linkedinUrl` varchar(500),
	`portfolioUrl` varchar(500),
	`audioTranscription` text,
	`rawAudioUrl` text,
	`optimizationScore` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `profiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ssi_actions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`category` enum('profile','network','engagement','content') NOT NULL,
	`priority` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`completed` boolean NOT NULL DEFAULT false,
	`dueDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ssi_actions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `plan` enum('basic','gold') DEFAULT 'basic' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `generationsUsed` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `generationsLimit` int DEFAULT 3 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `avatarUrl` text;