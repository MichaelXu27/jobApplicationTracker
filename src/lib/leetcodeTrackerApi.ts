// ---------------------------------------------------------------------------
// LeetCode Tracker API Client
// Uses the Next.js app's own API routes — no separate backend needed.
// Auth is handled via NextAuth session cookies automatically.
// ---------------------------------------------------------------------------

export interface Problem {
  id: string;
  slug: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  topic: string;
  source: string;
}

export interface UserProblem {
  id: string;
  userId: string;
  problemId: string;
  status: "unsolved" | "solved" | "review";
  lastSolvedAt: string | null;
  nextReviewAt: string | null;
  intervalDays: number;
  easeFactor: number;
  problem: Problem;
}

export interface CursorPage<T> {
  items: T[];
  next_cursor: string | null;
}

// ---------------------------------------------------------------------------
// Generic request helper — session cookie sent automatically
// ---------------------------------------------------------------------------

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api/leetcode${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...((options?.headers as Record<string, string>) ?? {}),
    },
  });

  if (!res.ok) {
    let detail = "Request failed";
    try {
      const body = await res.json();
      detail = body.error ?? body.detail ?? body.message ?? detail;
    } catch {
      // ignore parse errors
    }
    throw new Error(detail);
  }

  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text);
}

// ---------------------------------------------------------------------------
// Problems
// ---------------------------------------------------------------------------

export async function listProblems(): Promise<CursorPage<Problem>> {
  return request<CursorPage<Problem>>("/problems");
}

export async function getMarkedProblemIds(): Promise<string[]> {
  return request<string[]>("/problems/marked");
}

export async function markSolved(
  problemId: string,
  reviewOutcome: string = "success"
): Promise<void> {
  await request<void>(`/problems/${problemId}/solve`, {
    method: "POST",
    body: JSON.stringify({ review_outcome: reviewOutcome }),
  });
}

export async function markUnsolved(problemId: string): Promise<void> {
  await request<void>(`/problems/${problemId}/unsolve`, {
    method: "POST",
  });
}

// ---------------------------------------------------------------------------
// Reviews (spaced repetition)
// ---------------------------------------------------------------------------

export async function getRandomReviews(): Promise<UserProblem[]> {
  return request<UserProblem[]>("/reviews/random");
}
