"use client";
import { useState, useRef, useEffect } from "react";
import { MonitorUp, Square, FileText } from "lucide-react";
import { socket } from "../app/socket";

// AudioWorklet code for processing audio in real-time
const WorkletCode = `
class RecorderProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 2048;
    // Buffer for stereo (2 channels), so size is 2x
    this.buffer = new Float32Array(this.bufferSize * 2);
    this.index = 0;
  }

  process(inputs) {
    const input = inputs[0];
    if (input && input.length > 0) {
      const left = input[0];
      const right = input.length > 1 ? input[1] : new Float32Array(left.length);
      
      for (let i = 0; i < left.length; i++) {
        // Interleave: Left, Right, Left, Right...
        this.buffer[this.index++] = left[i];
        this.buffer[this.index++] = right ? right[i] : 0;
        
        if (this.index >= this.bufferSize * 2) {
          // Convert Float32 to Int16 PCM (Stereo)
          const pcmBuffer = new Int16Array(this.bufferSize * 2);
          for (let j = 0; j < this.bufferSize * 2; j++) {
            const s = Math.max(-1, Math.min(1, this.buffer[j]));
            pcmBuffer[j] = s < 0 ? s * 0x8000 : s * 0x7FFF;
          }
          
          this.port.postMessage(pcmBuffer);
          this.index = 0;
        }
      }
    }
    return true;
  }
}
registerProcessor("recorder-worklet", RecorderProcessor);
`;

interface LiveAudioRecorderProps {
  activeSessionId: string | null;
}

