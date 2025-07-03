/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import Supplier from "#schemas/supplier.ts";
import { getIO } from "#socket/initSocket.ts";
import CustomError from "#utils/CustomError.ts";
import { betterErrorLog } from "#utils/logMethods.ts";
import { NextFunction, Request, Response } from "express";

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
  } catch (error) {
    if (error.code === 11000) {
      next(new CustomError(`${error.keyValue.name} već postoji`, 409));
      return;
    }
    const statusCode = error.statusCode || 500;
    betterErrorLog("> Error adding a new supplier:", error);
    next(new CustomError("Doslo je do problema prilikom dodavanja dobavljača", statusCode));
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
  } catch (error) {
    const statusCode = error.statusCode || 500;
    betterErrorLog("> Error updating a supplier:", error);
    next(new CustomError("Doslo je do problema prilikom promene dobavljača", statusCode));
    return;
  }
};

// DELETE A SUPPLIER
export const deleteSupplier = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const deletedSupplier = await Supplier.findByIdAndDelete(id);
    if (!deletedSupplier) {
      next(new CustomError(`Dobavljač sa ID: ${id} nije pronadjen`, 404));
      return;
    }

    // SOCKET HANDLING
    const io = getIO();
    // await updateLastUpdatedField("supplierLastUpdatedAt", io);
    io.emit("supplierRemoved", deletedSupplier._id);

    res.status(200).json({ message: `Dobavljač ${deletedSupplier.name} je uspešno obrisan`, supplier: deletedSupplier });
  } catch (error) {
    const statusCode = error.statusCode ?? 500;
    betterErrorLog("> Error deleting a supplier:", error);
    next(new CustomError("Doslo je do problema prilikom brisanja dobavljača", statusCode));
    return;
  }
};
