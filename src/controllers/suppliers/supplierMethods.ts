/* eslint-disable perfectionist/sort-modules */

import { MethodDesc } from "../../global/types.js";
import Supplier from "../../schemas/supplier.js";
import { CRUD_PermissionTypes } from "../../schemas/user.js";
import { getIO } from "../../socket/initSocket.js";

/**
 * Fetches all suppliers from the database
 * @returns Supplier[]
 */
export async function getSuppliersLogic() {
  return await Supplier.find();
}

/**
 * Craetes a new Supplier in the database
 * @param name string
 * @returns Supplier
 */
export async function addSupplierLogic(name: string) {
  const newSupplier = new Supplier({
    name: name,
  });

  await newSupplier.save();

  const io = getIO();
  io.emit("supplierAdded", newSupplier);
  return newSupplier;
}

/**
 * Updates a supplier via ID
 * @param param0 {id: string, name: string}
 * @returns Updated Supplier
 */
export async function updateSupplierLogic(id: string, name: string) {
  const updatedSupplier = await Supplier.findByIdAndUpdate(id, { name }, { new: true });

  const io = getIO();
  io.emit("supplierUpdated", updatedSupplier);
  return updatedSupplier;
}

/**
 * Deletes a supplier from database via ID
 * @param id string
 * @returns Deleted Supplier
 */
export async function deleteSupplierLogic(id: string) {
  const deletedSupplier = await Supplier.findByIdAndDelete(id);

  if (!deletedSupplier) return;
  const io = getIO();
  io.emit("supplierRemoved", deletedSupplier._id);
  return deletedSupplier;
}

/**
 * Returns an array of suppliers method descriptions for agentic AI to use
 * @returns MethodDesc[]
 */
export function suppliersMethodsDescriptionArr(permission: CRUD_PermissionTypes) {
  const desc = [
    // GET SUPPLIERS
    {
      description: "Get a list of all suppliers",
      name: "get_suppliers",
      parameters: {
        properties: {},
        type: "object",
      },
    },
  ] as MethodDesc[];

  // ADD SUPPLIER
  if (permission.add) {
    desc.push({
      description: "Add a new supplier to the system",
      name: "add_supplier",
      parameters: {
        properties: {
          name: {
            description: "Name of the supplier",
            type: "string",
          },
        },
        required: ["name"],
        type: "object",
      },
    });
  }

  // UPDATE SUPPLIER
  if (permission.edit) {
    desc.push({
      description: "Update an existing supplier's name using its ID",
      name: "update_supplier",
      parameters: {
        properties: {
          id: {
            description: "ID of the supplier to update",
            type: "string",
          },
          name: {
            description: "New name for the supplier",
            type: "string",
          },
        },
        required: ["id", "name"],
        type: "object",
      },
    });
  }

  // DELETE SUPPLIER
  if (permission.remove) {
    desc.push({
      description: "Delete a supplier by ID",
      name: "delete_supplier",
      parameters: {
        properties: {
          id: {
            description: "ID of the supplier to delete",
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
