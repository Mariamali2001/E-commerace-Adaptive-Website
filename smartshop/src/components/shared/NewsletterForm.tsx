"use client";

import { FormEvent, useState } from "react";

import { cn } from "@/lib/utils";

type Status =
  | { type: "idle" }
  | { type: "submitting" }
  | { type: "success" }
  | { type: "error"; message: string };

type Props = {
  formClassName?: string;
  inputClassName?: string;
  buttonClassName?: string;
  placeholder?: string;
  successMessage?: string;
  errorMessage?: string;
  buttonLabel?: string;
};

export function NewsletterForm({
  formClassName,
  inputClassName,
  buttonClassName,
  placeholder = "Enter your email address",
  successMessage = "Thanks for subscribing!",
  errorMessage = "Something went wrong. Please try again.",
  buttonLabel = "Subscribe",
}: Props) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>({ type: "idle" });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) {
      setStatus({ type: "error", message: "Email is required" });
      return;
    }

    setStatus({ type: "submitting" });
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? errorMessage);
      }
      setEmail("");
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("newsletter:subscribed", {
            detail: { email, location: buttonClassName?.includes("bg-white") ? "hero" : "footer" },
          })
        );
        if (window.dataLayer) {
          window.dataLayer.push({
            event: "newsletter_subscribed",
            location: buttonClassName?.includes("bg-white") ? "hero" : "footer",
            email,
            timestamp: Date.now(),
          });
        }
      }
      setStatus({ type: "success" });
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : errorMessage,
      });
    }
  };

  const submitting = status.type === "submitting";

  return (
    <div className="space-y-2">
      <form className={cn("flex flex-col gap-2 sm:flex-row", formClassName)} onSubmit={handleSubmit}>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={placeholder}
          className={cn("flex-1 rounded-xl border p-3", inputClassName)}
          required
        />
        <button
          type="submit"
          disabled={submitting}
          className={cn(
            "btn w-full bg-neutral-900 text-white hover:opacity-90 disabled:opacity-60 sm:w-auto",
            buttonClassName
          )}
        >
          {submitting ? "Subscribing..." : buttonLabel}
        </button>
      </form>

      {status.type === "error" && <p className="text-sm text-red-500">{status.message}</p>}
      {status.type === "success" && <p className="text-sm text-green-600">{successMessage}</p>}
    </div>
  );
}


