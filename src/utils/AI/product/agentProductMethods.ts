/* eslint-disable @typescript-eslint/no-explicit-any */

import { getActiveProductsLogic, getInactivePRoductsLogic } from "../../../controllers/products/productMethods.js";

export async function agentProductMethods(name: string, args: any) {
  let functionResult;
  if (name === "get_active_products") {
    functionResult = await getActiveProductsLogic();
  }
  if (name === "get_inactive_products") {
    functionResult = await getInactivePRoductsLogic();
  }

  return functionResult;
}
