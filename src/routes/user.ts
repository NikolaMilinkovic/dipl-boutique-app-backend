import express from "express";

import { createUser } from "../controllers/users/userControler.js";

const router = express.Router();

// router.route("/get").get(getSuppliers);
router.route("/create").post(createUser);
// router.route("/:id").delete(deleteSupplier).patch(updateSupplier);

export default router;
