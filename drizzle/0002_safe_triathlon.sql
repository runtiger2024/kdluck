CREATE TABLE `invoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`orderNo` varchar(64) NOT NULL,
	`invoiceNumber` varchar(20),
	`invoiceDate` varchar(20),
	`randomNumber` varchar(10),
	`buyerIdentifier` varchar(10) NOT NULL DEFAULT '0000000000',
	`buyerName` varchar(128) NOT NULL DEFAULT '消費者',
	`buyerEmail` varchar(320),
	`carrierType` varchar(20),
	`carrierId` varchar(128),
	`npoban` varchar(10),
	`amount` decimal(10,2) NOT NULL,
	`taxAmount` decimal(10,2) NOT NULL DEFAULT '0.00',
	`totalAmount` decimal(10,2) NOT NULL,
	`status` enum('pending','issued','voided','failed') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`rawResponse` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invoices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `line_push_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`templateKey` varchar(128),
	`targetType` enum('all','user','enrolled') NOT NULL DEFAULT 'all',
	`targetUserId` int,
	`messageContent` text NOT NULL,
	`sentCount` int NOT NULL DEFAULT 0,
	`status` enum('pending','sent','failed') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `line_push_history_id` PRIMARY KEY(`id`)
);
