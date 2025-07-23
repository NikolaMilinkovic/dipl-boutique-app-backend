import express from "express";
import multer from "multer";

import { addOrder, getOrders, parseOrder, removeOrdersBatch } from "../controllers/orders//ordersControler.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.route("/parse").post(parseOrder);
router.route("/add").post(upload.single("image"), addOrder);
router.route("/get").get(getOrders);
router.route("/remove-orders-batch").delete(removeOrdersBatch);

export default router;
