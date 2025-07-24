/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import multer from "multer";

import { addOrder, getOrders, parseOrder, removeOrdersBatch, setIndicatorToFalse, setIndicatorToTrue, updateOrder } from "../controllers/orders//ordersControler.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.route("/parse").post(parseOrder);
router.route("/add").post(upload.single("image"), addOrder);
router.route("/get").get(getOrders);
router.route("/remove-orders-batch").delete(removeOrdersBatch);
router.route("/update/:id").patch(upload.single("profileImage"), updateOrder as any);
router
  .route("/packed/set-indicator-to-true/:id")
  .post(setIndicatorToTrue)

router
  .route("/packed/set-indicator-to-false/:id")
  .post(setIndicatorToFalse)

export default router;
