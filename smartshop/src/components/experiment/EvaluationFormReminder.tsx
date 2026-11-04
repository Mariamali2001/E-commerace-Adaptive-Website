"use client";

import { useAuthSession } from "@/lib/experiment/AdaptiveAuthProvider";

/**
 * After mood confirmation, remind participants to use the same signup email
 * on the Google Form so SUS/UEQ/AWEQ can be joined to persona × device × mood.
 */
export function EvaluationFormReminder() {
  const { user } = useAuthSession();
  const email = user?.email?.trim();
  const formUrl = process.env.NEXT_PUBLIC_EVALUATION_FORM_URL?.trim();

  if (!email) return null;

  return (
    <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-left text-sm text-emerald-950">
      <p className="font-medium">When you fill the evaluation form</p>
      <p className="mt-1 text-emerald-900">
        Enter this same email — the one you used to sign up:
      </p>
      <p className="mt-2 break-all font-mono text-base font-semibold">{email}</p>
      {formUrl ? (
        <a
          href={formUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex rounded-lg bg-emerald-800 px-3 py-1.5 text-xs font-medium text-white"
        >
          Open evaluation form
        </a>
      ) : (
        <p className="mt-2 text-xs text-emerald-800">
          Do not use a different Gmail or university address than this one.
        </p>
      )}
    </div>
  );
}
