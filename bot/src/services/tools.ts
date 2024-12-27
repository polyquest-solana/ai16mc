import dotenv from "dotenv";
dotenv.config();

import { tool } from "@langchain/core/tools";
import fetch from "node-fetch";
import { LangGraphRunnableConfig } from "@langchain/langgraph";
import bs58 from "bs58";
import { z } from "zod";
import { FootballApiService } from "./footballService";
import {
  TEAM_ID,
  PREMIER_LEAGUE_ID,
  PREMIER_LEAGUE_SEASON,
} from "../common/constants";
import { MarketService } from "./market";
import {
  createUser,
  db,
  getActiveMarket,
  getMarketByKey,
  getUserBets,
} from "../db/drizzle";
import { bets, marketOptions, markets } from "../db/schema";
import {
  calculateWinPercentage,
  formatCurrency,
  formatNumber,
} from "../utils/utils";
import { eq } from "drizzle-orm";
import {
  AddressLookupTableAccount,
  Connection,
  Keypair,
  PublicKey,
  TransactionInstruction,
} from "@solana/web3.js";
import { getMint } from "@solana/spl-token";
import { getSolanaTokens, sendTransaction } from "../utils/connection";
import { FungibleToken, NonFungibleToken } from "../types/helius";

// tools
const footballService = new FootballApiService();

export const getFixturesTool = tool(
  async () => {
    console.log("Call getFixturesTool");

    const fixtures = await footballService.getFixtures({
      league: PREMIER_LEAGUE_ID,
      season: PREMIER_LEAGUE_SEASON,
      team: TEAM_ID,
      next: 5,
    });

    return [
      `Respond with the recent fixtures of Manchester City for the 2024 season using the following fixtures data: 
        ${JSON.stringify(fixtures.response)}
        `,
      [],
    ];
  },
  {
    name: "getFixturesTool",
    description: "Use this tool to get upcoming sports fixtures for a team.",
    responseFormat: "content_and_artifact",
    schema: z.string().describe("Name of club"),
  }
);

export const getOddsTool = tool(
  async (arg) => {
    console.log("Call getOddsTool with args: ", arg);

    const oddsResponse = await footballService.getOdds({
      fixture: arg,
      league: PREMIER_LEAGUE_ID,
      season: PREMIER_LEAGUE_SEASON,
    });

    console.log("oddsResponse", oddsResponse);

    const bookmakers = oddsResponse.response.at(0)?.bookmakers ?? [];
    const matchWinnerOdds = bookmakers.map((bookmaker) =>
      bookmaker.bets.filter((bet) => bet.name === "Match Winner")
    );

    return [
      `The match winner odds in the format of JSON: 
        ${JSON.stringify(matchWinnerOdds)}
        `,
      [],
    ];
  },
  {
    name: "getOddsTool",
    description:
      "Use this tool to get betting odds for a specific id of fixture",
    responseFormat: "content_and_artifact",
    schema: z.string().describe("id of fixture"),
  }
);

const createPrediectionSchema = z.object({
  title: z
    .string()
    .describe(
      "The title of the prediction market, such as Manchester Manchester City vs Chelsea."
    ),
  description: z.string().describe(`
    The description of the market prediction, such as
    In the upcoming La Liga match between Barcelona and Atletico Madrid on December 21, 2024, both teams are poised for a crucial encounter. MU, despite recent inconsistencies and a two-game touchline ban for coach Eric Tenhat, remains at the top of the league table with 38 points. Chelsea is in excellent form, having won 11 consecutive games and averaging 2.83 goals per match in their last 11 games. The match, set to take place at Estadi Olímpic Lluís Companys, is expected to be high-scoring, given MU's strong offense and recent defensive struggles
    `),
  opponent: z
    .string()
    .describe('The name of the opponent team, such as "Chelsea"'),
  date: z.string().describe("The date and time of the match."),
  win: z.number().describe("The betting odds for Manchester City to win"),
  draw: z.number().describe("The betting odds for a draw."),
  lost: z
    .number()
    .describe(
      "The betting odds for the opponent to win against Manchester City"
    ),
});

