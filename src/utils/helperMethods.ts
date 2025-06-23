import bcrypt from "bcryptjs";

import User from "../schemas/user.js";
import { betterErrorLog } from "./logMethods.js";

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
