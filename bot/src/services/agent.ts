import {
  Annotation,
  MemorySaver,
  StateGraph,
  messagesStateReducer,
} from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { ToolNode } from "@langchain/langgraph/prebuilt";

import {
  AIMessage,
  BaseMessage,
  SystemMessage,
} from "@langchain/core/messages";
import {
  createPredictionTool,
  getOddsTool,
  getActiveMarketsTool,
  getFixturesTool,
  placeBetTool,
  finishMarketTool,
  claimRewardTool,
} from "./tools";
import { StateGraphAddNodeOptions } from "@langchain/langgraph/dist/graph/state";
import { ADMIN_USERNAMES } from "../common/constants";

const usersTools = [
  getFixturesTool,
  getOddsTool,
  getActiveMarketsTool,
  placeBetTool,
  claimRewardTool,
];

const adminTools = [createPredictionTool, finishMarketTool, ...usersTools];

const toolNode = new ToolNode([...adminTools, ...usersTools]);

let model = new ChatOpenAI({
  temperature: 0.8,
  model: "gpt-4o-mini",
  streaming: true,
});

const StateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
  }),
  username: Annotation<string>(),
});

async function callModel(
  state: typeof StateAnnotation.State,
  options: StateGraphAddNodeOptions
) {
  console.log("callModel");
  // @ts-ignore
  const username = options?.configurable?.username;
  const isAdmin = ADMIN_USERNAMES.includes(username);

  let modelWithTools;

  if (isAdmin) {
    modelWithTools = model.bindTools(adminTools);
  } else {
    modelWithTools = model.bindTools(usersTools);
  }

  const messages = state.messages;
  const response = await modelWithTools.invoke([
    new SystemMessage(
      "I want you to act as a football assistant for the Manchester City team. Your role is to provide useful information about football, especially related to Manchester City. Additionally, you can assist users by showing the team's fixtures and providing odds for their matches. Return in markdown format, using *text* for bold text, you must using start * and end *, never use * without end *, don't use **text**, don't use many speacial characters, dont use ###."
    ),
    ...messages,
  ]);

  return { messages: [response] };
}

function shouldContinue(state: typeof StateAnnotation.State) {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1] as AIMessage;

  if (lastMessage.tool_calls?.length) {
    console.log("shouldContinue calling tool");
    return "tools";
  }

  console.log("shouldContinue end");
  return "__end__";
}

const workflow = new StateGraph(StateAnnotation)
  .addNode("agent", callModel)
  .addNode("tools", toolNode)
  .addEdge("__start__", "agent")
  .addConditionalEdges("agent", shouldContinue)
  .addEdge("tools", "agent");

const memory = new MemorySaver();

const app = workflow.compile({ checkpointer: memory });

export default app;
