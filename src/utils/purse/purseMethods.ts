/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { NextFunction } from "express";

import PurseColorModel from "../../schemas/purseColor.js";
import CustomError from "../CustomError.js";
import { betterErrorLog } from "../logMethods.js";

export async function purseColorStockHandler(colorId: string, operation: string, value = 1, next: NextFunction) {
  try {
    const purseColor = await PurseColorModel.findById(colorId);
    if (!purseColor) {
      next(new CustomError(`Purse Color objekat nije pronadjen za id ${colorId}`, 404));
      return;
    }

    // Decrement / Increment based on provided operation
    if (operation === "decrement") {
      if (purseColor.stock > 0) {
        purseColor.stock -= value;
      } else {
        next(new CustomError(`Nedovoljno zaliha na stanju [${purseColor.stock.toString()}]`, 500));
        return;
      }
    } else if (operation === "increment") {
      purseColor.stock += value;
    } else {
      next(new CustomError(`Pogrešan unos za operaciju u purseColorStockHandler [increment | decrement] vaš unos: ${operation}`, 500));
      return;
    }

    return await purseColor.save();
  } catch (err) {
    const error = err as any;
    const statusCode = error?.statusCode ?? 500;
    betterErrorLog("> Error adding an order:", error);
    next(new CustomError("Došlo je do problema prilikom dodavanja porudžbine", Number(statusCode)));
    return;
  }
}
