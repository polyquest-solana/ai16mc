import { tool } from "@langchain/core/tools";
import { LangGraphRunnableConfig } from "@langchain/langgraph";

import { z } from "zod";
import { FootballApiService } from "./footballService";
import {
  TEAM_ID,
  PREMIER_LEAGUE_ID,
  PREMIER_LEAGUE_SEASON,
} from "../common/constants";
import { MarketService } from "./market";
import { createUser, db, getActiveMarket, getUserBets } from "../db/drizzle";
import { bets, marketOptions, markets } from "../db/schema";
import { calculateWinPercentage } from "../utils/utils";
import { eq } from "drizzle-orm";

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
    console.log("Call createPredictionTool with args: ", input);

    const { title, description, opponent, date, win, draw, lost } = input;

    const username = config?.configurable?.username as string;
    const user = await createUser(username);

    const percents = calculateWinPercentage(win, draw, lost);

    const market = new MarketService();

    const { signature, marketKey, answerKeys } = await market.createPrediction({
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
          // @ts-ignore
          creatorId: user.id,
          date: new Date(date),
        })
        .returning();

      await tx.insert(marketOptions).values([
        {
          marketId: newMarket.id,
          name: `Manchester City Win - ${percents.winPercentage}%`,
          answerKey: answerKeys[0].toNumber(),
          odd: String(percents.winPercentage),
        },
        {
          marketId: newMarket.id,
          name: `Draw - ${percents.drawPercentage}%`,
          answerKey: answerKeys[1].toNumber(),
          odd: String(percents.drawPercentage),
        },
        {
          marketId: newMarket.id,
          name: `${opponent} Win - ${percents.opponentWinPercentage}%`,
          answerKey: answerKeys[2].toNumber(),
          odd: String(percents.opponentWinPercentage),
        },
      ]);
    });

    return [
      `Respond with the details of the prediction market, including the title: ${title}, description: ${description}, time: ${date}, and odds. Include the signature hash: ${signature} at the bottom.
        `,
      [],
    ];
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
    const bets = await getUserBets(user!.id, market!.id);

    const userBetsMessage =
      bets && bets.length > 0
        ? `Your bet for this match: ${bets
            .map(
              (bet) =>
                `You placed a bet of ${bet.amount} USDC on ${bet.option.name}`
            )
            .join("\n")}`
        : "";

    return `
    Return the active prediction market using following information:
    Match info:
    - Title: ${market?.title}
    - Description: ${market?.description}
    - Date: ${market?.date}

    Prediction Options:
    ${market?.options.map((option) => `- ${option.name}`).join("\n")}

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
        })
        .returning();

      return [
        `Respond success message include this signature hash: ${signature} at the bottom.
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