"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/shared/Button";
import { ADMIN_EMAIL } from "@/lib/admin-email";

type Row = Record<string, string | number>;

type CoverageSummary = {
  master_combinations: number;
  combinations_with_participants: number;
  combinations_empty: number;
  participants_exact_match: number;
  participants_fallback_or_incomplete: number;
  participants_total: number;
};

type MoodFeedbackSummary = {
  total: number;
  withImage: number;
  correct: number;
  incorrect: number;
  ok: boolean;
};

type MoodFeedbackRow = {
  id: string;
  email: string;
  predictedRaw: string;
  predictedGuideline: string;
  confirmedGuideline: string;
  wasCorrect: string;
  hasImage: string;
  imageBytesApprox: number;
  imageDataUrl?: string;
  createdAt: string;
};

export function AdminExperimentPanel() {
  const [rows, setRows] = useState<Row[]>([]);
  const [coverageRows, setCoverageRows] = useState<Row[]>([]);
  const [coverageSummary, setCoverageSummary] =
    useState<CoverageSummary | null>(null);
  const [coverageNewRows, setCoverageNewRows] = useState<Row[]>([]);
  const [coverageNewSummary, setCoverageNewSummary] =
    useState<CoverageSummary | null>(null);
  const [newChapterCount, setNewChapterCount] = useState(0);
  const [legacyCount, setLegacyCount] = useState(0);
  const [moodSummary, setMoodSummary] = useState<MoodFeedbackSummary | null>(
    null
  );
  const [moodRecent, setMoodRecent] = useState<MoodFeedbackRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [res, moodRes] = await Promise.all([
        fetch("/api/admin/experiment-results", {
          credentials: "include",
          cache: "no-store",
        }),
        fetch("/api/admin/mood-feedback?preview=1", {
          credentials: "include",
          cache: "no-store",
        }),
      ]);
      const payload = await res.json();
      if (!res.ok) {
        setAllowed(false);
        throw new Error(
          payload.message ||
            payload.error ||
            `Admin access only. Log in as ${ADMIN_EMAIL}`
        );
      }
      setAllowed(true);
      setRows(payload.data ?? []);
      setNewChapterCount(payload.newChapterCount ?? 0);
      setLegacyCount(payload.legacyCount ?? 0);
      setCoverageRows(payload.coverage?.rows ?? []);
      setCoverageSummary(payload.coverage?.summary ?? null);
      setCoverageNewRows(payload.coverageNewChapter?.rows ?? []);
      setCoverageNewSummary(payload.coverageNewChapter?.summary ?? null);

      if (moodRes.ok) {
        const moodPayload = await moodRes.json();
        setMoodSummary(moodPayload.summary ?? null);
        setMoodRecent(moodPayload.recent ?? []);
      } else {
        setMoodSummary(null);
        setMoodRecent([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
      setRows([]);
      setCoverageRows([]);
      setCoverageSummary(null);
      setCoverageNewRows([]);
      setCoverageNewSummary(null);
      setNewChapterCount(0);
      setLegacyCount(0);
      setMoodSummary(null);
      setMoodRecent([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const previewCols = [
    "email",
    "study_chapter",
    "age",
    "gender",
    "survey_persona",
    "device",
    "self_reported_mood",
    "model_detected_mood",
    "predicted_guideline_mood",
    "confirmed_mood",
    "mood_was_correct",
    "mood_source",
    "mood_backend",
    "guideline_mood",
    "in_master_rules",
    "ui_checkout_style",
    "ui_social_proof_display",
    "ui_desktop_review_display",
    "ui_mobile_review_display",
    "ui_desktop_navigation",
    "ui_mobile_navigation",
    "ui_color_theme_pref",
  ];

  const coverageCols = [
    "persona",
    "device",
    "device_label",
    "mood",
    "n",
    "in_master_rules",
    "has_participants",
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">
            Admin — experiment data
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            Restricted to <code className="text-xs">{ADMIN_EMAIL}</code>. Legacy
            rows stay for analysis; <strong>new chapter</strong> = runs after
            mood validation (camera/manual confirm).
          </p>
        </div>
        {allowed && (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => void load()}
              className="bg-neutral-700"
            >
              Refresh
            </Button>
            <Button
              type="button"
              onClick={() => {
                window.location.href = "/api/admin/experiment-results?format=csv";
              }}
              disabled={!rows.length}
            >
              Download all participants CSV
            </Button>
            <Button
              type="button"
              onClick={() => {
                window.location.href =
                  "/api/admin/experiment-results?format=csv&chapter=new";
              }}
              disabled={!newChapterCount}
              className="bg-emerald-700 hover:opacity-90"
            >
              Download new chapter CSV
            </Button>
            <Button
              type="button"
              onClick={() => {
                window.location.href =
                  "/api/admin/experiment-results?format=combinations-csv";
              }}
            >
              Combinations CSV (all)
            </Button>
            <Button
              type="button"
              onClick={() => {
                window.location.href =
                  "/api/admin/experiment-results?format=combinations-csv&chapter=new";
              }}
              disabled={!newChapterCount}
              className="bg-emerald-700 hover:opacity-90"
            >
              Combinations CSV (new chapter)
            </Button>
          </div>
        )}
      </div>

      {loading && <p className="text-sm text-neutral-500">Loading…</p>}
      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p>{error}</p>
          <p className="mt-2">
            Log in with the demo admin account, then reopen this page:{" "}
            <Link href="/auth/login" className="font-medium underline">
              Log in
            </Link>
          </p>
          <p className="mt-1 text-xs">
            Email: <code>{ADMIN_EMAIL}</code> · password: the demo password you
            already use (e.g. <code>demo1234</code>)
          </p>
        </div>
      )}

      {allowed && !loading && (
        <p className="text-sm text-neutral-600">
          {rows.length} total · {legacyCount} legacy · {newChapterCount} new
          chapter
        </p>
      )}

      {allowed && (
        <div className="rounded-2xl border border-sky-200 bg-sky-50/60 p-5 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">
              Mood frame feedback (fine-tune dataset)
            </h2>
            <p className="mt-1 text-sm text-neutral-600">
              After you detect + confirm mood (Yes or No), a JPEG frame should
              appear here. Check this before calling the build final.
            </p>
          </div>
          {moodSummary ? (
            <p className="text-sm text-neutral-800">
              <span className="font-medium">{moodSummary.total}</span> feedback
              record{moodSummary.total === 1 ? "" : "s"} ·{" "}
              <span className="font-medium">{moodSummary.withImage}</span> with
              image · {moodSummary.correct} correct · {moodSummary.incorrect}{" "}
              corrected ·{" "}
              {moodSummary.ok ? (
                <span className="font-medium text-emerald-700">
                  frames OK
                </span>
              ) : moodSummary.total === 0 ? (
                <span className="font-medium text-amber-700">
                  none yet — run camera confirm once
                </span>
              ) : (
                <span className="font-medium text-red-700">
                  some records missing images
                </span>
              )}
            </p>
          ) : (
            !loading && (
              <p className="text-sm text-amber-800">
                Could not load mood feedback status.
              </p>
            )
          )}
          {moodRecent.length > 0 && (
            <div className="flex flex-wrap gap-4">
              {moodRecent.slice(0, 4).map((f) => (
                <div
                  key={f.id}
                  className="w-40 overflow-hidden rounded-xl border border-neutral-200 bg-white"
                >
                  {f.imageDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={f.imageDataUrl}
                      alt="Saved mood frame"
                      className="aspect-square w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-square items-center justify-center bg-neutral-100 text-xs text-neutral-500">
                      No image
                    </div>
                  )}
                  <div className="space-y-0.5 p-2 text-[10px] text-neutral-700">
                    <p>
                      pred: {f.predictedGuideline} → conf:{" "}
                      {f.confirmedGuideline}
                    </p>
                    <p>
                      {f.wasCorrect === "yes" ? "Yes" : "No"} · image:{" "}
                      {f.hasImage}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {allowed && coverageNewSummary && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 space-y-2">
          <h2 className="text-lg font-semibold text-neutral-900">
            New chapter coverage (67 master cells)
          </h2>
          <p className="text-sm text-neutral-600">
            {coverageNewSummary.combinations_with_participants} /{" "}
            {coverageNewSummary.master_combinations} combinations have ≥1
            participant · {coverageNewSummary.participants_exact_match}{" "}
            exact-match ·{" "}
            {coverageNewSummary.participants_fallback_or_incomplete} fallback /
            incomplete · {coverageNewSummary.participants_total} new-chapter
            participants
          </p>
        </div>
      )}

      {allowed && coverageSummary && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-2">
          <h2 className="text-lg font-semibold text-neutral-900">
            All records coverage (legacy + new)
          </h2>
          <p className="text-sm text-neutral-600">
            {coverageSummary.combinations_with_participants} /{" "}
            {coverageSummary.master_combinations} combinations have ≥1
            participant · {coverageSummary.participants_exact_match} exact-match
            · {coverageSummary.participants_fallback_or_incomplete} fallback /
            incomplete · {coverageSummary.participants_total} total
          </p>
        </div>
      )}

      {allowed && (
        <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
          <table className="min-w-full text-left text-xs">
            <thead className="border-b bg-neutral-50 text-neutral-600">
              <tr>
                {previewCols.map((c) => (
                  <th
                    key={c}
                    className="whitespace-nowrap px-3 py-2 font-medium"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={String(row.user_id)}
                  className="border-b last:border-0"
                >
                  {previewCols.map((c) => (
                    <td
                      key={c}
                      className="whitespace-nowrap px-3 py-2 text-neutral-800"
                    >
                      {row[c] === "" || row[c] == null ? "—" : String(row[c])}
                    </td>
                  ))}
                </tr>
              ))}
              {!rows.length && !loading && (
                <tr>
                  <td
                    colSpan={previewCols.length}
                    className="px-3 py-8 text-center text-neutral-500"
                  >
                    No saved experiment runs yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {allowed && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-neutral-900">
            New chapter combination counts
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white max-h-[28rem]">
            <table className="min-w-full text-left text-xs">
              <thead className="sticky top-0 border-b bg-neutral-50 text-neutral-600">
                <tr>
                  {coverageCols.map((c) => (
                    <th
                      key={c}
                      className="whitespace-nowrap px-3 py-2 font-medium"
                    >
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {coverageNewRows.map((row) => (
                  <tr
                    key={`new-${row.persona}-${row.device}-${row.mood}`}
                    className="border-b last:border-0"
                  >
                    {coverageCols.map((c) => (
                      <td
                        key={c}
                        className="whitespace-nowrap px-3 py-2 text-neutral-800"
                      >
                        {row[c] === "" || row[c] == null
                          ? "—"
                          : String(row[c])}
                      </td>
                    ))}
                  </tr>
                ))}
                {!coverageNewRows.length && !loading && (
                  <tr>
                    <td
                      colSpan={coverageCols.length}
                      className="px-3 py-8 text-center text-neutral-500"
                    >
                      No new-chapter combinations yet — run the updated mood
                      confirmation flow.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {allowed && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-neutral-900">
            All records combination counts (legacy + new)
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white max-h-[28rem]">
            <table className="min-w-full text-left text-xs">
              <thead className="sticky top-0 border-b bg-neutral-50 text-neutral-600">
                <tr>
                  {coverageCols.map((c) => (
                    <th
                      key={c}
                      className="whitespace-nowrap px-3 py-2 font-medium"
                    >
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {coverageRows.map((row) => (
                  <tr
                    key={`all-${row.persona}-${row.device}-${row.mood}`}
                    className="border-b last:border-0"
                  >
                    {coverageCols.map((c) => (
                      <td
                        key={c}
                        className="whitespace-nowrap px-3 py-2 text-neutral-800"
                      >
                        {row[c] === "" || row[c] == null
                          ? "—"
                          : String(row[c])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
