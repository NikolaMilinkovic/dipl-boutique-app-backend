/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { CategoryTypes } from "#global/types.ts";
import Category from "#schemas/category.ts";
import { getIO } from "#socket/initSocket.ts";
import CustomError from "#utils/CustomError.ts";
import { betterErrorLog } from "#utils/logMethods.ts";
import { NextFunction, Request, Response } from "express";

// GET
export const getCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await Category.find();
    res.status(200).json(categories);
  } catch (error) {
    betterErrorLog("> Error while fetching categories:", error);
    next(new CustomError("Došlo je do problema prilikom preuzimanja kategorija", 500));
    return;
  }
};

interface CategoryAddRequestTypes {
  name: string;
  stockType: string;
}

// ADD
export const addCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, stockType } = req.body as CategoryAddRequestTypes;
    const newCategory = new Category({
      name: name,
      stockType: stockType,
    });
    await newCategory.save();

    const io = getIO();
    // updateLastUpdatedField("categoryLastUpdatedAt", io);
    io.emit("categoryAdded", newCategory);

    res.status(200).json({ category: newCategory, message: `Kategorija ${name} je uspešno dodata` });
  } catch (error: unknown) {
    if (error.code === 11000) {
      next(new CustomError(`Kategorija ${error?.keyValue?.name} već postoji`, 409));
      return;
    }
    const statusCode = error.statusCode ?? 500;
    betterErrorLog("> Error while adding a new category:", error);
    next(new CustomError("Došlo je do problema prilikom dodavanja kategorije", statusCode));
    return;
  }
};

// DELETE
export const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const deletedCategory = await Category.findByIdAndDelete(id);
    if (!deletedCategory) {
      next(new CustomError(`Kategorija sa ID: ${id} nije pronadjena`, 404));
      return;
    }

    // SOCKET HANDLING
    const io = getIO();
    // updateLastUpdatedField("categoryLastUpdatedAt", io);
    io.emit("categoryRemoved", deletedCategory._id);

    res.status(200).json({ color: deletedCategory, message: `Kategorija ${deletedCategory.name} je uspešno obrisana` });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    betterErrorLog("> Error while deleting a category:", error);
    next(new CustomError("Došlo je do problema prilikom brisanja kategorije", statusCode));
    return;
  }
};

// UPDATE
export const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, stockType } = req.body;
    const { id } = req.params;
    const updatedCategory = await Category.findByIdAndUpdate(id, { name, stockType }, { new: true });

    // Handle socket update
    const io = getIO();
    // updateLastUpdatedField('categoryLastUpdatedAt', io);
    io.emit("categoryUpdated", updatedCategory);

    // Send a response
    res.status(200).json({
      category: updatedCategory,
      message: `Kategorija uspešno sačuvana kao ${name}`,
    });
  } catch (error) {
    betterErrorLog("> Error while updating a category:", error);
    next(new CustomError("There was an error while updating category", 500));
    return;
  }
};
