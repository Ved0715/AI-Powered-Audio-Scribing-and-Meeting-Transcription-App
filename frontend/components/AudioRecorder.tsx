"use client"

import { useState, useRef, useEffect } from "react"
import {socket } from '@/app/socket'
import { Mic, Square, Loader2, FileText, MonitorUp } from "lucide-react"
import { clsx } from 'clsx'




export default function AudioRecorder() {
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState<string>("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream[]>([]);


    useEffect(() => {
        function onTranscription(text: string) {
            setTranscript((prev) => prev + (prev ?  "\n" : "") + text);
            setIsProcessing(false);
        }
        function onError(err: string) {
            setError(err);
            setIsProcessing(false);
            stopRecording();
        }

        socket.on("transcription", onTranscription);
        socket.on("error", onError);

        return () => {
            socket.off("transcription", onTranscription);
            socket.off("error", onError);
        }
    }, []);
    
    const startRecording = async () => {
        try {
            setError(null);
            
            // Get mic stream
            const micStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                },
            });

            // Get Tab audio stream
            const displayStream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: {
                    echoCancellation: false, // We want the raw system audio
                    autoGainControl: false,
                    noiseSuppression: false,
                }
            });

            if (displayStream.getAudioTracks().length === 0) {
                setError("No system audio detected. Please restart and check 'Share tab audio' in the popup.");
                // Stop streams immediately
                micStream.getTracks().forEach(track => track.stop());
                displayStream.getTracks().forEach(t => t.stop());
                return;
            }

            // Combine Streams using Web Audio API
            const audioContext = new AudioContext();
            const destination = audioContext.createMediaStreamDestination();

            // Create sources
            const micSource = audioContext.createMediaStreamSource(micStream);
            const displaySource = audioContext.createMediaStreamSource(displayStream);

            // Connect sources to destination
            micSource.connect(destination);
            displaySource.connect(destination);

            //store referance for cleanup
            audioContextRef.current = audioContext;
            streamRef.current = [micStream, displayStream]

            // Use the combined stream for recording
            const combineStream = destination.stream;
            const mediaRecorder = new MediaRecorder(combineStream, {
                mimeType: "audio/webm;codecs=opus"
            });

            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    socket.emit("audio-chunk", event.data);
                }
            };

            // Handle if user clicks "Stop sharing" on the browser native UI
            displayStream.getVideoTracks()[0].onended = () => {
                stopRecording();
            };

            mediaRecorder.start(100);
            setIsRecording(true);
            socket.emit("start-recording");

        } catch (error) {
            console.log("Error accessing media devices:", error);
            setError("Could not access microphone or screen. Please allow permissions.");
        }
    };

    const stopRecording = () => {
        if (isRecording) {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
                mediaRecorderRef.current.stop();
            }

            // Stop all tracks in all streams (Mic + System)
            streamRef.current.forEach(s => {
                s.getTracks().forEach(t => t.stop());
            });
            streamRef.current = [];

            // close AudioContext
            if (audioContextRef.current) {
                audioContextRef.current.close();
                audioContextRef.current = null;
            }

            setIsRecording(false);
            setIsProcessing(true);
            socket.emit("stop-recording");
        }
    };

    return (
        <div className="flex flex-col gap-6 w-full max-w-2xl">
      <div className="flex flex-col items-center gap-4 p-6 bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 w-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Meeting Scribe</h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-xs mx-auto">
            {isRecording 
              ? "Recording both microphone and system audio..." 
              : "Select a tab/screen with 'Share Audio' enabled to begin"}
          </p>
        </div>

        <div className="relative group">
          <div
            className={clsx(
              "absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200",
              isRecording && "animate-pulse opacity-75"
            )}
          ></div>
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={clsx(
              "relative flex items-center justify-center w-20 h-20 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
              isRecording
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 text-blue-600"
            )}
          >
            {isRecording ? (
              <Square className="w-8 h-8 fill-current" />
            ) : (
              <MonitorUp className="w-8 h-8" />
            )}
          </button>
        </div>

        {error && (
          <div className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-md text-center">
            {error}
          </div>
        )}

        <div className="text-xs text-zinc-400 font-mono h-6">
          {isRecording && (
            <span className="flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" />
              Recording...
            </span>
          )}
          {isProcessing && (
            <span className="flex items-center gap-2 text-blue-500">
              <Loader2 className="w-3 h-3 animate-spin" />
              Transcribing...
            </span>
          )}
        </div>
      </div>

      {transcript && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
          <div className="flex items-center gap-2 mb-4 text-zinc-500">
            <FileText className="w-5 h-5" />
            <h3 className="font-semibold">Transcript</h3>
          </div>
          <div className="prose dark:prose-invert max-w-none">
            <p className="whitespace-pre-wrap leading-relaxed">{transcript}</p>
          </div>
        </div>
      )}
    </div>
    );
}