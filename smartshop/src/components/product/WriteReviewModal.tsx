// components/product/WriteReviewModal.tsx
"use client";
import { ChangeEvent, FormEvent, useState } from "react";
import { cn } from "@/lib/utils";
import { adaptiveFieldClass } from "@/lib/uiAdapter/adaptiveFieldClass";
import { RatingSelector } from "./RatingSelector";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  productSlug: string;
};

type Status =
  | { type: "idle" }
  | { type: "submitting" }
  | { type: "error"; message: string };

type Preview = { file: File; url: string };

const MAX_IMAGES = 3;

export function WriteReviewModal({
  isOpen,
  onClose,
  onSuccess,
  productSlug,
}: Props) {
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [previews, setPreviews] = useState<Preview[]>([]);
  const [status, setStatus] = useState<Status>({ type: "idle" });

  if (!isOpen) return null;

  const resetForm = () => {
    previews.forEach((p) => URL.revokeObjectURL(p.url));
    setName("");
    setRating(0);
    setComment("");
    setPreviews([]);
    setStatus({ type: "idle" });
  };

  const handleImagesChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

    const room = MAX_IMAGES - previews.length;
    if (room <= 0) {
      setStatus({
        type: "error",
        message: `You can upload up to ${MAX_IMAGES} images`,
      });
      event.target.value = "";
      return;
    }

    try {
      const selected = files.slice(0, room);
      const next: Preview[] = [];
      for (const file of selected) {
        if (!file.type.startsWith("image/")) {
          throw new Error("Only image files are allowed");
        }
        if (file.size > 4 * 1024 * 1024) {
          throw new Error("Image is too large (max 4MB)");
        }
        next.push({ file, url: URL.createObjectURL(file) });
      }
      setPreviews((prev) => [...prev, ...next].slice(0, MAX_IMAGES));
      setStatus({ type: "idle" });
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error instanceof Error ? error.message : "Could not add images",
      });
    }
    event.target.value = "";
  };

  const removeImage = (index: number) => {
    setPreviews((prev) => {
      const copy = [...prev];
      const [removed] = copy.splice(index, 1);
      if (removed) URL.revokeObjectURL(removed.url);
      return copy;
    });
  };

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
      setStatus({
        type: "error",
        message: "Comment must be at least 3 characters",
      });
      return;
    }

    setStatus({ type: "submitting" });

    try {
      const form = new FormData();
      form.set("author", name.trim());
      form.set("rating", String(rating));
      form.set("comment", comment.trim());
      for (const preview of previews) {
        form.append("images", preview.file);
      }

      const response = await fetch(`/api/products/${productSlug}/reviews`, {
        method: "POST",
        body: form,
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to submit review");
      }

      resetForm();
      onClose();
      onSuccess?.();
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error instanceof Error ? error.message : "Unable to submit review",
      });
    }
  };

  const handleClose = () => {
    if (status.type === "submitting") return;
    resetForm();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
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

        <form onSubmit={handleSubmit} className="space-y-4" data-adaptive-form="review">
          <label className="block">
            <span className="text-sm font-medium">Your Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={cn("mt-1", adaptiveFieldClass())}
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
              className={cn("mt-1", adaptiveFieldClass())}
              placeholder="Share your experience with this product..."
              required
              disabled={status.type === "submitting"}
            />
          </label>

          <div className="block">
            <span className="text-sm font-medium">
              Product photos{" "}
              <span className="font-normal text-neutral-500">
                (optional, up to {MAX_IMAGES})
              </span>
            </span>
            <label
              className={cn(
                "mt-2 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-6 text-center transition hover:border-neutral-400 hover:bg-neutral-100",
                status.type === "submitting" && "pointer-events-none opacity-60"
              )}
            >
              <span className="text-sm font-medium text-neutral-800">
                Upload images
              </span>
              <span className="mt-1 text-xs text-neutral-500">
                JPG or PNG · show the product you received
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                disabled={
                  status.type === "submitting" || previews.length >= MAX_IMAGES
                }
                onChange={handleImagesChange}
              />
            </label>

            {previews.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {previews.map((preview, index) => (
                  <div
                    key={preview.url}
                    className="relative h-20 w-20 overflow-hidden rounded-lg border border-neutral-200"
                  >
                    <img
                      src={preview.url}
                      alt={`Upload preview ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      disabled={status.type === "submitting"}
                      className="absolute right-1 top-1 rounded-full bg-black/70 px-1.5 text-[10px] font-bold text-white"
                      aria-label="Remove image"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

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
