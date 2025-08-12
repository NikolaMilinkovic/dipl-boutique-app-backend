/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request, Response } from "express";
import OpenAI from "openai";
import stream, { PassThrough } from "stream";

// import { getIO } from "../socket/initSocket.js";
import { AgentMessage, handleAgentMessages, handleUnauthorizedAgentMessages } from "../utils/AI/AgentSendMessage.js";
import CustomError from "../utils/CustomError.js";
import { convertAudioBufferToWav } from "../utils/helperMethods.js";
import { betterConsoleLog, betterErrorLog } from "../utils/logMethods.js";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

import ffmpeg from "fluent-ffmpeg";
import { Readable } from "stream";

export const handleTranscribe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file) {
      res.status(400).json({ error: "No audio file uploaded" });
      return;
    }

    const convertedBuffer = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];

      ffmpeg()
        .input(Readable.from(file.buffer))
        .inputFormat("webm")
        .audioCodec("pcm_s16le")
        .format("wav")
        .on("error", reject)
        .on("end", () => {
          resolve(Buffer.concat(chunks));
        })
        .pipe()
        .on("data", (chunk: Buffer) => chunks.push(chunk));
    });

    const transcription = await openai.audio.transcriptions.create({
      file: new File([convertedBuffer], "recording.wav", { type: "audio/wav" }),
      model: "whisper-1",
    });

    if (!transcription || !("text" in transcription)) {
      next(new CustomError("Transcription failed", 500));
      return;
    }

    res.status(200).json({ text: (transcription as any).text || "" });
  } catch (error) {
    console.error("Error while transcribing audio:", error);
    next(new CustomError("There was an error while transcribing audio", 500));
  }
};
