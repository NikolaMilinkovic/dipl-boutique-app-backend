/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { AddColorInput, addColorLogic, deleteColorLogic, getColorsLogic, updateColorLogic } from "../../../controllers/colors/colorsMethods.js";

export async function agentColorMethods(name: string, args: any) {
  let functionResult;
  if (name === "add_color") {
    functionResult = await addColorLogic(args as AddColorInput);
  }
  if (name === "get_colors") {
    functionResult = await getColorsLogic();
  }
  if (name === "delete_color") {
    functionResult = await deleteColorLogic(args.id as string);
  }
  if (name === "update_color") {
    functionResult = await updateColorLogic(args.id as string, args.colorCode as string, args.name as string);
  }

  return functionResult;
}
