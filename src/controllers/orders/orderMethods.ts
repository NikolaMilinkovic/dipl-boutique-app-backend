/* eslint-disable @typescript-eslint/no-unnecessary-template-expression */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/restrict-template-expressions */

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable perfectionist/sort-modules */
import mongoose from "mongoose";

import DressModel from "../../schemas/dress.js";
import DressColorModel from "../../schemas/dressColor.js";
import Order from "../../schemas/order.js";
import PurseModel from "../../schemas/purse.js";
import PurseColorModel from "../../schemas/purseColor.js";
import { getIO } from "../../socket/initSocket.js";
import CustomError from "../../utils/CustomError.js";
import { betterErrorLog } from "../../utils/logMethods.js";

// export async function getOrdersLogicForAgent() {
//   const processedOrders = await Order.find({ processed: true }).sort({ createdAt: -1 });
//   const unprocessedOrders = await Order.find({ processed: false }).sort({ createdAt: -1 });
//   const unpackedOrders = await Order.find({ packed: false, packedIndicator: false }).sort({ createdAt: -1 });
//   const orders = {
//     processedOrders,
//     unpackedOrders,
//     unprocessedOrders,
//   };

//   return orders;
// }

export async function getUnpackedOrdersLogic() {
  const unpackedOrders = await Order.find({ packed: false, packedIndicator: false }).sort({ createdAt: -1 });
  return unpackedOrders;
}
export async function getProcessedOrdersLogic() {
  const processedOrders = await Order.find({ processed: true }).sort({ createdAt: -1 });
  return processedOrders;
}
export async function getUnprocessedOrdersLogic() {
  const unprocessedOrders = await Order.find({ processed: false }).sort({ createdAt: -1 });
  return unprocessedOrders;
}
export async function getAllOrdersLogic() {
  const processedOrders = await Order.find({ processed: true }).sort({ createdAt: -1 });
  const unprocessedOrders = await Order.find({ processed: false }).sort({ createdAt: -1 });
  return [...processedOrders, ...unprocessedOrders];
}

/**
 * Returns an array of order method descriptions for agentic AI to use
 * @returns methodDescriptions[]
 */
export function ordersMethodsDescriptionArr() {
  const desc = [
    {
      description:
        "Fetch all unpacked orders. These are not yet packed or marked for packing. USE THIS ONLY WHEN WORKING WITH PACKED STATE. THIS DOES NOT COUNT AS PROCESSED / UNPROCESSED",
      name: "get_unpacked_orders",
      parameters: {
        properties: {},
        type: "object",
      },
    },
    {
      description: "Fetch all orders that are marked as processed.",
      name: "get_processed_orders",
      parameters: {
        properties: {},
        type: "object",
      },
    },
    {
      description: "Fetch all orders that are not yet marked as processed.",
      name: "get_unprocessed_orders",
      parameters: {
        properties: {},
        type: "object",
      },
    },
    {
      description: "Fetch all orders > processed and unprocessed.",
      name: "get_all_orders",
      parameters: {
        properties: {},
        type: "object",
      },
    },
    {
      description:
        "Remove a single order by its ID. This also restores stock quantities for all products in the order, depending on stock type (dress or purse), and emits real-time updates via socket events.",
      name: "remove_order_by_id",
      parameters: {
        properties: {
          orderId: {
            description: "The unique ID of the order to be removed.",
            type: "string",
          },
        },
        required: ["orderId"],
        type: "object",
      },
    },
    {
      description:
        "Remove multiple orders by their IDs in a single transaction. This restores stock quantities for all products in each order—handling dresses with sizes and purses accordingly—and emits real-time socket updates for batch stock increases. If any product color or size is missing, the operation fails and rolls back.",
      name: "remove_batch_orders_by_id",
      parameters: {
        properties: {
          orderIds: {
            description: "Array of unique order IDs to remove.",
            items: { type: "string" },
            type: "array",
          },
        },
        required: ["orderIds"],
        type: "object",
      },
    },
    {
      description:
        "PACKS THE ORDER. Marks the order with the given ID as packed by setting 'packedIndicator' to true. Emits a socket event 'setStockIndicatorToTrue'. Returns true if successfull or false if failed",
      name: "set_indicator_to_true",
      parameters: {
        properties: {
          id: {
            description: "The ID of the order to update.",
            type: "string",
          },
        },
        required: ["id"],
        type: "object",
      },
    },
    {
      description:
        "UNPACKS THE ORDER. Marks the order with the given ID as unpacked by setting 'packedIndicator' to false. Emits a socket event 'setStockIndicatorToFalse'. Returns true if successfull or false if failed",
      name: "set_indicator_to_false",
      parameters: {
        properties: {
          id: {
            description: "The ID of the order to update.",
            type: "string",
          },
        },
        required: ["id"],
        type: "object",
      },
    },
    {
      description:
        "PACKS MULTIPLE ORDERS. Accepts an array of order IDs and marks each corresponding order as packed by setting 'packed' to true. Emits a real-time socket event 'packOrdersByIds' with the affected IDs. Returns true if successfull or false if failed",
      name: "pack_orders_by_ids",
      parameters: {
        properties: {
          packedIds: {
            description: "Array of unique order IDs to mark as packed.",
            items: { type: "string" },
            type: "array",
          },
        },
        required: ["packedIds"],
        type: "object",
      },
    },
  ];
  return desc;
}

