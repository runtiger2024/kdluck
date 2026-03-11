CREATE TABLE `certificates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`courseId` int NOT NULL,
	`certificateNo` varchar(64) NOT NULL,
	`userName` varchar(256) NOT NULL,
	`courseName` varchar(512) NOT NULL,
	`instructorName` varchar(256),
	`completedAt` timestamp NOT NULL,
	`pdfUrl` varchar(1024),
	`pdfKey` varchar(512),
	`issuedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `certificates_id` PRIMARY KEY(`id`),
	CONSTRAINT `certificates_certificateNo_unique` UNIQUE(`certificateNo`)
);
