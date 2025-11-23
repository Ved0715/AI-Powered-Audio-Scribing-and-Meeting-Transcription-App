"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, ChevronDown, ChevronUp } from "lucide-react";

interface SummaryPanelProps {
  sessionId: string;
  summary?: string | null;
  onGenerateSummary?: () => void;
  isGenerating?: boolean;
}

export default function SummaryPanel({
  sessionId,
  summary,
  onGenerateSummary,
  isGenerating = false,
}: SummaryPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-slate-400" />
            AI Summary
          </CardTitle>
          <div className="flex items-center gap-2">
            {!summary && (
              <Button
                onClick={onGenerateSummary}
                disabled={isGenerating}
                className="bg-white text-black hover:bg-slate-200"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Summary
                  </>
                )}
              </Button>
            )}
            {summary && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-slate-400 hover:text-white"
              >
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent>
          {summary ? (
            <div className="space-y-4">
              <div className="prose prose-invert max-w-none">
                <div className="whitespace-pre-wrap text-slate-300 leading-relaxed">
                  {summary}
                </div>
              </div>
              
              <div className="flex items-center gap-2 pt-4 border-t border-slate-800">
                <Button
                  onClick={onGenerateSummary}
                  variant="outline"
                  size="sm"
                  disabled={isGenerating}
                  className="border-slate-700 hover:bg-slate-800"
                >
                  {isGenerating ? "Regenerating..." : "Regenerate Summary"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Sparkles className="w-12 h-12 text-slate-400 mx-auto mb-4 opacity-50" />
              <p className="text-slate-400 mb-4">
                No summary generated yet. Click the button above to generate an AI-powered
                summary of this session.
              </p>
              <p className="text-xs text-slate-500">
                The summary will include key points, action items, and decisions.
              </p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
