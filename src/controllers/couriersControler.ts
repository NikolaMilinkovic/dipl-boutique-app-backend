/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
import Courier from "#schemas/courier.js";
import { getIO } from "#socket/initSocket.js";
import CustomError from "#utils/CustomError.js";
import { betterErrorLog } from "#utils/logMethods.js";
import { NextFunction, Request, Response } from "express";

// GET ALL COURIERS
export const getCouriers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const couriers = await Courier.find();
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
    const newCourier = new Courier({
      deliveryPrice: deliveryPrice,
      name: name,
    });

    await newCourier.save();
    const io = getIO();
    // await updateLastUpdatedField("courierLastUpdatedAt", io);
    io.emit("courierAdded", newCourier);

    res.status(200).json({ courier: newCourier, message: `Kurir ${name} je uspešno dodat` });
  } catch (error) {
    if (error.code === 11000) {
      next(new CustomError(`Kurir ${error.keyValue.name} već postoji`, 409));
      return;
    }
    const statusCode = error.statusCode ?? 500;
    betterErrorLog("> Error adding a new courier:", error);
    next(new CustomError("Došlo je do problema prilikom dodavanja kurira", statusCode));
    return;
  }
};

// UPDATE A COURIER
export const updateCourier = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { deliveryPrice, name } = req.body;
    const { id } = req.params;
    console.log(deliveryPrice, name);
    const updatedCourier = await Courier.findByIdAndUpdate(id, { deliveryPrice, name }, { new: true });
    console.log(updatedCourier);

    // Handle socket update
    const io = getIO();
    // await updateLastUpdatedField("courierLastUpdatedAt", io);
    io.emit("courierUpdated", updatedCourier);

    res.status(200).json({
      courier: updatedCourier,
      message: `Kurir ${name} uspešno sačuvan`,
    });
  } catch (error) {
    const statusCode = error.statusCode ?? 500;
    betterErrorLog("> Error updating a courier:", error);
    next(new CustomError("Do[lo je do problema prilikom promene kurira", statusCode));
    return;
  }
};

// DELETE A COURIER
export const deleteCourier = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const deleterCourier = await Courier.findByIdAndDelete(id);
    if (!deleterCourier) {
      next(new CustomError(`Kurir sa ID: ${id} nije pronadjen`, 404));
      return;
    }

    // SOCKET HANDLING
    const io = getIO();
    // await updateLastUpdatedField("courierLastUpdatedAt", io);
    io.emit("courierRemoved", deleterCourier._id);

    res.status(200).json({ courier: deleterCourier, message: `Kurir ${deleterCourier.name} je uspešno obrisan` });
  } catch (error) {
    const statusCode = error.statusCode ?? 500;
    betterErrorLog("> Error deleting a courier:", error);
    next(new CustomError("Došlo je do problema prilikom brisanja kurira", statusCode));
    return;
  }
};
