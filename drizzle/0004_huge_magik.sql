ALTER TABLE `users` ADD `phone` varchar(32);--> statement-breakpoint
ALTER TABLE `users` ADD `birthday` varchar(10);--> statement-breakpoint
ALTER TABLE `users` ADD `gender` enum('male','female','other','prefer_not_to_say');--> statement-breakpoint
ALTER TABLE `users` ADD `city` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `address` text;--> statement-breakpoint
ALTER TABLE `users` ADD `bio` text;--> statement-breakpoint
ALTER TABLE `users` ADD `occupation` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `company` varchar(128);