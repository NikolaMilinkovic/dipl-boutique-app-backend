import express from "express";
import multer from "multer";

import { addOrder, parseOrder } from "../controllers/ordersControler.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.route("/parse").post(parseOrder);
router.route("/add").post(upload.single("image"), addOrder);

export default router;
