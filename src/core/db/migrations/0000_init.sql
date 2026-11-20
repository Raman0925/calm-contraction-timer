CREATE TABLE `contractions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`started_at` integer NOT NULL,
	`ended_at` integer,
	`intensity` integer,
	`note` text,
	CONSTRAINT "contractions_end_after_start" CHECK("contractions"."ended_at" IS NULL OR "contractions"."ended_at" >= "contractions"."started_at"),
	CONSTRAINT "contractions_intensity_range" CHECK("contractions"."intensity" IS NULL OR "contractions"."intensity" BETWEEN 1 AND 3)
);
--> statement-breakpoint
CREATE INDEX `contractions_started_at_idx` ON `contractions` (`started_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `contractions_single_active_idx` ON `contractions` (("ended_at" IS NULL)) WHERE "contractions"."ended_at" IS NULL;