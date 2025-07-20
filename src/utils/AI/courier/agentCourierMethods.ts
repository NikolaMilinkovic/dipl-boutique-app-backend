/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { addCourierLogic, deleteCourierLogic, getCouriersLogic, updateCourierLogic } from "../../../controllers/couriers/couriersMethods.js";

export async function agentCourierMethods(name: string, args: any) {
  let functionResult;
  if (name === "add_courier") {
    functionResult = await addCourierLogic(args.name as string, args.deliveryPrice as string);
  }
  if (name === "get_couriers") {
    functionResult = await getCouriersLogic();
  }
  if (name === "delete_courier") {
    functionResult = await deleteCourierLogic(args.id as string);
  }
  if (name === "update_courier") {
    functionResult = await updateCourierLogic(args.id as string, args.name as string, args.deliveryPrice as string);
  }

  return functionResult;
}
