CREATE TABLE `course_faqs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`courseId` int NOT NULL,
	`question` text NOT NULL,
	`answer` text NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `course_faqs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `course_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`courseId` int NOT NULL,
	`lessonId` int,
	`content` text NOT NULL,
	`videoTimestamp` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `course_notes_id` PRIMARY KEY(`id`)
);
