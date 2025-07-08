/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { NextFunction, Request, Response } from "express";

import { ImageTypes, NewProductTypes, ProductColorTypes } from "../global/types.js";
import DressModel from "../schemas/dress.js";
import DressColorModel from "../schemas/dressColor.js";
import PurseModel from "../schemas/purse.js";
import PurseColorModel from "../schemas/purseColor.js";
import { getIO } from "../socket/initSocket.js";
import CustomError from "../utils/CustomError.js";
import { betterErrorLog } from "../utils/logMethods.js";
import { uploadMediaToS3 } from "../utils/s3/S3DefaultMethods.js";

interface AddProductRequestBody {
  product: string;
}

export const getProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [activePurses, activeDresses, inactivePurses, inactiveDresses] = await Promise.all([
      PurseModel.find({ active: true }).populate("colors").sort({ createdAt: -1 }),
      DressModel.find({ active: true }).populate("colors").sort({ createdAt: -1 }),
      PurseModel.find({ active: false }).populate("colors").sort({ createdAt: -1 }),
      DressModel.find({ active: false }).populate("colors").sort({ createdAt: -1 }),
    ]);

    const activeProducts = [...activePurses, ...activeDresses];
    const inactiveProducts = [...inactivePurses, ...inactiveDresses];

    res.status(200).json({
      activeProducts,
      allProducts: [...activeProducts, ...inactiveProducts],
      inactiveProducts,
    });
  } catch (err) {
    const error = err as any;
    const statusCode = error?.statusCode ?? 500;
    next(new CustomError("Doslo je do problema prilikom preuzimanja proizvoda", statusCode as number));
  }
};

export const addProduct = async (req: Request<unknown, unknown, AddProductRequestBody>, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.body.product) {
      res.status(404).json({ message: "Product data not found, please try again" });
      return;
    }
    if (!req.file) {
      res.status(404).json({ message: "Product image not found, please try again" });
      return;
    }
    const product = JSON.parse(req.body.product) as NewProductTypes;
    const file: Express.Multer.File = req.file;

    const colorsArray: ProductColorTypes[] = Array.isArray(product.colors) ? product.colors : JSON.parse(product.colors);
    colorsArray.forEach((color: ProductColorTypes) => {
      delete color._id;
    });

    // Save image to S3 -> imageName, uri
    const image = await uploadMediaToS3("images/products/", file, next);
    if (!image) {
      res.status(500).json({ message: "There was an error while adding image to AWS storage" });
      return;
    }

    // PURSE
    if (product.stockType === "Boja-Količina") {
      await addPurse(product, colorsArray, image, next);
    }

    // DRESS
    if (product.stockType === "Boja-Veličina-Količina") {
      await addDress(product, colorsArray, image, next);
    }
    res.status(200).json({ message: `Proizvod ${product.name} je uspešno dodat.` });
  } catch (err) {
    const error = err as any;
    const statusCode = error?.statusCode ?? 500;
    betterErrorLog(`> Error adding a new product: `, err);
    next(new CustomError("Doslo je do problema prilikom dodavanja proizvoda", statusCode as number));
  }
};

async function addDress(product: NewProductTypes, colorsArray: ProductColorTypes[], image: ImageTypes, next: NextFunction) {
  const insertedColors = await DressColorModel.insertMany(colorsArray);
  const colorIds = insertedColors.map((color) => color._id);

  let totalStock = 0;
  for (const color of insertedColors) {
    for (const sizeObj of color.sizes) {
      totalStock += sizeObj.stock;
    }
  }

  const newDress = new DressModel({
    category: product.category,
    colors: colorIds,
    description: product.description,
    image,
    name: product.name,
    price: product.price,
    stockType: product.stockType,
    supplier: product.supplier,
    totalStock,
  });

  const result = await newDress.save();
  const populatedDress = await DressModel.findById(result._id).populate("colors");

  const io = getIO();
  io.emit("productAdded", populatedDress);
}

async function addPurse(product: NewProductTypes, colorsArray: ProductColorTypes[], image: ImageTypes, next: NextFunction) {
  const insertedColors = await PurseColorModel.insertMany(colorsArray);
  const colorIds = insertedColors.map((color) => color._id);
  const totalStock = insertedColors.reduce((sum, color) => sum + color.stock, 0);

  const newPurse = new PurseModel({
    category: product.category,
    colors: colorIds,
    description: product.description,
    image,
    name: product.name,
    price: product.price,
    stockType: product.stockType,
    supplier: product.supplier,
    totalStock,
  });

  const result = await newPurse.save();
  const populatedPurse = await PurseModel.findById(result._id).populate("colors");

  const io = getIO();
  io.emit("productAdded", populatedPurse);
}
