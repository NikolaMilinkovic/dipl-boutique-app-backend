/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { NextFunction } from "express";
import mongoose from "mongoose";

import PurseColorModel from "../../schemas/purseColor.js";
import CustomError from "../CustomError.js";
import { betterConsoleLog, betterErrorLog } from "../logMethods.js";

export interface PursesBatchColorStockUpdateArrTypes {
  colorId: string;
  increment: number;
  orderId: string;
}
/**
 * @param {Array<Object>} pursesArr - Array of objects with neccessary data for purse update
 * Each object contains:
 * - orderId: string
 * - colorId: string
 * - increment: number
 * @param {String} operation - can either be increment | decrement
 * @param {Function} next - callback function for error handling
 * @returns {Promise} - A promise resolving to the updated stock levels or an error.
 */
export async function purseBatchColorStockHandler(pursesArr: PursesBatchColorStockUpdateArrTypes[], operation: string, next: NextFunction) {
  betterConsoleLog('> Purses arr', pursesArr);
  try {
    const operations = pursesArr.map((item) => ({
      updateOne: {
        // OVDE MOZE BITI ISSUE! Bilo je `${item.colorId}` moguce sa dobrim razlogom!
        filter: { _id: new mongoose.Types.ObjectId(String(item.colorId)) },
        update: { $inc: { stock: operation === "increment" ? item.increment : -item.increment } },
      },
    }));

    return await PurseColorModel.collection.bulkWrite(operations);
  } catch (err) {
    const error = err as any;
    const statusCode = error.statusCode ?? 500;
    betterErrorLog("> Error updating purse batch stock:", error);
    next(new CustomError("There was an error while updating purse stock", Number(statusCode)));
    return;
  }
}

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
