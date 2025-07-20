import express from "express";

import { addCategory, deleteCategory, getCategories, updateCategory } from "../controllers/categories/categoryControler.js";

const router = express.Router();

router.route("/get").get(getCategories);
router.route("/add").post(addCategory);
router.route("/:id").delete(deleteCategory).patch(updateCategory);

export default router;
