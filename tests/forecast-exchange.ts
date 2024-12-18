import * as anchor from "@coral-xyz/anchor";
import { expect } from "chai";
import { PublicKey, Connection, Signer, sendAndConfirmTransaction } from "@solana/web3.js";
import { createNewMint, createUserWithLamports, mintTokenTo } from "../sdk/utils/helper";
import ForecastExchangeIDL from '../sdk/idl/forecast_exchange.json';
import { ForecastExchangeProgram } from "../sdk/forecast-exchange-program";
import { ForecastExchange } from "../target/types/forecast_exchange";
import { approve, getAccount, getAssociatedTokenAddress } from "@solana/spl-token";

describe.skip("forecast-exchange", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  let owner: Signer;
  let user: Signer;

  let tokenMint: PublicKey;
  let pointMint: PublicKey;

  const decimals = 9;
  const connection = new Connection("http://localhost:8899", 'confirmed');

  const forecastExchangeProgram = new ForecastExchangeProgram(ForecastExchangeIDL as ForecastExchange, connection);

  it("Success: Is initialized!", async () => {
    [owner, user] = await Promise.all([
      createUserWithLamports(connection, 10),
      createUserWithLamports(connection, 10),
    ]);

    tokenMint = await createNewMint(connection, owner, decimals);
    pointMint = await createNewMint(connection, owner, decimals);

    //mint for owner 3.000.000 points 
    await mintTokenTo(connection, pointMint, owner, owner, owner.publicKey, 3000000 * 10 ** decimals);

    //mint for owner 3.000.000 tokens 
    await mintTokenTo(connection, tokenMint, owner, owner, owner.publicKey, 3000000 * 10 ** decimals);

    //mint for user 3.000.000 tokens 
    await mintTokenTo(connection, tokenMint, owner, owner, user.publicKey, 3000000 * 10 ** decimals);

    const ownerPointTokenAccount = await getAssociatedTokenAddress(pointMint, owner.publicKey, true);

    const ownerTokenAccount = await getAssociatedTokenAddress(tokenMint, owner.publicKey, true);

    //approve to allow config account can transfer point from owner to user  
    await approve(connection, owner, ownerPointTokenAccount, forecastExchangeProgram.configPDA, owner.publicKey, 3000000 * 10 ** decimals, [owner]);

    //approve to allow config account can transfer token from owner to user  
    await approve(connection, owner, ownerTokenAccount, forecastExchangeProgram.configPDA, owner.publicKey, 3000000 * 10 ** decimals, [owner]);

    const tx = await forecastExchangeProgram.initialize(owner.publicKey, pointMint, tokenMint);
    await sendAndConfirmTransaction(connection, tx, [owner]);

    const configData = await forecastExchangeProgram.getConfigData();

    expect(configData.owner.toString()).to.equal(owner.publicKey.toString());
    expect(configData.tokenMint.toString()).to.equal(tokenMint.toString());
    expect(configData.pointMint.toString()).to.equal(pointMint.toString());
  });

  it("Success: Buy Point!", async () => {
    const buyAmount = new anchor.BN(1000 * 10 ** decimals);
    const tx = await forecastExchangeProgram.buyPoint(user.publicKey, buyAmount);
    await sendAndConfirmTransaction(connection, tx, [user]);
    const userPointTokenAccount = await getAssociatedTokenAddress(pointMint, user.publicKey, true);
    const userPointBalance = await getAccount(connection, userPointTokenAccount, 'confirmed');

    expect(buyAmount.toString()).to.equal(userPointBalance.amount.toString())
  });

  it("Success: Sell Point!", async () => {
    const sellAmount = new anchor.BN(500 * 10 ** decimals);
    const tx = await forecastExchangeProgram.sellPoint(user.publicKey, sellAmount);
    await sendAndConfirmTransaction(connection, tx, [user]);
    const userPointTokenAccount = await getAssociatedTokenAddress(pointMint, user.publicKey, true);
    const userPointBalance = await getAccount(connection, userPointTokenAccount, 'confirmed');

    //after sold 500 points have 500 points
    expect(userPointBalance.amount.toString()).to.equal(new anchor.BN(500 * 10 ** decimals).toString());
  });
});

