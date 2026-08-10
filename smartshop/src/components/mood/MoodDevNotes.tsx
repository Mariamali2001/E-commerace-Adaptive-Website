"use client";

import { useAuthSession } from "@/lib/experiment/AdaptiveAuthProvider";
import { isAdminEmailClient } from "@/lib/admin-email";

/** Local HTTPS / Mood API tips — admin only, hidden from participants. */
export function MoodDevNotes() {
  const { ready, user } = useAuthSession();
  const isAdmin = ready && user != null && isAdminEmailClient(user.email);
  if (!isAdmin) return null;

  return (
    <div className="mt-4 space-y-2 rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-xs text-amber-950">
      <p className="font-semibold">Admin / local setup notes</p>
      <p>
        <strong>Desktop:</strong>{" "}
        <code>http://localhost:3000/shop/mood</code> (camera works on localhost).
      </p>
      <p>
        <strong>iPhone / mobile camera:</strong> Safari needs{" "}
        <strong>HTTPS</strong>. Run <code>npm run dev:https</code>, then open the
        Network URL (example: <code>https://192.168.x.x:3000</code>). If Safari
        warns about the certificate, tap <em>Advanced → Continue</em>.
      </p>
      <p>
        Do <strong>not</strong> type <code>localhost</code> on the phone. Mood API:{" "}
        <code>cd mood_model && python3 mood_api.py</code>
      </p>
    </div>
  );
}