export const createPredictionTool = tool(
  async (input, config: LangGraphRunnableConfig) => {
    try {
      console.log("Call createPredictionTool with args: ", input);

      const { title, description, opponent, date, win, draw, lost } = input;

      const username = config?.configurable?.username as string;
      const user = await createUser(username);

      const percents = calculateWinPercentage(win, draw, lost);

      const market = new MarketService();

      const { signature, marketKey, answerKeys } =
        await market.createPrediction({
          title: title,
          description: description,
        });

      await db.transaction(async (tx) => {
        const [newMarket] = await tx
          .insert(markets)
          .values({
            title: title,
            description: description,
            marketKey: marketKey.toString(),
            creatorId: user!.id,
            date: new Date(date),
          })
          .returning();

        await tx.insert(marketOptions).values([
          {
            marketId: newMarket.id,
            name: `Manchester City Win - ${percents.winPercentage.toFixed(2)}%`,
            answerKey: answerKeys[0].toNumber(),
            odd: String(percents.winPercentage),
          },
          {
            marketId: newMarket.id,
            name: `Draw - ${percents.drawPercentage.toFixed(2)}%`,
            answerKey: answerKeys[1].toNumber(),
            odd: String(percents.drawPercentage),
          },
          {
            marketId: newMarket.id,
            name: `${opponent} Win - ${percents.opponentWinPercentage.toFixed(2)}%`,
            answerKey: answerKeys[2].toNumber(),
            odd: String(percents.opponentWinPercentage),
          },
        ]);
      });

      return [
        `Respond following message:
      The prediction market was successfully created.

      Prediction market:
    - Title: ${title}
    - Description: ${description}
    - Date: ${date}

    Prediction Options:
    - ${`Manchester City Win - ${percents.winPercentage}%`}
    - ${`Draw - ${percents.drawPercentage}%`}
    - ${`${opponent} Win - ${percents.opponentWinPercentage}%`}
    
    \n\n
      View the on-chain transaction here: \`https://solscan.io/tx/${signature}?cluster=devnet\`
      `,
        [],
      ];
    } catch (error) {
      console.log("createPredictionTool error", error);

      return ["error, technical issue. Please try again later."];
    }
  },
  {
    name: "createPredictionTool",
    description:
      "Use this action to create a new prediction market for a match. Don't use it for bet creation.",
    responseFormat: "content_and_artifact",
    schema: createPrediectionSchema,
  }
);

export const getActiveMarketsTool = tool(
  async (_, config: LangGraphRunnableConfig) => {
    console.log("Call getActiveMarketsTool");
    const username = config?.configurable?.username as string;
    const user = await createUser(username);

    const market = await getActiveMarket();
    console.log("market: ", market);

    let result = "";

    if (market?.status === "finished") {
      result = `*The market has ended. Result: ${market.options.find((option) => option.id === market.correctAnswerId)?.name}*`;
    }

    const bets = await getUserBets(user!.id, String(market!.marketKey));

    const userBetsMessage =
      bets && bets.length > 0
        ? `Your bet for this match: ${bets
            .map(
              (bet) =>
                `You placed a bet of *${bet.amount} USDC* on *${bet.option.name}*`
            )
            .join("\n")}`
        : "";

    return `
    Respond with the exact following message and nothing else.

    Match info:
    - Title: *${market?.title}*
    - Description: ${market?.description}
    - Date: ${market?.date}

    Prediction Options:
    ${market?.options.map((option) => `- ${option.name}`).join("\n")}

    ${result}

    ${userBetsMessage}


    You don't need to return the following information but remember it, user can need it later:
    - market key: ${market?.marketKey}
    - answer key for each option: ${market?.options
      .map(
        (option) =>
          `${option.answerKey} is the answer key of ${option.name} option`
      )
      .join(", ")}

    `;
  },
  {
    name: "getActiveMarketsTool",
    description: "Use this action to get all active prediction markets",
  }
);

const betSchema = z.object({
  marketKey: z.string().describe("The market key of the prediction market."),
  betAmount: z
    .number()
    .describe("The amount the user wants to bet, specified in USDC."),
  answerKey: z.string().describe("The answer key the user wants to bet on."),
});

