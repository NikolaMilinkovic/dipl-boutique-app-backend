/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request, Response } from "express";

import User from "../../schemas/user.js";
import CustomError from "../../utils/CustomError.js";
import { betterErrorLog } from "../../utils/logMethods.js";
import { createUserLogic, NewUserTypes } from "./userMethods.js";

// GET ALL SUPPLIERS
export const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const newUser = req.body as NewUserTypes;
    await createUserLogic(newUser);
    res.status(200).json({ message: "User created successfully" });
  } catch (error) {
    betterErrorLog("> Error fetchin suppliers:", error);
    next(new CustomError("There was an error while creating a new user", 500));
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
