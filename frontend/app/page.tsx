"use client";

import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { 
  Mic, 
  Shield, 
  Zap, 
  Sparkles, 
  ArrowRight, 
  Brain,
  AudioWaveform,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function LandingPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session && !isPending) {
      router.replace("/dashboard");
    }
  }, [session, isPending, router]);

  if (isPending) {
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
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => router.push("/sign-in")}
                className="text-zinc-400 hover:text-white hover:bg-zinc-900"
              >
                Sign In
              </Button>
              <Button
                onClick={() => router.push("/sign-in")}
                className="bg-white text-black hover:bg-zinc-200 shadow-lg shadow-white/10"
              >
                Get Started
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <main className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto pt-24 pb-20 text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 bg-zinc-900/50 border border-zinc-800 rounded-full backdrop-blur-sm">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span className="text-sm text-zinc-300 font-medium">AI-Powered Transcription</span>
            </div>

            {/* Main heading */}
            <h1 className="text-7xl md:text-9xl font-black mb-6 leading-[0.9] tracking-tight">
              <span className="text-white">Turn Audio Into</span>
              <br />
              <span className="bg-gradient-to-r from-white via-zinc-300 to-zinc-500 bg-clip-text text-transparent">
                Actionable Text
              </span>
            </h1>

            <p className="text-xl text-zinc-400 mb-12 max-w-2xl mx-auto">
              Real-time transcription and AI summaries. 
              Professional-grade accuracy for meetings, lectures, and interviews.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
              <Button
                size="lg"
                onClick={() => router.push("/sign-in")}
                className="bg-white text-black hover:bg-zinc-200 text-lg px-10 py-6 shadow-2xl shadow-white/20"
              >
                <Mic className="mr-2 w-5 h-5" />
                Start Recording
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-zinc-700 hover:bg-zinc-900 text-zinc-300 hover:text-white text-lg px-10 py-6"
              >
                Watch Demo
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto pt-12 border-t border-zinc-800/50">
              <div className="group">
                <div className="text-5xl font-black bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent mb-2">
                  99%
                </div>
                <div className="text-sm text-zinc-500 uppercase tracking-wider">Accuracy</div>
              </div>
              <div className="group">
                <div className="text-5xl font-black bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent mb-2">
                  &lt;1s
                </div>
                <div className="text-sm text-zinc-500 uppercase tracking-wider">Latency</div>
              </div>
              <div className="group">
                <div className="text-5xl font-black bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent mb-2">
                  24/7
                </div>
                <div className="text-sm text-zinc-500 uppercase tracking-wider">Available</div>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-24">
            <Card className="bg-zinc-950/50 border-zinc-800 backdrop-blur-sm hover:border-zinc-600 transition-all group">
              <CardHeader>
                <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center mb-4 group-hover:bg-zinc-800 transition-colors">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-white text-lg">Real-Time Transcription</CardTitle>
                <CardDescription className="text-zinc-500">
                  Deepgram Nova-2 delivers instant, accurate transcriptions as you speak.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-zinc-950/50 border-zinc-800 backdrop-blur-sm hover:border-zinc-600 transition-all group">
              <CardHeader>
                <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center mb-4 group-hover:bg-zinc-800 transition-colors">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-white text-lg">AI Summaries</CardTitle>
                <CardDescription className="text-zinc-500">
                  Automatic summaries with key points, decisions, and action items.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-zinc-950/50 border-zinc-800 backdrop-blur-sm hover:border-zinc-600 transition-all group">
              <CardHeader>
                <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center mb-4 group-hover:bg-zinc-800 transition-colors">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-white text-lg">Enterprise Security</CardTitle>
                <CardDescription className="text-zinc-500">
                  Bank-grade encryption keeps your conversations private and secure.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Features List */}
          <div className="max-w-4xl mx-auto mb-24">
            <Card className="bg-zinc-950/30 border-zinc-800 backdrop-blur-sm">
              <CardContent className="p-12">
                <h2 className="text-4xl font-bold text-white mb-12 text-center">
                  Everything You Need
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-white font-semibold mb-1">Live Transcription</div>
                      <div className="text-sm text-zinc-500">Instant text as you speak with industry-leading accuracy</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-white font-semibold mb-1">Smart Summaries</div>
                      <div className="text-sm text-zinc-500">AI-generated insights with action items and decisions</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-white font-semibold mb-1">Session History</div>
                      <div className="text-sm text-zinc-500">Access and search all recordings in one place</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-white font-semibold mb-1">Export & Share</div>
                      <div className="text-sm text-zinc-500">Download transcripts and share with your team</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Final CTA */}
          <div className="max-w-4xl mx-auto text-center pb-24">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-zinc-700 to-zinc-900 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
              <Card className="relative bg-zinc-950/80 border-zinc-700 backdrop-blur-sm">
                <CardContent className="py-16 px-8">
                  <h2 className="text-5xl font-black text-white mb-4">
                    Ready to Start?
                  </h2>
                  <p className="text-xl text-zinc-400 mb-10">
                    Join professionals who trust Audio Scriber for accurate transcriptions.
                  </p>
                  <Button
                    size="lg"
                    onClick={() => router.push("/sign-in")}
                    className="bg-white text-black hover:bg-zinc-200 text-lg px-12 py-6 shadow-2xl shadow-white/20"
                  >
                    Get Started Free
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-zinc-800/50 backdrop-blur-xl bg-black/30">
          <div className="container mx-auto px-6 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-zinc-700 to-zinc-900 p-2 rounded-lg border border-zinc-700">
                  <AudioWaveform className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                  Audio Scriber
                </span>
              </div>
              <div className="text-zinc-600 text-sm">
                © 2025 Audio Scriber. All rights reserved.
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
