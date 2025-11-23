import { Router } from "express";
import * as chunkController from "../controllers/chunkController.js";

const router = Router();


router.post("/:sessionId/chunks", chunkController.saveChunk);
router.get("/:sessionId/chunks", chunkController.getSessionChunks);
router.get("/:sessionId/transcript", chunkController.getFullTranscript);

export default router;