export const placeBetTool = tool(
  async (input, config) => {
    try {
      console.log("Call placeBetTool with arg: ", input);

      const username = config?.configurable?.username as string;

      const user = await createUser(username);

      const { marketKey, betAmount, answerKey } = input;

      const marketService = new MarketService();

      const { signature } = await marketService.bet({
        marketKey,
        betAmount,
        answerKey,
      });

      const market = await db.query.markets.findFirst({
        where: eq(markets.marketKey, marketKey),
        with: {
          options: true,
        },
      });

      console.log("market", market);
      // @ts-ignore
      const option = market.options.find(
        (option: any) => String(option.answerKey) === answerKey
      );

      const [newBet] = await db
        .insert(bets)
        .values({
          userId: user!.id,
          optionId: option!.id,
          amount: String(betAmount),
          claimed: false,
        })
        .returning();

      return [
        `Respond following message,
        Your bet has been successfully placed.\n
        View the on-chain transaction here: \`https://solscan.io/tx/${signature}?cluster=devnet\`
        `,
        [],
      ];
    } catch (error) {
      console.log("betTool error", error);
      return [
        `erorr, technical issue.
          `,
        [],
      ];
    }
  },
  {
    name: "placeBetTool",
    description: "Use this action to place a bet on a match",
    responseFormat: "content_and_artifact",
    schema: betSchema,
  }
);

const finishMarketSchema = z.object({
  marketKey: z.string().describe("The market key of the prediction market."),
  answerKey: z
    .string()
    .describe("The answer key the admin wants to finish on."),
});

export const finishMarketTool = tool(
  async (input) => {
    console.log("Call finishMarket with args: ", input);

    const market = new MarketService();

    const { signature } = await market.finishMarket({
      marketKey: input.marketKey,
      answerKey: input.answerKey,
    });

    const answer = await db.query.marketOptions.findFirst({
      where: eq(marketOptions.answerKey, Number(input.answerKey)),
    });

    await db
      .update(markets)
      .set({
        status: "finished",
        correctAnswerId: answer!.id,
      })
      .where(eq(markets.marketKey, input.marketKey));

    return [
      `Respond following message,
      The prediction market for this match has concluded successfully..\n
      View the on-chain transaction here: \`https://solscan.io/tx/${signature}?cluster=devnet\`
      `,
      [],
    ];
  },
  {
    name: "finishMarketTool",
    description:
      "Call this function when admin want to finish or end the market. ",
    responseFormat: "content_and_artifact",
    schema: finishMarketSchema,
  }
);

const claimRewardSchema = z.object({
  marketKey: z.string().describe("The market key of the prediction market."),
});

export const claimRewardTool = tool(
  async (input, config) => {
    console.log("Call claimRewardTool with args: ", input);
    const { marketKey } = input;

    const username = config?.configurable?.username as string;
    const user = await createUser(username);

    const market = await getMarketByKey(marketKey);

    if (market?.status !== "finished") {
      return `
    Respond with the exact following message and nothing else.
      This prediction market is not finished yet.
    `;
    }

    const bets = await getUserBets(user!.id, marketKey);

    if (!bets || bets.length === 0) {
      return `
    Respond with the exact following message and nothing else.
      You didn't place a bet on this match
    `;
    }

    const answerKeys = bets.map((bet) => bet.option.answerKey);

    if (answerKeys.length === 0) {
      return `
    Respond with the exact following message and nothing else.
      Your bet didn't win this time. Better luck next time!
    `;
    }

    const marketService = new MarketService();

    const { signature } = await marketService.claimReward({
      voter: user!.wallet!,
      marketKey: input.marketKey,
      answerKeys: answerKeys,
    });

    return [
      `Respond following message,
      The reward has been sent to your wallet. Thank you for participating in this prediction!\n
      View the on-chain transaction here: \`https://solscan.io/tx/${signature}?cluster=devnet\`
      `,
      [],
    ];
  },
  {
    name: "claimRewardSchema",
    description:
      "Call this function when user want to claim the reward from their betting",
    responseFormat: "content_and_artifact",
    schema: claimRewardSchema,
  }
);

const swapTokenSchema = z.object({
  fromTokenMint: z
    .string()
    .describe("The mint address of the token to swap from"),
  toTokenMint: z.string().describe("The mint address of the token to swap to"),
  amount: z.number().describe("The amount of token to swap"),
});

