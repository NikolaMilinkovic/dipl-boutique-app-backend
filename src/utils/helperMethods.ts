/* eslint-disable @typescript-eslint/prefer-promise-reject-errors */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-confusing-void-expression */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import bcrypt from "bcryptjs";
import ffmpeg from "fluent-ffmpeg";
import { PassThrough } from "stream";

import User, { UserTypes } from "../schemas/user.js";
import { betterErrorLog } from "./logMethods.js";

type Action = keyof UserTypes["permissions"][Resource];

import { NextFunction, Request, Response } from "express";

// These match your defined types
type Resource = keyof UserTypes["permissions"];
/**
 * Adds a user to the database if they do not already exist.
 * @param {String} username - The username for the new user.
 * @param {String} plainPassword - The plain text password for the new user.
 */
export async function addUserOnStartup(username: string, plainPassword: string): Promise<void> {
  try {
    const existingUser = await User.findOne({ username });

    if (!existingUser) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(plainPassword, salt);

      const newUser = new User({
        password: hashedPassword,
        username,
      });

      await newUser.save();
      console.log(`> User [${newUser.username}] created`);
    } else {
      console.log(`> User [${username}] already exists`);
    }
  } catch (error: unknown) {
    betterErrorLog("> Error creating a user:", error);
  }
}

export const checkPermission = (resource: Resource, action: Action) => (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as UserTypes;

  if (!user.permissions[resource][action]) {
    return res.status(403).json({ message: "Forbidden: insufficient permissions" });
  }

  return next();
};

export function compareAndUpdate(oldValue: unknown, newValue: unknown): any {
  if (typeof oldValue === "object" && typeof newValue === "object") {
    if (!deepEqual(oldValue!, newValue!)) {
      return newValue;
    }
    return oldValue;
  }
  if (oldValue !== newValue) {
    return newValue;
  }
  return oldValue;
}

export function convertAudioBufferToWav(inputBuffer: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const inputStream = new PassThrough();
    inputStream.end(inputBuffer);

    const outputChunks: Buffer[] = [];
    const outputStream = new PassThrough();

    outputStream.on("data", (chunk) => outputChunks.push(chunk));
    outputStream.on("end", () => resolve(Buffer.concat(outputChunks)));
    outputStream.on("error", (err) => reject(err));

    ffmpeg(inputStream)
      .format("wav")
      .audioChannels(1)
      .on("error", (err) => reject(err))
      .pipe(outputStream, { end: true });
  });
}

function deepEqual(obj1: object, obj2: object) {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
}
