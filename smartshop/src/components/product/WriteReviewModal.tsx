// components/product/WriteReviewModal.tsx
"use client";
import { FormEvent, useState } from "react";
import { cn } from "@/lib/utils";
import { RatingSelector } from "./RatingSelector";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  productSlug: string;
};

type Status = { type: "idle" } | { type: "submitting" } | { type: "error"; message: string };

export function WriteReviewModal({ isOpen, onClose, onSuccess, productSlug }: Props) {
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<Status>({ type: "idle" });

  if (!isOpen) return null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (!name.trim()) {
      setStatus({ type: "error", message: "Name is required" });
      return;
    }
    
    if (rating === 0) {
      setStatus({ type: "error", message: "Please select a rating" });
      return;
    }
    
    if (comment.trim().length < 3) {
      setStatus({ type: "error", message: "Comment must be at least 3 characters" });
      return;
    }

    setStatus({ type: "submitting" });
    
    try {
      const response = await fetch(`/api/products/${productSlug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author: name.trim(),
          rating,
          comment: comment.trim(),
        }),
      });

      const payload = await response.json();
      
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to submit review");
      }

      // Reset form
      setName("");
      setRating(0);
      setComment("");
      setStatus({ type: "idle" });
      
      // Close modal and refresh reviews list
      onClose();
      onSuccess?.();
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to submit review",
      });
    }
  };

  const handleClose = () => {
    if (status.type === "submitting") return;
    setName("");
    setRating(0);
    setComment("");
    setStatus({ type: "idle" });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Write a Review</h2>
          <button
            type="button"
            onClick={handleClose}
            disabled={status.type === "submitting"}
            className="text-neutral-400 hover:text-neutral-900 disabled:opacity-50"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium">Your Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-neutral-200 p-3 outline-none focus:ring-2 focus:ring-neutral-900"
              placeholder="Enter your name"
              required
              disabled={status.type === "submitting"}
            />
          </label>

          <div className="block">
            <span className="text-sm font-medium">Rating</span>
            <div className="mt-2">
              <RatingSelector
                value={rating}
                onChange={setRating}
                disabled={status.type === "submitting"}
              />
            </div>
          </div>

          <label className="block">
            <span className="text-sm font-medium">Your Review</span>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="mt-1 w-full rounded-xl border border-neutral-200 p-3 outline-none focus:ring-2 focus:ring-neutral-900"
              placeholder="Share your experience with this product..."
              required
              disabled={status.type === "submitting"}
            />
          </label>

          {status.type === "error" && (
            <p className="text-sm text-red-500">{status.message}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={status.type === "submitting"}
              className={cn(
                "flex-1 rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium",
                "hover:bg-neutral-50 disabled:opacity-50"
              )}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={status.type === "submitting" || rating === 0}
              className={cn(
                "flex-1 rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white",
                "hover:opacity-90 disabled:opacity-60"
              )}
            >
              {status.type === "submitting" ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

