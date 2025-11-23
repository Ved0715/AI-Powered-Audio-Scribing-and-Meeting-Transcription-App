import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import "dotenv/config";
import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";
import { auth } from "./lib/auth.js";
import { toNodeHandler } from "better-auth/node";

import sessionRoutes from "./routes/sessionsRoute.js";
import chunkRoutes from "./routes/chunkRoutes.js";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
    },
});

// Initialize Deepgram
const deepgram = createClient(process.env.DEEPGRAM_API_KEY || "");

app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
}));
app.use(express.json());

// Mount Better Auth API routes
app.use("/api/auth", toNodeHandler(auth));
app.use("/api/sessions", sessionRoutes);
app.use("/api/sessions", chunkRoutes);

app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

// Store active Deepgram sessions
const deepgramSessions: Record<string, any> = {};

io.on("connection", (socket) => {
    console.log("✅ User connected:", socket.id);

    socket.on("start-recording", async () => {
        try {
            console.log("🔌 Connecting to Deepgram for:", socket.id);

            const connection = deepgram.listen.live({
                model: "nova-2",
                language: "en-US",
                smart_format: true,
                encoding: "linear16",
                sample_rate: 16000,
                channels: 2,
                multichannel: true,
                // Enable interim results for real-time feedback
                interim_results: true,
                // Finalize transcript after 300ms of silence (faster finalization)
                endpointing: 300,
                // Mark utterance as complete after 1000ms silence
                utterance_end_ms: 1000,
            });

            connection.on(LiveTranscriptionEvents.Open, () => {
                console.log("✅ Deepgram Connected for:", socket.id);
                socket.emit("recording-started");
            });

            connection.on(LiveTranscriptionEvents.Transcript, (data) => {
                const transcript = data.channel.alternatives[0].transcript;
                const isFinal = data.is_final;

                // Determine speaker based on channel
                // data.channel_index is usually an array [0] or [1] for multichannel
                const channelIndex = data.channel_index && data.channel_index[0] !== undefined
                    ? data.channel_index[0]
                    : 0;

                const speaker = channelIndex === 0 ? "Me" : "Other";

                if (transcript && transcript.trim().length > 0) {
                    // console.log(`🗣️ [${speaker}] ${transcript}`);
                    socket.emit("transcription", {
                        text: transcript,
                        isFinal: isFinal,
                        speaker: speaker,
                        type: "asr"
                    });
                }
            });

            connection.on(LiveTranscriptionEvents.Close, () => {
                console.log("🔴 Deepgram Connection Closed");
                socket.emit("recording-stopped");
            });

            connection.on(LiveTranscriptionEvents.Error, (err) => {
                console.error("❌ Deepgram Error:", err);
                socket.emit("error", "Transcription service error");
            });

            deepgramSessions[socket.id] = connection;

        } catch (err) {
            console.error("❌ Failed to start Deepgram:", err);
            socket.emit("error", "Failed to start transcription");
        }
    });

    socket.on("audio-chunk", (chunk: any) => {
        const connection = deepgramSessions[socket.id];
        if (connection) {
            // Deepgram expects raw buffer
            const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
            connection.send(buffer);
        }
    });

    socket.on("stop-recording", () => {
        console.log("🛑 Stopping recording for:", socket.id);
        const connection = deepgramSessions[socket.id];
        if (connection) {
            connection.finish();
            delete deepgramSessions[socket.id];
        }
    });

    socket.on("disconnect", () => {
        console.log("👋 User disconnected:", socket.id);
        const connection = deepgramSessions[socket.id];
        if (connection) {
            connection.finish();
            delete deepgramSessions[socket.id];
        }
    });
});

const PORT = process.env.PORT || 8000;
httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📝 Deepgram Live Transcription Enabled`);
});
