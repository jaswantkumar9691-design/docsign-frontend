"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { setToken } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { access_token } = await api.login(email, password);
      setToken(access_token);
      router.push("/documents");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-notary-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="font-display text-2xl text-parchment tracking-wide">DocSign</p>
          <p className="text-notary-400 text-sm mt-1">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-notary-900 border border-notary-800 rounded-lg p-6 space-y-4">
          <div>
            <label className="block text-xs text-notary-400 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded border border-notary-700 bg-notary-800 px-3 py-2 text-sm text-parchment focus:outline-none focus:ring-2 focus:ring-seal-500"
              placeholder="you@firm.com"
            />
          </div>
          <div>
            <label className="block text-xs text-notary-400 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded border border-notary-700 bg-notary-800 px-3 py-2 text-sm text-parchment focus:outline-none focus:ring-2 focus:ring-seal-500"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm text-seal-400 bg-seal-600/10 border border-seal-600/30 rounded px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-seal-600 hover:bg-seal-700 text-white font-medium text-sm py-2.5 transition-colors disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="text-center text-sm text-notary-400 mt-4">
          New here?{" "}
          <Link href="/register" className="text-seal-400 hover:text-seal-300">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
