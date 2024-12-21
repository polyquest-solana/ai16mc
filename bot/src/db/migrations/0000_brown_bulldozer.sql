CREATE TABLE "market_options" (
	"id" text PRIMARY KEY NOT NULL,
	"market_id" varchar NOT NULL,
	"name" varchar(255) NOT NULL,
	"answer_key" integer NOT NULL,
	"odd" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "market_predictions" (
	"id" text PRIMARY KEY NOT NULL,
	"title" varchar(100),
	"description" text,
	"market_key" varchar,
	"creator" varchar NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "market_predictions_market_key_unique" UNIQUE("market_key")
);
--> statement-breakpoint
ALTER TABLE "market_options" ADD CONSTRAINT "market_options_market_id_market_predictions_id_fk" FOREIGN KEY ("market_id") REFERENCES "public"."market_predictions"("id") ON DELETE no action ON UPDATE no action;