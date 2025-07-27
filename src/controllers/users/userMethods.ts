/* eslint-disable @typescript-eslint/no-invalid-void-type */
import bcrypt from "bcryptjs";

import User from "../../schemas/user.js";
import { getIO } from "../../socket/initSocket.js";
import { betterErrorLog } from "../../utils/logMethods.js";

export interface NewUserTypes {
  password: string;
  permissions: {
    category: Permission;
    color: Permission;
    courier: Permission;
    order: Permission;
    product: Permission;
    supplier: Permission;
  };
  role: string;
  username: string;
}
export interface Permission {
  add: boolean;
  edit: boolean;
  remove: boolean;
}

export async function createUserLogic(newUser: NewUserTypes): Promise<boolean | void> {
  try {
    const existingUser = await User.findOne({ username: newUser.username });
    if (existingUser) {
      console.log(`> User [${newUser.username}] already exists`);
      return false;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newUser.password, salt);

    const userToSave = new User({
      password: hashedPassword,
      permissions: newUser.permissions,
      role: newUser.role || "user",
      username: newUser.username,
    });

    const user = await userToSave.save();
    const io = getIO();
    io.emit("newUserAdded", user);
    console.log(`> User [${userToSave.username}] created`);
  } catch (err) {
    betterErrorLog("Error creating user:", err);
    return false;
  }
}