export default function LiveAudioRecorder({ activeSessionId }: LiveAudioRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [interimTranscript, setInterimTranscript] = useState("");

    const contextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const workletNodeRef = useRef<AudioWorkletNode | null>(null);

    const [currentChunk, setCurrentChunk] = useState({
        seq: 0,
        text: "",
        startTime: "00:00:00",
    });
    const [recordingStartTime, setRecordingStartTime] = useState<number>(0);
    const chunkIntervalRef = useRef<NodeJS.Timeout | null>(null);


    useEffect(() => {
        // Listen for transcription from backend
        socket.on("transcription", (data: { text: string; isFinal: boolean; speaker?: string }) => {
            const speakerLabel = data.speaker ? `[${data.speaker}] ` : "";
            const textWithSpeaker = `${speakerLabel}${data.text}`;

            if (data.isFinal) {
                setTranscript((prev) => prev + "\n" + textWithSpeaker);
                setInterimTranscript(""); 

                setCurrentChunk((prev) => ({
                    ...prev,
                    text: prev.text + "\n" + textWithSpeaker,
                }));

            } else {
                setInterimTranscript(textWithSpeaker);
            }
        });

        socket.on("recording-started", () => {
            console.log("✅ Recording started on server");
        });

        socket.on("recording-stopped", () => {
            console.log("⏹️ Recording stopped on server");
        });

        socket.on("error", (error: string) => {
            console.error("❌ Server error:", error);
            alert(`Error: ${error}`);
        });

        return () => {
            socket.off("transcription");
            socket.off("recording-started");
            socket.off("recording-stopped");
            socket.off("error");
        };
    }, []);

    const start = async () => {
        try {
            console.log("🎤 Starting recording...");

            // 1. Get Microphone Stream (User's Voice)
            const micStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 16000,
                    channelCount: 1
                }
            });

            // 2. Get Tab/System Audio (Meeting Voice)
            // Alert user first so they know what to do
            alert("Please select the Tab you want to transcribe and ensure 'Share tab audio' is checked.");
            const tabStream = await navigator.mediaDevices.getDisplayMedia({
                video: true, // Required for getDisplayMedia
                audio: {
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: false, // Capture raw audio from tab
                    noiseSuppression: false
                }
            });

            // Check if user shared audio
            const tabAudioTrack = tabStream.getAudioTracks()[0];
            if (!tabAudioTrack) {
                alert("You didn't share audio! Please try again and check the 'Share audio' box.");
                micStream.getTracks().forEach(t => t.stop());
                tabStream.getTracks().forEach(t => t.stop());
                return;
            }

            // 3. Mix Streams using AudioContext
            const context = new AudioContext({ sampleRate: 16000 });
            contextRef.current = context;

            // Create sources
            const micSource = context.createMediaStreamSource(micStream);
            const tabSource = context.createMediaStreamSource(new MediaStream([tabAudioTrack]));

            // Create a Channel Merger (2 Channels: Left=Mic, Right=Tab)
            const merger = context.createChannelMerger(2);

            // Connect Mic to Channel 0 (Left)
            micSource.connect(merger, 0, 0);
            
            // Connect Tab to Channel 1 (Right)
            tabSource.connect(merger, 0, 1);

            streamRef.current = tabStream; // Keep tab stream as main ref for cleanup
            const allTracks = [...micStream.getTracks(), ...tabStream.getTracks()];
            
            // Create AudioWorklet
            const workletBlob = new Blob([WorkletCode], { type: "application/javascript" });
            const workletUrl = URL.createObjectURL(workletBlob);
            await context.audioWorklet.addModule(workletUrl);

            const workletNode = new AudioWorkletNode(context, "recorder-worklet", {
                outputChannelCount: [2] // Ensure output is stereo if needed, though we send data via port
            });
            workletNodeRef.current = workletNode;

            // Connect Merger -> Worklet
            merger.connect(workletNode);

            // Connect Worklet -> Silent Sink (to keep graph active)
            const silentSink = context.createGain();
            silentSink.gain.value = 0;
            workletNode.connect(silentSink);
            silentSink.connect(context.destination);

            // Store tracks for cleanup
            (streamRef.current as any)._allTracks = allTracks;

            // Listen for audio data from worklet
            workletNode.port.onmessage = (event) => {
                const pcmData = event.data; // Int16Array
                // Send to backend via Socket.IO
                socket.emit("audio-chunk", pcmData);
            };

            // Tell backend to start Gemini session
            socket.emit("start-recording");

            setRecordingStartTime(Date.now());

            const nextSeq = await getNextChunkSequence();
            setCurrentChunk({
                seq: nextSeq,  // ← Starts after existing chunks!
                text: "",
                startTime: formatDuration(0),
            });

            // Start 30-second chunk save interval
            chunkIntervalRef.current = setInterval(() => {
                console.log("⏰ [CHUNK] 30 seconds elapsed, saving chunk...");
                saveCurrentChunk();
            }, 30000); 

            console.log("⏰ [CHUNK] Auto-save timer started (30s interval)");

            setIsRecording(true);
            setTranscript("");
            setInterimTranscript("");

            console.log("✅ Recording started");
        } catch (err: any) {
            console.error("❌ Error starting recording:", err);
            
            let errorMessage = "Failed to start recording.";
            
            if (err.name === "NotAllowedError") {
                errorMessage = "Permission denied. Please allow access to Microphone and Screen Share.";
            } else if (err.name === "NotFoundError") {
                errorMessage = "No microphone or audio device found. Please ensure a microphone is connected.";
            } else if (err.name === "NotReadableError") {
                errorMessage = "Microphone or screen sharing device is in use or unavailable.";
            } else if (err.name === "AbortError") {
                errorMessage = "Screen sharing was cancelled by the user.";
            } else {
                errorMessage = `Error: ${err.message || err}`;
            }

            alert(errorMessage);
        }
    };

    const getNextChunkSequence = async (): Promise<number> => {
        if (!activeSessionId) return 0;

        try {
            console.log("🔍 [CHUNK] Fetching existing chunks for session:", activeSessionId);
            
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/sessions/${activeSessionId}/chunks`
            );

            if (response.ok) {
                const chunks = await response.json();
                
                if (chunks.length === 0) {
                    console.log("✅ [CHUNK] No existing chunks, starting at seq 0");
                    return 0;
                }

                // Find the highest seq number
                const maxSeq = Math.max(...chunks.map((c: any) => c.seq));
                const nextSeq = maxSeq + 1;
      
                console.log(`✅ [CHUNK] Found ${chunks.length} existing chunks, starting at seq ${nextSeq}`);
                return nextSeq;
            }
        } catch (error) {
            console.error("❌ [CHUNK] Error fetching chunks:", error);
        }

        return 0; // Fallback to 0 if error
    };

    const saveCurrentChunk = async () => {
        if (!activeSessionId || !currentChunk.text.trim()) {
            console.log("⏭️ [CHUNK] Skipping save - no text to save");
            return;
        }

        try {
            console.log(`💾 [CHUNK] Saving chunk ${currentChunk.seq}...`);
            
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/sessions/${activeSessionId}/chunks`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        seq: currentChunk.seq,
                        text: currentChunk.text,
                        startTime: currentChunk.startTime,
                        endTime: formatDuration(Date.now() - recordingStartTime),
                    }),
                }
            );

            if (response.ok) {
                console.log(`✅ [CHUNK] Chunk ${currentChunk.seq} saved successfully`);
                
                setCurrentChunk({
                    seq: currentChunk.seq + 1,
                    text: "",
                    startTime: formatDuration(Date.now() - recordingStartTime),
                });
            } else {
                console.error("❌ [CHUNK] Failed to save chunk");
            }
        } catch (error) {
            console.error("❌ [CHUNK] Error saving chunk:", error);
        }
    };

    // Helper function to format duration as HH:MM:SS
    const formatDuration = (milliseconds: number): string => {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    };

    const stop = async () => {
        console.log("🛑 Stopping recording...");

        // Tell backend to stop
        socket.emit("stop-recording");

        if (chunkIntervalRef.current) {
            clearInterval(chunkIntervalRef.current);
            chunkIntervalRef.current = null;
            console.log("⏹️ [CHUNK] Auto-save timer stopped");
        }

        // Save final chunk before stopping
        await saveCurrentChunk();
        console.log("💾 [CHUNK] Final chunk saved");

        // Cleanup audio resources
        if (workletNodeRef.current) {
            workletNodeRef.current.disconnect();
            workletNodeRef.current = null;
        }

        if (contextRef.current) {
            contextRef.current.close();
            contextRef.current = null;
        }

        if (streamRef.current) {
            // Check for custom _allTracks property (from mixed streams)
            const allTracks = (streamRef.current as any)._allTracks;
            if (allTracks) {
                allTracks.forEach((t: MediaStreamTrack) => t.stop());
            } else {
                streamRef.current.getTracks().forEach((t) => t.stop());
            }
            streamRef.current = null;
        }

        setIsRecording(false);
        console.log("✅ Recording stopped");
    };

    return (
        <div className="flex flex-col gap-4 w-full max-w-2xl">
            <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-col items-center">
                <button
                    onClick={isRecording ? stop : start}
                    className={`p-4 rounded-full transition-all ${
                        isRecording
                            ? "bg-red-500 hover:bg-red-600"
                            : "bg-blue-600 hover:bg-blue-700"
                    } text-white`}
                >
                    {isRecording ? <Square size={32} /> : <MonitorUp size={32} />}
                </button>
                <p className="mt-4 text-zinc-500">
                    {isRecording ? "🔴 Listening... Click to stop" : "Click to Start Recording"}
                </p>
                <p className="text-xs text-zinc-400 mt-2">
                    🎙️ Real-time streaming to Gemini for transcription
                </p>
            </div>

            <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 min-h-[200px]">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <FileText size={20} className="text-blue-500" /> Live Transcript
                </h3>
                <p className="whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
                    {transcript}
                    {interimTranscript && (
                        <span className="text-zinc-400 dark:text-zinc-500 italic">
                            {interimTranscript}
                        </span>
                    )}
                </p>
                {!transcript && !interimTranscript && (
                    <p className="text-zinc-400 dark:text-zinc-500 text-sm">
                        Start speaking to see real-time transcription powered by Gemini...
                    </p>
                )}
            </div>
        </div>
    );
}
