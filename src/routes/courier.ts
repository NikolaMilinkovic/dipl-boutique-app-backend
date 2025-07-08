import { addCourier, deleteCourier, getCouriers, updateCourier } from "#controllers/couriersControler.js";
import express from "express";

const router = express.Router();

router.route("/get").get(getCouriers);
router.route("/add").post(addCourier);
router.route("/:id").delete(deleteCourier).patch(updateCourier);

export default router;
