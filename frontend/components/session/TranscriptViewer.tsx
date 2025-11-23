"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check, Search } from "lucide-react";

interface TranscriptViewerProps {
  transcript: string;
  isLoading?: boolean;
}

export default function TranscriptViewer({
  transcript,
  isLoading = false,
}: TranscriptViewerProps) {
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const handleCopy = () => {
    navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const highlightText = (text: string, search: string) => {
    if (!search.trim()) return text;

    const parts = text.split(new RegExp(`(${search})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === search.toLowerCase() ? (
        <mark key={i} className="bg-yellow-500/30 text-yellow-200">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <span>Full Transcript</span>
            {transcript && (
              <span className="text-xs text-slate-400 font-normal">
                ({transcript.length.toLocaleString()} characters)
              </span>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 w-48"
              />
            </div>

            {/* Copy Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              disabled={!transcript || copied}
              className="border-slate-700 hover:bg-slate-800"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="min-h-[400px] max-h-[600px] overflow-y-auto bg-black/30 rounded-lg p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-400">Loading transcript...</p>
              </div>
            </div>
          ) : transcript ? (
            <div className="whitespace-pre-wrap text-slate-300 leading-relaxed font-mono text-sm">
              {highlightText(transcript, searchTerm)}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-slate-500 italic">
                No transcript available. Start recording to generate one.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
