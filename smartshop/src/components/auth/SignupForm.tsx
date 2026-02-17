"use client";

import { FormEvent, useState } from "react";
import { AnimatedAvatar } from "./AnimatedAvatar";

type Status = { type: "idle" } | { type: "error"; message: string } | { type: "success" };
type AvatarState = "idle" | "typing" | "password" | "error" | "success";

export function SignupForm() {
  const [name, setName] = useState("Demo User");
  const [email, setEmail] = useState("demo+1@smartshop.dev");
  const [password, setPassword] = useState("demo1234");
  const [accepted, setAccepted] = useState(true);
  const [status, setStatus] = useState<Status>({ type: "idle" });
  const [submitting, setSubmitting] = useState(false);
  const [avatarState, setAvatarState] = useState<AvatarState>("idle");
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!accepted) {
      setStatus({ type: "error", message: "Please accept the terms to continue" });
      setAvatarState("error");
      setTimeout(() => setAvatarState("idle"), 1000);
      return;
    }
    setSubmitting(true);
    setStatus({ type: "idle" });
    setAvatarState("idle");
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, email, password }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to create account");
      }
      setStatus({ type: "success" });
      setAvatarState("success");
      // Force full page reload to fetch user session
      setTimeout(() => {
        window.location.href = "/";
      }, 1500); // Show success message for 1.5 seconds before redirect
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to create account",
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
        <span className="text-sm font-medium">Full Name</span>
        <input
          className="mt-2 w-full rounded-xl border border-neutral-200 p-3 focus:ring-2 focus:ring-neutral-900"
          value={name}
          onChange={(event) => setName(event.target.value)}
          onFocus={() => {
            setFocusedField("name");
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
        <span className="text-sm font-medium">Email Address</span>
        <input
          type="email"
          className="mt-2 w-full rounded-xl border border-neutral-200 p-3 focus:ring-2 focus:ring-neutral-900"
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
          className="mt-2 w-full rounded-xl border border-neutral-200 p-3 focus:ring-2 focus:ring-neutral-900"
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

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={accepted} onChange={() => setAccepted((v) => !v)} />
        I agree to the{" "}
        <a href="#" className="underline">
          Terms &amp; Conditions
        </a>
      </label>

      {status.type === "error" && <p className="text-sm text-red-500">{status.message}</p>}
      {status.type === "success" && (
        <p className="text-sm text-green-600">Account created! You are now logged in.</p>
      )}

      <button
        className="btn w-full bg-neutral-900 text-white hover:opacity-90 disabled:opacity-60"
        disabled={submitting}
      >
        {submitting ? "Creating account..." : "Signup"}
      </button>
    </form>
  );
}

