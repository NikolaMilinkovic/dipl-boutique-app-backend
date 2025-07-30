/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import multer from "multer";

import {
  addOrder,
  getOrders,
  packOrdersByIds,
  parseOrder,
  removeOrdersBatch,
  setIndicatorToFalse,
  setIndicatorToTrue,
  updateOrder,
} from "../controllers/orders/ordersControler.js";
import { checkPermission } from "../utils/helperMethods.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.route("/parse").post(parseOrder);
router.route("/add").post(checkPermission("order", "add") as any, upload.single("image"), addOrder);
router.route("/get").get(getOrders);
router.route("/remove-orders-batch").delete(checkPermission("order", "remove") as any, removeOrdersBatch);
router.route("/update/:id").patch(checkPermission("order", "edit") as any, upload.single("profileImage"), updateOrder as any);
router.route("/packed/set-indicator-to-true/:id").post(setIndicatorToTrue);

router.route("/packed/set-indicator-to-false/:id").post(setIndicatorToFalse);

router.route("/pack-orders").post(packOrdersByIds);

export default router;
