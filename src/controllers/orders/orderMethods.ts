/* eslint-disable perfectionist/sort-modules */
import Order from "../../schemas/order.js";

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
  ];
  return desc;
}
