import { BN, IdlAccounts, IdlEvents, Program } from '@coral-xyz/anchor';
import {
  Connection,
  PublicKey,
  Transaction,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from '@solana/spl-token';
import { SYSTEM_PROGRAM_ID } from '@coral-xyz/anchor/dist/cjs/native/system';
import { ForecastMarket } from '../target/types/forecast_market';

export type ConfigData = IdlAccounts<ForecastMarket>['configAccount'];
export type MarketData = IdlAccounts<ForecastMarket>["marketAccount"];
export type AnswerData = IdlAccounts<ForecastMarket>["answerAccount"];
export type BettingData = IdlAccounts<ForecastMarket>["bettingAccount"];

export type MarketDraftedEvent = IdlEvents<ForecastMarket>["marketDrafted"];
export type MarketApprovedEvent = IdlEvents<ForecastMarket>["marketApproved"];
export type MarketSuccessEvent = IdlEvents<ForecastMarket>["marketSuccess"];
export type MarketFinishedEvent = IdlEvents<ForecastMarket>["marketFinished"];
export type MarketAdjournedEvent = IdlEvents<ForecastMarket>["marketAdjourned"];

export type AnswerAddedEvent = IdlEvents<ForecastMarket>["answerAdded"];
export type BetPlacedEvent = IdlEvents<ForecastMarket>["betPlaced"];
export type TokenClaimedEvent = IdlEvents<ForecastMarket>["tokenClaimed"];
export type RewardClaimedEvent = IdlEvents<ForecastMarket>["rewardClaimed"];

export class ForecastMarketProgram {
  constructor(
    public readonly idl: ForecastMarket,
    public readonly connection: Connection
  ) { }

  get program() {
    return new Program(this.idl, { connection: this.connection });
  }

  get accounts(): any {
    return this.program.account;
  }

  get configPDA(): PublicKey {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      this.program.programId
    )[0];
  }

  public marketPDA(marketKey: BN): PublicKey {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("market"), marketKey.toBuffer("le", 8)],
      this.program.programId
    )[0];
  }

  public answerPDA(marketKey: BN): PublicKey {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("answer"), marketKey.toBuffer("le", 8)],
      this.program.programId
    )[0];
  }

  public bettingPDA(voter: PublicKey, marketKey: BN, anwserKey: BN): PublicKey {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("betting"), voter.toBuffer(), marketKey.toBuffer("le", 8), anwserKey.toBuffer("le", 8)],
      this.program.programId
    )[0];
  }

  /**
   * Adds an event listener for the 'marketDrafted' event.
   * @param handler - The function to handle the event.
   */
  onMarketDrafted(handler: (event: MarketDraftedEvent) => void) {
    this.program.addEventListener('marketDrafted', handler)
  }

  /**
   * Adds an event listener for the 'answerAdded' event.
   * @param handler - The function to handle the event.
   */
  onAddAnswersKey(handler: (event: AnswerAddedEvent) => void) {
    this.program.addEventListener('answerAdded', handler)
  }

  /**
   * Adds an event listener for the 'marketApproved' event.
   * @param handler - The function to handle the event.
   */
  onMarketApproved(handler: (event: MarketApprovedEvent) => void) {
    this.program.addEventListener('marketApproved', handler)
  }

  /**
   * Adds an event listener for the 'marketFinished' event.
   * @param handler - The function to handle the event.
   */
  onMarketFinished(handler: (event: MarketFinishedEvent) => void) {
    this.program.addEventListener('marketFinished', handler)
  }

  /**
   * Adds an event listener for the 'marketSuccess' event.
   * @param handler - The function to handle the event.
   */
  onMarketSuccess(handler: (event: MarketSuccessEvent) => void) {
    this.program.addEventListener('marketSuccess', handler)
  }

  /**
   * Adds an event listener for the 'betPlaced' event.
   * @param handler - The function to handle the event.
   */
  onBetPlaced(handler: (event: BetPlacedEvent) => any) {
    this.program.addEventListener('betPlaced', handler)
  }

  /**
   * Adds an event listener for the 'marketAdjourned' event.
   * @param handler - The function to handle the event.
   */
  onMarketAdjourned(handler: (event: MarketAdjournedEvent) => any) {
    this.program.addEventListener('marketAdjourned', handler)
  }

  /**
   * Adds an event listener for the 'tokenClaimed' event.
   * @param handler - The function to handle the event.
   */
  onTokenClaimed(handler: (event: TokenClaimedEvent) => any) {
    this.program.addEventListener('tokenClaimed', handler)
  }

  /**
 * Adds an event listener for the 'rewardClaimed' event.
 * @param handler - The function to handle the event.
 */
  onRewardClaimed(handler: (event: RewardClaimedEvent) => any) {
    this.program.addEventListener('rewardClaimed', handler)
  }

  /**
   * Initializes the forecast market program.
   * @param owner - The public key of the owner.
   * @param rewardMint - The public key of the reward mint.
   * @param rewardApr - The annual percentage rate (APR) for rewards as a number.
   * @returns A transaction object for the initialization.
   */
  public async initialize(owner: PublicKey, rewardMint: PublicKey, rewardApr: number): Promise<Transaction> {
    const rewardAprBN = new BN(rewardApr)
    const tx = await this.program.methods
      .initialize(rewardMint, rewardAprBN)
      .accountsPartial({
        owner: owner,
        configAccount: this.configPDA,
      })
      .transaction();
    return tx;
  }

  /**
   * Updates the service, and remaining fee accounts in the config.
   * @param owner - The public key of the owner.
   * @param serviceFeeAccount - The optional public key of the new service fee account.
   * @param remainAccount - The optional public key of the new remaining account.
   * @returns A transaction object for setting the accounts.
   */
  public async setAccount(
    owner: PublicKey,
    serviceFeeAccount?: PublicKey,
    remainAccount?: PublicKey
  ): Promise<Transaction> {
    const tx = await this.program.methods
      .setAccount(serviceFeeAccount || null, remainAccount || null)
      .accountsPartial({
        owner: owner,
        configAccount: this.configPDA,
      })
      .transaction();
    return tx;
  }

  /**
 * Updates reward apr and reward mint in the config.
 * @param owner - The public key of the owner.
 * @param rewardMint - The optional public key of the new reward mint.
 * @param rewardAPR - The optional public key of the new reward apr.
 * @returns A transaction object for setting the accounts.
 */
  public async updateRewardConfig(
    owner: PublicKey,
    rewardMint?: PublicKey,
    rewardAPR?: BN
  ): Promise<Transaction> {
    const tx = await this.program.methods
      .updateRewardConfig(rewardMint || null, rewardAPR || null)
      .accountsPartial({
        owner: owner,
        configAccount: this.configPDA,
      })
      .transaction();
    return tx;
  }

  /**
   * Drafts a new market.
   * @param owner - The public key of the owner.
   * @param creator - The public key of the market creator.
   * @param betMint - The public key of the bet mint.
   * @param marketKey - The key of the market.
   * @param title - The title of the market.
   * @param createFee - The creation fee for the market.
   * @param creatorFeePercentage - The percentage of fees for the market creator.
   * @param cojamFeePercentage - The percentage of fees for the platform (cojam).
   * @returns A transaction object for drafting the market.
   */
  public async draftMarket(
    owner: PublicKey,
    creator: PublicKey,
    betMint: PublicKey,
    marketKey: BN,
    title: string,
    createFee: BN,
    creatorFeePercentage: BN,
    cojamFeePercentage: BN,
  ): Promise<Transaction> {
    const tx = await this.program.methods
      .draftMarket(marketKey, creator, title, createFee, creatorFeePercentage, cojamFeePercentage)
      .accountsPartial({
        owner: owner,
        configAccount: this.configPDA,
        betMint: betMint,
        marketAccount: this.marketPDA(marketKey)
      })
      .transaction();
    return tx;
  }

  /**
   * Adds answer keys to a market.
   * @param owner - The public key of the owner.
   * @param marketKey - The key of the market.
   * @param anwserKeys - An array of answer keys to be added.
   * @returns A transaction object for adding the answer keys.
   */
  public async addAnswerKeys(owner: PublicKey, marketKey: BN, anwserKeys: BN[]): Promise<Transaction> {
    const tx = await this.program.methods
      .addAnswerKeys(anwserKeys)
      .accountsPartial({
        owner: owner,
        configAccount: this.configPDA,
        marketAccount: this.marketPDA(marketKey),
        answerAccount: this.answerPDA(marketKey)
      })
      .transaction();
    return tx;
  }

  /**
   * Approves a market for trading.
   * @param owner - The public key of the owner.
   * @param marketKey - The key of the market to be approved.
   * @returns A transaction object for approving the market.
   */
  public async approveMarket(owner: PublicKey, marketKey: BN): Promise<Transaction> {
    const tx = await this.program.methods
      .approveMarket()
      .accountsPartial({
        owner: owner,
        configAccount: this.configPDA,
        marketAccount: this.marketPDA(marketKey)
      })
      .transaction();
    return tx;
  }

  /**
   * Adjourns a market.
   * @param owner - The public key of the owner.
   * @param marketKey - The key of the market to be adjourned.
   * @returns A transaction object for adjourning the market.
   */
  public async adjournMarket(owner: PublicKey, marketKey: BN): Promise<Transaction> {
    const tx = await this.program.methods
      .adjournMarket()
      .accountsPartial({
        owner: owner,
        configAccount: this.configPDA,
        marketAccount: this.marketPDA(marketKey)
      })
      .transaction();
    return tx;
  }

  /**
   * Marks a market as finished.
   * @param owner - The public key of the owner.
   * @param marketKey - The key of the market to be finished.
   * @returns A transaction object for finishing the market.
   */
  public async finishMarket(owner: PublicKey, marketKey: BN): Promise<Transaction> {
    const tx = await this.program.methods
      .finishMarket()
      .accountsPartial({
        owner: owner,
        configAccount: this.configPDA,
        marketAccount: this.marketPDA(marketKey),
      })
      .transaction();
    return tx;
  }

  /**
   * Marks a market as successful with the correct answer.
   * @param owner - The public key of the owner.
   * @param marketKey - The key of the market.
   * @param correctAnswerKey - The key of the correct answer to finalize the market.
   * @returns A transaction object for marking the market as successful.
   */
  public async successMarket(owner: PublicKey, marketKey: BN, correctAnswerKey: BN): Promise<Transaction> {
    const configData = await this.getConfigData();
    const marketAccount = this.marketPDA(marketKey);
    const marketData = await this.getMarketData(marketKey);

    const vaultTokenAccount = await getAssociatedTokenAddress(marketData.betMint, marketAccount, true);
    const creatorTokenAccount = await getAssociatedTokenAddress(marketData.betMint, marketData.creator, true);
    const serviceTokenAccount = await getAssociatedTokenAddress(marketData.betMint, configData.serviceFeeAccount, true);

    const tx = await this.program.methods
      .successMarket(correctAnswerKey)
      .accountsPartial({
        owner: owner,
        configAccount: this.configPDA,
        vaultTokenAccount: vaultTokenAccount,
        creatorTokenAccount: creatorTokenAccount,
        serviceTokenAccount: serviceTokenAccount,
        marketAccount: this.marketPDA(marketKey),
        answerAccount: this.answerPDA(marketKey)
      })
      .transaction();
    return tx;
  }

  /**
 * Retrieve remain tokens from owner.
 * @param owner - The public key of the owner.
 * @param marketKey - The key of the market.
 * @returns A transaction object for retrieving token.
 */
  public async retrieveTokens(owner: PublicKey, marketKey: BN): Promise<Transaction> {
    const configData = await this.getConfigData();
    const marketAccount = this.marketPDA(marketKey);
    const marketData = await this.getMarketData(marketKey);

    const vaultTokenAccount = await getAssociatedTokenAddress(marketData.betMint, marketAccount, true);
    const remainTokenAccount = await getAssociatedTokenAddress(marketData.betMint, configData.remainAccount, true);

    const tx = await this.program.methods.retrieveTokens()
      .accountsPartial({
        owner: owner,
        configAccount: this.configPDA,
        vaultTokenAccount: vaultTokenAccount,
        remainsTokenAccount: remainTokenAccount,
        marketAccount: this.marketPDA(marketKey),
      })
      .transaction();
    return tx;
  }

  /**
   * Places a bet on a market.
   * @param voter - The public key of the voter placing the bet.
   * @param marketKey - The key of the market to bet on.
   * @param betAmount - The amount of the bet.
   * @param answerKey - The key of the answer the bet is placed on.
   * @returns A transaction object for placing the bet.
   */
  public async bet(voter: PublicKey, marketKey: BN, betAmount: BN, answerKey: BN): Promise<Transaction> {
    const marketAccount = this.marketPDA(marketKey);
    const marketData = await this.getMarketData(marketKey);
    const betMint = marketData.betMint;

    const userTokenAccount = await getAssociatedTokenAddress(betMint, voter);
    const vaultTokenAccount = await getAssociatedTokenAddress(betMint, marketAccount, true);

    const tx = await this.program.methods
      .bet(answerKey, betAmount)
      .accountsPartial({
        voter: voter,
        configAccount: this.configPDA,
        marketAccount: this.marketPDA(marketKey),
        answerAccount: this.answerPDA(marketKey),
        betMint: betMint,
        userTokenAccount: userTokenAccount,
        betAccount: this.bettingPDA(voter, marketKey, answerKey),
        vaultTokenAccount: vaultTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SYSTEM_PROGRAM_ID
      })
      .transaction();
    return tx;
  }

  /**
   * Claims tokens from a bet.
   * @param voter - The public key of the voter claiming the tokens.
   * @param marketKey - The key of the market where the bet was placed.
   * @param answerKey - The key of the answer on which the bet was placed.
   * @returns A transaction object for claiming the tokens.
   */
  public async claimToken(voter: PublicKey, marketKey: BN, answerKey: BN): Promise<Transaction> {
    let configData = await this.getConfigData();
    const configAccount = this.configPDA;
    const marketAccount = this.marketPDA(marketKey);
    const marketData = await this.getMarketData(marketKey);

    const userBetTokenAccount = await getAssociatedTokenAddress(marketData.betMint, voter);
    const userRewardTokenAccount = await getAssociatedTokenAddress(configData.rewardMint, voter);
    const vaultBetTokenAccount = await getAssociatedTokenAddress(marketData.betMint, marketAccount, true);
    const vaultRewardTokenAccount = await getAssociatedTokenAddress(configData.rewardMint, configAccount, true);

    const tx = await this.program.methods
      .claimToken()
      .accountsPartial({
        voter: voter,
        configAccount: this.configPDA,
        marketAccount: this.marketPDA(marketKey),
        answerAccount: this.answerPDA(marketKey),
        betMint: marketData.betMint,
        rewardMint: configData.rewardMint,
        vaultBetTokenAccount: vaultBetTokenAccount,
        vaultRewardTokenAccount: vaultRewardTokenAccount,
        userRewardTokenAccount: userRewardTokenAccount,
        userBetTokenAccount: userBetTokenAccount,
        betAccount: this.bettingPDA(voter, marketKey, answerKey),
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SYSTEM_PROGRAM_ID
      })
      .transaction();
    return tx;
  }

  /**
   * Retrieves the configuration data.
   * @returns The configuration data as a `ConfigData` object.
   */
  public async getConfigData(): Promise<ConfigData> {
    const configPDA = this.configPDA;
    const configData = await this.accounts.configAccount.fetch(configPDA);
    return configData;
  }

  /**
   * Retrieves the market data for a given market key.
   * @param marketKey - The key of the market.
   * @returns The market data as a `MarketData` object.
   */
  async getMarketData(marketKey: BN): Promise<MarketData> {
    const marketPDA = this.marketPDA(marketKey);
    const marketData = await this.accounts.marketAccount.fetch(marketPDA);
    return marketData;
  }

  /**
   * Retrieves the answer data for a given market key.
   * @param marketKey - The key of the market.
   * @returns The answer data as an `AnswerData` object.
   */
  public async getAnswerData(marketKey: BN): Promise<AnswerData> {
    const answerPDA = this.answerPDA(marketKey);
    const answerData = await this.accounts.answerAccount.fetch(answerPDA);
    return answerData;
  }

  /**
   * Retrieves the betting data for a given voter, market key, and answer key.
   * @param voter - The public key of the voter.
   * @param marketKey - The key of the market.
   * @param anwserKey - The key of the answer.
   * @returns The betting data as a `BettingData` object.
   */
  public async getBettingData(voter: PublicKey, marketKey: BN, anwserKey: BN): Promise<BettingData> {
    const bettingPDA = this.bettingPDA(voter, marketKey, anwserKey);
    const bettingData = await this.accounts.bettingAccount.fetch(bettingPDA);
    return bettingData;
  }

  /**
 * Return total amount bet and pending reward.
 * @param voter - The public key of the voter.
 * @param marketKey - The key of the market.
 * @param anwserKey - The key of the answer.
 * @returns The betting data as a { recieveTokens: BN, pendingReward: BN } object.
 */
  public async getPendingRewardData(voter: PublicKey, marketKey: BN, anwserKey: BN): Promise<{ recieveTokens: BN, pendingReward: BN }> {

    let recieveTokens = new BN(0);

    let correctAnswerTotalTokens = new BN(0);

    const configData = await this.getConfigData();

    const bettingData = await this.getBettingData(voter, marketKey, anwserKey);

    const marketData = await this.getMarketData(marketKey);

    const answerData = await this.getAnswerData(marketKey);

    if (marketData.status.success && marketData.correctAnswerKey.toString() == anwserKey.toString()) {

      let percentage = new BN(0);
      let marketRewardBaseTokens = marketData.marketRewardBaseTokens;

      for (let i = 0; i < answerData.answers.length; i++) {
        if (answerData.answers[i].answerKey.toString() == marketData.correctAnswerKey.toString()) {
          correctAnswerTotalTokens = answerData.answers[i].answerTotalTokens;
          break;
        }
      }

      percentage = marketRewardBaseTokens.mul(new BN(10000)).div(correctAnswerTotalTokens);

      recieveTokens = bettingData.tokens.mul(percentage).div(new BN(10000));
    }

    const rewardAPR = configData.rewardApr;

    const timeStaked = marketData.finishTime.sub(bettingData.createTime);

    const pendingReward = bettingData.tokens.mul(rewardAPR).div(new BN(10000)).mul(timeStaked).div(new BN(31536000));
    return {
      recieveTokens: recieveTokens,
      pendingReward: pendingReward
    };
  }

  /**
   * Retrieves the balance of the market's vault token account.
   * @param marketKey - The key of the market.
   * @returns The balance of the market's vault token account.
   */
  public async getMarketVaultBalance(marketKey: BN): Promise<any> {
    const marketAccount = this.marketPDA(marketKey);
    const marketData = await this.getMarketData(marketKey);

    const vaultTokenAccount = await getAssociatedTokenAddress(marketData.betMint, marketAccount, true);
    const marketVaultBalance = await this.connection.getTokenAccountBalance(vaultTokenAccount, 'confirmed');

    return marketVaultBalance.value;
  }
}
