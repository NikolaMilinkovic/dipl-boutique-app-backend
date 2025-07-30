/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";

import { addCategory, deleteCategory, getCategories, updateCategory } from "../controllers/categories/categoryControler.js";
import { checkPermission } from "../utils/helperMethods.js";

const router = express.Router();

router.route("/get").get(getCategories);
router.route("/add").post(checkPermission("category", "add") as any, addCategory);
router
  .route("/:id")
  .delete(checkPermission("category", "remove") as any, deleteCategory)
  .patch(checkPermission("category", "edit") as any, updateCategory);

export default router;
