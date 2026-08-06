"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatedAvatar } from "./AnimatedAvatar";
import { ForgotPasswordModal } from "./ForgotPasswordModal";

type Status = { type: "idle" } | { type: "error"; message: string } | { type: "success" };
type AvatarState = "idle" | "typing" | "password" | "error" | "success";

export function LoginForm() {
  const router = useRouter();
  const [remember, setRemember] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>({ type: "idle" });
  const [submitting, setSubmitting] = useState(false);
  const [avatarState, setAvatarState] = useState<AvatarState>("idle");
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setStatus({ type: "idle" });
    setAvatarState("idle");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, remember }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to login");
      }
      setStatus({ type: "success" });
      setAvatarState("success");
      const { clearAdaptiveExperiment } = await import(
        "@/lib/experiment/clearAdaptive"
      );
      clearAdaptiveExperiment();
      // Land on home (not shop/filters); browse timer still starts
      setTimeout(() => {
        window.location.href = "/?experiment=browse";
      }, 800);
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to login",
      });
      setAvatarState("error");
      setTimeout(() => setAvatarState("idle"), 1000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
      {/* Animated Avatar */}
      <AnimatedAvatar state={avatarState} className="mb-6" />

      <label className="block">
        <span className="text-sm font-medium">Email Address</span>
        <input
          type="email"
          className="mt-2 w-full rounded-xl border border-neutral-200 bg-white p-3 outline-none focus:ring-2 focus:ring-neutral-900"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          onFocus={() => {
            setFocusedField("email");
            setAvatarState("typing");
          }}
          onBlur={() => {
            setFocusedField(null);
            setAvatarState("idle");
          }}
          required
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">Password</span>
        <input
          type="password"
          className="mt-2 w-full rounded-xl border border-neutral-200 bg-white p-3 outline-none focus:ring-2 focus:ring-neutral-900"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          onFocus={() => {
            setFocusedField("password");
            setAvatarState("password");
          }}
          onBlur={() => {
            setFocusedField(null);
            setAvatarState("idle");
          }}
          required
        />
      </label>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={remember} onChange={() => setRemember((v) => !v)} />
          Remember Me
        </label>
        <button
          type="button"
          onClick={() => setShowForgotPassword(true)}
          className="text-sm text-neutral-500 hover:text-neutral-900"
        >
          Forgot Password?
        </button>
      </div>

      {status.type === "error" && <p className="text-sm text-red-500">{status.message}</p>}
      {status.type === "success" && (
        <p className="text-sm text-green-600">Logged in! Session cookie saved.</p>
      )}

      <button
        className="btn w-full bg-neutral-900 text-white hover:opacity-90 disabled:opacity-60"
        disabled={submitting}
      >
        {submitting ? "Logging in..." : "Login"}
      </button>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />
    </form>
  );
}