export const swapTokenTool = tool(
  async (arg, config) => {
    console.log("Call swapToken with args: ", arg);
    const username = config?.configurable?.username as string;
    const user = await createUser(username);
    const userKp = Keypair.fromSecretKey(bs58.decode(user!.privateKey!));

    const { fromTokenMint, toTokenMint, amount } = arg;

    const connection = new Connection(
      process.env.SOLANA_MAINNET_RPC_URL!,
      "confirmed"
    );

    const fromMintInfo = await getMint(
      connection,
      new PublicKey(fromTokenMint)
    );

    const quoteResponse = await fetch(
      `https://quote-api.jup.ag/v6/quote?inputMint=${fromTokenMint}&outputMint=${toTokenMint}&amount=${
        amount * 10 ** fromMintInfo.decimals
      }&slippageBps=300&onlyDirectRoutes=true&maxAccounts=20`
    );

    const quote: any = await quoteResponse.json();

    const response = await fetch(
      "https://quote-api.jup.ag/v6/swap-instructions",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteResponse: quote,
          userPublicKey: user?.wallet!,
          wrapAndUnwrapSol: true,
        }),
      }
    );

    const {
      swapInstruction,
      setupInstructions,
      cleanupInstruction,
      addressLookupTableAddresses,
    } = (await response.json()) as any;

    const deserializeInstruction = (instruction: any) => {
      return new TransactionInstruction({
        programId: new PublicKey(instruction.programId),
        keys: instruction.accounts.map((key: any) => ({
          pubkey: new PublicKey(key.pubkey),
          isSigner: key.isSigner,
          isWritable: key.isWritable,
        })),
        data: Buffer.from(instruction.data, "base64"),
      });
    };

    const getAddressLookupTableAccounts = async (
      keys: string[]
    ): Promise<AddressLookupTableAccount[]> => {
      const addressLookupTableAccountInfos =
        await connection.getMultipleAccountsInfo(
          keys.map((key) => new PublicKey(key))
        );

      return addressLookupTableAccountInfos.reduce(
        (acc, accountInfo, index) => {
          const addressLookupTableAddress = keys[index];
          if (accountInfo) {
            const addressLookupTableAccount = new AddressLookupTableAccount({
              key: new PublicKey(addressLookupTableAddress),
              state: AddressLookupTableAccount.deserialize(accountInfo.data),
            });
            acc.push(addressLookupTableAccount);
          }

          return acc;
        },
        new Array<AddressLookupTableAccount>()
      );
    };

    const addressLookupTableAccounts: AddressLookupTableAccount[] = [];

    addressLookupTableAccounts.push(
      ...(await getAddressLookupTableAccounts(addressLookupTableAddresses))
    );

    try {
      const signature = await sendTransaction(
        connection,
        userKp.publicKey,
        [
          ...setupInstructions.map(deserializeInstruction),
          deserializeInstruction(swapInstruction),
          deserializeInstruction(cleanupInstruction),
        ],
        [userKp],
        addressLookupTableAccounts
      );

      return [`signature = ${signature}`, []];
    } catch (error) {
      console.error(error);
      return ["error", []];
    }
  },
  {
    name: "swapTokenTool",
    description: `
    Use this function when user want swap tokens. Token can be SOL or SPL token
    For now we only support following SPL tokens:
    - SOL: So11111111111111111111111111111111111111112
    - USDC: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
    - Bonk: DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263
    - WIF: EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm
    - PENGU: 2zMMhcVQEXDtdE6vsFS7S7D5oUodfJHE8vd1gnBouauv
    - SEND: SENDdRQtYMWaQrBroBrJ2Q53fgVuq95CV9UPGEvpCxa
    If user ask to swap other SPL token, we will show an error message.

    Reponse following message, no more, no less: Token swapped successfully. View the on-chain transaction here: https://solscan.io/tx/<insert the signature here>
    `,
    responseFormat: "content_and_artifact",
    schema: swapTokenSchema,
  }
);

