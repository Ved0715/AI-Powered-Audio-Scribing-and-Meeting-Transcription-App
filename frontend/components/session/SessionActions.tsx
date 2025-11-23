"use client";

import { Button } from "@/components/ui/button";
import { Download, FileText, Mic } from "lucide-react";

interface SessionActionsProps {
  sessionId: string;
  canResume?: boolean;
  onResume?: () => void;
  onExportTxt?: () => void;
  onExportPdf?: () => void;
}

export default function SessionActions({
  sessionId,
  canResume = false,
  onResume,
  onExportTxt,
  onExportPdf,
}: SessionActionsProps) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Resume Recording */}
      {canResume && (
        <Button
          onClick={onResume}
          className="bg-white text-black hover:bg-slate-200"
        >
          <Mic className="w-4 h-4 mr-2" />
          Resume Recording
        </Button>
      )}

      {/* Export TXT */}
      <Button
        variant="outline"
        onClick={onExportTxt}
        className="border-slate-700 hover:bg-slate-800"
      >
        <FileText className="w-4 h-4 mr-2" />
        Export TXT
      </Button>

      {/* Export PDF */}
      <Button
        variant="outline"
        onClick={onExportPdf}
        className="border-slate-700 hover:bg-slate-800"
      >
        <Download className="w-4 h-4 mr-2" />
        Export PDF
      </Button>
    </div>
  );
}
