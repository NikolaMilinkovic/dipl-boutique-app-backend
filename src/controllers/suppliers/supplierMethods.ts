/* eslint-disable perfectionist/sort-modules */

import Supplier from "../../schemas/supplier.js";
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
 * Returns an array of supplier method descriptions for agentic AI to use
 * @returns methodDescriptions[]
 */
export function suppliersMethodsDescriptionArr() {
  const desc = [
    // GET
    {
      description: "Get a list of all suppliers",
      name: "get_suppliers",
      parameters: {
        properties: {},
        type: "object",
      },
    },
    // ADD
    {
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
    },
    // UPDATE
    {
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
    },
    // DELETE
    {
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
    },
  ];

  return desc;
}
