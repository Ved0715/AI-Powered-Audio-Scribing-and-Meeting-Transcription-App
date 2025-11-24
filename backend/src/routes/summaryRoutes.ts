import { Router } from "express";
import { generateSessionSummary } from "../controllers/summaryController.js";

const router = Router();

router.post("/:id/summary", generateSessionSummary);

export default router;
