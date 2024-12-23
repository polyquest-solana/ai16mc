import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { getAdminKp } from "../utils/keys";
import idl from "../program/forecast_market.json";
import { ForecastMarketProgram } from "../program/forecast-market-program";
import { USDC_MINT } from "../common/constants";
import { BN } from "@coral-xyz/anchor";
import { sendTransaction } from "../utils/connection";

export class MarketService {
  private readonly signer: Keypair;
  private readonly connection: Connection;

  constructor() {
    this.signer = getAdminKp();
    this.connection = new Connection(process.env.SOLANA_RPC_URL!, "confirmed");
  }

  public async createPrediction(params: {
    title: string;
    description: string;
  }) {
    const program = new ForecastMarketProgram(idl as any, this.connection);

    const marketKey = new BN(Date.now());
    console.log("marketKey", marketKey.toString());

    const createFee = new BN(15);
    const creatorFeePercentage = new BN(15);
    const cojamFeePercentage = new BN(15);

    const draftMarketTx = await program.draftMarket(
      this.signer.publicKey,
      this.signer.publicKey,
      USDC_MINT,
      new BN(Date.now()),
      params.title,
      createFee,
      creatorFeePercentage,
      cojamFeePercentage
    );

    const answerKeys = [new BN(0), new BN(1), new BN(2)];

    const addAnswerKeysTx = await program.addAnswerKeys(
      this.signer.publicKey,
      marketKey,
      answerKeys
    );

    const approveMarketTx = await program.approveMarket(
      this.signer.publicKey,
      marketKey
    );

    const signature = await sendTransaction(
      this.connection,
      this.signer.publicKey,
      [
        ...draftMarketTx.instructions,
        ...addAnswerKeysTx.instructions,
        ...approveMarketTx.instructions,
      ],
      [this.signer]
    );

    return {
      signature,
      marketKey,
      answerKeys,
    };
  }

  public async bet(params: {
    marketKey: string;
    betAmount: number;
    answerKey: number | string;
  }) {
    const program = new ForecastMarketProgram(idl as any, this.connection);

    const betTx = await program.bet(
      this.signer.publicKey,
      new BN(params.marketKey),
      new BN(params.betAmount * 10 ** 6),
      new BN(params.answerKey)
    );

    const signature = await sendTransaction(
      this.connection,
      this.signer.publicKey,
      [...betTx.instructions],
      [this.signer]
    );

    return {
      signature,
    };
  }

  public async finishMarket(params: {
    marketKey: string;
    answerKey: number | string;
  }) {
    const program = new ForecastMarketProgram(idl as any, this.connection);

    const finishMarketTx = await program.finishMarket(
      this.signer.publicKey,
      new BN(params.marketKey)
    );

    const successMarketTx = await program.successMarket(
      this.signer.publicKey,
      new BN(params.marketKey),
      new BN(params.answerKey)
    );

    const signature = await sendTransaction(
      this.connection,
      this.signer.publicKey,
      [...finishMarketTx.instructions, ...successMarketTx.instructions],
      [this.signer]
    );

    return {
      signature,
    };
  }

  public async claimReward(params: {
    voter: string;
    marketKey: string;
    answerKeys: (number | string)[];
  }) {
    const program = new ForecastMarketProgram(idl as any, this.connection);

    const claimTokenTxs = await Promise.all(
      params.answerKeys.map((answerKey) =>
        program.claimToken(
          new PublicKey(params.voter),
          new BN(params.marketKey),
          new BN(answerKey)
        )
      )
    );

    const signature = await sendTransaction(
      this.connection,
      this.signer.publicKey,
      [...claimTokenTxs.map((tx) => tx.instructions).flat()],
      [this.signer]
    );

    return {
      signature,
    };
  }
}
