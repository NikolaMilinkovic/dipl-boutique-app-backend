import { NextFunction, Request, Response } from "express";

// import { getIO } from "../socket/initSocket.js";
import { AgentMessage, handleAgentMessages, handleUnauthorizedAgentMessages } from "../utils/AI/AgentSendMessage.js";
import CustomError from "../utils/CustomError.js";
import { betterErrorLog } from "../utils/logMethods.js";

interface AgentRequestBody {
  messages: AgentMessage[];
  token: string;
}
export const handleAgentResponse = async (req: Request<unknown, unknown, AgentRequestBody>, res: Response, next: NextFunction) => {
  try {
    // token
    const { messages, token } = req.body;
    if (messages.length === 0) return;
    let response;

    if (token) response = await handleAgentMessages(messages);
    if (!token) response = await handleUnauthorizedAgentMessages(messages);

    if (response === undefined) {
      next(new CustomError("There was an error while handling agent responses", 500));
      return;
    }
    res.status(200).json({
      text: response.message.content || "",
    });
  } catch (error: unknown) {
    betterErrorLog("> Error while handling agent response:", error);
    next(new CustomError("There was an error while handling agent response", 500));
    return;
  }
};
