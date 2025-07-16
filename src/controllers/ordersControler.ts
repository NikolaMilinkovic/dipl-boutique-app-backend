import { NextFunction, Request, Response } from "express";

import { parseOrderData } from "../utils/AI/parseOrderData.js";
import CustomError from "../utils/CustomError.js";
import { betterConsoleLog, betterErrorLog } from "../utils/logMethods.js";

interface ParseOrderRequestBody {
  orderData: string;
}

export const parseOrder = async (req: Request<{}, {}, ParseOrderRequestBody>, res: Response, next: NextFunction) => {
  try {
    const { orderData } = req.body;
    betterConsoleLog("> Parse order called", orderData);

    if (!orderData) {
      next(new CustomError("There was an error while parsing data", 400));
      return;
    }

    const rawResponse = await parseOrderData(orderData);
    betterConsoleLog("> Raw Response", rawResponse);

    res.status(200).json({
      data: rawResponse,
      message: "Data parsed successfully",
    });
  } catch (error) {
    betterErrorLog("> Error parsing order data via AI:", error);
    next(new CustomError("There was an error while parsing order data", 500));
    return;
  }
};
