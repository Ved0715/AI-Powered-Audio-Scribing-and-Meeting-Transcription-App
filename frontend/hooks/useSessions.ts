import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";

interface RecordingSession {
    id: string;
    userId: string;
    state: "RECORDING" | "PAUSED" | "COMPLETED" | "PROCESSING" | "ERROR";
    startedAt: string;
    stoppedAt?: string;
    transcriptText?: string;
    summary?: string;
    durationSec?: number;
    title: string;
    description: string;
    chunks?: {
        id: string;
        seq: number;
        sizeBytes: number;
  }[];
}

export function useSessions() {
    const { data: session } = useSession();
    const [sessions, setSessions] = useState<RecordingSession[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchSessions = async () => {
        if (!session?.user?.id) return;

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sessions/user/${session.user.id}`);

            if (!response.ok) {
                throw new Error("Failed to fetch sessions");
            }

            const data = await response.json();
            setSessions(data);
            
        } catch (error) {
            console.error("Error fetching sessions:", error);
            setLoading(false);
            
        } finally {
            setLoading(false);
        }  
    };

    const createSession = async (title?: string) => {
    if (!session?.user?.id) return null;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/sessions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: session.user.id,
            title: title || `Session ${new Date().toLocaleDateString()}`,
          }),
        }
      );

      if (response.ok) {
        const newSession = await response.json();
        setSessions([newSession, ...sessions]);
        return newSession;
      }
    } catch (error) {
      console.error("Failed to create session:", error);
    }
    return null;
  };

const deleteSession = async (sessionId: string) => {
  try {
    console.log("🗑️ [HOOK] Starting delete for session:", sessionId);
    console.log("🌐 [HOOK] API URL:", process.env.NEXT_PUBLIC_API_URL);
    
    const url = `${process.env.NEXT_PUBLIC_API_URL}/api/sessions/${sessionId}`;
    console.log("🌐 [HOOK] Full URL:", url);
    
    const response = await fetch(url, { 
      method: "DELETE",
      headers: {
        "Content-Type": "application/json"
      }
    });

    console.log("📡 [HOOK] Response status:", response.status);
    console.log("📡 [HOOK] Response OK:", response.ok);

    if (response.ok) {
      console.log("✅ [HOOK] Delete successful, updating state");
      setSessions(sessions.filter((s) => s.id !== sessionId));
    } else {
      const errorData = await response.json();
      console.error("❌ [HOOK] Delete failed:", errorData);
    }
  } catch (error) {
    console.error("❌ [HOOK] Delete error:", error);
  }
};

  useEffect(() => {
    fetchSessions();
  }, [session?.user?.id]);

  return {
    sessions,
    loading,
    createSession,
    deleteSession,
    refetch: fetchSessions,
  };

}