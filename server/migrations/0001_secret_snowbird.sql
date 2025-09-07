CREATE TABLE "turnarchist"."game_stats" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v1mc() NOT NULL,
	"killed_by" varchar(100),
	"enemies_killed" jsonb,
	"damage_done" integer DEFAULT 0 NOT NULL,
	"damage_taken" integer DEFAULT 0 NOT NULL,
	"depth_reached" integer DEFAULT 0 NOT NULL,
	"turns_passed" integer DEFAULT 0 NOT NULL,
	"coins_collected" integer DEFAULT 0 NOT NULL,
	"items_collected" integer DEFAULT 0 NOT NULL,
	"xp" integer DEFAULT 0 NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"game_duration_ms" integer DEFAULT 0 NOT NULL,
	"inventory" jsonb,
	"created_at" timestamptz DEFAULT now() NOT NULL,
	"updated_at" timestamptz DEFAULT now() NOT NULL
);
