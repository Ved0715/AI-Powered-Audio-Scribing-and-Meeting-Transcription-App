"use client";

import { ErrorBoundary } from "@/components/ErrorBoundary";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Play } from "lucide-react";
import LiveAudioRecorder from "@/components/LiveAudioRecorder";
import SessionStats from "@/components/session/SessionStats";
import TranscriptViewer from "@/components/session/TranscriptViewer";
import SummaryPanel from "@/components/session/SummaryPanel";
import SessionActions from "@/components/session/SessionActions";

interface RecordingSession {
  id: string;
  userId: string;
  title: string;
  state: "RECORDING" | "PAUSED" | "COMPLETED" | "PROCESSING" | "ERROR";
  startedAt: string;
  stoppedAt?: string;
  transcriptText?: string;
  summary?: string;
  durationSec?: number;
  chunks?: Array<{ id: string; seq: number; sizeBytes: number }>;
}

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const sessionId = params.id as string;

  const [recordingSession, setRecordingSession] = useState<RecordingSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedTranscript, setSavedTranscript] = useState<string>("");
  const [loadingTranscript, setLoadingTranscript] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  const fetchSession = async () => {
    try {
      console.log("🔍 [SESSION PAGE] Fetching session:", sessionId);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/sessions/${sessionId}`
      );

      if (response.ok) {
        const data = await response.json();
        console.log("✅ [SESSION PAGE] Session loaded:", data);
        setRecordingSession(data);
        
        // Auto-load transcript for completed sessions
        if (data.state === "COMPLETED") {
          fetchTranscript();
        }
      } else {
        console.error("❌ [SESSION PAGE] Failed to load session");
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("❌ [SESSION PAGE] Error:", error);
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const fetchTranscript = async () => {
    if (!sessionId) return;
    
    console.log("📖 [SESSION PAGE] Fetching transcript for session:", sessionId);
    setLoadingTranscript(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/sessions/${sessionId}/transcript`
      );

      console.log("📖 [SESSION PAGE] Transcript API response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("📖 [SESSION PAGE] Transcript data received:", JSON.stringify(data, null, 2));
        
        // Handle potential property name mismatch
        const text = data.transcript || data.fullTranscript || "";
        console.log(`📖 [SESSION PAGE] Setting transcript state (length: ${text.length})`);
        setSavedTranscript(text);
      } else {
        console.error("Failed to load transcript");
        setSavedTranscript("");
      }
    } catch (error) {
      console.error("Error fetching transcript:", error);
      setSavedTranscript("");
    } finally {
      setLoadingTranscript(false);
    }
  };

  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  const handleGenerateSummary = async () => {
    if (!sessionId) return;

    console.log("🤖 [SESSION PAGE] Generating summary for session:", sessionId);
    setIsGeneratingSummary(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/sessions/${sessionId}/summary`,
        { method: "POST" }
      );

      console.log("🤖 [SESSION PAGE] Summary API response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("✅ [SESSION PAGE] Summary received:", data);
        
        // Update session with new summary
        setRecordingSession(prev => 
          prev ? { ...prev, summary: data.summary } : null
        );
      } else {
        console.error("❌ [SESSION PAGE] Failed to generate summary");
      }
    } catch (error) {
      console.error("❌ [SESSION PAGE] Error generating summary:", error);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleExportTxt = () => {
    console.log("📥 [SESSION PAGE] Exporting TXT for session:", sessionId);
    // TODO: Implement export
  };

  const handleExportPdf = () => {
    console.log("📥 [SESSION PAGE] Exporting PDF for session:", sessionId);
    // TODO: Implement export
  };

  const handleResume = () => {
    setIsRecording(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!recordingSession) {
    return null;
  }

  const isCompleted = recordingSession.state === "COMPLETED";
  
  console.log("📱 [SESSION PAGE] Rendering. State:", recordingSession.state, "isCompleted:", isCompleted);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/dashboard")}
              className="text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">{recordingSession.title}</h1>
              <p className="text-sm text-slate-400">
                {new Date(recordingSession.startedAt).toLocaleDateString(undefined, {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
          <Badge
            className={
              recordingSession.state === "RECORDING"
                ? "bg-red-500/20 text-red-400 border-red-500/30"
                : recordingSession.state === "COMPLETED"
                ? "bg-green-500/20 text-green-400 border-green-500/30"
                : "bg-slate-700/20 text-slate-400 border-slate-700/30"
            }
          >
            {recordingSession.state}
          </Badge>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* STATE 1: ACTIVE RECORDING / READY TO RECORD */}
        {(!isCompleted || isRecording) && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <ErrorBoundary>
              <LiveAudioRecorder 
                activeSessionId={sessionId}
                onRecordingStop={() => {
                  fetchSession();
                  setIsRecording(false);
                }}
              />
            </ErrorBoundary>
          </div>
        )}

        {/* STATE 3: COMPLETED SESSION */}
        {isCompleted && !isRecording && (
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Session Stats */}
            <SessionStats
              startedAt={recordingSession.startedAt}
              durationSec={recordingSession.durationSec}
              chunkCount={recordingSession.chunks?.length || 0}
            />

            {/* Actions Bar */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Session Details</h2>
              <SessionActions
                sessionId={sessionId}
                canResume={true}
                onResume={handleResume}
                onExportTxt={handleExportTxt}
                onExportPdf={handleExportPdf}
              />
            </div>

            {/* Transcript Viewer */}
            <TranscriptViewer 
              transcript={savedTranscript} 
              isLoading={loadingTranscript}
            />

            {/* AI Summary Panel */}
            <SummaryPanel
              sessionId={sessionId}
              summary={recordingSession.summary}
              onGenerateSummary={handleGenerateSummary}
              isGenerating={isGeneratingSummary}
            />
          </div>
        )}
      </main>
    </div>
  );
}