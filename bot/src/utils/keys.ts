import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";

export const getAdminKp = () => {
  return Keypair.fromSecretKey(
    bs58.decode(process.env.PROGRAM_MARKET_OWNER_SECRET!)
  );
};
