/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { NextFunction } from "express";
import mongoose from "mongoose";

import DressColorModel from "../../schemas/dressColor.js";
import CustomError from "../CustomError.js";
import { betterConsoleLog, betterErrorLog } from "../logMethods.js";

interface DressArrTypes {
  colorId: string;
  dressId: string;
  increment: number;
  sizeId: string;
}

/**
 * @param {Array<Object>} dressesArr - Array of objects with neccessary data for dress update
 * Each object contains:
 * - dressId: string
 * - colorId: string
 * - sizeId: string
 * - increment: number
 * @param {String} operation - can either be increment | decrement
 * @param {Function} next - callback function for error handling
 * @returns {Promise} - A promise resolving to the updated stock levels or an error.
 */
export async function dressBatchColorStockHandler(dressesArr: DressArrTypes[], operation: string, next: NextFunction) {
  betterConsoleLog('> Dresses arr', dressesArr);
  try {
    const operations = dressesArr.map((item) => ({
      updateOne: {
        filter: {
          _id: new mongoose.Types.ObjectId(String(item.colorId)),
          "sizes._id": new mongoose.Types.ObjectId(String(item.sizeId)),
        },
        update: { $inc: { "sizes.$.stock": operation === "increment" ? item.increment : -item.increment } },
      },
    }));

    return await DressColorModel.collection.bulkWrite(operations);
  } catch (err) {
    const error = err as any;
    const statusCode = error.statusCode ?? 500;
    betterErrorLog("> Error updating purse batch stock:", error);
    next(new CustomError("Došlo je do problema prilikom ažuriranja stanja artikala", Number(statusCode)));
    return;
  }
}
export async function dressColorStockHandler(colorId: string, sizeId: string, operation: string, value = 1, next: NextFunction) {
  try {
    const dressColor = await DressColorModel.findById(colorId);
    if (!dressColor) {
      next(new CustomError(`Dress Color objekat nije pronadjen za id ${colorId}`, 404));
      return;
    }

    // Find the correct size object
    const sizeToUpdate = dressColor.sizes.find((size: any) => size._id.toString() === sizeId);
    if (!sizeToUpdate) {
      next(new CustomError(`Sizer objekat nije pronadjen za id ${sizeId}`, 404));
      return;
    }

    // Decrement / Increment based on provided operation
    if (operation === "decrement") {
      if (sizeToUpdate.stock > 0) {
        sizeToUpdate.stock -= value;
      } else {
        next(new CustomError(`Nedovoljno zaliha na stanju [${sizeToUpdate.stock.toString()}] za size id: ${sizeId}`, 500));
        return;
      }
    } else if (operation === "increment") {
      sizeToUpdate.stock += value;
    } else {
      next(new CustomError(`Pogrešan unos za operaciju u dressColorStockHandler [increment | decrement] vaš unos: ${operation}`, 500));
      return;
    }

    return await dressColor.save();
  } catch (err) {
    const error = err as any;
    const statusCode = error?.statusCode ?? 500;
    betterErrorLog("> Error adding an order:", error);
    next(new CustomError("Došlo je do problema prilikom dodavanja porudžbine", Number(statusCode)));
    return;
  }
}
