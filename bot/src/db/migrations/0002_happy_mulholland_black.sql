CREATE TABLE "bets" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"option_id" varchar NOT NULL,
	"amount" numeric,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "bets" ADD CONSTRAINT "bets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bets" ADD CONSTRAINT "bets_option_id_market_options_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."market_options"("id") ON DELETE no action ON UPDATE no action;