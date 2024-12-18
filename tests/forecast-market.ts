import * as anchor from "@coral-xyz/anchor";
import { expect } from "chai";
import { PublicKey, Connection, Signer, sendAndConfirmTransaction } from "@solana/web3.js";
import { createNewMint, createUserWithLamports, mintTokenTo, sleep } from "../sdk/utils/helper";
import ForecastMarketIDL from '../target/idl/forecast_market.json';
import { getAssociatedTokenAddress, getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";
import { ForecastMarketProgram } from "../sdk/forecast-market-program";
import { ForecastMarket } from "../target/types/forecast_market";

describe("forecast-market", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  let owner: Signer;
  let creator: Signer;
  let voter: Signer;
  let voter2: Signer;
  let voter3: Signer;

  let serviceFeeAccount: Signer;
  let remainAccount: Signer

  let betMint: PublicKey;
  let rewardMint: PublicKey;

  const rewardAPR = 2000 //20% per year
  const answerKeys = [
    new anchor.BN(0),
    new anchor.BN(1),
    new anchor.BN(2),
    new anchor.BN(3),
  ];

  const decimals = 9;
  const connection = new Connection("http://localhost:8899", 'confirmed');

  const forecastMarketProgram = new ForecastMarketProgram(ForecastMarketIDL as ForecastMarket, connection);

  const marketKey = new anchor.BN(1);

  it("Success: Is initialized!", async () => {
    [owner, creator, voter, voter2, voter3, serviceFeeAccount, remainAccount] = await Promise.all([
      createUserWithLamports(connection, 10),
      createUserWithLamports(connection, 10),
      createUserWithLamports(connection, 10),
      createUserWithLamports(connection, 10),
      createUserWithLamports(connection, 10),
      createUserWithLamports(connection, 10),
      createUserWithLamports(connection, 10)
    ]);

    betMint = await createNewMint(connection, owner, 9);
    rewardMint = await createNewMint(connection, owner, 9);

    const tx = await forecastMarketProgram.initialize(owner.publicKey, rewardMint, rewardAPR);
    await sendAndConfirmTransaction(connection, tx, [owner]);

    const configData = await forecastMarketProgram.getConfigData();

    await mintTokenTo(connection, betMint, owner, owner, voter.publicKey, 3000000);
    await mintTokenTo(connection, betMint, owner, owner, voter2.publicKey, 3000000);
    await mintTokenTo(connection, betMint, owner, owner, voter3.publicKey, 3000000);

    //mint for vault reward 10M token;
    await mintTokenTo(connection, rewardMint, owner, owner, forecastMarketProgram.configPDA, 10_000_000);

    expect(configData.owner.toString()).to.equal(owner.publicKey.toString());
    expect(configData.rewardMint.toString()).to.equal(rewardMint.toString());
    expect(configData.rewardApr.toString()).to.equal(rewardAPR.toString());
  });

  it("Success: Set accounts!", async () => {

    //create serviceFeeAccount, remainAccount token account 
    await getOrCreateAssociatedTokenAccount(connection, owner, betMint, serviceFeeAccount.publicKey, true);
    await getOrCreateAssociatedTokenAccount(connection, owner, betMint, remainAccount.publicKey, true);

    const tx = await forecastMarketProgram.setAccount(owner.publicKey, serviceFeeAccount.publicKey, remainAccount.publicKey);
    await sendAndConfirmTransaction(connection, tx, [owner]);

    const configData = await forecastMarketProgram.getConfigData();

    expect(configData.serviceFeeAccount.toString()).to.equal(serviceFeeAccount.publicKey.toString());


    expect(configData.remainAccount.toString()).to.equal(remainAccount.publicKey.toString());
  });

  it("Success: Draft market", async () => {
    const title = 'Test Title';
    const createFee = new anchor.BN(15);
    const creatorFeePercentage = new anchor.BN(15);
    const cojamFeePercentage = new anchor.BN(15);

    const tx = await forecastMarketProgram
      .draftMarket(owner.publicKey, owner.publicKey, betMint, marketKey, title, createFee, creatorFeePercentage, cojamFeePercentage);

    await sendAndConfirmTransaction(connection, tx, [owner]);

    const marketData = await forecastMarketProgram.getMarketData(marketKey);

    expect(marketData.creator.toString()).to.equal(owner.publicKey.toString());
    expect(marketData.betMint.toString()).to.equal(betMint.toString());
    expect(marketData.status).to.deep.equal({ draft: {} })
  });

  it("Success: Add New Answer Keys", async () => {
    const tx = await forecastMarketProgram
      .addAnswerKeys(owner.publicKey, marketKey, answerKeys);
    await sendAndConfirmTransaction(connection, tx, [owner]);

    const answerData = await forecastMarketProgram.getAnswerData(marketKey);

    for (let index in answerData.answers) {
      expect(answerData.answers[index].answerKey.toString()).to.equal(answerKeys[index].toString());
    }
  });

  it("Success: Add 1 answer key to old answer keys", async () => {
    const addedAnswerKey = [new anchor.BN(4)];
    const tx = await forecastMarketProgram
      .addAnswerKeys(owner.publicKey, marketKey, addedAnswerKey);
    await sendAndConfirmTransaction(connection, tx, [owner]);
    const answerData = await forecastMarketProgram.getAnswerData(marketKey);

    const expectedAnswerKeys = [...answerKeys, ...addedAnswerKey];
    for (let index in answerData.answers) {
      expect(answerData.answers[index].answerKey.toString()).to.equal(expectedAnswerKeys[index].toString());
    }
  });

  it("Success: Approve market", async () => {
    const tx = await forecastMarketProgram
      .approveMarket(owner.publicKey, marketKey);
    await sendAndConfirmTransaction(connection, tx, [owner]);

    const marketData = await forecastMarketProgram.getMarketData(marketKey);
    expect(marketData.status).to.deep.equal({ approve: {} })
  });
  // // //anwser_key: u64, amount: u64
  it("Success: Voter 1 Betting", async () => {

    const answerKey = answerKeys[0];
    const betAmount = new anchor.BN(1000 * 10 ** decimals);

    const tx = await forecastMarketProgram
      .bet(voter.publicKey, marketKey, betAmount, answerKey)

    await sendAndConfirmTransaction(connection, tx, [voter]);

    const betData = await forecastMarketProgram.getBettingData(voter.publicKey, marketKey, answerKey);
    expect(betData.marketKey.toString()).to.equal(marketKey.toString());
    expect(betData.answerKey.toString()).to.equal(answerKey.toString());
    expect(betData.voter.toString()).to.equal(voter.publicKey.toString());
    expect(betData.tokens.toNumber()).to.equal(betAmount.toNumber());

    const marketVaultBalance = await forecastMarketProgram.getMarketVaultBalance(marketKey);
    expect(Number(marketVaultBalance.amount)).to.equal(betAmount.toNumber());
  });

  it("Success: Voter 1 Betting", async () => {
    const answerKey = answerKeys[0];
    const betAmount = new anchor.BN(2000 * 10 ** decimals);

    const tx = await forecastMarketProgram
      .bet(voter.publicKey, marketKey, betAmount, answerKey)

    await sendAndConfirmTransaction(connection, tx, [voter]);

    const betData = await forecastMarketProgram.getBettingData(voter.publicKey, marketKey, answerKey);
    expect(betData.marketKey.toString()).to.equal(marketKey.toString());
    expect(betData.answerKey.toString()).to.equal(answerKey.toString());
    expect(betData.voter.toString()).to.equal(voter.publicKey.toString());
    expect(betData.tokens.toNumber()).to.equal(3000 * 10 ** decimals);

    const answerData = await forecastMarketProgram.getAnswerData(marketKey);
    expect(answerData.answers[0].answerTotalTokens.toNumber()).to.equal(3000 * 10 ** decimals);
  });

  it("Success: Voter 2 Betting", async () => {
    const answerKey = answerKeys[1];
    const betAmount = new anchor.BN(2000 * 10 ** decimals);

    const tx = await forecastMarketProgram
      .bet(voter2.publicKey, marketKey, betAmount, answerKey)

    await sendAndConfirmTransaction(connection, tx, [voter2]);

    const betData = await forecastMarketProgram.getBettingData(voter2.publicKey, marketKey, answerKey);
    expect(betData.marketKey.toString()).to.equal(marketKey.toString());
    expect(betData.answerKey.toString()).to.equal(answerKey.toString());
    expect(betData.voter.toString()).to.equal(voter2.publicKey.toString());

    const answerData = await forecastMarketProgram.getAnswerData(marketKey);
    expect(answerData.answers[1].answerTotalTokens.toNumber()).to.equal(2000 * 10 ** decimals);
  });

  it("Success: Voter 3 Betting", async () => {
    const answerKey = answerKeys[1];
    const betAmount = new anchor.BN(2000 * 10 ** decimals);

    const tx = await forecastMarketProgram
      .bet(voter3.publicKey, marketKey, betAmount, answerKey)

    await sendAndConfirmTransaction(connection, tx, [voter3]);

    const betData = await forecastMarketProgram.getBettingData(voter3.publicKey, marketKey, answerKey);

    expect(betData.marketKey.toString()).to.equal(marketKey.toString());
    expect(betData.answerKey.toString()).to.equal(answerKey.toString());
    expect(betData.voter.toString()).to.equal(voter3.publicKey.toString());

    const answerData = await forecastMarketProgram.getAnswerData(marketKey);
    expect(answerData.answers[1].answerTotalTokens.toNumber()).to.equal(4000 * 10 ** decimals);
  });

  it("Success: Finish market", async () => {
    await sleep(10000);
    const tx = await forecastMarketProgram
      .finishMarket(owner.publicKey, marketKey);

    await sendAndConfirmTransaction(connection, tx, [owner]);

    const marketData = await forecastMarketProgram.getMarketData(marketKey);
    expect(marketData.status).to.deep.equal({ finished: {} })
  });

  it("Success: Set success market", async () => {
    const answerKey = answerKeys[0];

    await getOrCreateAssociatedTokenAccount(connection, owner, betMint, owner.publicKey, true);
    const tx = await forecastMarketProgram
      .successMarket(owner.publicKey, marketKey, answerKey);

    await sendAndConfirmTransaction(connection, tx, [owner]);
    const marketData = await forecastMarketProgram.getMarketData(marketKey);
    expect(marketData.status).to.deep.equal({ success: {} })
  });

  it("Success: Voter 1 claim token", async () => {
    const answerKey = answerKeys[0];

    const rewardData = await forecastMarketProgram.getPendingRewardData(voter.publicKey, marketKey, answerKey);
    console.log('rewardData: ', rewardData.recieveTokens.toString());
    console.log('pendingReward: ', rewardData.pendingReward.toString());

    const tx = await forecastMarketProgram
      .claimToken(voter.publicKey, marketKey, answerKey);

    await sendAndConfirmTransaction(connection, tx, [voter]);

    const voterRewardTokenAccount = await getAssociatedTokenAddress(rewardMint, voter.publicKey);
    const voterBetTokenAccount = await getAssociatedTokenAddress(betMint, voter.publicKey);
    const userBetTokenBalance = await connection.getTokenAccountBalance(voterBetTokenAccount);

    const voterRewardTokenBalance = await connection.getTokenAccountBalance(voterRewardTokenAccount);
    
    console.log('voterRewardTokenBalance: ', voterRewardTokenBalance)
    console.log('userBetTokenBalance: ', userBetTokenBalance)

  });

  it("Success: Voter 2 claim token", async () => {
    const answerKey = answerKeys[1];
    const marketData = await forecastMarketProgram.getMarketData(marketKey);

    const tx = await forecastMarketProgram
      .claimToken(voter2.publicKey, marketKey, answerKey);

    await sendAndConfirmTransaction(connection, tx, [voter2]);

    const voterRewardTokenAccount = await getAssociatedTokenAddress(rewardMint, voter2.publicKey);
    const voterBetTokenAccount = await getAssociatedTokenAddress(betMint, voter2.publicKey);
    const userBetTokenBalance = await connection.getTokenAccountBalance(voterBetTokenAccount);

    const voterRewardTokenBalance = await connection.getTokenAccountBalance(voterRewardTokenAccount);
    console.log('voterRewardTokenBalance: ', voterRewardTokenBalance)
    console.log('userBetTokenBalance: ', userBetTokenBalance)

  });

  it("Success: Update reward config", async () => {
    const newRewardAPR = 4000 //40% per year
    const tx = await forecastMarketProgram
      .updateRewardConfig(owner.publicKey, null, new anchor.BN(newRewardAPR));

    await sendAndConfirmTransaction(connection, tx, [owner]);

    const configData = await forecastMarketProgram.getConfigData();
    expect(configData.rewardApr.toString()).to.equal(newRewardAPR.toString());
  });

});