import dotenv from "dotenv";
dotenv.config();

import agent from "./services/agent";
import { Telegraf } from "telegraf";
import { HumanMessage } from "@langchain/core/messages";

const telegramToken = process.env.TELEGRAM_TOKEN!;

const bot = new Telegraf(telegramToken);

bot.start((ctx) => {
  ctx.reply("Welcome to my Telegram bot!");
});

bot.help((ctx) => {
  ctx.reply("Send me a message and I will echo it back to you.");
});

bot.on("message", async (ctx) => {
  // console.log("Message received: ", ctx.message);

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
      const text = (ctx.message as any).text;

      if (!text) {
        ctx.reply("Please send a text message.");
        return;
      }

      console.log("Input: ", text);

      await ctx.sendChatAction("typing");

      try {
        // const bets = await getUserBets(
        //   "6sAgICXY7V8kSZS1Yb_o2",
        //   "2oajii5j3WXNCJ8iidBfd"
        // );

        // console.log({ bets });

        // ctx.reply("ok");

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

        await ctx.reply(
          // @ts-ignore
          response.messages[response.messages.length - 1].content ?? ""
        );
      } catch (error) {
        console.log(error);

        const message = JSON.stringify(
          (error as any)?.response?.data?.error ?? "Unable to extract error"
        );

        console.log({ message });

        await ctx.reply(
          "Whoops! There was an error while talking to OpenAI. Error: " +
            message
        );
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
