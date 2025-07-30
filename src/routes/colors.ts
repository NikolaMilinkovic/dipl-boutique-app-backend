/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";

import { addColor, deleteColor, getColors, updateColor } from "../controllers/colors/colorsControler.js";
import { checkPermission } from "../utils/helperMethods.js";
const router = express.Router();

router.route("/get").get(getColors);
router.route("/add").post(checkPermission("color", "add") as any, addColor);
router
  .route("/:id")
  .delete(checkPermission("category", "remove") as any, deleteColor)
  .patch(checkPermission("category", "edit") as any, updateColor);

export default router;
