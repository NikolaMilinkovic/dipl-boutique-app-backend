import express from "express";
import multer from "multer";

import { handleAgentResponse, handleTranscribe } from "../controllers/agentControler.js";

const router = express.Router();
const upload = multer({
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB size limit
  storage: multer.memoryStorage(),
});

router.route("/message").post(handleAgentResponse);
router.post("/transcribe", upload.single("audio"), handleTranscribe);

export default router;
