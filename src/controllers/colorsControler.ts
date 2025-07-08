/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
import Color, { IColor } from "#schemas/color.js";
import CustomError from "#utils/CustomError.js";
import { betterErrorLog } from "#utils/logMethods.js";
import { NextFunction, Request, Response } from "express";

import { getIO } from "../socket/initSocket.js";

// GET ALL COLORS
export const getColors = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const colors: IColor[] = await Color.find();
    res.status(200).json(colors);
  } catch (error) {
    betterErrorLog("> Error getting all colors:", error);
    next(new CustomError("Došlo je do problema prilikom preuzimanja boja", 500));
    return;
  }
};

interface ColorRequestBody {
  colorCode?: string;
  name: string;
}

// ADD NEW COLOR
export const addColor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { colorCode, name } = req.body as ColorRequestBody;
    const newColor = new Color({
      colorCode: colorCode ?? "#68e823",
      name: name,
    });

    await newColor.save();

    // SOCKET HANDLING
    const io = getIO();
    // updateLastUpdatedField("colorLastUpdatedAt", io);
    io.emit("colorAdded", newColor);

    res.status(200).json({ color: newColor, message: `${name} boja je uspešno dodata` });
  } catch (error: unknown) {
    const mongoError = error as {
      cause?: {
        code?: number;
        keyValue?: { name?: string };
      };
      code?: number;
      statusCode?: number;
    };

    const mongoErrCode = mongoError.cause?.code;

    if (mongoError.code === 11000 || mongoErrCode === 11000) {
      const name = mongoError.cause?.keyValue?.name ?? "Boja";
      next(new CustomError(`${name} boja već postoji`, 409));
      return;
    }

    betterErrorLog("> Error adding a new color:", error);
    const statusCode = mongoError.statusCode ?? 500;
    next(new CustomError(`Došlo je do problema prilikom dodavanja boje [${mongoError.code}]`, statusCode));
  }
};

// DELETE A COLOR
export const deleteColor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const deletedColor = await Color.findByIdAndDelete(id);
    if (!deletedColor) {
      next(new CustomError(`Boja sa ID: ${id} nije pronađena`, 404));
      return;
    }

    // SOCKET HANDLING
    const io = getIO();
    // updateLastUpdatedField('colorLastUpdatedAt', io);
    io.emit("colorRemoved", deletedColor._id);

    res.status(200).json({ color: deletedColor, message: `${deletedColor.name} boja je uspešno obrisana` });
  } catch (error: unknown) {
    const statusCode = error?.statusCode ?? 500;
    betterErrorLog("> Error deleting a color:", error);
    next(new CustomError("Došlo je do problema prilikom brisanja boje", statusCode));
    return;
  }
};

// UPDATE A COLOR
export const updateColor = async (req: Request, res: Response, next: NextFunction) => {
  interface ColorRequestBody {
    colorCode: string;
    name: string;
  }
  try {
    const { colorCode, name } = req.body as ColorRequestBody;
    const { id } = req.params;
    const updatedColor = await Color.findByIdAndUpdate(id, { colorCode, name }, { new: true });

    // SOCKET HANDLING
    // updateLastUpdatedField('colorLastUpdatedAt', io);
    const io = getIO();
    io.emit("colorUpdated", updatedColor);

    res.status(200).json({
      color: updatedColor,
      message: `Boja uspešno sačuvana kao ${name}`,
    });
  } catch (error: unknown) {
    const statusCode = error.statusCode ?? 500;
    betterErrorLog("> Error updating a color:", error);
    next(new CustomError("Došlo je do problema prilikom promene boje", statusCode));
    return;
  }
};
