/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { NextFunction, Request, Response } from "express";

import Color, { IColor } from "../../schemas/color.js";
import { getIO } from "../../socket/initSocket.js";
import CustomError from "../../utils/CustomError.js";
import { betterErrorLog } from "../../utils/logMethods.js";
import { AddColorInput, addColorLogic } from "./colorsMethods.js";

// GET ALL COLORS
export const getColors = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const colors: IColor[] = await Color.find();
    res.status(200).json(colors);
  } catch (error) {
    betterErrorLog("> Error getting all colors:", error);
    next(new CustomError("There was an error while fetching colors", 500));
    return;
  }
};

// ADD NEW COLOR
export const addColor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { colorCode, name } = req.body as AddColorInput;
    const result = await addColorLogic({ colorCode, name });
    res.status(200).json(result);
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
      next(new CustomError(`${name} already exists`, 409));
      return;
    }

    betterErrorLog("> Error adding a new color:", error);
    const statusCode = mongoError.statusCode ?? 500;
    next(new CustomError(`There was an error while adding color [${mongoError.code}]`, statusCode));
  }
};

// DELETE A COLOR
export const deleteColor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const deletedColor = await Color.findByIdAndDelete(id);
    if (!deletedColor) {
      next(new CustomError(`Color with ID: ${id} was not found`, 404));
      return;
    }

    // SOCKET HANDLING
    const io = getIO();
    // updateLastUpdatedField('colorLastUpdatedAt', io);
    io.emit("colorRemoved", deletedColor._id);

    res.status(200).json({ color: deletedColor, message: `${deletedColor.name} has been successfully deleteda` });
  } catch (err) {
    const error = err as any;
    const statusCode = error?.statusCode ?? 500;
    betterErrorLog("> Error deleting a color:", error);
    next(new CustomError("There was an error while deleting color", statusCode));
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
      message: `Color saved as ${name}`,
    });
  } catch (err) {
    const error = err as any;
    const statusCode = error.statusCode ?? 500;
    betterErrorLog("> Error updating a color:", error);
    next(new CustomError("There was an error while updating color", statusCode));
    return;
  }
};
