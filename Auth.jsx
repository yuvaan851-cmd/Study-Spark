import React, { useState } from "react";
import { BookOpen, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

export default function Auth() {
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage("Account created — check your email to confirm, then sign in.");
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{ background: "#14181F", color: "#F1EEE6", minHeight: "100vh", fontFamily: "'Iowan Old Style', Georgia, 'Times New Roman', serif" }}
      className="flex items-center justify-center p-6"
    >
      <div style={{ background: "#1B212C", border: "1px solid #2B3341" }} className="w-full max-w-sm rounded-2xl p-7">
        <div className="flex items-center gap-2 mb-6">
          <div style={{ background: "#F2B65A" }} className="w-9 h-9 rounded-full flex items-center justify-center">
            <BookOpen size={18} color="#14181F" />
          </div>
          <span className="text-xl">StudySpark</span>
        </div>

        <div className="flex gap-2 mb-5" style={{ fontFamily: "system-ui, sans-serif" }}>
          <button
            type="button"
            onClick={() => { setMode("signin"); setError(""); setMessage(""); }}
            className="flex-1 py-2 rounded-full text-sm"
            style={{ background: mode === "signin" ? "#F2B65A" : "#212836", color: mode === "signin" ? "#14181F" : "#F1EEE6" }}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => { setMode("signup"); setError(""); setMessage(""); }}
            className="flex-1 py-2 rounded-full text-sm"
            style={{ background: mode === "signup" ? "#F2B65A" : "#212836", color: mode === "signup" ? "#14181F" : "#F1EEE6" }}
          >
            Create account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3" style={{ fontFamily: "system-ui, sans-serif" }}>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            autoComplete="email"
            className="px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: "#212836", border: "1px solid #2B3341", color: "#F1EEE6" }}
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            className="px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: "#212836", border: "1px solid #2B3341", color: "#F1EEE6" }}
          />

          {error && <p className="text-sm" style={{ color: "#C46A5E" }}>{error}</p>}
          {message && <p className="text-sm" style={{ color: "#6B9080" }}>{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 py-2.5 rounded-full text-sm flex items-center justify-center gap-2"
            style={{ background: "#F2B65A", color: "#14181F" }}
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}
