import { NextFunction, Request, Response } from "express";

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
