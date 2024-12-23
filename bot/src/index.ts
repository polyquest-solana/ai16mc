import dotenv from "dotenv";
dotenv.config();

import agent from "./services/agent";
import { Telegraf } from "telegraf";
import { HumanMessage } from "@langchain/core/messages";
import { createUser } from "./db/drizzle";
import { escapeMarkdown } from "./utils/escape";

const telegramToken = process.env.TELEGRAM_TOKEN!;

const bot = new Telegraf(telegramToken);

bot.start(async (ctx) => {
  const username = ctx.message.from?.username;

  if (username) {
    const user = await createUser(username);

    if (!user) {
      ctx.reply("Unknown error occured. Please try again.");
      return;
    }

    ctx.replyWithMarkdownV2(getWelcomeMessage(user.wallet!));
  } else {
    ctx.reply("Unknown error occured. Please try again.");
  }
});

bot.help((ctx) => {
  ctx.reply("Send me a message and I will echo it back to you.");
});

bot.on("message", async (ctx) => {
  // @ts-ignore
  // const entities = ctx.message.entities;

  // if (entities) {
  //   const botMention = entities.some((entity: any) => {
  //     return (
  //       entity.type === "mention" &&
  //       // @ts-ignore
  //       ctx.message?.text?.includes(`@${bot?.botInfo?.username}`)
  //     );
  //   });

  //   if (botMention) {
  //     const text = (ctx.message as any).text;

  //     if (!text) {
  //       ctx.reply("Please send a text message.");
  //       return;
  //     }

  //     console.log("Input: ", text);

  //     await ctx.sendChatAction("typing");

  //     try {

  //       const response = await agent.invoke(
  //         {
  //           messages: [new HumanMessage(text)],
  //         },
  //         {
  //           configurable: {
  //             thread_id: "123",
  //             username: ctx.message.from?.username!,
  //           },
  //         }
  //       );

  //       await ctx.reply(
  //         // @ts-ignore
  //         response.messages[response.messages.length - 1].content ?? ""
  //       );
  //     } catch (error) {
  //       console.log(error);

  //       const message = JSON.stringify(
  //         (error as any)?.response?.data?.error ?? "Unable to extract error"
  //       );

  //       console.log({ message });

  //       await ctx.reply(
  //         "Whoops! There was an error while talking to OpenAI. Error: " +
  //           message
  //       );
  //     }
  //   }
  // }

  // -----------------------
  const text = (ctx.message as any).text;

  if (!text) {
    ctx.reply("Please send a text message.");
    return;
  }

  console.log("Input: ", text);

  await ctx.sendChatAction("typing");

  try {
    const response = await agent.invoke(
      {
        messages: [new HumanMessage(text)],
      },
      {
        configurable: {
          thread_id: "123",
          username: ctx.message.from?.username!,
        },
      }
    );

    await ctx.replyWithMarkdownV2(
      escapeMarkdown(
        // @ts-ignore
        response.messages[response.messages.length - 1].content ?? ""
      )
    );
  } catch (error) {
    console.log(error);

    const message = JSON.stringify(
      (error as any)?.response?.data?.error ?? "Unable to extract error"
    );

    console.log({ message });

    await ctx.reply(
      "Whoops! There was an error while talking to OpenAI. Error: " + message
    );
  }
});

bot.launch().then(() => {
  console.log("Bot launched");
});

process.on("SIGTERM", () => {
  bot.stop();
});

function getWelcomeMessage(address: string) {
  return escapeMarkdown(`
   *Welcome to ai16mc bot*
The first AI-powered prediction market on Solana, dedicated to Manchester City in the English Premier League (EPL).
  
You currently have no SOL in your wallet. To start Predicting & Discovering, deposit SOL to your unique ai16mc address:
  
\`${address}\` (tap to copy)
  
Once done, tap refresh and your balance will appear here.

To receive the latest updates on MC's upcoming matches, type the command /matches.  

To participate in predictions for MC's matches, type the command /predicted.
  
For more info on your wallet and to retrieve your private key, tap the wallet button below. User funds are safe on ai16mc, but if you expose your private key we can't protect you!
\n
Here are the upcoming matches for Manchester City in the EPL in this week:
1. Everton FC vs Manchester City on Thursday, Dec 26, 2024, at 4:30 AM PST - type /match1

2. Manchester City vs Leicester City on Sunday, Dec 29, 2024, at 6:30 AM PST - type /match2
   `);
}
