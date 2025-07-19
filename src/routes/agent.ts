import express from "express";

import { handleAgentResponse } from "../controllers/agentControler.js";

const router = express.Router();

router.route("/message").post(handleAgentResponse);

export default router;
