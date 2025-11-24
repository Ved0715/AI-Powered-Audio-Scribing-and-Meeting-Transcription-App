"use client";

import { signIn } from "@/lib/auth-client";
import { useState } from "react";
import { AudioWaveform, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function SignInPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signIn.social({
        provider: "google",
        callbackURL: `${window.location.origin}/dashboard`,
      });
    } catch (error) {
      console.error("Sign in failed:", error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center">
      {/* Metallic gradient background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-black to-zinc-900" />
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-gradient-radial from-zinc-800/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-gradient-radial from-zinc-800/10 to-transparent rounded-full blur-3xl" />
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:72px_72px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md px-6">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => router.push("/")}
          className="mb-8 text-zinc-400 hover:text-white hover:bg-zinc-900"
        >
          <ArrowLeft className="mr-2 w-4 h-4" />
          Back to Home
        </Button>

        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-600 to-zinc-400 rounded-lg blur opacity-50 group-hover:opacity-75 transition-opacity" />
            <div className="relative bg-gradient-to-br from-zinc-700 to-zinc-900 p-3 rounded-lg border border-zinc-700">
              <AudioWaveform className="w-8 h-8 text-white" />
            </div>
          </div>
          <span className="text-3xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            Audio Scriber
          </span>
        </div>

        {/* Login Card */}
        <Card className="bg-zinc-950/50 border-zinc-800 backdrop-blur-sm">
          <CardContent className="p-10">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-black text-white mb-2">Welcome Back</h1>
              <p className="text-zinc-400">Sign in to continue</p>
            </div>

            {/* Google Sign In Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-white hover:bg-zinc-100 text-black font-semibold py-4 px-6 rounded-lg flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-white/10"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC04"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {loading ? "Signing in..." : "Continue with Google"}
            </button>

            <p className="text-center text-zinc-500 text-xs mt-6">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-8">
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-1">99%</div>
            <div className="text-xs text-zinc-500 uppercase tracking-wider">Accuracy</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-1">&lt;1s</div>
            <div className="text-xs text-zinc-500 uppercase tracking-wider">Latency</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-1">Secure</div>
            <div className="text-xs text-zinc-500 uppercase tracking-wider">Private</div>
          </div>
        </div>
      </div>
    </div>
  );
}