/**
 * Removes a single order by its ID.
 *
 * @param {string} orderId
 * @returns {Promise<Object|null>}
 */
export async function removeOrderById(orderId: string) {
  // Start a MongoDB session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const orderData = await Order.findById(orderId).session(session);
    if (!orderData) {
      throw new CustomError(`Porudžbina sa ID: ${orderId} nije pronađena`, 404);
    }

    // Arrays to collect updates for different product types
    const dressUpdates = [];
    const purseUpdates = [];

    // Process all products in the order
    for (const item of orderData.products) {
      if (!item.selectedColorId) {
        console.warn(`Invalid product data in order ${orderId}`);
        continue;
      }

      const quantity = 1;

      if (item.stockType === "Boja-Veličina-Količina") {
        await DressModel.findByIdAndUpdate(item.itemReference._id, { $inc: { totalStock: 1 } }, { new: true, session });
        // Handle dress stock update
        const colorItem = await DressColorModel.findById(item.selectedColorId).populate("sizes").session(session);

        if (!colorItem) {
          throw new CustomError(`DressColorItem sa ID: ${item.selectedColorId} nije pronađen`, 404);
        }

        // const size = colorItem.sizes.id(item.selectedSizeId);
        const size = colorItem.sizes.find((s) => s._id?.toString() === item.selectedSizeId);
        if (!size) {
          throw new CustomError(`Size with ID: ${item.selectedSizeId} not found`, 404);
        }

        size.stock += quantity;

        if (size.stock < 0) {
          throw new CustomError(
            `Invalid stock update would result in negative stock for DressColor ${item.selectedColorId} Size ${item.selectedSizeId}`,
            400,
          );
        }

        colorItem.markModified("sizes");
        await colorItem.save({ session });

        // Collect dress update for socket emission
        dressUpdates.push({
          colorId: item.selectedColorId,
          dressId: item.itemReference,
          increment: quantity,
          sizeId: item.selectedSizeId,
          stockType: item.stockType,
        });
      } else {
        await PurseModel.findByIdAndUpdate(item.itemReference._id, { $inc: { totalStock: 1 } }, { new: true, session });
        // Handle purse stock update
        const colorItem = await PurseColorModel.findById(item.selectedColorId).session(session);
        if (!colorItem) {
          throw new CustomError(`PurseColorItem sa ID: ${item.selectedColorId} nije pronađen`, 404);
        }

        colorItem.stock += quantity;

        if (colorItem.stock < 0) {
          throw new CustomError(`Invalid stock update would result in negative stock for PurseColor ${item.selectedColorId}`, 400);
        }

        await colorItem.save({ session });

        // Collect purse update for socket emission
        purseUpdates.push({
          colorId: item.selectedColorId,
          increment: quantity,
          purseId: item.itemReference,
          stockType: item.stockType,
        });
      }
    }

    // Delete the order
    const deletedOrder = await Order.findByIdAndDelete(orderId, { session });

    // Commit transaction
    await session.commitTransaction();

    // SOCKET HANDLING - after successful transaction

    const io = getIO();
    // Emit order removal
    io.emit("orderRemoved", orderId);

    const data = { dresses: dressUpdates, purses: purseUpdates };
    io.emit("batchStockIncrease", data);

    return deletedOrder;
  } catch (error) {
    // Rollback transaction on error
    await session.abortTransaction();
    betterErrorLog("> Error in removeOrderById:", error);
    throw error;
  } finally {
    await session.endSession();
  }
}

/**
 * Removes a batch of orders by their IDs.
 *
 * @param {string[]} orderIds
 * @returns {Promise<{ acknowledged: boolean, deletedCount: number }>}
 */
