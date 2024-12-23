import { drizzle } from "drizzle-orm/postgres-js";
import bs58 from "bs58";
import postgres from "postgres";
import * as schema from "./schema";
import dotenv from "dotenv";
import { Keypair } from "@solana/web3.js";
import { getAdminKp } from "../utils/keys";
import { and, eq, or } from "drizzle-orm";
import { ADMIN_USERNAMES } from "../common/constants";

dotenv.config();

if (!process.env.POSTGRES_URL) {
  throw new Error("POSTGRES_URL environment variable is not set");
}

export const client = postgres(process.env.POSTGRES_URL);
export const db = drizzle(client, { schema });

export const createUser = async (username: string) => {
  const isAdmin = ADMIN_USERNAMES.includes(username);

  const kp = isAdmin ? getAdminKp() : Keypair.generate();

  await db
    .insert(schema.users)
    .values({
      username,
      wallet: kp.publicKey.toBase58(),
      privateKey: bs58.encode(kp.secretKey),
      role: isAdmin ? "admin" : "member",
    })
    .onConflictDoNothing({
      target: schema.users.username,
    });

  const user = await db.query.users.findFirst({
    where: eq(schema.users.username, username),
  });

  return user;
};

export const getActiveMarket = () =>
  db.query.markets.findFirst({
    with: {
      options: true,
    },
  });

export const getMarketByKey = (marketKey: string) =>
  db.query.markets.findFirst({
    where: eq(schema.markets.marketKey, marketKey),
    with: {
      options: true,
    },
  });

export const getUserBets = async (userId: string, marketKey: string) => {
  const market = await db.query.markets.findFirst({
    where: eq(schema.markets.marketKey, marketKey),
    with: {
      options: true,
    },
  });

  return await db.query.bets.findMany({
    where: and(
      eq(schema.bets.userId, userId),
      or(
        ...market!.options.map((option) => eq(schema.bets.optionId, option.id))
      )
    ),
    with: {
      option: true,
    },
  });
};

export const updateUserBets = async (userId: string, marketKey: string) => {
  const market = await db.query.markets.findFirst({
    where: eq(schema.markets.marketKey, marketKey),
    with: {
      options: true,
    },
  });

  return await db
    .update(schema.bets)
    .set({ claimed: true })
    .where(
      and(
        eq(schema.bets.userId, userId),
        or(
          ...market!.options.map((option) =>
            eq(schema.bets.optionId, option.id)
          )
        )
      )
    );
};
