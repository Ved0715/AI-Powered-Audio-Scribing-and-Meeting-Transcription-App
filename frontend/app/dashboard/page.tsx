"use client";

import { useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useSessions } from "@/hooks/useSessions";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Clock, Trash2 } from "lucide-react";
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
    e.stopPropagation(); // Stop event bubbling
    console.log("🗑️ [DASHBOARD] Delete button clicked for session:", sessionId);

    if (confirm("Delete this session?")) {
      console.log("✅ [DASHBOARD] User confirmed delete");
      await deleteSession(sessionId);
    } else {
    console.log("❌ [DASHBOARD] User cancelled delete");
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
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            ScribeAI
          </h1>
          <UserProfile />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Page Title */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">My Sessions</h2>
            <p className="text-slate-400">
              Create a new session or continue an existing one
            </p>
          </div>

          {/* Sessions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* New Session Card */}
            <Card
              className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/30 hover:border-purple-500/50 transition-all cursor-pointer group"
              onClick={handleNewSession}
            >
              <CardContent className="flex flex-col items-center justify-center h-48 p-6">
                <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mb-4 group-hover:bg-purple-500/30 transition-all">
                  <Plus className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold">New Session</h3>
                <p className="text-slate-400 text-sm mt-2">Start recording</p>
              </CardContent>
            </Card>

            {/* Existing Sessions */}
            {sessions.map((sess) => (
              <Card
                key={sess.id}
                className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-all cursor-pointer group"
                onClick={() => router.push(`/sessions/${sess.id}`)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-1 group-hover:text-purple-400 transition-colors">
                        {sess.title}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-2">
                        <Clock className="w-3 h-3" />
                        {formatDate(sess.startedAt)}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleDeleteSession(sess.id, e)}
                      className="text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          sess.state === "COMPLETED"
                            ? "default"
                            : sess.state === "RECORDING"
                            ? "destructive"
                            : "secondary"
                        }
                        className={
                          sess.state === "COMPLETED"
                            ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                            : sess.state === "RECORDING"
                            ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                            : "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
                        }
                      >
                        {sess.state}
                      </Badge>
                    </div>
                    <span className="text-sm text-slate-400">
                      {formatDuration(sess.durationSec)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Empty State */}
          {sessions.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <p>No sessions yet. Create your first session to get started!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}