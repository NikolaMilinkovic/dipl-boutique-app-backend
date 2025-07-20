/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  getAllOrdersLogic,
  getProcessedOrdersLogic,
  getUnpackedOrdersLogic,
  getUnprocessedOrdersLogic,
} from "../../../controllers/orders/orderMethods.js";

export async function agentOrderMethods(name: string, args: any) {
  let functionResult;
  if (name === "get_processed_orders") {
    functionResult = await getProcessedOrdersLogic();
  }
  if (name === "get_unpacked_orders") {
    functionResult = await getUnpackedOrdersLogic();
  }
  if (name === "get_unprocessed_orders") {
    functionResult = await getUnprocessedOrdersLogic();
  }
  if (name === "get_all_orders") {
    functionResult = await getAllOrdersLogic();
  }

  return functionResult;
}
