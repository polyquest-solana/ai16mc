CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"username" varchar,
	"wallet" varchar,
	"private_key" text NOT NULL,
	"role" varchar(20) DEFAULT 'member' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_wallet_unique" UNIQUE("wallet")
);
--> statement-breakpoint
ALTER TABLE "market_predictions" RENAME COLUMN "creator" TO "creator_id";--> statement-breakpoint
ALTER TABLE "market_predictions" ADD CONSTRAINT "market_predictions_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;