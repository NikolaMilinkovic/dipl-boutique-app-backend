/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  ColorSizeTypes,
  ImageTypes,
  NewColorObjectTypes,
  NewProductTypes,
  NewPurseColorTypes,
  ProductColorTypes,
  PurseColorTypes,
  PurseTypes,
} from "#global/types.ts";
import color from "#schemas/color.ts";
import DressModel from "#schemas/dress.ts";
import PurseModel from "#schemas/purse.ts";
import PurseColorModel from "#schemas/purseColor.ts";
import { getIO } from "#socket/initSocket.ts";
import CustomError from "#utils/CustomError.ts";
import { betterConsoleLog, betterErrorLog } from "#utils/logMethods.ts";
import { uploadFileToS3, uploadMediaToS3 } from "#utils/s3/S3DefaultMethods.ts";
import { NextFunction, Request, Response } from "express";
import { RequestOptions } from "https";

interface AddProductRequestBody {
  product: string;
}

export const getProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log("> Getting all products...");
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
  } catch (error: unknown) {
    const statusCode = error?.statusCode ?? 500;
    next(new CustomError("Doslo je do problema prilikom preuzimanja proizvoda", statusCode as number));
  }
};

export const addProduct = async (req: Request<unknown, unknown, AddProductRequestBody>, res: Response, next: NextFunction) => {
  try {
    if (!req.body.product) {
      return res.status(404).json({ message: "Product data not found, please try again" });
    }
    if (!req.file) {
      return res.status(404).json({ message: "Product image not found, please try again" });
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
      return res.status(500).json({ message: "There was an error while adding image to AWS storage" });
    }

    // PURSE
    if (product.stockType === "Boja-Količina") {
      await addPurse(product, colorsArray, image, next);
    }

    // DRESS
    if (product.stockType === "Boja-Veličina-Količina") {
      // Create color objects -> _id
      // create new product
      // call socket to update products to all user
    }
    res.status(200).json({ message: `Proizvod ${product.name} je uspešno dodat.` });
  } catch (error: unknown) {
    const statusCode = error?.statusCode ?? 500;
    next(new CustomError("Doslo je do problema prilikom dodavanja proizvoda", statusCode as number));
  }
};

async function addDress() {}
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
