/* eslint-disable perfectionist/sort-objects */
/* eslint-disable perfectionist/sort-modules */
import Color, { IColor } from "../../schemas/color.js";
import { getIO } from "../../socket/initSocket.js";

export interface AddColorInput {
  colorCode?: string;
  name: string;
}

// GET COLORS
export async function getColorsLogic(): Promise<IColor[]> {
  return await Color.find();
}

// ADD COLOR
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

// DELETE COLOR
export async function deleteColorLogic(id: string) {
  const deleted = await Color.findByIdAndDelete(id);
  const io = getIO();
  if (deleted && deleted._id) io.emit("colorRemoved", deleted._id);
  return deleted;
}

// UPDATE COLOR
export async function updateColorLogic(id: string, colorCode: string, name: string) {
  const updatedColor = await Color.findByIdAndUpdate(id, { colorCode, name }, { new: true });
  const io = getIO();
  io.emit("colorUpdated", updatedColor);

  return updatedColor;
}

export function colorsMethodsDescriptionArr() {
  const desc = [
    // ADD COLOR
    {
      description: "Add a new color to the boutique",
      name: "add_color",
      parameters: {
        properties: {
          colorCode: {
            description: "Hex color code, default is #68e823 if not provided",
            type: "string",
          },
          name: {
            description: "Name of the color to add",
            type: "string",
          },
        },
        required: ["name"],
        type: "object",
      },
    },

    // GET COLORS
    {
      description: "Fetches all colors from the database.",
      name: "get_colors",
      parameters: {
        properties: {},
        type: "object",
      },
    },

    // DELETE
    {
      description: "Deletes a color from the database.",
      name: "delete_color",
      parameters: {
        properties: {
          id: {
            description: "ID of the color to delete",
            type: "string",
          },
        },
        required: ["id"],
        type: "object",
      },
    },

    // UPDATE COLOR
    {
      description: "Updates an existing color with new name and colorCode",
      name: "update_color",
      parameters: {
        properties: {
          id: {
            description: "ID of the color to update",
            type: "string",
          },
          colorCode: {
            description: "New hex color code if not provided dont change the existing one",
            type: "string",
          },
          name: {
            description: "New color name to which we update the existing one",
            type: "string",
          },
        },
        required: ["id", "colorCode", "name"],
        type: "object",
      },
    },
  ];
  return desc;
}
