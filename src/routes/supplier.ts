/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";

import { addSupplier, deleteSupplier, getSuppliers, updateSupplier } from "../controllers/suppliers/supplierControler.js";
import { checkPermission } from "../utils/helperMethods.js";

const router = express.Router();

router.route("/get").get(getSuppliers);
router.route("/add").post(checkPermission("supplier", "add") as any, addSupplier);
router
  .route("/:id")
  .delete(checkPermission("supplier", "remove") as any, deleteSupplier)
  .patch(checkPermission("supplier", "edit") as any, updateSupplier);

export default router;
