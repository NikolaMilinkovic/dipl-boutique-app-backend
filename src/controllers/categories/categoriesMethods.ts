/* eslint-disable perfectionist/sort-modules */

import Category from "../../schemas/category.js";
import { getIO } from "../../socket/initSocket.js";

/**
 * Fetches all categories from the database
 * @returns Categories[]
 */
export async function getCategoriesLogic() {
  return await Category.find();
}

/**
 * Creates a new category in the database
 * @param name string
 * @param stockType string
 * @returns Category
 */
export async function addCategoryLogic(name: string, stockType: string) {
  const newCategory = new Category({
    name: name,
    stockType: stockType,
  });
  await newCategory.save();

  const io = getIO();
  io.emit("categoryAdded", newCategory);
  return newCategory;
}

/**
 * Deletes a category in the database via ID
 * @param id string
 * @returns Deleted Category
 */
export async function deleteCategoryLogic(id: string) {
  const deletedCategory = await Category.findByIdAndDelete(id);

  if (!deletedCategory) return;
  const io = getIO();
  io.emit("categoryRemoved", deletedCategory._id);
  return deletedCategory;
}

/**
 * Updates a category in the database via its ID
 * @param id string
 * @param name string
 * @param stockType string
 * @returns Updated Category
 */
export async function updateCategoryLogic(id: string, name: string, stockType: string) {
  const updatedCategory = await Category.findByIdAndUpdate(id, { name, stockType }, { new: true });
  const io = getIO();
  io.emit("categoryUpdated", updatedCategory);
  return updatedCategory;
}

/**
 * Returns an array of categories method descritpions for agentic AI to use
 * @returns methodDescriptions[]
 */
export function categoriesMethodsDescriptionArr() {
  const desc = [
    // GET CATEGORIES
    {
      description: "Fetches all categories from the database.",
      name: "get_categories",
      parameters: {
        properties: {},
        type: "object",
      },
    },
    {
      description: `Adds a new category with a given name and stock type.
      stockType must be exactly one of:
      - "Boja-Količina"
      - "Boja-Veličina-Količina"

      This field is case-sensitive and must include proper accents and dashes.`,
      name: "add_category",
      parameters: {
        properties: {
          name: {
            description: "The name of the new category.",
            type: "string",
          },
          stockType: {
            description: `Case-sensitive. Must be either "Boja-Količina" or "Boja-Veličina-Količina".`,
            enum: ["Boja-Količina", "Boja-Veličina-Količina"],
            type: "string",
          },
        },
        required: ["name", "stockType"],
        type: "object",
      },
    },
    // DELETE CATEGORY
    {
      description: "Deletes a category by its ID.",
      name: "delete_category",
      parameters: {
        properties: {
          id: {
            description: "The ID of the category to delete.",
            type: "string",
          },
        },
        required: ["id"],
        type: "object",
      },
    },
    {
      description: `Updates the name and stock type of a category by its ID.
      stockType must be exactly one of:
      - "Boja-Količina"
      - "Boja-Veličina-Količina"

      This value is case-sensitive.`,
      name: "update_category",
      parameters: {
        properties: {
          id: {
            description: "The ID of the category to update.",
            type: "string",
          },
          name: {
            description: "The new name for the category.",
            type: "string",
          },
          stockType: {
            description: `Must be either "Boja-Količina" or "Boja-Veličina-Količina", case-sensitive.`,
            enum: ["Boja-Količina", "Boja-Veličina-Količina"],
            type: "string",
          },
        },
        required: ["id", "name", "stockType"],
        type: "object",
      },
    },
  ];
  return desc;
}
