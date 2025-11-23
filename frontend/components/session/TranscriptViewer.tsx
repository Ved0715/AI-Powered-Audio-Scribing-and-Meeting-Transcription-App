"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

interface TranscriptViewerProps {
  transcript: string;
  isLoading?: boolean;
}

export default function TranscriptViewer({
  transcript,
  isLoading = false,
}: TranscriptViewerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
              {transcript}
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
