import ForecastMarketIDL from "../target/idl/forecast_market.json";
import { ForecastMarketProgram } from "../sdk/forecast-market-program";
import {
  Connection,
  Transaction,
  sendAndConfirmTransaction,
  PublicKey,
  clusterApiUrl,
  Keypair,
} from "@solana/web3.js";
import { owner } from "./wallet";
import { getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import { ForecastMarket } from "../target/types/forecast_market";
import { createNewMint, mintTokenTo } from "../sdk/utils/helper";

const args = process.argv.slice(2);

async function main() {
  let tx: Transaction;
  const rewardApr = 0;
  const url = args.indexOf("--url");
  let rpcUrl = args[url + 1];
  const connection = new Connection(rpcUrl, "confirmed");

  const forecastMarketProgram = new ForecastMarketProgram(
    ForecastMarketIDL as ForecastMarket,
    connection
  );

  const rewardMint = await createNewMint(connection, owner, 6);
  console.log("reward-mint: ", rewardMint.toString());

  //init forecast market program
  tx = await forecastMarketProgram.initialize(
    owner.publicKey,
    rewardMint,
    rewardApr
  );
  await sendAndConfirmTransaction(connection, tx, [owner]);

  let configAccount = forecastMarketProgram.configPDA;
  console.log("configAccount: ", configAccount.toString());

  //set up fee service account and remain account
  tx = await forecastMarketProgram.setAccount(
    owner.publicKey,
    owner.publicKey,
    owner.publicKey
  );
  await sendAndConfirmTransaction(connection, tx, [owner]);

  //set up token account
  await getOrCreateAssociatedTokenAccount(
    connection,
    owner,
    rewardMint,
    owner.publicKey,
    true
  );

  //send reward to vault reward
  await mintTokenTo(
    connection,
    rewardMint,
    owner,
    owner,
    forecastMarketProgram.configPDA,
    1_000_0000
  );
  await mintTokenTo(
    connection,
    rewardMint,
    owner,
    owner,
    owner.publicKey,
    1_000_0000
  );
}

main();
