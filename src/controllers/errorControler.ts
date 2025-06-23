import dotenv from "dotenv";
import { NextFunction, Request, Response } from "express";

import CustomError from "../utils/CustomError.js";
import { betterErrorLog } from "../utils/logMethods.js";

dotenv.config();

const devErrors = (res: Response, err: CustomError) => {
  betterErrorLog(err.message, err);

  res.status(err.statusCode).json({
    error: err,
    message: err.message,
    stackTrace: err.stack,
    status: err.statusCode,
  });
};

const prodErrors = (res: Response, err: CustomError) => {
  betterErrorLog(err.message, err);

  if (err.isOperational) {
    res.status(err.statusCode).json({
      message: err.message || "Something went wrong! Please try again later",
      status: err.statusCode,
    });
  } else {
    res.status(500).json({
      message: "Something went wrong! Please try again later",
      status: "error",
    });
  }
};

const castErrorHandler = (err: unknown): CustomError => {
  // const message = `Invalid value for ${err.path}: ${err.value}!`;
  const message = `Error: ${err}`;
  return new CustomError(message, 400);
};

export default (err: CustomError, req: Request, res: Response, next: NextFunction) => {
  const NODE_ENV = process.env.NODE_ENV;
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (NODE_ENV === "development") {
    devErrors(res, err);
  } else {
    if (err.name === "castError") {
      err = castErrorHandler(err);
    }
    prodErrors(res, err);
  }
};
