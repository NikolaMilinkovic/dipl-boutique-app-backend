/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { NextFunction } from "express";

import DressColorModel from "../../schemas/dressColor.js";
import CustomError from "../CustomError.js";
import { betterErrorLog } from "../logMethods.js";

export async function dressColorStockHandler(colorId: string, sizeId: string, operation: string, value = 1, next: NextFunction) {
  try {
    const dressColor = await DressColorModel.findById(colorId);
    if (!dressColor) {
      next(new CustomError(`Dress Color objekat nije pronadjen za id ${colorId}`, 404));
      return;
    }

    // Find the correct size object
    const sizeToUpdate = dressColor.sizes.find((size) => size._id.toString() === sizeId);
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
