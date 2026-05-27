CREATE TABLE "turnarchist"."feedback_logs" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v1mc() NOT NULL,
  "type" varchar(10) NOT NULL,
  "text" text NOT NULL,
  "user_id" uuid,
  "ip_address" varchar(100),
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "feedback_logs_created_at_idx" ON "turnarchist"."feedback_logs" ("created_at");
--> statement-breakpoint
CREATE INDEX "feedback_logs_user_id_idx" ON "turnarchist"."feedback_logs" ("user_id");
--> statement-breakpoint
CREATE INDEX "feedback_logs_type_idx" ON "turnarchist"."feedback_logs" ("type");
