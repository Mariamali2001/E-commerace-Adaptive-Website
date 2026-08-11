import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/session";
import { isAdminEmail, ADMIN_EMAIL } from "@/server/admin";
import {
  buildCombinationCoverage,
  experimentResultsToRows,
  filterNewChapterResults,
  listExperimentResults,
  rowsToCsv,
} from "@/server/experiment";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || !isAdminEmail(user.email)) {
    return {
      error: NextResponse.json(
        {
          error: "Forbidden",
          message: `Admin only. Log in as ${ADMIN_EMAIL}`,
        },
        { status: 403 }
      ),
    };
  }
  return { user };
}

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format");
    const chapter = searchParams.get("chapter"); // "new" | null (all)
    const results = await listExperimentResults();
    const newChapterResults = filterNewChapterResults(results);
    const scoped =
      chapter === "new" ? newChapterResults : results;

    const rows = experimentResultsToRows(scoped);
    const coverageAll = buildCombinationCoverage(results);
    const coverageNew = buildCombinationCoverage(newChapterResults);
    const coverage = chapter === "new" ? coverageNew : coverageAll;

    if (format === "csv" || format === "xlsx") {
      const label = chapter === "new" ? "new_chapter" : "all";
      const csv = rowsToCsv(rows);
      const filename = `smartshop_participants_${label}_${new Date()
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

    if (format === "combinations-csv") {
      const label = chapter === "new" ? "new_chapter" : "all";
      const csv = rowsToCsv(coverage.rows);
      const filename = `smartshop_combinations_${label}_${new Date()
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

    return NextResponse.json({
      data: experimentResultsToRows(results),
      count: results.length,
      newChapterCount: newChapterResults.length,
      legacyCount: results.length - newChapterResults.length,
      coverage: {
        summary: coverageAll.summary,
        rows: coverageAll.rows,
      },
      coverageNewChapter: {
        summary: coverageNew.summary,
        rows: coverageNew.rows,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load results" },
      { status: 500 }
    );
  }
}
