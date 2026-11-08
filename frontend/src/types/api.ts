/**
 * TypeScript interfaces matching the FastAPI POST /api/analyze response contract.
 * Public analysis fields returned by FastAPI; additive code-understanding fields
 * remain optional for compatibility with older mocked responses.
 */

export interface RelevantFile {
  filename: string;
  reason: string;
}

export interface AnalysisResult {
  project_overview?: string;
  file_explanations?: FileExplanation[];
  potential_issues?: PotentialIssue[];
  missing_context?: string[];
  issue_summary: string;
  relevant_files: RelevantFile[];
  contribution_plan: string[];
  suggested_tests: string[];
  uncertainties: string[];
}

export interface FileExplanation {
  filename: string;
  purpose: string;
  important_elements: string[];
  relationships: string;
}

export interface PotentialIssue {
  filename: string;
  location: string;
  title: string;
  assessment: 'observed' | 'inferred';
  evidence: string;
  why_it_matters: string;
}

/** HTTP error shape returned by FastAPI for 4xx / 5xx responses. */
export interface ApiErrorDetail {
  detail: string;
}
