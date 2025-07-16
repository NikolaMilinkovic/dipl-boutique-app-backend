/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Type } from "@aws-sdk/client-s3";
import { NextFunction, Request, Response } from "express";
import { ObjectId, Types } from "mongoose";

import { DressColorTypes, ImageTypes, NewProductTypes, ProductColorTypes, ProductTypes, PurseColorTypes } from "../global/types.js";
import DressModel from "../schemas/dress.js";
import DressColorModel from "../schemas/dressColor.js";
import PurseModel from "../schemas/purse.js";
import PurseColorModel from "../schemas/purseColor.js";
import { getIO } from "../socket/initSocket.js";
import CustomError from "../utils/CustomError.js";
import { compareAndUpdate } from "../utils/helperMethods.js";
import { betterConsoleLog, betterErrorLog } from "../utils/logMethods.js";
import { deleteMediaFromS3, uploadMediaToS3 } from "../utils/s3/S3DefaultMethods.js";

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
    betterConsoleLog("> Error while fetching products", err);
    next(new CustomError("There was an error while fething products", statusCode as number));
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
    res.status(200).json({ message: `Proizvod ${product.name} je uspešno dodat` });
  } catch (err) {
    const error = err as any;
    const statusCode = error?.statusCode ?? 500;
    betterErrorLog(`> Error adding a new product: `, err);
    next(new CustomError("There was an error while adding product", statusCode as number));
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

export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
  interface DeletePurseBody {
    colorIds: string[];
    id: string;
    stockType: string;
  }
  try {
    const { colorIds, id, stockType } = req.body as DeletePurseBody;

    if (!id || !Array.isArray(colorIds)) {
      next(new CustomError("Invalid input data", 400));
      return;
    }

    // PURSE
    if (stockType === "Boja-Količina") {
      await deletePurse(id, colorIds, next);
    }

    // DRESS
    if (stockType === "Boja-Veličina-Količina") {
      await deleteDress(id, colorIds, next);
    }

    // SOCKET HANDLING
    const io = getIO();
    // updateLastUpdatedField('colorLastUpdatedAt', io);
    io.emit("productRemoved", id);
    res.status(200).json({ message: `Proizvod je uspešno obrisan` });
  } catch (err) {
    const error = err as any;
    const statusCode = error?.statusCode ?? 500;
    next(new CustomError("There was an error while deleting the product", statusCode as number));
  }
};

async function deleteDress(id: string, colorIds: string[], next: NextFunction) {
  await Promise.all(colorIds.map((colorId) => DressColorModel.findByIdAndDelete(colorId)));
  const dress = await DressModel.findById(id);
  if (!dress) {
    throw new Error("Dress not found");
  }
  const imageName = dress.image.imageName;
  await deleteMediaFromS3("images/products/", imageName, next);
  await DressModel.findByIdAndDelete(id);
}

async function deletePurse(id: string, colorIds: string[], next: NextFunction) {
  await Promise.all(colorIds.map((colorId) => PurseColorModel.findByIdAndDelete(colorId)));
  const purse = await PurseModel.findById(id);
  if (!purse) {
    throw new Error("Purse not found");
  }
  const imageName = purse.image.imageName;
  await deleteMediaFromS3("images/products/", imageName, next);
  await PurseModel.findByIdAndDelete(id);
}

export const updateProduct = async (req: Request<unknown, unknown, AddProductRequestBody>, res: Response, next: NextFunction) => {
  try {
    if (!req.body.product) {
      res.status(404).json({ message: "Product data not found, please try again" });
      return;
    }
    const product = JSON.parse(req.body.product) as ProductTypes;
    const db_product = await fetchProduct(product);
    if (!db_product) {
      next(new CustomError("Product not found in the database", 404));
      return;
    }

    // Update simple data
    db_product.category = compareAndUpdate(db_product.category, product.category) as string;
    db_product.price = compareAndUpdate(db_product.price, product.price) as number;
    db_product.name = compareAndUpdate(db_product.name, product.name) as string;
    db_product.description = compareAndUpdate(db_product.description, product.description) as string;
    db_product.supplier = compareAndUpdate(db_product.supplier, product.supplier) as string;

    // Replace Image
    if (req.file) {
      db_product.image = (await replaceProductImage(db_product.image.imageName, req.file, next)) as ImageTypes;
    }

    // Update colors
    const newColors = await updateColors(product, next);
    db_product.colors = compareAndUpdate(db_product.colors, newColors) as Types.ObjectId[];

    await db_product.save();
    const populatedProduct = await fetchPopulatedProduct(product);

    const io = getIO();
    // updateLastUpdatedField('colorLastUpdatedAt', io);
    io.emit("productUpdated", populatedProduct);
    res.status(200).json({ message: `Proizvod ${db_product.name} je uspešno ažuriran` });
  } catch (err) {
    const error = err as any;
    const statusCode = error?.statusCode ?? 500;
    betterErrorLog("> Error updating a product", err);
    next(new CustomError("There was an error while updating the product", statusCode as number));
  }
};

async function fetchPopulatedProduct(product: ProductTypes) {
  if (product.stockType === "Boja-Količina") {
    return PurseModel.findById(product._id).populate("colors");
  }
  return DressModel.findById(product._id).populate("colors");
}
async function fetchProduct(product: ProductTypes) {
  if (product.stockType === "Boja-Količina") {
    return PurseModel.findById(product._id);
  }
  return DressModel.findById(product._id);
}
async function replaceProductImage(imageName: string, file: Express.Multer.File, next: NextFunction) {
  await deleteMediaFromS3("images/products/", imageName, next);
  const newImage = await uploadMediaToS3("images/products/", file, next);
  if (!newImage) next(new CustomError("There was an error uploading the image to the storage, please try again", 500));
  return newImage;
}
async function updateColors(product: ProductTypes, next: NextFunction) {
  const colorsArray = Array.isArray(product.colors) ? product.colors : JSON.parse(product.colors);
  let insertedColors;

  // PURSE
  if (product.stockType === "Boja-Količina") {
    const db_product = await PurseModel.findById(product._id);
    if (!db_product) {
      next(new CustomError("Product not found", 404));
      return;
    }
    await PurseColorModel.deleteMany({ _id: { $in: db_product.colors } });
    const sanitizedColors = colorsArray.map((color: any) => {
      const { _id, ...rest } = color;
      return rest;
    });
    insertedColors = await PurseColorModel.insertMany(sanitizedColors);
  }

  // DRESS
  if (product.stockType === "Boja-Veličina-Količina") {
    const db_product = await DressModel.findById(product._id);
    if (!db_product) {
      next(new CustomError("Product not found", 404));
      return;
    }
    await DressColorModel.deleteMany({ _id: { $in: db_product.colors } });
    const sanitizedColors = colorsArray.map((color: any) => {
      const { _id, ...rest } = color;
      return rest;
    });
    insertedColors = await DressColorModel.insertMany(sanitizedColors);
  }

  if (!insertedColors) {
    next(new CustomError("There was an error while updating colors", 500));
    return;
  }

  return insertedColors.map((color) => color._id) as any;
}
