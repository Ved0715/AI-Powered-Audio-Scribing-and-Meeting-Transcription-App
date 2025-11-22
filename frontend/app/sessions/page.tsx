"use client";

import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Clock, FileText, Calendar } from "lucide-react";
import UserProfile from "@/components/UserProfile";

type RecordingSession = {
  id: string;
  title?: string;
  state: string;
  startedAt: string;
  stoppedAt?: string;
  durationSec?: number;
  transcriptText?: string;
  summary?: string;
};

export default function SessionsPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [sessions, setSessions] = useState<RecordingSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/sign-in");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    // TODO: Fetch sessions from API
    // For now, showing empty state
    setLoading(false);
  }, []);

  if (isPending || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading sessions...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Sessions</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              View and manage your recording sessions
            </p>
          </div>
          <UserProfile />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {sessions.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/20 mb-4">
              <FileText className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No recording sessions yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Start recording to see your sessions here
            </p>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
            >
              Start Recording
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/sessions/${session.id}`)}
              >
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {session.title || "Untitled Session"}
                </h3>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} />
                    {formatDate(session.startedAt)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={16} />
                    {formatDuration(session.durationSec)}
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        session.state === "COMPLETED"
                          ? "bg-green-500"
                          : session.state === "PROCESSING"
                          ? "bg-yellow-500"
                          : "bg-gray-500"
                      }`}
                    />
                    {session.state}
                  </div>
                </div>
                {session.summary && (
                  <p className="mt-4 text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                    {session.summary}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