export const showPortfolio = tool(
  async (arg, config) => {
    console.log("Call showPortfolio ");
    const username = config?.configurable?.username as string;

    try {
      const user = await createUser(username);

      const response = await fetch(process.env.SOLANA_MAINNET_RPC_URL!, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "my-id",
          method: "searchAssets",
          params: {
            ownerAddress: user?.wallet,
            tokenType: "all",
            displayOptions: {
              showNativeBalance: true,
              showInscription: true,
              showCollectionMetadata: true,
            },
            limit: 200,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch data`);
      }

      const data: any = await response.json();
      const items: (FungibleToken | NonFungibleToken)[] = data.result.items;

      const tokenList = await getSolanaTokens();

      let fungibleTokens: FungibleToken[] = items
        .filter(
          (item): item is FungibleToken =>
            item.interface === "FungibleToken" ||
            item.interface === "FungibleAsset"
        )
        .filter(
          (item) =>
            item.token_info.price_info?.total_price &&
            item.token_info.price_info?.total_price > 0
        );

      const nonFungibleTokens: NonFungibleToken[] = items
        .filter(
          (item): item is NonFungibleToken =>
            !["FungibleToken", "FungibleAsset"].includes(item.interface)
        )
        .sort((a, b) => {
          const aCollection = a.grouping?.find(
            (group) => group.group_key === "collection"
          );
          const bCollection = b.grouping?.find(
            (group) => group.group_key === "collection"
          );

          if (!!aCollection && !bCollection) {
            return -1;
          }
          if (!aCollection && !!bCollection) {
            return 1;
          }
          return 0;
        });

      fungibleTokens = fungibleTokens
        .map((item) => {
          const tokenMetadata = tokenList.find(
            (token: any) => token.address === item.id
          );

          if (tokenMetadata) {
            return {
              ...item,
              content: {
                ...item.content,
                files: [
                  {
                    uri: tokenMetadata.logoURI,
                    cdn_uri: "",
                    mime: "image/png",
                  },
                ],
                links: {
                  image: tokenMetadata.logoURI,
                },
              },
            };
          }

          return item;
        })
        .sort(
          (a, b) =>
            (b.token_info.price_info?.total_price || 0) -
            (a.token_info.price_info?.total_price || 0)
        );

      const solBalance = data.result.nativeBalance.lamports;

      // Create SOL token object
      const solToken = {
        interface: "FungibleAsset",
        id: "So11111111111111111111111111111111111111112",
        content: {
          $schema: "https://schema.metaplex.com/nft1.0.json",
          json_uri: "",
          files: [
            {
              uri: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
              cdn_uri: "",
              mime: "image/png",
            },
          ],
          metadata: {
            description: "Solana Token",
            name: "Wrapped SOL",
            symbol: "SOL",
            token_standard: "Native Token",
          },
          links: {
            image:
              "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
          },
        },
        authorities: [],
        compression: {
          eligible: false,
          compressed: false,
          data_hash: "",
          creator_hash: "",
          asset_hash: "",
          tree: "",
          seq: 0,
          leaf_id: 0,
        },
        grouping: [], // Assuming empty for SOL
        royalty: {
          royalty_model: "", // Fill as needed
          target: null,
          percent: 0,
          basis_points: 0,
          primary_sale_happened: false,
          locked: false,
        },
        creators: [], // Assuming empty for SOL
        ownership: {
          frozen: false,
          delegated: false,
          delegate: null,
          ownership_model: "token",
          owner: nonFungibleTokens[0]?.ownership.owner,
        },
        supply: null, // Assuming null for SOL
        mutable: true, // Assuming true for SOL
        burnt: false, // Assuming false for SOL

        token_info: {
          symbol: "SOL",
          balance: solBalance,
          supply: 0, // Assuming null for SOL
          decimals: 9,
          token_program: "", // Fill as needed
          associated_token_address: "", // Fill as needed
          price_info: {
            price_per_token: data.result.nativeBalance.price_per_sol, // Fill with actual price if available
            total_price: data.result.nativeBalance.total_price, // Fill with actual total price if available
            currency: "", // Fill as needed
          },
        },
      };

      if (solBalance > 0) {
        fungibleTokens.push(solToken);
      }

      const totalValue = fungibleTokens.reduce(
        (acc, token) => acc + (token.token_info.price_info?.total_price || 0),
        0
      );

      return [
        `
        Total value: ${formatCurrency(totalValue, "USD")}

        Your assets:

        ${fungibleTokens
          .map(
            (token) => `
          - $${token.token_info.symbol}: ${formatNumber(token.token_info.balance / 10 ** token.token_info.decimals)} (${formatCurrency(token.token_info.price_info?.total_price || 0, "USD")})
          `
          )
          .join("\n")}

          ${nonFungibleTokens.length > 0 ? "NFTs" : ""}

          ${
            nonFungibleTokens.length > 0 &&
            nonFungibleTokens
              .map(
                (token) => `
            - ${token.content.metadata.name}
            `
              )
              .join("\n")
          }


        `,
        [],
      ];
    } catch (error) {
      console.error(error);
      return ["error", []];
    }
  },
  {
    name: "getPortfolioTool",
    description: `
    Use this function to get the user's portfolio`,
    responseFormat: "content_and_artifact",
  }
);


