CREATE TYPE "public"."status" AS ENUM('active', 'finished', 'draft', 'canceled');--> statement-breakpoint
ALTER TABLE "bets" ADD COLUMN "claimed" boolean;--> statement-breakpoint
ALTER TABLE "market_predictions" ADD COLUMN "status" "status" DEFAULT 'active';--> statement-breakpoint
ALTER TABLE "market_predictions" ADD COLUMN "correct_answer_id" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "market_predictions" ADD CONSTRAINT "market_predictions_correct_answer_id_market_options_id_fk" FOREIGN KEY ("correct_answer_id") REFERENCES "public"."market_options"("id") ON DELETE no action ON UPDATE no action;