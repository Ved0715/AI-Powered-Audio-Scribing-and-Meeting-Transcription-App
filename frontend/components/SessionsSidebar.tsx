"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { Plus, Mic, Trash2, Clock } from "lucide-react";

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

interface SessionsSidebarProps {
  activeSessionId: string | null;
  onSessionSelect: (sessionId: string) => void;
  onNewSession: () => void;
}

export default function SessionsSidebar({
  activeSessionId,
  onSessionSelect,
  onNewSession,
}: SessionsSidebarProps) {
  const { data: session } = useSession();
  const [sessions, setSessions] = useState<RecordingSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.id) {
      fetchSessions();
    }
  }, [session?.user?.id]);

  const fetchSessions = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/sessions/user/${session?.user?.id}`
      );
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      }
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this session?")) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/sessions/${sessionId}`,
        { method: "DELETE" }
      );
      if (response.ok) {
        setSessions(sessions.filter((s) => s.id !== sessionId));
        if (activeSessionId === sessionId) {
          onSessionSelect("");
        }
      }
    } catch (error) {
      console.error("Failed to delete session:", error);
    }
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return "Today";
    } else if (d.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-80 h-screen bg-gradient-to-b from-slate-900 to-slate-800 border-r border-slate-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <button
          onClick={onNewSession}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2 font-semibold transition-all transform hover:scale-105"
        >
          <Plus className="w-5 h-5" />
          New Session
        </button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Mic className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No sessions yet</p>
            <p className="text-xs mt-1">Click "New Session" to start</p>
          </div>
        ) : (
          sessions.map((sess) => (
            <div
              key={sess.id}
              onClick={() => onSessionSelect(sess.id)}
              className={`p-3 rounded-lg cursor-pointer transition-all ${
                activeSessionId === sess.id
                  ? "bg-purple-600/30 border border-purple-500"
                  : "bg-slate-800/50 hover:bg-slate-700/50 border border-transparent"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-white font-medium text-sm line-clamp-1">
                  {sess.title || "Untitled Session"}
                </h3>
                <button
                  onClick={(e) => deleteSession(sess.id, e)}
                  className="text-gray-400 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{formatDate(sess.startedAt)}</span>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatDuration(sess.durationSec)}</span>
                </div>
              </div>

              <div className="mt-2">
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    sess.state === "COMPLETED"
                      ? "bg-green-500/20 text-green-400"
                      : sess.state === "RECORDING"
                      ? "bg-red-500/20 text-red-400"
                      : "bg-yellow-500/20 text-yellow-400"
                  }`}
                >
                  {sess.state}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
