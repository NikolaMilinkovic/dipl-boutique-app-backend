/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";

import { addCourier, deleteCourier, getCouriers, updateCourier } from "../controllers/couriers/couriersControler.js";
import { checkPermission } from "../utils/helperMethods.js";

const router = express.Router();

router.route("/get").get(getCouriers);
router.route("/add").post(checkPermission("courier", "add") as any, addCourier);
router
  .route("/:id")
  .delete(checkPermission("courier", "remove") as any, deleteCourier)
  .patch(checkPermission("courier", "edit") as any, updateCourier);

export default router;
