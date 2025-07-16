import express from "express";

import { parseOrder } from "../controllers/ordersControler.js";

const router = express.Router();

router.route("/parse").post(parseOrder);

export default router;
