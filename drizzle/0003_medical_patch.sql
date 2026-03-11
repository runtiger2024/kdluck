ALTER TABLE `orders` ADD `paymentProofUrl` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `paymentProofKey` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `paymentNote` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `proofUploadedAt` timestamp;--> statement-breakpoint
ALTER TABLE `orders` ADD `reviewStatus` enum('none','pending_review','approved','rejected') DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `reviewedAt` timestamp;--> statement-breakpoint
ALTER TABLE `orders` ADD `reviewedBy` int;--> statement-breakpoint
ALTER TABLE `orders` ADD `reviewNote` text;