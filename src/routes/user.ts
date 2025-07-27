import express from "express";

import { createUser, fetchUsers, getUserById, removeUser, updateUser } from "../controllers/users/userControler.js";

const router = express.Router();

router.route("/get-all").post(fetchUsers);
router.route("/create").post(createUser);
// router.route("/:id").delete(deleteSupplier).patch(updateSupplier);
router.route("/remove/:id").delete(removeUser);
router.route("/get/:id").get(getUserById);
router.route("/update").patch(updateUser);

export default router;
