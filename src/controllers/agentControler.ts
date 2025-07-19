import { NextFunction, Request, Response } from "express";

import { MessageTypes } from "../global/types.js";
// import { getIO } from "../socket/initSocket.js";
import { AgentMessage, handleAgentMessages } from "../utils/AI/AgentSendMessage.js";
import CustomError from "../utils/CustomError.js";
import { betterConsoleLog, betterErrorLog } from "../utils/logMethods.js";

interface AgentRequestBody {
  messages: AgentMessage[];
  token: string;
}
export const handleAgentResponse = async (req: Request<unknown, unknown, AgentRequestBody>, res: Response, next: NextFunction) => {
  try {
    const { messages, token } = req.body;
    if (messages.length === 0) return;
    const response = await handleAgentMessages(messages);
    console.log("AI response:", response.message);

    res.status(200).json({
      message: "Youve hit the api for agent messages!",
      text: response.message.content || "",
    });
  } catch (error: unknown) {
    betterErrorLog("> Error while handling agent response:", error);
    next(new CustomError("There was an error while handling agent response", 500));
    return;
  }
};
