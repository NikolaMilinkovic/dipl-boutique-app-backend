/* eslint-disable @typescript-eslint/no-empty-object-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { NextFunction, Request, Response } from "express";

import DressModel from "../../schemas/dress.js";
import Order from "../../schemas/order.js";
import PurseModel from "../../schemas/purse.js";
import { getIO } from "../../socket/initSocket.js";
import { parseOrderData } from "../../utils/AI/parseOrderData.js";
import CustomError from "../../utils/CustomError.js";
import { dressColorStockHandler } from "../../utils/dress/dressMethods.js";
import { betterErrorLog } from "../../utils/logMethods.js";
import { purseColorStockHandler } from "../../utils/purse/purseMethods.js";
import { uploadMediaToS3 } from "../../utils/s3/S3DefaultMethods.js";
import { removeBatchOrdersById, removeOrderById } from "./orderMethods.js";

interface ParseOrderRequestBody {
  orderData: string;
}

export const parseOrder = async (req: Request<{}, {}, ParseOrderRequestBody>, res: Response, next: NextFunction) => {
  try {
    const { orderData } = req.body;

    if (!orderData) {
      next(new CustomError("There was an error while parsing data", 400));
      return;
    }

    const rawResponse = await parseOrderData(orderData);

    res.status(200).json({
      data: rawResponse,
      message: "Data parsed successfully",
    });
  } catch (error) {
    betterErrorLog("> Error parsing order data via AI:", error);
    next(new CustomError("There was an error while parsing order data", 500));
    return;
  }
};
export const addOrder = async (req: Request<unknown, unknown>, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.body.productData) {
      res.status(404).json({ message: "Product data not found, please try again" });
      return;
    }
    if (!req.file) {
      res.status(404).json({ message: "Product image not found, please try again" });
      return;
    }

    const buyerData = JSON.parse(req.body.buyerData as string);
    const productData = JSON.parse(req.body.productData as string);
    const productsPrice = parseFloat(req.body.productsPrice as string);
    const totalPrice = parseFloat(req.body.totalPrice as string);
    // Parse values back to bool
    const reservation = req.body.reservation === "true";
    const packedIndicator = req.body.packed === "true";
    const packed = req.body.packed === "true";
    const processed = req.body.processed === "true";
    const courier = JSON.parse(req.body.courier as string);
    const weight = req.body?.weight || 1;
    const value = req.body?.value || "";
    const internalRemark = req.body?.internalRemark || "";
    const deliveryRemark = req.body?.deliveryRemark || "";
    const orderNotes = req.body?.orderNotes || "";
    const reservationDate = req.body?.reservationDate ? new Date(req.body.reservationDate as string) : null;

    if (
      !buyerData ||
      !productData ||
      !Array.isArray(productData) ||
      productData.length === 0 ||
      !productsPrice ||
      !totalPrice ||
      typeof reservation !== "boolean" ||
      typeof packedIndicator !== "boolean" ||
      typeof packed !== "boolean" ||
      typeof processed !== "boolean" ||
      !courier
    ) {
      console.error("> Nepotpuni podaci za dodavanje porudzbine!");
      next(new CustomError("Nepotpuni podaci za dodavanje nove porudžbine", 404));
      return;
    }

    // Extract profile image
    const profileImage = await uploadMediaToS3("images/profiles/", req.file, next);
    if (!profileImage) {
      res.status(500).json({ message: "There was an error while adding profile image to AWS storage" });
      return;
    }

    productData.forEach((product) => {
      product.itemReference = product.itemReference._id;
    });

    // NEW ORDER
    const order = new Order({
      buyer: {
        address: buyerData.address,
        bankNumber: buyerData?.bankNumber || "",
        name: buyerData.name,
        phone: buyerData.phone,
        phone2: buyerData?.phone2 || "",
        place: buyerData?.place || "",
        profileImage: {
          imageName: profileImage.imageName,
          uri: profileImage.uri,
        },
      },
      courier: {
        deliveryPrice: courier.deliveryPrice,
        name: courier.name,
      },
      deliveryRemark: deliveryRemark,
      internalRemark: internalRemark,
      orderNotes: orderNotes,
      packed: packed,
      packedIndicator: packed,
      processed: processed,
      products: productData,
      productsPrice: productsPrice,
      reservation: reservation,
      reservationDate: reservationDate,
      totalPrice: totalPrice,
      value: value,
      weight: weight,
    });

    const newOrder = await order.save();

    const io = getIO();
    io.emit("orderAdded", newOrder);
    const dressUpdateData = [];
    const purseUpdateData = [];

    // SOCKETS | Handles updates in the database & on client
    for (const product of productData) {
      try {
        if (product.stockType === "Boja-Veličina-Količina") {
          // Update the dress stock in DB
          const updatedItem = await dressColorStockHandler(product.selectedColorId as string, product.selectedSizeId as string, "decrement", 1, next);
          const dress = await DressModel.findById(product.itemReference);
          if (!dress?.totalStock) {
            res.status(500).json({ message: "There was an error while updating the dress data" });
            return;
          }
          dress.totalStock -= 1;
          await dress.save();
          if (!updatedItem) return;

          // Check and update item status if needed
          // Commented out because we want to see when item is out of stock
          // If item is not active it will not be displayed in browse products
          // const checkedItem = await updateDressActiveStatus(product.itemReference._id);
          // if(!checkedItem) return;

          // Emit new dress stock
          const dressData = {
            colorId: product.selectedColorId,
            decrement: 1,
            dressId: product.itemReference,
            sizeId: product.selectedSizeId,
            stockType: product.stockType,
          };
          dressUpdateData.push(dressData);
        } else {
          // Update the purse stock in DB
          const updatedItem = await purseColorStockHandler(product.selectedColorId as string, "decrement", 1, next);
          const purse = await PurseModel.findById(product.itemReference);
          if (!purse?.totalStock) {
            res.status(500).json({ message: "There was an error while updating the purse data | Total stock issue" });
            return;
          }
          purse.totalStock -= 1;
          await purse.save();
          if (!updatedItem) return;

          // Check and update item status if needed
          // Commented out because we want to see when item is out of stock
          // If item is not active it will not be displayed in browse products
          // const checkedItem = await updatePurseActiveStatus(product.itemReference._id);
          // if(!checkedItem) return;

          // Emit new purse stock
          const purseData = {
            colorId: product.selectedColorId,
            decrement: 1,
            purseId: product.itemReference,
            stockType: product.stockType,
          };
          purseUpdateData.push(purseData);
        }
      } catch (error) {
        betterErrorLog("> Error while updating product stock on backend", error);
        console.error(error);
      }
    }

    const stockUpdateData = { dresses: dressUpdateData, purses: purseUpdateData };
    io.emit("batchStockDecrease", stockUpdateData);

    res.status(200).json({ message: "Porudžbina uspešno dodata" });
    return;
  } catch (err) {
    const error = err as any;
    const statusCode = error?.statusCode ?? 500;
    betterErrorLog("> Error adding a new order", error);
    next(new CustomError("Došlo je do problema prilikom dodavanja porudžbine", Number(statusCode)));
    console.error(error);
    return;
  }
};

export const getOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const populateColors = {
      path: "products.itemReference",
      populate: { path: "colors" },
    };

    const processedOrders = await Order.find({ processed: true }).sort({ createdAt: -1 }).populate(populateColors);
    const unprocessedOrders = await Order.find({ processed: false }).sort({ createdAt: -1 }).populate(populateColors);
    const unpackedOrders = await Order.find({ packed: false, packedIndicator: false }).sort({ createdAt: -1 }).populate(populateColors);
    const orders = {
      processedOrders,
      unpackedOrders,
      unprocessedOrders,
    };

    res.status(200).json({ message: "Orders fetched successfully", orders });
  } catch (err) {
    const error = err as any;
    const statusCode = error?.statusCode ?? 500;
    betterErrorLog("> Error fetching processed orders:", error);
    next(new CustomError("Došlo je do problema prilikom preuzimanja porudžbina", Number(statusCode)));
    return;
  }
};

// DELETE BATCH ORDERS
export const removeOrdersBatch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const orderIds: string[] = req.body;

    if (orderIds.length === 1) {
      await removeOrderById(orderIds[0]);
    } else if (orderIds.length > 1) {
      await removeBatchOrdersById(orderIds);
    }

    res.status(200).json({ message: "Sve izabrane porudžbine su uspešno obrisane" });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    betterErrorLog("> Error during batch order delete:", error);
    next(new CustomError("Došlo je do problema prilikom brisanja porudžbina", Number(statusCode)));
  }
};
