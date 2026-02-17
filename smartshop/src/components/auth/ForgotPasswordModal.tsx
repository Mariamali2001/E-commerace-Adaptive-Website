"use client";

import { FormEvent, useState } from "react";

type Status = { type: "idle" } | { type: "error"; message: string } | { type: "success"; message: string };

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function ForgotPasswordModal({ isOpen, onClose }: Props) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>({ type: "idle" });
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setStatus({ type: "idle" });

    try {
      const response = await fetch("/api/auth/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to process request");
      }

      setStatus({ 
        type: "success", 
        message: data.message || "Password reset email sent! Check your inbox." 
      });
      setEmail("");
      
      // Auto-close after 3 seconds on success
      setTimeout(() => {
        onClose();
        setStatus({ type: "idle" });
      }, 3000);
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to process request",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-neutral-400 hover:text-neutral-900"
          type="button"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-2xl font-bold">Forgot Password?</h2>
        <p className="mt-2 text-sm text-neutral-600">
          Enter your email address and we'll send you a link to reset your password.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-medium">Email Address</span>
            <input
              type="email"
              className="mt-2 w-full rounded-xl border border-neutral-200 bg-white p-3 outline-none focus:ring-2 focus:ring-neutral-900"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="your@email.com"
              required
            />
          </label>

          {status.type === "error" && (
            <p className="text-sm text-red-500">{status.message}</p>
          )}
          {status.type === "success" && (
            <div className="rounded-lg bg-green-50 p-3">
              <p className="text-sm text-green-700">{status.message}</p>
            </div>
          )}

          <button
            type="submit"
            className="btn w-full bg-neutral-900 text-white hover:opacity-90 disabled:opacity-60"
            disabled={submitting}
          >
            {submitting ? "Sending..." : "Send Reset Link"}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="btn w-full border border-neutral-200 hover:bg-neutral-50"
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}

