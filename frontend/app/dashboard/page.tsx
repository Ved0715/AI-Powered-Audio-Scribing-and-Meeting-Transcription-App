"use client";

import { useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useSessions } from "@/hooks/useSessions";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Clock, Trash2, AudioWaveform, Mic, Play } from "lucide-react";
import UserProfile from "@/components/UserProfile";

export default function Dashboard() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const { sessions, loading, createSession, deleteSession } = useSessions();

  useEffect(() => {
    if (!session && !isPending) {
      router.push("/sign-in");
    }
  }, [session, isPending, router]);

  const handleNewSession = async () => {
    const newSession = await createSession();
    if (newSession) {
      router.push(`/sessions/${newSession.id}`);
    }
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Delete this session? This action cannot be undone.")) {
      await deleteSession(sessionId);
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isPending || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-zinc-800 border-t-white rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Metallic gradient background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-black to-zinc-900" />
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-radial from-zinc-800/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-radial from-zinc-800/10 to-transparent rounded-full blur-3xl" />
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:72px_72px]" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-zinc-800/50 backdrop-blur-xl bg-black/30">
          <div className="container mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-zinc-600 to-zinc-400 rounded-lg blur opacity-50 group-hover:opacity-75 transition-opacity" />
                <div className="relative bg-gradient-to-br from-zinc-700 to-zinc-900 p-2 rounded-lg border border-zinc-700">
                  <AudioWaveform className="w-6 h-6 text-white" />
                </div>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                Audio Scriber
              </span>
            </div>
            <UserProfile />
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-6 py-12">
          <div className="max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="flex justify-between items-start mb-12">
              <div>
                <h1 className="text-5xl font-black text-white mb-3">Sessions</h1>
                <p className="text-zinc-400 text-lg">
                  {sessions.length > 0 
                    ? `${sessions.length} recording${sessions.length !== 1 ? 's' : ''}`
                    : "No recordings yet"}
                </p>
              </div>
              <Button
                onClick={handleNewSession}
                className="bg-white text-black hover:bg-zinc-200 shadow-lg shadow-white/10"
                size="lg"
              >
                <Plus className="mr-2 w-5 h-5" />
                New Recording
              </Button>
            </div>

            {/* Sessions Grid */}
            {sessions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sessions.map((sess) => (
                  <Card
                    key={sess.id}
                    className="bg-zinc-950/50 border-zinc-800 hover:border-zinc-600 transition-all cursor-pointer group backdrop-blur-sm"
                    onClick={() => router.push(`/sessions/${sess.id}`)}
                  >
                    <CardHeader className="space-y-4">
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg text-white line-clamp-2 group-hover:text-zinc-300 transition-colors">
                            {sess.title}
                          </CardTitle>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleDeleteSession(sess.id, e)}
                          className="text-zinc-500 hover:text-red-400 hover:bg-red-500/10 flex-shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="flex items-center justify-between">
                        <Badge
                          variant={sess.state === "COMPLETED" ? "default" : "destructive"}
                          className={
                            sess.state === "COMPLETED"
                              ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700"
                              : sess.state === "RECORDING"
                              ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30"
                              : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 border border-zinc-700"
                          }
                        >
                          {sess.state === "RECORDING" && (
                            <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse" />
                          )}
                          {sess.state}
                        </Badge>
                        <span className="text-sm text-zinc-500 font-mono">
                          {formatDuration(sess.durationSec)}
                        </span>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="flex items-center gap-2 text-sm text-zinc-500">
                        <Clock className="w-4 h-4" />
                        {formatDate(sess.startedAt)}
                      </div>
                    </CardContent>

                    {/* Hover effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-zinc-700/0 via-zinc-700/5 to-zinc-700/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-xl" />
                  </Card>
                ))}
              </div>
            ) : (
              /* Empty State */
              <Card className="bg-zinc-950/30 border-zinc-800 backdrop-blur-sm">
                <CardContent className="flex flex-col items-center justify-center py-20">
                  <div className="w-20 h-20 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center mb-6">
                    <Mic className="w-10 h-10 text-zinc-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">No Recordings Yet</h3>
                  <p className="text-zinc-400 mb-8 text-center max-w-md">
                    Start your first recording session to transcribe audio and generate AI summaries
                  </p>
                  <Button
                    onClick={handleNewSession}
                    className="bg-white text-black hover:bg-zinc-200 shadow-lg shadow-white/10"
                    size="lg"
                  >
                    <Plus className="mr-2 w-5 h-5" />
                    Create First Recording
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}