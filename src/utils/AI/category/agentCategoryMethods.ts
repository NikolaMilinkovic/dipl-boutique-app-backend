/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { addCategoryLogic, deleteCategoryLogic, getCategoriesLogic, updateCategoryLogic } from "../../../controllers/categories/categoriesMethods.js";

export async function agentCategoryMethods(name: string, args: any) {
  let functionResult;
  if (name === "add_category") {
    functionResult = await addCategoryLogic(args.name as string, args.stockType as string);
  }
  if (name === "get_categories") {
    functionResult = await getCategoriesLogic();
  }
  if (name === "delete_category") {
    functionResult = await deleteCategoryLogic(args.id as string);
  }
  if (name === "update_category") {
    functionResult = await updateCategoryLogic(args.id as string, args.name as string, args.stockType as string);
  }

  return functionResult;
}
