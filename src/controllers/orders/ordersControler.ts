// prettier-ignore-file
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-empty-object-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { NextFunction, Request, Response } from "express";

import { ProductTypes } from "../../global/types.js";
import DressModel from "../../schemas/dress.js";
import Order from "../../schemas/order.js";
import PurseModel from "../../schemas/purse.js";
import { getIO } from "../../socket/initSocket.js";
import { parseOrderData } from "../../utils/AI/parseOrderData.js";
import CustomError from "../../utils/CustomError.js";
import { dressBatchColorStockHandler, dressColorStockHandler } from "../../utils/dress/dressMethods.js";
import { compareAndUpdate } from "../../utils/helperMethods.js";
import { betterErrorLog } from "../../utils/logMethods.js";
import { purseBatchColorStockHandler, purseColorStockHandler } from "../../utils/purse/purseMethods.js";
import { deleteMediaFromS3, uploadMediaToS3 } from "../../utils/s3/S3DefaultMethods.js";
import {
  packOrdersByIdsLogic,
  removeBatchOrdersById,
  removeOrderById,
  setOrderPackedIndicatorToFalseLogic,
  setOrderPackedIndicatorToTrueLogic,
} from "./orderMethods.js";

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

    const populatedOrder = await Order.findById(newOrder._id)
      .populate({
        path: "products.itemReference",
        populate: { path: "colors" },
      })
      .exec();

    const io = getIO();
    io.emit("orderAdded", populatedOrder);
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

export const updateOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const {
      address, // string
      bankNumber, // string
      name, // string
      orderNotes, //string
      phone, // number
      phone2, // number
      place, // string
    } = req.body;

    if (!address || !name || !phone || !place || !req.body.courier) {
      next(new CustomError("Missing data during product update", 404));
      return;
    }

    const courier = JSON.parse(req.body.courier as string);
    const products = JSON.parse(req.body.products as string);
    const reservation = req.body.reservation === "true";
    const packed = req.body.packed === "true";
    const productsPrice = parseFloat(req.body.productsPrice as string);
    const totalPrice = parseFloat(req.body.totalPrice as string);

    const internalRemark = req.body?.internalRemark || "";
    const deliveryRemark = req.body?.deliveryRemark || "";

    const { addedProducts, removedProducts } = compareProductArrays(order.products as any[], products);

    // Increment the stock for each removed product from the order
    const io = getIO();
    if (removedProducts.length > 0) {
      const dresses = [];
      const purses = [];

      for (const item of order.products) {
        if (!item._id) {
          next(new CustomError("Missing id during product update", 404));
          return;
        } else {
          const itemIdStr = item._id.toString();
          if (removedProducts.some((id: string) => id.toString() === itemIdStr)) {
            let data;
            // Get correct data object for stock increase
            item.stockType === "Boja-Veličina-Količina" ? (data = getDressIncrementData(item)) : (data = getPurseIncrementData(item));
            // Push each data object to correct array based on stock type
            item.stockType === "Boja-Veličina-Količina" ? dresses.push(data) : purses.push(data);
          }
        }
      }
      if (purses.length > 0) await purseBatchColorStockHandler(purses as any, "increment", next);
      if (dresses.length > 0) await dressBatchColorStockHandler(dresses as any, "increment", next);

      const data = {
        dresses: dresses,
        purses: purses,
      };
      io.emit("batchStockIncrease", data);
    }

    if (addedProducts.length > 0) {
      const dresses = [];
      const purses = [];

      for (const item of addedProducts) {
        let data;
        // Get correct data object for stock decrease
        item.stockType === "Boja-Veličina-Količina" ? (data = getDressIncrementData(item)) : (data = getPurseIncrementData(item));
        // Push each data object to correct array based on stock type
        item.stockType === "Boja-Veličina-Količina" ? dresses.push(data) : purses.push(data);
      }
      if (purses.length > 0) await purseBatchColorStockHandler(purses as any, "decrement", next);
      if (dresses.length > 0) await dressBatchColorStockHandler(dresses as any, "decrement", next);
      const data = {
        dresses: dresses,
        purses: purses,
      };
      io.emit("batchStockDecrease", data);
    }

    order.buyer.name = compareAndUpdate(order.buyer.name, name);
    order.buyer.address = compareAndUpdate(order.buyer.address, address);
    order.buyer.phone = compareAndUpdate(order.buyer.phone, phone);
    order.courier = compareAndUpdate(order.courier, courier);
    order.products = compareAndUpdate(order.products, products);
    order.reservation = compareAndUpdate(order.reservation, reservation);
    order.packed = compareAndUpdate(order.packed, packed);
    order.productsPrice = compareAndUpdate(order.productsPrice, productsPrice);
    order.totalPrice = compareAndUpdate(order.totalPrice, totalPrice);
    order.orderNotes = compareAndUpdate(order.orderNotes, orderNotes);
    order.buyer.place = compareAndUpdate(order.buyer.place, place);
    order.buyer.phone2 = compareAndUpdate(order.buyer.phone2, phone2);
    order.buyer.bankNumber = compareAndUpdate(order.buyer.bankNumber, bankNumber);
    order.internalRemark = compareAndUpdate(order.internalRemark, internalRemark);
    order.deliveryRemark = compareAndUpdate(order.deliveryRemark, deliveryRemark);

    if (req.file) {
      await deleteMediaFromS3("images/profiles/", order.buyer.profileImage.imageName);
      const image = await uploadMediaToS3("images/profiles/", req.file, next);
      if (image) order.buyer.profileImage = image;
    }

    const updatedOrder = await order.save();
    const populatedOrder = await Order.findById(updatedOrder._id)
      .populate({
        path: "products.itemReference",
        populate: { path: "colors" },
      })
      .exec();
    io.emit("orderUpdated", populatedOrder);
    res.status(200).json({ message: "Porudžbina uspešno ažurirana" });
  } catch (err) {
    const error = err as any;
    const statusCode = error.statusCode ?? 500;
    betterErrorLog("> Error while updating an order", error);
    next(new CustomError("There was an error while updating the product", Number(statusCode)));
    return;
  }
};

