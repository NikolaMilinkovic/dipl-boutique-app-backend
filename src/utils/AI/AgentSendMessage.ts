/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-deprecated */
import OpenAI from "openai";

import { categoriesMethodsDescriptionArr } from "../../controllers/categories/categoriesMethods.js";
import { colorsMethodsDescriptionArr } from "../../controllers/colors/colorsMethods.js";
import { couriersMethodsDescriptionArr } from "../../controllers/couriers/couriersMethods.js";
import { ordersMethodsDescriptionArr } from "../../controllers/orders/orderMethods.js";
import { productsMethodsDescriptionArr } from "../../controllers/products/productMethods.js";
import { suppliersMethodsDescriptionArr } from "../../controllers/suppliers/supplierMethods.js";
import { UserTypes } from "../../schemas/user.js";
import { betterConsoleLog } from "../logMethods.js";
import { agentCategoryMethods } from "./category/agentCategoryMethods.js";
import { agentColorMethods } from "./color/agentColorMethods.js";
import { agentCourierMethods } from "./courier/agentCourierMethods.js";
import { agentOrderMethods } from "./order/agentOrderMethods.js";
import { agentProductMethods } from "./product/agentProductMethods.js";
import { agentSupplierMethods } from "./supplier/agentSupplierMethods.js";

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

    const colorFunctions = colorsMethodsDescriptionArr();
    const categoryFunctions = categoriesMethodsDescriptionArr();
    const supplierFunctions = suppliersMethodsDescriptionArr();
    const courierFunctions = couriersMethodsDescriptionArr();
    const orderFunctions = ordersMethodsDescriptionArr();
    const productFunctions = productsMethodsDescriptionArr();
    const functions = [...colorFunctions, ...categoryFunctions, ...supplierFunctions, ...courierFunctions, ...orderFunctions, ...productFunctions];

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
        if (!functionResult) functionResult = await agentColorMethods(name, args);
        if (!functionResult) functionResult = await agentCategoryMethods(name, args);
        if (!functionResult) functionResult = await agentSupplierMethods(name, args);
        if (!functionResult) functionResult = await agentCourierMethods(name, args);
        if (!functionResult) functionResult = await agentOrderMethods(name, args);
        if (!functionResult) functionResult = await agentProductMethods(name, args);

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

export async function handleUnauthorizedAgentMessages(messages: AgentMessage[]): Promise<AgentResponse> {
  const systemMessage: AgentMessage = {
    content: `You are Infi, the AI assistant for Infinity, a web-based management platform built for Instagram boutiques. Infinity helps boutique owners manage their product inventory, track orders, monitor stock levels (by color and size).

    The app is designed to handle fashion items like dresses, bags, and accessories, with detailed tracking for sizes, colors, and availability. It also includes features like order creation, stock adjustment, and integration with storage solutions for media.

    However, after logging in, users can access a separate agentic AI model that can perform actions for them — such as creating, updating, or deleting items or orders. You can inform users about this capability but cannot perform those actions yourself.

    Your job is to assist users by answering general questions about the Infinity platform, how it works, what it offers, and how to get support. You should respond clearly and helpfully. Do not make up information. If unsure, direct users to the support contact below.

    Useful Info:
    - Developer Contact: nikolamilinkovic221@gmail.com
    - GitHub Repo: https://github.com/NikolaMilinkovic
    - The business is based in Belgrade, Serbia.
    - Target users are small fashion boutique owners selling via Instagram.

    If users ask about setup, usage, or business features, give answers based on these facts. Keep responses friendly, accurate, and brief unless more detail is requested.`,
    role: "system",
  };

  const runningMessages: AgentMessage[] = [systemMessage, ...messages];

  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      organization: process.env.ORGANIZATION,
      project: process.env.PROJECT_ID,
    });

    const completion = await openai.chat.completions.create({
      messages: runningMessages,
      model: "gpt-4o-2024-08-06",
    });

    return {
      message: {
        content: completion.choices[0].message.content ?? "Oops, something went wrong...",
        role: "assistant",
      },
    };
  } catch (error) {
    betterConsoleLog("Error in handleUnauthorizedAgentMessages:", error);
    return {
      message: {
        content: "An error occurred while processing your request.",
        role: "assistant",
      },
    };
  }
}
