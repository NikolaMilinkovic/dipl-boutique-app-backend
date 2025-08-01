/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { NextFunction, Request, Response } from "express";

import Category from "../../schemas/category.js";
import { getIO } from "../../socket/initSocket.js";
import CustomError from "../../utils/CustomError.js";
import { betterErrorLog } from "../../utils/logMethods.js";
import { addCategoryLogic, deleteCategoryLogic, getCategoriesLogic, updateCategoryLogic } from "./categoriesMethods.js";

// GET
export const getCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await getCategoriesLogic();
    res.status(200).json(categories);
  } catch (error: unknown) {
    betterErrorLog("> Error while fetching categories:", error);
    next(new CustomError("There was an error while fetching categories", 500));
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
    const newCategory = await addCategoryLogic(name, stockType);

    res.status(200).json({ category: newCategory, message: `Category ${name} successfully added` });
  } catch (err) {
    const error = err as any;
    if (error.code === 11000) {
      next(new CustomError(`Category ${error?.keyValue?.name} alredy exists`, 409));
      return;
    }
    const statusCode = error?.statusCode ?? 500;
    betterErrorLog("> Error while adding a new category:", error);
    next(new CustomError("There was an error while adding a new category", statusCode));
    return;
  }
};

// DELETE
export const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const deletedCategory = await deleteCategoryLogic(id);
    if (!deletedCategory) {
      next(new CustomError(`Category with ID: ${id} was not found`, 404));
      return;
    }

    res.status(200).json({ color: deletedCategory, message: `Category ${deletedCategory.name} has been successfully deleted` });
  } catch (err) {
    const error = err as any;
    const statusCode = error?.statusCode ?? 500;
    betterErrorLog("> Error while deleting a category:", error);
    next(new CustomError("There was an error while deleting the category", statusCode));
    return;
  }
};

// UPDATE
export const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, stockType } = req.body;
    const { id } = req.params;
    const updatedCategory = await updateCategoryLogic(id, name, stockType);

    res.status(200).json({
      category: updatedCategory,
      message: `Category saved successfully as ${name}`,
    });
  } catch (error) {
    betterErrorLog("> Error while updating a category:", error);
    next(new CustomError("There was an error while updating category", 500));
    return;
  }
};
