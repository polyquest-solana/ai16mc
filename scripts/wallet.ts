import { Keypair, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import {config} from 'dotenv';
config();

const ownerPrivatekey = bs58.decode(process.env.OWNER_PRIVATE_KEY!);

export const owner = Keypair.fromSecretKey(ownerPrivatekey);