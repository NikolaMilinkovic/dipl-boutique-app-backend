/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-deprecated */
import OpenAI from "openai";

import { addColorLogic } from "../../controllers/colors/colorsMethods.js";
import { betterConsoleLog } from "../logMethods.js";

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
    // Array of functions > Move this into a separate method
    const functions = [
      {
        description: "Add a new color to the boutique",
        name: "add_color",
        parameters: {
          properties: {
            colorCode: {
              description: "Hex color code, default is #68e823 if not provided",
              type: "string",
            },
            name: {
              description: "Name of the color to add",
              type: "string",
            },
          },
          required: ["name"],
          type: "object",
        },
      },
    ];

    const completion = await openai.chat.completions.create({
      function_call: "auto",
      functions,
      messages: [
        {
          content:
            "You are Infi, a versatile AI agent that assists users by answering questions, calling methods on the backend to fulfil user requests and more. Use backend functions as needed. Always keep your asnwers short and concize, do not waste tokens when answering!",
          role: "system",
        },
        ...messages,
      ],
      model: "gpt-4o-2024-08-06",
    });

    const message = completion.choices[0].message;
    console.log(message);

    if (message.function_call) {
      const toolCall = message.function_call;
      const { arguments: argsJson, name } = toolCall;
      const args = JSON.parse(argsJson);
      let functionResult;

      // METHODS
      if (name === "add_color") {
        functionResult = await addColorLogic(args);
      }

      const updatedMessages = [
        ...messages,
        message,
        {
          content: JSON.stringify(functionResult),
          name,
          role: "function",
        },
      ];

      const finalCompletion = await openai.chat.completions.create({
        messages: updatedMessages,
        model: "gpt-4o-2024-08-06",
      });

      return { message: finalCompletion.choices[0].message };
    }

    // If no function call, return AI's direct message
    return { message };
  } catch (error) {
    betterConsoleLog("Error in parseOrderData:", error);
    throw error;
  }
}

// The content is expected to be JSON string (because of json_schema), parse it
// if (!completion.choices[0].message.content) {
//   throw new Error("Reading response content from AI failed");
// }
// return JSON.parse(completion.choices[0].message.content) as ParsedOrderData;
