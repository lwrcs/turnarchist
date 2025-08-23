ALTER TABLE "turnarchist"."game_stats" ALTER COLUMN "enemies_killed" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "turnarchist"."game_stats" ALTER COLUMN "inventory" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "turnarchist"."game_stats" ADD COLUMN "device_type" jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "turnarchist"."game_stats" ADD COLUMN "side_paths_entered" jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "turnarchist"."game_stats" ADD COLUMN "weapon_choice" varchar(100);--> statement-breakpoint
ALTER TABLE "turnarchist"."game_stats" ADD COLUMN "game_state" jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "turnarchist"."game_stats" ADD COLUMN "game_version" varchar(10);--> statement-breakpoint
ALTER TABLE "turnarchist"."game_stats" ADD COLUMN "loaded_from_save_file" boolean NOT NULL;--> statement-breakpoint
CREATE INDEX "game_stats_created_at_idx" ON "turnarchist"."game_stats" USING btree ("created_at");