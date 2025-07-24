/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  getAllOrdersLogic,
  getProcessedOrdersLogic,
  getUnpackedOrdersLogic,
  getUnprocessedOrdersLogic,
  packOrdersByIdsLogic,
  removeBatchOrdersById,
  removeOrderById,
  setOrderPackedIndicatorToFalseLogic,
  setOrderPackedIndicatorToTrueLogic,
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
  if (name === "remove_order_by_id") {
    functionResult = await removeOrderById(args.orderId as string);
  }
  if (name === "remove_batch_orders_by_id") {
    functionResult = await removeBatchOrdersById(args.orderIds as string[]);
  }
  if (name === "set_indicator_to_true") {
    functionResult = await setOrderPackedIndicatorToTrueLogic(args.id as string);
  }
  if (name === "set_indicator_to_false") {
    functionResult = await setOrderPackedIndicatorToFalseLogic(args.id as string);
  }
  if (name === "pack_orders_by_ids") {
    functionResult = await packOrdersByIdsLogic(args.packedIds as string[]);
  }

  return functionResult;
}
