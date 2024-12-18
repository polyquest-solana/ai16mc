
import { Keypair, PublicKey, Connection, Signer, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { createMint, getMint, getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";

export async function createUserWithLamports(
  connection: Connection,
  lamports: number,
): Promise<Signer> {
  const account = Keypair.generate();
  const signature = await connection.requestAirdrop(
    account.publicKey,
    lamports * LAMPORTS_PER_SOL
  );
  const block = await connection.getLatestBlockhash();
  await connection.confirmTransaction({ ...block, signature });
  return account;
}

export async function createNewMint(
  connection: Connection,
  creator: Signer,
  decimals: number
): Promise<PublicKey> {
  const tokenMint = await createMint(
    connection,
    creator, // payer
    creator.publicKey, // mintAuthority
    creator.publicKey, // freezeAuthority
    decimals // decimals
  );
  return tokenMint
}

export async function mintTokenTo(
  connection: Connection,
  tokenMint: PublicKey,
  mintAuthority: Signer,
  payer: Signer,
  to: PublicKey,
  amount: number
): Promise<PublicKey> {

  const userTokenAccount = await getOrCreateAssociatedTokenAccount(connection, payer, tokenMint, to, true);

  const mintInfo = await getMint(connection, tokenMint);

  //mint for dever 3_000_000 tokens
  await mintTo(
    connection,
    payer,
    tokenMint,
    userTokenAccount.address,
    mintAuthority,
    amount * 10 ** mintInfo.decimals,
  );

  return userTokenAccount.address

}

export async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
