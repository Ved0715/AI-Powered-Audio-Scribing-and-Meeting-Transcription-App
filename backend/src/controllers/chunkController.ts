import type { Request, Response } from "express";
import prisma from "../lib/prisma.js";

// Interface for chunk metadata structure
interface ChunkMeta {
    transcriptText?: string;
    startTime?: string;
    endTime?: string;
    speakers?: string[];
}



export const saveChunk = async (req: Request, res: Response) => {
    try {
        console.log("💾 [SAVE CHUNK] Request received:", {
            sessionId: req.params.sessionId,
            seq: req.body.seq
        });

        const { sessionId } = req.params;
        const { seq, text, startTime, endTime, speakers } = req.body;

        // Validate required fields
        if (!sessionId || seq === undefined || !text) {
            console.log("❌ [SAVE CHUNK] Missing required fields")
            return res.status(400).json({ error: "Missing required fields" });
        }

        const chunk = await prisma.chunk.create({
            data: {
                sessionId,
                seq,
                sizeBytes: text.length,
                meta: {
                    transcriptText: text,
                    startTime: startTime || "00:00:00",
                    endTime: endTime || "00:00:00",
                    speakers: speakers || []
                }
            }
        });

        console.log("💾 [SAVE CHUNK] Chunk saved:", chunk, "Seq:", seq);
        return res.status(201).json(chunk);

    } catch (error) {
        console.error("❌ [SAVE CHUNK] Error:", error);
        return res.status(500).json({ error: "Failed to save chunk" });
    }
}



export const getSessionChunks = async (req: Request, res: Response) => {
    try {
        console.log("💾 [GET SESSION CHUNKS] Request received:", {
            sessionId: req.params.sessionId
        });

        const { sessionId } = req.params;

        if (!sessionId) {
            console.log("❌ [GET SESSION CHUNKS] Missing sessionId")
            return res.status(400).json({ error: "Missing sessionId" });
        }

        const chunks = await prisma.chunk.findMany({
            where: { sessionId },
            orderBy: { seq: "asc" },
            select: {
                id: true,
                seq: true,
                sizeBytes: true,
                meta: true,
                uploadedAt: true
            }
        });

        console.log(`✅ [GET CHUNKS] Found ${chunks.length} chunks`);
        return res.status(200).json(chunks);


    } catch (error) {
        console.error("❌ [GET CHUNKS] Error:", error);
        return res.status(500).json({ error: "Failed to get chunks" });
    }
};


export const getFullTranscript = async (req: Request, res: Response) => {
    try {
        console.log("💾 [GET FULL TRANSCRIPT] Request received:", {
            sessionId: req.params.sessionId
        });

        const { sessionId } = req.params;

        if (!sessionId) {
            console.log("❌ [GET FULL TRANSCRIPT] Missing sessionId")
            return res.status(400).json({ error: "Missing sessionId" });
        }

        const chunks = await prisma.chunk.findMany({
            where: { sessionId },
            orderBy: { seq: "asc" },
            select: {
                seq: true,
                meta: true,
            }
        });

        const fullTranscript = chunks
            .map((chunk) => {
                const meta = chunk.meta as ChunkMeta;
                return meta?.transcriptText || "";
            })
            .join("\n");

        console.log(`✅ [GET FULL TRANSCRIPT] Generated transcript with ${chunks.length} chunks`);
        return res.status(200).json({
            transcript: fullTranscript,
            chunkCount: chunks.length,
            totalChars: fullTranscript.length,
        });

    } catch (error) {
        console.error("❌ [GET FULL TRANSCRIPT] Error:", error);
        return res.status(500).json({ error: "Failed to get full transcript" });
    }
};  