import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/session";
import { isAdminEmail, ADMIN_EMAIL } from "@/server/admin";
import {
  experimentResultsToRows,
  listExperimentResults,
  rowsToCsv,
} from "@/server/experiment";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdminEmail(user.email)) {
      return NextResponse.json(
        {
          error: "Forbidden",
          message: `Admin only. Log in as ${ADMIN_EMAIL}`,
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format");
    const results = await listExperimentResults();
    const rows = experimentResultsToRows(results);

    if (format === "csv" || format === "xlsx") {
      const csv = rowsToCsv(rows);
      const filename = `smartshop_experiment_export_${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    return NextResponse.json({ data: rows, count: rows.length });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load results" },
      { status: 500 }
    );
  }
}
