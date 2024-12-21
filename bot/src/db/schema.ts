import {
  pgTable,
  varchar,
  text,
  timestamp,
  integer,
  numeric,
} from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  username: varchar("username").unique(),
  wallet: varchar("wallet").unique(),
  privateKey: text("private_key").notNull(),
  role: varchar("role", { length: 20 }).notNull().default("member"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const markets = pgTable("market_predictions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  title: varchar("title", { length: 100 }),
  description: text("description"),
  marketKey: varchar("market_key").unique(),
  creatorId: varchar("creator_id")
    .references(() => users.id)
    .notNull(),
  date: timestamp("date").notNull().defaultNow(),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const marketOptions = pgTable("market_options", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  marketId: varchar("market_id")
    .references(() => markets.id)
    .notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  answerKey: integer("answer_key").notNull(),
  odd: numeric("odd", { precision: 10, scale: 2 }).notNull(),
});

export const bets = pgTable("bets", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  userId: varchar("user_id")
    .references(() => users.id)
    .notNull(),
  optionId: varchar("option_id")
    .references(() => marketOptions.id)
    .notNull(),

  amount: numeric("amount"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const userRelations = relations(users, ({ many }) => ({
  markets: many(markets),
}));

export const marketRelations = relations(markets, ({ many, one }) => ({
  options: many(marketOptions),
  creator: one(users, {
    fields: [markets.creatorId],
    references: [users.id],
  }),
}));

export const optionsRelations = relations(marketOptions, ({ one }) => ({
  market: one(markets, {
    fields: [marketOptions.marketId],
    references: [markets.id],
  }),
}));

export const betsRelations = relations(bets, ({ one }) => ({
  user: one(users, {
    fields: [bets.userId],
    references: [users.id],
  }),
  option: one(marketOptions, {
    fields: [bets.optionId],
    references: [marketOptions.id],
  }),
}));

export type User = typeof users.$inferSelect;

// export const users = pgTable("users", {
//   id: serial("id").primaryKey(),
//   name: varchar("name", { length: 100 }),
//   email: varchar("email", { length: 255 }).notNull().unique(),
//   passwordHash: text("password_hash").notNull(),
//   role: varchar("role", { length: 20 }).notNull().default("member"),
//   createdAt: timestamp("created_at").notNull().defaultNow(),
//   updatedAt: timestamp("updated_at").notNull().defaultNow(),
//   deletedAt: timestamp("deleted_at"),
// });

// export const teams = pgTable("teams", {
//   id: serial("id").primaryKey(),
//   name: varchar("name", { length: 100 }).notNull(),
//   createdAt: timestamp("created_at").notNull().defaultNow(),
//   updatedAt: timestamp("updated_at").notNull().defaultNow(),
//   stripeCustomerId: text("stripe_customer_id").unique(),
//   stripeSubscriptionId: text("stripe_subscription_id").unique(),
//   stripeProductId: text("stripe_product_id"),
//   planName: varchar("plan_name", { length: 50 }),
//   subscriptionStatus: varchar("subscription_status", { length: 20 }),
// });

// export const teamMembers = pgTable("team_members", {
//   id: serial("id").primaryKey(),
//   userId: integer("user_id")
//     .notNull()
//     .references(() => users.id),
//   teamId: integer("team_id")
//     .notNull()
//     .references(() => teams.id),
//   role: varchar("role", { length: 50 }).notNull(),
//   joinedAt: timestamp("joined_at").notNull().defaultNow(),
// });

// export const activityLogs = pgTable("activity_logs", {
//   id: serial("id").primaryKey(),
//   teamId: integer("team_id")
//     .notNull()
//     .references(() => teams.id),
//   userId: integer("user_id").references(() => users.id),
//   action: text("action").notNull(),
//   timestamp: timestamp("timestamp").notNull().defaultNow(),
//   ipAddress: varchar("ip_address", { length: 45 }),
// });

// export const invitations = pgTable("invitations", {
//   id: serial("id").primaryKey(),
//   teamId: integer("team_id")
//     .notNull()
//     .references(() => teams.id),
//   email: varchar("email", { length: 255 }).notNull(),
//   role: varchar("role", { length: 50 }).notNull(),
//   invitedBy: integer("invited_by")
//     .notNull()
//     .references(() => users.id),
//   invitedAt: timestamp("invited_at").notNull().defaultNow(),
//   status: varchar("status", { length: 20 }).notNull().default("pending"),
// });

// export const teamsRelations = relations(teams, ({ many }) => ({
//   teamMembers: many(teamMembers),
//   activityLogs: many(activityLogs),
//   invitations: many(invitations),
// }));

// export const usersRelations = relations(users, ({ many }) => ({
//   teamMembers: many(teamMembers),
//   invitationsSent: many(invitations),
// }));

// export const invitationsRelations = relations(invitations, ({ one }) => ({
//   team: one(teams, {
//     fields: [invitations.teamId],
//     references: [teams.id],
//   }),
//   invitedBy: one(users, {
//     fields: [invitations.invitedBy],
//     references: [users.id],
//   }),
// }));

// export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
//   user: one(users, {
//     fields: [teamMembers.userId],
//     references: [users.id],
//   }),
//   team: one(teams, {
//     fields: [teamMembers.teamId],
//     references: [teams.id],
//   }),
// }));

// export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
//   team: one(teams, {
//     fields: [activityLogs.teamId],
//     references: [teams.id],
//   }),
//   user: one(users, {
//     fields: [activityLogs.userId],
//     references: [users.id],
//   }),
// }));

// export type NewUser = typeof users.$inferInsert;
// export type Team = typeof teams.$inferSelect;
// export type NewTeam = typeof teams.$inferInsert;
// export type TeamMember = typeof teamMembers.$inferSelect;
// export type NewTeamMember = typeof teamMembers.$inferInsert;
// export type ActivityLog = typeof activityLogs.$inferSelect;
// export type NewActivityLog = typeof activityLogs.$inferInsert;
// export type Invitation = typeof invitations.$inferSelect;
// export type NewInvitation = typeof invitations.$inferInsert;
// export type TeamDataWithMembers = Team & {
//   teamMembers: (TeamMember & {
//     user: Pick<User, "id" | "name" | "email">;
//   })[];
// };

// export enum ActivityType {
//   SIGN_UP = "SIGN_UP",
//   SIGN_IN = "SIGN_IN",
//   SIGN_OUT = "SIGN_OUT",
//   UPDATE_PASSWORD = "UPDATE_PASSWORD",
//   DELETE_ACCOUNT = "DELETE_ACCOUNT",
//   UPDATE_ACCOUNT = "UPDATE_ACCOUNT",
//   CREATE_TEAM = "CREATE_TEAM",
//   REMOVE_TEAM_MEMBER = "REMOVE_TEAM_MEMBER",
//   INVITE_TEAM_MEMBER = "INVITE_TEAM_MEMBER",
//   ACCEPT_INVITATION = "ACCEPT_INVITATION",
// }
