"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/shared/Button";
import { ADMIN_EMAIL } from "@/lib/admin-email";

type Row = Record<string, string | number>;

export function AdminExperimentPanel() {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/experiment-results", {
        credentials: "include",
        cache: "no-store",
      });
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const downloadExcel = () => {
    window.location.href = "/api/admin/experiment-results?format=csv";
  };

  const previewCols = [
    "email",
    "age",
    "gender",
    "survey_persona",
    "score_extraversion",
    "score_agreeableness",
    "score_conscientiousness",
    "score_neuroticism",
    "score_openness",
    "self_reported_mood",
    "model_detected_mood",
    "device",
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Admin — experiment data</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Restricted to <code className="text-xs">{ADMIN_EMAIL}</code>. Signup /
            questionnaire demographics + TIPI scores + moods.
          </p>
        </div>
        {allowed && (
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => void load()} className="bg-neutral-700">
              Refresh
            </Button>
            <Button type="button" onClick={downloadExcel} disabled={!rows.length}>
              Download Excel (CSV)
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
          {rows.length} participant record{rows.length === 1 ? "" : "s"}
        </p>
      )}

      {allowed && (
        <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
          <table className="min-w-full text-left text-xs">
            <thead className="border-b bg-neutral-50 text-neutral-600">
              <tr>
                {previewCols.map((c) => (
                  <th key={c} className="whitespace-nowrap px-3 py-2 font-medium">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={String(row.user_id)} className="border-b last:border-0">
                  {previewCols.map((c) => (
                    <td key={c} className="whitespace-nowrap px-3 py-2 text-neutral-800">
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
    </div>
  );
}
