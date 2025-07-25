import bcrypt from "bcryptjs";

import User from "../../schemas/user.js";
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

export async function createUserLogic(newUser: NewUserTypes): Promise<void> {
  try {
    const existingUser = await User.findOne({ username: newUser.username });
    if (existingUser) {
      console.log(`> User [${newUser.username}] already exists`);
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newUser.password, salt);

    const userToSave = new User({
      password: hashedPassword,
      permissions: newUser.permissions,
      role: newUser.role || "user",
      username: newUser.username,
    });

    await userToSave.save();
    console.log(`> User [${userToSave.username}] created`);
  } catch (err) {
    betterErrorLog("Error creating user:", err);
  }
}
