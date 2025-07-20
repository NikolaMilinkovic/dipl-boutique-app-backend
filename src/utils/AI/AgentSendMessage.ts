/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-deprecated */
import OpenAI from "openai";

import { colorsMethodsDescriptionArr } from "../../controllers/colors/colorsMethods.js";
import { betterConsoleLog } from "../logMethods.js";
import { agentColorMethods } from "./color/agentColorMethods.js";

if (process.env.NODE_ENV !== "production") {
  const dotenv = await import("dotenv");
  dotenv.config();
}
export type AgentMessage =
  | { content: string; function_call?: never; name?: never; role: "assistant" | "system" | "user" }
  | { content: string; name: string; role: "function" };

interface AgentResponse {
  message: AgentMessage;
}

export async function handleAgentMessages(messages: AgentMessage[]): Promise<AgentResponse> {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      organization: process.env.ORGANIZATION,
      project: process.env.PROJECT_ID,
    });

    const functions = colorsMethodsDescriptionArr();

    const systemMessage: AgentMessage = {
      content:
        "You are Infi, a versatile AI agent that assists users by answering questions and calling backend functions. Keep answers short and concise.",
      role: "system",
    };

    const runningMessages: AgentMessage[] = [systemMessage, ...messages];
    let callCount = 0;
    const maxCalls = 10;

    while (callCount < maxCalls) {
      callCount++;
      const completion = await openai.chat.completions.create({
        function_call: "auto",
        functions,
        messages: runningMessages,
        model: "gpt-4o-2024-08-06",
      });

      const message = completion.choices[0].message;

      if (message.function_call) {
        const { arguments: argsJson, name } = message.function_call;
        const args = JSON.parse(argsJson || "{}");
        let functionResult;

        // METHODS
        functionResult = await agentColorMethods(name, args);

        runningMessages.push(message as AgentMessage);
        runningMessages.push({
          content: JSON.stringify(functionResult),
          name,
          role: "function",
        });
      } else {
        // No more function calls, return final message
        return { message } as any;
      }
    }

    return {
      message: {
        content: "I'm sorry, I wasn't able to finish processing your request.",
        role: "assistant",
      },
    };
  } catch (error) {
    betterConsoleLog("Error in AgentSendMessage:", error);
    return {
      message: {
        content: "An error occurred while processing your request.",
        role: "assistant",
      },
    };
  }
}

// The content is expected to be JSON string (because of json_schema), parse it
// if (!completion.choices[0].message.content) {
//   throw new Error("Reading response content from AI failed");
// }
// return JSON.parse(completion.choices[0].message.content) as ParsedOrderData;
