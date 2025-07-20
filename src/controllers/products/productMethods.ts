import DressModel from "../../schemas/dress.js";
import PurseModel from "../../schemas/purse.js";

export async function getActiveProductsLogic() {
  const [activePurses, activeDresses] = await Promise.all([
    PurseModel.find({ active: true }).populate("colors").sort({ createdAt: -1 }),
    DressModel.find({ active: true }).populate("colors").sort({ createdAt: -1 }),
  ]);

  const activeProducts = [...activePurses, ...activeDresses];
  return activeProducts;
}

export async function getInactivePRoductsLogic() {
  const [inactivePurses, inactiveDresses] = await Promise.all([
    PurseModel.find({ active: false }).populate("colors").sort({ createdAt: -1 }),
    DressModel.find({ active: false }).populate("colors").sort({ createdAt: -1 }),
  ]);
  const inactiveProducts = [...inactivePurses, ...inactiveDresses];
  return inactiveProducts;
}

/**
 * Returns an array of product method descriptions for agentic AI to use
 * @returns methodDescriptions[]
 */
export function productsMethodsDescriptionArr() {
  const desc = [
    {
      description: "Fetch all active products including dresses and purses.",
      name: "get_active_products",
      parameters: {
        properties: {},
        type: "object",
      },
    },
    {
      description: "Fetch all inactive products including dresses and purses.",
      name: "get_inactive_products",
      parameters: {
        properties: {},
        type: "object",
      },
    },
  ];
  return desc;
}
