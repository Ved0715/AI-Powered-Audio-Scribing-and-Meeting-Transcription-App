import { Router } from "express";
import * as sessionController from "../controllers/sessionController.js";

const router = Router();

// Create new session
router.post("/", sessionController.createSession);

// Get all sessions for a user
router.get("/user/:userId", sessionController.getUserSessions);

// Get single session by ID
router.get("/:id", sessionController.getSessionById);

// Update session
router.put("/:id", sessionController.updateSession);

// Delete session
router.delete("/:id", sessionController.deleteSession);

export default router;