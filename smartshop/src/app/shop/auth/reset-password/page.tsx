"use client";

import { FormEvent, useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type Status = { type: "idle" } | { type: "error"; message: string } | { type: "success" };

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<Status>({ type: "idle" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus({ type: "error", message: "Invalid reset link" });
    }
  }, [token]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      setStatus({ type: "error", message: "Invalid reset link" });
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatus({ type: "error", message: "Passwords do not match" });
      return;
    }

    if (newPassword.length < 6) {
      setStatus({ type: "error", message: "Password must be at least 6 characters" });
      return;
    }

    setSubmitting(true);
    setStatus({ type: "idle" });

    try {
      const response = await fetch("/api/auth/password-reset/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to reset password");
      }

      setStatus({ type: "success" });

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/shop/auth/login");
      }, 2000);
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to reset password",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container flex min-h-screen items-center justify-center py-12">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Reset Password</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Enter your new password below
          </p>
        </div>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-medium">New Password</span>
            <input
              type="password"
              className="mt-2 w-full rounded-xl border border-neutral-200 bg-white p-3 outline-none focus:ring-2 focus:ring-neutral-900"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="Enter new password"
              required
              minLength={6}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">Confirm Password</span>
            <input
              type="password"
              className="mt-2 w-full rounded-xl border border-neutral-200 bg-white p-3 outline-none focus:ring-2 focus:ring-neutral-900"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Confirm new password"
              required
              minLength={6}
            />
          </label>

          {status.type === "error" && (
            <div className="rounded-lg bg-red-50 p-3">
              <p className="text-sm text-red-600">{status.message}</p>
            </div>
          )}

          {status.type === "success" && (
            <div className="rounded-lg bg-green-50 p-3">
              <p className="text-sm text-green-700">
                Password successfully reset! Redirecting to login...
              </p>
            </div>
          )}

          <button
            type="submit"
            className="btn w-full bg-neutral-900 text-white hover:opacity-90 disabled:opacity-60"
            disabled={submitting || !token}
          >
            {submitting ? "Resetting..." : "Reset Password"}
          </button>

          <div className="text-center">
            <Link
              href="/shop/auth/login"
              className="text-sm text-neutral-500 hover:text-neutral-900"
            >
              Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="container flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}

