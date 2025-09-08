/* eslint-disable perfectionist/sort-modules */

import { MethodDesc } from "../../global/types.js";
import Courier from "../../schemas/courier.js";
import { CRUD_PermissionTypes } from "../../schemas/user.js";
import { getIO } from "../../socket/initSocket.js";

/**
 * Fetches all couriers from the database
 * @returns Courier[]
 */
export async function getCouriersLogic() {
  return await Courier.find();
}

/**
 * Creates a new courier in the database
 * @param name string
 * @param deliveryPrice string
 * @returns Courier
 */
export async function addCourierLogic(name: string, deliveryPrice: string) {
  const newCourier = new Courier({
    deliveryPrice: deliveryPrice,
    name: name,
  });

  await newCourier.save();
  const io = getIO();
  io.emit("courierAdded", newCourier);

  return newCourier;
}

/**
 * Updates a courier in the dabase via ID
 * @param id string
 * @param name string
 * @param deliveryPrice string
 * @returns Updated Courier
 */
export async function updateCourierLogic(id: string, name: string, deliveryPrice: string) {
  const updatedCourier = await Courier.findByIdAndUpdate(id, { deliveryPrice, name }, { new: true });

  const io = getIO();
  io.emit("courierUpdated", updatedCourier);
  return updatedCourier;
}

/**
 * Deletes a courier in the database via ID
 * @param id string
 * @returns Deleted Courier
 */
export async function deleteCourierLogic(id: string) {
  const deletedCourier = await Courier.findByIdAndDelete(id);
  if (!deletedCourier) return;

  const io = getIO();
  io.emit("courierRemoved", deletedCourier._id);
  return deletedCourier;
}

/**
 * Returns an array of couriers method descriptions for agentic AI to use
 * @returns MethodDesc[]
 */
export function couriersMethodsDescriptionArr(permission: CRUD_PermissionTypes) {
  const desc = [
    // GET COURIERS
    {
      description: "Fetches all couriers from the database.",
      name: "get_couriers",
      parameters: {
        properties: {},
        type: "object",
      },
    },
  ] as MethodDesc[];

  // ADD COURIER
  if (permission.add) {
    desc.push({
      description: "Creates a new courier in the database.",
      name: "add_courier",
      parameters: {
        properties: {
          deliveryPrice: {
            description: "Price of delivery for this courier.",
            type: "string",
          },
          name: {
            description: "Name of the courier.",
            type: "string",
          },
        },
        required: ["name", "deliveryPrice"],
        type: "object",
      },
    });
  }

  // UPDATE COURIER
  if (permission.edit) {
    desc.push({
      description: "Updates a courier by ID.",
      name: "update_courier",
      parameters: {
        properties: {
          deliveryPrice: {
            description: "New delivery price for the courier.",
            type: "string",
          },
          id: {
            description: "ID of the courier to update.",
            type: "string",
          },
          name: {
            description: "New name for the courier.",
            type: "string",
          },
        },
        required: ["id", "name", "deliveryPrice"],
        type: "object",
      },
    });
  }

  // DELETE COURIER
  if (permission.remove) {
    desc.push({
      description: "Deletes a courier by ID.",
      name: "delete_courier",
      parameters: {
        properties: {
          id: {
            description: "ID of the courier to delete.",
            type: "string",
          },
        },
        required: ["id"],
        type: "object",
      },
    });
  }

  return desc;
}