export async function removeBatchOrdersById(orderIds: string[]) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const fetchedOrders = await Order.find({ _id: { $in: orderIds } }).session(session);
    if (!fetchedOrders.length) {
      throw new CustomError("No orders found with the provided IDs", 404);
    }

    const dressColorUpdates = new Map();
    const purseColorUpdates = new Map();
    const dressItems = [];
    const purseItems = [];

    // Process orders and collect updates
    for (const order of fetchedOrders) {
      if (!order.products.length) {
        console.warn(`Order ${order._id} has no products`);
        continue;
      }

      for (const product of order.products) {
        if (!product.selectedColorId) {
          console.warn(`Invalid product data in order ${order._id}`);
          continue;
        }

        if (product.stockType === "Boja-Veličina-Količina") {
          await DressModel.findByIdAndUpdate(product.itemReference._id, { $inc: { totalStock: 1 } }, { new: true, session });
          const dressUpdateData = {
            colorId: product.selectedColorId,
            dressId: product.itemReference,
            increment: 1,
            sizeId: product.selectedSizeId,
          };
          dressItems.push(dressUpdateData);

          const key = `${product.selectedColorId}-${product.selectedSizeId}`;
          if (!dressColorUpdates.has(key)) {
            dressColorUpdates.set(key, {
              colorId: product.selectedColorId,
              increment: 0,
              sizeId: product.selectedSizeId,
            });
          }
          dressColorUpdates.get(key).increment += 1;
        } else {
          await PurseModel.findByIdAndUpdate(product.itemReference._id, { $inc: { totalStock: 1 } }, { new: true, session });
          const purseUpdateData = {
            colorId: product.selectedColorId,
            increment: 1,
            purseId: product.itemReference,
          };
          purseItems.push(purseUpdateData);

          if (!purseColorUpdates.has(product.selectedColorId)) {
            purseColorUpdates.set(product.selectedColorId, 0);
          }
          purseColorUpdates.set(product.selectedColorId, purseColorUpdates.get(product.selectedColorId) + 1);
        }
      }
    }

    // Process dress color updates
    await Promise.all(
      Array.from(dressColorUpdates.values()).map(async ({ colorId, increment, sizeId }) => {
        const colorItem = await DressColorModel.findById(colorId).session(session);
        if (!colorItem) {
          throw new CustomError(`DressColor ${colorId} not found`, 404);
        }

        // const size = colorItem.sizes.id(sizeId);
        const size = colorItem.sizes.find((s) => s._id?.toString() === sizeId);
        if (!size) {
          throw new CustomError(`Size ${sizeId} not found in DressColor ${colorId}`, 404);
        }

        size.stock += increment;

        if (size.stock < 0) {
          throw new CustomError(`Invalid stock update would result in negative stock for DressColor ${colorId} Size ${sizeId}`, 400);
        }

        colorItem.markModified("sizes");
        return colorItem.save({ session });
      }),
    );

    // Process purse color updates
    await Promise.all(
      Array.from(purseColorUpdates.entries()).map(async ([colorId, increment]) => {
        const colorItem = await PurseColorModel.findById(colorId).session(session);
        if (!colorItem) {
          throw new CustomError(`PurseColor ${colorId} not found`, 404);
        }

        colorItem.stock += increment;

        if (colorItem.stock < 0) {
          throw new CustomError(`Invalid stock update would result in negative stock for PurseColor ${colorId}`, 400);
        }

        return colorItem.save({ session });
      }),
    );

    // Delete orders
    const deletedOrders = await Order.deleteMany({ _id: { $in: orderIds } }, { session });

    // Commit transaction
    await session.commitTransaction();

    // Emit socket events for updates
    const data = { dresses: dressItems, purses: purseItems };
    const io = getIO();
    io.emit("batchStockIncrease", data);
    orderIds.forEach((orderId) => {
      io.emit("orderRemoved", orderId);
    });

    return deletedOrders;
  } catch (error) {
    // If there's an error, rollback the transaction
    await session.abortTransaction();
    betterErrorLog("> Error during purse batch deletion:", error);
    throw error;
  } finally {
    // End the session
    await session.endSession();
  }
}

export async function setOrderPackedIndicatorToTrueLogic(id: string): Promise<boolean> {
  try {
    await Order.findByIdAndUpdate(id, { packedIndicator: true });
    const io = getIO();
    io.emit("setStockIndicatorToTrue", id);
    return true;
  } catch (err) {
    const error = err as any;
    betterErrorLog("Error while setting indicator to true", error);
    return false;
  }
}
export async function setOrderPackedIndicatorToFalseLogic(id: string): Promise<boolean> {
  try {
    await Order.findByIdAndUpdate(id, { packedIndicator: false });
    const io = getIO();
    io.emit("setStockIndicatorToFalse", id);
    return true;
  } catch (err) {
    const error = err as any;
    betterErrorLog("Error while setting indicator to false", error);
    return false;
  }
}

export async function packOrdersByIdsLogic(packedIds: string[]) {
  try {
    const operations = packedIds.map((id: string) => ({
      updateOne: {
        filter: { _id: new mongoose.Types.ObjectId(`${id}`) },
        update: { $set: { packed: true } },
      },
    }));
    await Order.collection.bulkWrite(operations);
    const io = getIO();
    io.emit("packOrdersByIds", packedIds);
    return true;
  } catch (err) {
    const error = err as any;
    betterErrorLog("Error while setting indicator to false", error);
    return false;
  }
}
