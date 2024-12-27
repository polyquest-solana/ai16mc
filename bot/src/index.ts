import dotenv from "dotenv";
dotenv.config();

import agent from "./services/agent";
import { Context, Telegraf } from "telegraf";
import { Update } from "telegraf/types";
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
  const chatType = ctx.message.chat.type;

  if (chatType === "private") {
    // handle message
    handleBotMessage(ctx);
  } else {
    // @ts-ignore
    const entities = ctx.message.entities;

    if (entities) {
      const botMention = entities.some((entity: any) => {
        return (
          entity.type === "mention" &&
          // @ts-ignore
          ctx.message?.text?.includes(`@${bot?.botInfo?.username}`)
        );
      });

      if (botMention) {
        handleBotMessage(ctx);
      }
    }
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
The first AI-powered prediction market on Solana, dedicated to *Manchester City* in the English Premier League (EPL).
  
You currently have no SOL in your wallet. To start Predicting & Discovering, deposit SOL to your unique ai16mc address:
  
\`${address}\` (tap to copy)
  
Once done, tap refresh and your balance will appear here.
    `);
}

async function handleBotMessage(ctx: Context<Update>) {
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
          thread_id: "001",
          username: ctx?.message?.from?.username!,
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
}
