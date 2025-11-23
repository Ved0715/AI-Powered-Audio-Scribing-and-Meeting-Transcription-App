"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import LiveAudioRecorder from "@/components/LiveAudioRecorder";

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
}

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const sessionId = params.id as string;

  const [recordingSession, setRecordingSession] = useState<RecordingSession | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950">
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
                Started {new Date(recordingSession.startedAt).toLocaleString()}
              </p>
            </div>
          </div>
          <Badge
            className={
              recordingSession.state === "RECORDING"
                ? "bg-red-500/20 text-red-400"
                : recordingSession.state === "COMPLETED"
                ? "bg-green-500/20 text-green-400"
                : "bg-yellow-500/20 text-yellow-400"
            }
          >
            {recordingSession.state}
          </Badge>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 flex items-center justify-center">
        <LiveAudioRecorder activeSessionId={sessionId as string | null} />
      </main>
    </div>
  );
}