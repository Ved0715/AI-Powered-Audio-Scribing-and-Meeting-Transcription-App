import type { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

interface ChunkMeta {
    transcriptText: string;
    startTime: string;
    endTime: string;
    speakers: string[];
}

/**
 * Generate AI summary for a session
 * POST /api/sessions/:id/summary
 */
export const generateSessionSummary = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        console.log("🤖 [SUMMARY] Starting for session:", id);

        if (!id) {
            return res.status(400).json({ error: "Session ID required" });
        }

        // 1. Fetch chunks
        const chunks = await prisma.chunk.findMany({
            where: { sessionId: id },
            orderBy: { seq: "asc" },
            select: { meta: true }
        });

        if (chunks.length === 0) {
            return res.status(404).json({ error: "No transcript found" });
        }

        // 2. Build transcript
        const transcript = chunks
            .map(chunk => (chunk.meta as unknown as ChunkMeta)?.transcriptText || "")
            .join("\n");

        console.log(`📝 [SUMMARY] Transcript: ${transcript.length} chars`);

        if (transcript.length < 100) {
            const simpleSummary = "Brief conversation - too short for AI analysis";
            await prisma.recordingSession.update({
                where: { id },
                data: { summary: simpleSummary }
            });
            return res.status(200).json({ summary: simpleSummary });
        }

        // 3. Call Gemini API
        console.log("🤖 [SUMMARY] Calling Gemini API...");
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
        // We know this model works for your key (despite rate limits)
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `You are an expert meeting secretary. Analyze the following transcript and generate a comprehensive yet concise summary.

Output strictly in Markdown format with the following sections:

### 🎯 Executive Summary
A brief 2-3 sentence high-level overview of the meeting's purpose and main outcome.

### 🔑 Key Discussion Points
- Detail the most important topics discussed.
- Be specific but concise.
- Use sub-bullets if necessary for clarity.

### ⚡ Action Items
- [ ] **Task**: [Assignee if clear] - [Context/Deadline]
(If no action items, state "No specific action items assigned.")

### 📝 Decisions Made
- List any clear agreements or decisions reached.

### 📌 Follow-up & Next Steps
- Topics tabled for future discussion.

**Style Guidelines:**
- Use professional, clear business language.
- Avoid fluff; be direct.
- Fix any obvious transcription errors in your interpretation (e.g., "know js" -> "Node.js").

Transcript:
${transcript}`;

        // Retry logic for rate limits (429)
        let result;
        let retries = 3;
        while (retries > 0) {
            try {
                result = await model.generateContent(prompt);
                break; // Success
            } catch (error: any) {
                if (error.message?.includes("429") || error.status === 429) {
                    console.log(`⏳ [SUMMARY] Rate limit hit. Retrying in 30s... (${retries} left)`);
                    await new Promise(resolve => setTimeout(resolve, 30000));
                    retries--;
                    if (retries === 0) throw error;
                } else {
                    throw error; // Other errors, don't retry
                }
            }
        }

        const summary = result?.response.text() || "Failed to generate summary";
        console.log("✅ [SUMMARY] Generated successfully");

        // 4. Save to database
        await prisma.recordingSession.update({
            where: { id },
            data: { summary }
        });

        return res.status(200).json({ summary });

    } catch (error: any) {
        console.error("❌ [SUMMARY] Error:", error.message);

        // List available models for debugging
        try {
            console.log("🔍 [DEBUG] Listing available models...");
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
            );
            const data = await response.json();
            if (data.models) {
                console.log("✅ Available models:", data.models.map((m: any) => m.name));
            } else {
                console.log("❌ Failed to list models:", data);
            }
        } catch (e) {
            console.error("Failed to list models:", e);
        }

        return res.status(500).json({
            error: "Failed to generate summary",
            details: error.message
        });
    }
};