function compareProductArrays(oldProducts: ProductTypes[], newProducts: ProductTypes[]) {
  // Get _id strings for products with an _id in oldProducts
  const oldProductIds = oldProducts.filter((product) => product._id).map((product) => product._id.toString());

  // Get _id strings for products with an _id in newProducts
  const newProductIds = newProducts.filter((product) => product._id).map((product) => product._id.toString());

  // Find removed products by comparing old ids with new ids
  const removedProducts = oldProductIds.filter((id) => !newProductIds.includes(id));

  // Find added products by including products without _id and those with _id not in oldProductIds
  const addedProducts = [
    ...newProducts.filter((product) => !product._id), // Products without _id are new
    ...newProducts.filter((product) => product._id && !oldProductIds.includes(product._id.toString())), // Products with _id not in oldProducts
  ];

  return { addedProducts, removedProducts };
}
function getDressIncrementData(item: any) {
  return {
    colorId: item.selectedColorId,
    dressId: item.itemReference._id.toString(),
    increment: 1,
    sizeId: item.selectedSizeId,
  };
}
function getPurseIncrementData(item: any) {
  return {
    colorId: item.selectedColorId,
    increment: 1,
    purseId: item.itemReference._id.toString(),
  };
}

export const setIndicatorToTrue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await setOrderPackedIndicatorToTrueLogic(id);
    if (!result) next(new CustomError("There was an error while packing the order", 500));

    res.status(200).json({ message: "Success" });
  } catch (err) {
    const error = err as any;
    const statusCode = error.statusCode ?? 500;
    betterErrorLog("> Error while updating package indicator to true", error);
    next(new CustomError("There was an error while packing the order", Number(statusCode)));
    return;
  }
};

export const setIndicatorToFalse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await setOrderPackedIndicatorToFalseLogic(id);
    if (!result) next(new CustomError("There was an error while packing the order", 500));

    res.status(200).json({ message: "Success" });
  } catch (err) {
    const error = err as any;
    const statusCode = error.statusCode ?? 500;
    betterErrorLog("> Error while updating package indicator to false", error);
    next(new CustomError("There was an error while packing the order", Number(statusCode)));
    return;
  }
};

export const packOrdersByIds = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { packedIds } = req.body;
    await packOrdersByIdsLogic(packedIds);
    res.status(200).json({ message: "Porudžbine uspešno spakovane" });
  } catch (err) {
    const error = err as any;
    const statusCode = error.statusCode ?? 500;
    betterErrorLog("> Error while packing orders by ID's", error);
    next(new CustomError("Došlo je do problema prilikom ažuriranja stanja pakovanja porudžbine", Number(statusCode)));
    return;
  }
};
