/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
import bcrypt from "bcryptjs";
import { NextFunction, Request, Response } from "express";

import User, { UserTypes } from "../../schemas/user.js";
import { getIO } from "../../socket/initSocket.js";
import CustomError from "../../utils/CustomError.js";
import { compareAndUpdate } from "../../utils/helperMethods.js";
import { betterConsoleLog, betterErrorLog } from "../../utils/logMethods.js";
import { createUserLogic, NewUserTypes } from "./userMethods.js";

// GET ALL SUPPLIERS
export const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const newUser = req.body as NewUserTypes;
    const result = await createUserLogic(newUser as NewUserTypes);
    if (result === false) {
      res.status(500).json({ message: "This username is laready taken, please choose another one." });
      return;
    }

    res.status(200).json({ message: "User created successfully" });
  } catch (error) {
    betterErrorLog("> Error fetchin suppliers:", error);
    next(new CustomError("There was an error while creating a new user", 500));
    return;
  }
};
export const removeUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    await User.findOneAndDelete({ _id: id });
    const io = getIO();
    io.emit("removeUser", id);
    res.status(200).json({ message: "User removed successfully" });
  } catch (error) {
    betterErrorLog("> Error fetchin suppliers:", error);
    next(new CustomError("There was an error while creating a new user", 500));
    return;
  }
};
export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    const user = await User.findById(id);
    res.status(200).json({ user });
  } catch (error) {
    betterErrorLog("> Error fetchin user:", error);
    next(new CustomError("There was an error while fetchin the user", 500));
    return;
  }
};
export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updatedUser = req.body as UserTypes;
    const user = await User.findById(updatedUser._id);
    const userViaUsername = await User.findOne({ username: updatedUser.username });
    if (userViaUsername && `${userViaUsername._id}` !== `${updatedUser._id}`) {
      next(new CustomError(`Username ${updatedUser.username} already exists!`, 400));
      return;
    }
    if (user) {
      // USERNAME & PASSWORD
      user.username = compareAndUpdate(user.username, updatedUser.username);
      if (updatedUser.password !== user.password) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(updatedUser.password, salt);
        user.password = hashedPassword;
      }

      // ROLE
      user.role = compareAndUpdate(user.role, updatedUser.role);

      // PERMISSIONS
      user.permissions.category = compareAndUpdate(user.permissions.category, updatedUser.permissions.category);
      user.markModified("permissions.category");
      user.permissions.color = compareAndUpdate(user.permissions.color, updatedUser.permissions.color);
      user.markModified("permissions.color");
      user.permissions.courier = compareAndUpdate(user.permissions.courier, updatedUser.permissions.courier);
      user.markModified("permissions.courier");
      user.permissions.order = compareAndUpdate(user.permissions.order, updatedUser.permissions.order);
      user.markModified("permissions.order");
      user.permissions.product = compareAndUpdate(user.permissions.product, updatedUser.permissions.product);
      user.markModified("permissions.product");
      user.permissions.supplier = compareAndUpdate(user.permissions.supplier, updatedUser.permissions.supplier);
      user.markModified("permissions.supplier");

      const user_new = await user.save();
      const io = getIO();
      io.emit("updateUser", user_new);
      io.emit("updateCurrentUser", user_new);
    }
    res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    betterErrorLog("> Error updating the user:", error);
    next(new CustomError("There was an error while updating the user", 500));
    return;
  }
};

export const fetchUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id } = req.body as any;
    const user = await User.findOne({ _id: user_id, role: "admin" });
    if (!user) {
      next(new CustomError("You have insufficient permissions to fetch users list", 500));
    } else {
      const users = await User.find();
      res.status(200).json({ users });
    }
  } catch (error) {
    betterErrorLog("> Error fetching users:", error);
    next(new CustomError("There was an error while fetching users list", 500));
    return;
  }
};
