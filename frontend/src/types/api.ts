/**
 * TypeScript interfaces matching the FastAPI POST /api/analyze response contract.
 * Five public fields only — no internal metadata from the backend is exposed.
 */

export interface RelevantFile {
  filename: string;
  reason: string;
}

export interface AnalysisResult {
  issue_summary: string;
  relevant_files: RelevantFile[];
  contribution_plan: string[];
  suggested_tests: string[];
  uncertainties: string[];
}

/** HTTP error shape returned by FastAPI for 4xx / 5xx responses. */
export interface ApiErrorDetail {
  detail: string;
}
