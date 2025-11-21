import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

// Store active audio buffers
const audioBuffers: Record<string, Buffer[]> = {};

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("start-recording", () => {
        console.log("Recording started by:", socket.id);
        audioBuffers[socket.id] = [];
    });

    socket.on("audio-chunk", (chunk) => {

        const userBuffer = audioBuffers[socket.id];
        if (userBuffer) {
            userBuffer.push(Buffer.from(chunk));
        }
    });

    socket.on("stop-recording", async () => {
        console.log("Recording stopped by:", socket.id);

        const buffers = audioBuffers[socket.id];
        if (!buffers || buffers.length === 0) return;

        const fullBuffer = Buffer.concat(buffers);

        // Clean up memory
        delete audioBuffers[socket.id];

        try {
            // Convert buffer to base64 for Gemini
            const audioBase64 = fullBuffer.toString("base64");

            const result = await model.generateContent([
                "Transcribe this audio exactly as spoken.",
                {
                    inlineData: {
                        mimeType: "audio/webm; codecs=opus",
                        data: audioBase64
                    }
                }
            ]);

            const transcript = result.response.text();
            console.log("Transcript:", transcript);

            // Send transcript back to frontend
            socket.emit("transcription", transcript);

        } catch (error) {
            console.error("Error transcribing:", error);
            socket.emit("error", "Failed to transcribe audio");
        }
    });

    socket.on("disconnect", () => {
        delete audioBuffers[socket.id];
        console.log("User disconnected:", socket.id);
    });
});

const PORT = process.env.PORT || 8000;

httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});