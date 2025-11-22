import type { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import { SessionState } from "@prisma/client";

export const createSession = async (req: Request, res: Response) => {
    try {
        console.log("📝 [CREATE SESSION] Request received:", req.body);
        
        const { userId, title } = req.body;

        if (!userId) {
            console.log("❌ [CREATE SESSION] Missing userId");
            return res.status(400).json({ error: "User ID is required" });
        }

        const session = await prisma.recordingSession.create({
            data: {
                userId,
                title: title || `Session ${new Date().toLocaleDateString()}`,
                state: SessionState.RECORDING,
                startedAt: new Date()
            }
        });

        console.log("✅ [CREATE SESSION] Session created:", session.id);
        return res.status(201).json(session);

    } catch (error) {
        console.error("❌ [CREATE SESSION] Error:", error);
        res.status(500).json({ error: "Failed to create session" });
    }
}

export const getUserSessions = async (req: Request, res: Response) => {
    try {
        console.log("📋 [GET USER SESSIONS] UserId:", req.params.userId);
        
        const { userId } = req.params;

        if (!userId) {
            console.log("❌ [GET USER SESSIONS] Missing userId");
            return res.status(400).json("User ID is required");
        }

        const sessions = await prisma.recordingSession.findMany({
            where: {userId},
            orderBy: {startedAt: "desc"},
            include: {
                chunks: {
                    select: {
                        id: true,
                        seq: true,
                        sizeBytes: true,
                    }
                }
            }
        });

        console.log(`✅ [GET USER SESSIONS] Found ${sessions.length} sessions`);
        return res.status(200).json(sessions);

    } catch (error) {
        console.error("❌ [GET USER SESSIONS] Error:", error);
        res.status(500).json({ error: "Failed to get user sessions" });
    }
}

export const getSessionById = async (req: Request, res: Response) => {
    try {
        console.log("🔍 [GET SESSION] Session ID:", req.params.id);
        
        const { id } = req.params;

        if (!id) {
            console.log("❌ [GET SESSION] Missing session ID");
            return res.status(400).json("Session ID is required");
        }

        const session = await prisma.recordingSession.findUnique({
            where: { id },
            include: {
                chunks: {
                    orderBy: { seq: "asc"}
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    }
                }
            }
        });

        if (!session) {
            console.log("❌ [GET SESSION] Session not found");
            return res.status(404).json({ error: "Session not found" });
        }

        console.log("✅ [GET SESSION] Session found:", session.title);
        return res.status(200).json(session);
        
    } catch (error) {
        console.error("❌ [GET SESSION] Error:", error);
        res.status(500).json({ error: "Failed to get session by ID" });
    }
}

export const updateSession = async (req: Request, res: Response) => {
    try {
        console.log("✏️ [UPDATE SESSION] Session ID:", req.params.id, "Data:", req.body);
        
        const { id } = req.params;
        const {title, state, transcriptText, summary, durationSec} = req.body;

        if (!id) {
            console.log("❌ [UPDATE SESSION] Missing session ID");
            return res.status(400).json("Session ID is required");
        }

        const session = await prisma.recordingSession.update({
            where: { id },
            data: {
                ...(title && { title }),
                ...(state && { state }),
                ...(transcriptText && { transcriptText }),
                ...(summary && { summary }),
                ...(durationSec && { durationSec }),
                ...(state === "COMPLETED" && { stoppedAt: new Date() }),
            },
        });

        console.log("✅ [UPDATE SESSION] Session updated successfully");
        return res.status(200).json(session);
        
    } catch (error) {
        console.error("❌ [UPDATE SESSION] Error:", error);
        res.status(500).json({ error: "Failed to update session" });
    }
}

export const deleteSession = async (req: Request, res: Response) => {
    try {
        console.log("🗑️ [DELETE SESSION] Session ID:", req.params.id);
        
        const { id } = req.params;

        if(!id) {
            console.log("❌ [DELETE SESSION] Missing session ID");
            return res.status(400).json("Session ID is required");
        }

        await prisma.recordingSession.delete({
            where: { id },
        });

        console.log("✅ [DELETE SESSION] Session deleted successfully");
        return res.json({ success: true });
        
    } catch (error) {
        console.error("❌ [DELETE SESSION] Error:", error);
        return res.status(500).json({ error: "Failed to delete session" });
    }
};