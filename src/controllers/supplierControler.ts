/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { NextFunction, Request, Response } from "express";

import Supplier from "../schemas/supplier.js";
import { getIO } from "../socket/initSocket.js";
import CustomError from "../utils/CustomError.js";
import { betterErrorLog } from "../utils/logMethods.js";

// GET ALL SUPPLIERS
export const getSuppliers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const suppliers = await Supplier.find();
    res.status(200).json(suppliers);
  } catch (error) {
    betterErrorLog("> Error fetchin suppliers:", error);
    next(new CustomError("There was an error while fetching suppliers", 500));
    return;
  }
};

// ADD NEW SUPPLIER
export const addSupplier = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name } = req.body;
    const newSupplier = new Supplier({
      name: name,
    });

    await newSupplier.save();

    const io = getIO();
    // await updateLastUpdatedField("supplierLastUpdatedAt", io);
    io.emit("supplierAdded", newSupplier);

    res.status(200).json({ message: `${newSupplier.name} je uspešno dodat `, supplier: newSupplier });
  } catch (err) {
    const error = err as any;
    if (error.code === 11000) {
      next(new CustomError(`${error.keyValue.name} već postoji`, 409));
      return;
    }
    const statusCode = error.statusCode ?? 500;
    betterErrorLog("> Error adding a new supplier:", error);
    next(new CustomError("There was an error while adding a supplier", statusCode));
    return;
  }
};

// // UPDATE A SUPPLIER
export const updateSupplier = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name } = req.body;
    const { id } = req.params;
    const updatedSupplier = await Supplier.findByIdAndUpdate(id, { name }, { new: true });

    const io = getIO();
    // await updateLastUpdatedField("supplierLastUpdatedAt", io);
    io.emit("supplierUpdated", updatedSupplier);

    res.status(200).json({
      message: `Dobavljač uspešno sačuvan kao ${name}`,
      supplier: updatedSupplier,
    });
  } catch (err) {
    const error = err as any;
    const statusCode = error.statusCode ?? 500;
    betterErrorLog("> Error updating a supplier:", error);
    next(new CustomError("There was an error while updating the supplier", statusCode));
    return;
  }
};

// DELETE A SUPPLIER
export const deleteSupplier = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const deletedSupplier = await Supplier.findByIdAndDelete(id);
    if (!deletedSupplier) {
      next(new CustomError(`Supplier with ID: ${id} was not found`, 404));
      return;
    }

    // SOCKET HANDLING
    const io = getIO();
    // await updateLastUpdatedField("supplierLastUpdatedAt", io);
    io.emit("supplierRemoved", deletedSupplier._id);

    res.status(200).json({ message: `Supplier ${deletedSupplier.name} has been successfully deleted`, supplier: deletedSupplier });
  } catch (err) {
    const error = err as any;
    const statusCode = error.statusCode ?? 500;
    betterErrorLog("> Error deleting a supplier:", error);
    next(new CustomError("There was an error while deleting the supplier", statusCode));
    return;
  }
};
