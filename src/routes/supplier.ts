import express from "express";

import { addSupplier, deleteSupplier, getSuppliers, updateSupplier } from "../controllers/supplierControler.js";

const router = express.Router();

router.route("/get").get(getSuppliers);
router.route("/add").post(addSupplier);
router.route("/:id").delete(deleteSupplier).patch(updateSupplier);

export default router;
