import express from "express";

import { addColor, deleteColor, getColors, updateColor } from "../controllers/colors/colorsControler.js";
const router = express.Router();

router.route("/get").get(getColors);
router.route("/add").post(addColor);
router.route("/:id").delete(deleteColor).patch(updateColor);

export default router;
