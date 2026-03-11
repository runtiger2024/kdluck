CREATE TABLE `notification_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`channel` enum('in_app','line','email') NOT NULL,
	`targetType` enum('all','user','enrolled') NOT NULL DEFAULT 'all',
	`targetUserId` int,
	`title` varchar(256) NOT NULL,
	`content` text NOT NULL,
	`sentCount` int NOT NULL DEFAULT 0,
	`status` enum('pending','sent','partial','failed') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`sentBy` int,
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notification_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(256) NOT NULL,
	`content` text NOT NULL,
	`type` enum('system','order','course','promotion','review','certificate') NOT NULL DEFAULT 'system',
	`isRead` boolean NOT NULL DEFAULT false,
	`link` varchar(512),
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
