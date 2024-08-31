CREATE TABLE `email` (
	`email` text PRIMARY KEY NOT NULL,
	`banned` integer DEFAULT false NOT NULL,
	`verified` integer DEFAULT false NOT NULL,
	`code` text
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` blob PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	FOREIGN KEY (`email`) REFERENCES `email`(`email`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);