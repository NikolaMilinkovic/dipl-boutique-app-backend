import Color from "../../schemas/color.js";
import { getIO } from "../../socket/initSocket.js";

// =============================================[ ADD COLOR ]=============================================
export interface AddColorInput {
  colorCode?: string;
  name: string;
}
export async function addColorLogic({ colorCode, name }: AddColorInput) {
  const newColor = new Color({
    colorCode: colorCode ?? "#68e823",
    name,
  });
  await newColor.save();

  const io = getIO();
  io.emit("colorAdded", newColor);

  return { color: newColor, message: `${name} color successfully added` };
}
// =============================================[ \ADD COLOR ]=============================================
