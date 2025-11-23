"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, FileText, MessageSquare } from "lucide-react";

interface SessionStatsProps {
  startedAt: string;
  durationSec?: number;
  chunkCount?: number;
  transcriptLength?: number;
}

export default function SessionStats({
  startedAt,
  durationSec = 0,
  chunkCount = 0,
  transcriptLength = 0,
}: SessionStatsProps) {
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m ${secs}s`;
  };

  const estimateWords = (chars: number) => {
    return Math.floor(chars / 5); // Average word length ~5 chars
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Date */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-xs text-slate-500">Date</p>
              <p className="text-sm font-semibold text-white">
                {new Date(startedAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Duration */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-xs text-slate-500">Duration</p>
              <p className="text-sm font-semibold text-white">{formatDuration(durationSec)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chunks */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-xs text-slate-500">Chunks</p>
              <p className="text-sm font-semibold text-white">{chunkCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Words */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-xs text-slate-500">Words</p>
              <p className="text-sm font-semibold text-white">
                {estimateWords(transcriptLength).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
