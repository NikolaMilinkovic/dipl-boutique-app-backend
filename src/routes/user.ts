import express from "express";

import { createUser, fetchUsers } from "../controllers/users/userControler.js";

const router = express.Router();

router.route("/get-all").post(fetchUsers);
router.route("/create").post(createUser);
// router.route("/:id").delete(deleteSupplier).patch(updateSupplier);

export default router;
