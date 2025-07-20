/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { NextFunction, Request, Response } from "express";

import Courier from "../../schemas/courier.js";
import { getIO } from "../../socket/initSocket.js";
import CustomError from "../../utils/CustomError.js";
import { betterErrorLog } from "../../utils/logMethods.js";
import { addCourierLogic, deleteCourierLogic, getCouriersLogic, updateCourierLogic } from "./couriersMethods.js";

// GET ALL COURIERS
export const getCouriers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const couriers = await getCouriersLogic();
    res.status(200).json(couriers);
  } catch (error) {
    betterErrorLog("> Error getting all couriers:", error);
    next(new CustomError("There was an error while fetching couriers", 500));
    return;
  }
};

// ADD NEW COURIER
export const addCourier = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { deliveryPrice, name } = req.body;
    const newCourier = await addCourierLogic(name, deliveryPrice);

    res.status(200).json({ courier: newCourier, message: `Courier ${name} has been successfully added` });
  } catch (err) {
    const error = err as any;
    if (error.code === 11000) {
      next(new CustomError(`Courier ${error.keyValue.name} already exists`, 409));
      return;
    }
    const statusCode = error.statusCode ?? 500;
    betterErrorLog("> Error adding a new courier:", error);
    next(new CustomError("There was an error while adding a courier", statusCode));
    return;
  }
};

// UPDATE A COURIER
export const updateCourier = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { deliveryPrice, name } = req.body;
    const { id } = req.params;
    const updatedCourier = await updateCourierLogic(id, name, deliveryPrice);

    res.status(200).json({
      courier: updatedCourier,
      message: `Courier ${name} successfully updated`,
    });
  } catch (err) {
    const error = err as any;
    const statusCode = error.statusCode ?? 500;
    betterErrorLog("> Error updating a courier:", error);
    next(new CustomError("There was an error while updating courier", statusCode));
    return;
  }
};

// DELETE A COURIER
export const deleteCourier = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const deletedCourier = await deleteCourierLogic(id);
    if (!deletedCourier) {
      next(new CustomError(`Courier with ID: ${id} was not found`, 404));
      return;
    }
    res.status(200).json({ courier: deletedCourier, message: `Courier ${deletedCourier.name} has been successfully deleted` });
  } catch (err) {
    const error = err as any;
    const statusCode = error.statusCode ?? 500;
    betterErrorLog("> Error deleting a courier:", error);
    next(new CustomError("There was an error while deleting courier", statusCode));
    return;
  }
};
