import express from "express";
import multer from "multer";

import { addOrder, getOrders, parseOrder } from "../controllers/ordersControler.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.route("/parse").post(parseOrder);
router.route("/add").post(upload.single("image"), addOrder);
router.route("/get").get(getOrders);

export default router;
