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
    this.buffer = new Float32Array(this.bufferSize);
    this.index = 0;
  }

  process(inputs) {
    const input = inputs[0];
    if (input && input.length > 0) {
      const channelData = input[0];
      
      for (let i = 0; i < channelData.length; i++) {
        this.buffer[this.index++] = channelData[i];
        
        if (this.index >= this.bufferSize) {
          // Convert Float32 to Int16 PCM
          const pcmBuffer = new Int16Array(this.bufferSize);
          for (let j = 0; j < this.bufferSize; j++) {
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

export default function LiveAudioRecorder() {
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [interimTranscript, setInterimTranscript] = useState("");

    const contextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const workletNodeRef = useRef<AudioWorkletNode | null>(null);

    useEffect(() => {
        // Listen for transcription from backend
        socket.on("transcription", (data: { text: string; isFinal: boolean}) => {
            if (data.isFinal) {
                // Final transcript - append to permanent transcript
                setTranscript((prev) => prev + data.text + " ");
                setInterimTranscript(""); // Clear interim
            } else {
                // Interim transcript - show as preview
                setInterimTranscript(data.text);
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
                }
            });

            // 2. Get Tab/System Audio (Meeting Voice)
            // Alert user first so they know what to do
            alert("Please select the Tab you want to transcribe and ensure 'Share tab audio' is checked.");
            const tabStream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false,
                    sampleRate: 16000,
                },
            });

            const tabAudioTrack = tabStream.getAudioTracks()[0];
            if (!tabAudioTrack) {
                alert("No tab audio shared! Please try again and check 'Share tab audio'.");
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

            // Create a Mixer (GainNode)
            const mixer = context.createGain();

            // Connect sources to mixer
            micSource.connect(mixer);
            tabSource.connect(mixer);

            streamRef.current = tabStream; // Keep tab stream as main ref for cleanup
            const allTracks = [...micStream.getTracks(), ...tabStream.getTracks()];
            
            // Create AudioWorklet
            const workletBlob = new Blob([WorkletCode], { type: "application/javascript" });
            const workletUrl = URL.createObjectURL(workletBlob);
            await context.audioWorklet.addModule(workletUrl);

            const workletNode = new AudioWorkletNode(context, "recorder-worklet");
            workletNodeRef.current = workletNode;

            // Connect Mixer -> Worklet
            mixer.connect(workletNode);

            // Connect Worklet -> Silent Sink (to keep graph active without feedback)
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

    const stop = () => {
        console.log("🛑 Stopping recording...");

        // Tell backend to stop
        socket.emit("stop-recording");

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
