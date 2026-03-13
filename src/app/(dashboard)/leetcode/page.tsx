"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  listProblems,
  getMarkedProblemIds,
  getRandomReviews,
  markSolved,
  markUnsolved,
  type Problem,
  type UserProblem,
} from "@/lib/leetcodeTrackerApi";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DIFFICULTY_STYLES: Record<string, string> = {
  easy: "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  hard: "bg-red-100 text-red-700",
};

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium capitalize ${DIFFICULTY_STYLES[difficulty] ?? "bg-gray-100 text-gray-600"}`}>
      {difficulty}
    </span>
  );
}

function TopicBadge({ topic }: { topic: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-600">
      {topic.replace(/-/g, " ")}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function LeetcodePage() {
  const router = useRouter();

  const [problems, setProblems] = useState<Problem[]>([]);
  const [markedIds, setMarkedIds] = useState<Set<string>>(new Set());
  const [randomReviews, setRandomReviews] = useState<UserProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filters
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [topicFilter, setTopicFilter] = useState("");
  const [search, setSearch] = useState("");
  const [showMarkedOnly, setShowMarkedOnly] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [page, ids, reviews] = await Promise.all([
        listProblems(),
        getMarkedProblemIds(),
        getRandomReviews(),
      ]);
      setProblems(page.items);
      setMarkedIds(new Set(ids));
      setRandomReviews(reviews);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load";
      if (msg === "Unauthorized") {
        router.push("/login");
        return;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  async function handleMarkSolved(problemId: string) {
    setActionLoading(problemId + "_solve");
    try {
      await markSolved(problemId);
      const [ids, reviews] = await Promise.all([getMarkedProblemIds(), getRandomReviews()]);
      setMarkedIds(new Set(ids));
      setRandomReviews(reviews);
      toast.success("Marked as solved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleMarkUnsolved(problemId: string) {
    setActionLoading(problemId + "_unsolve");
    try {
      await markUnsolved(problemId);
      const [ids, reviews] = await Promise.all([getMarkedProblemIds(), getRandomReviews()]);
      setMarkedIds(new Set(ids));
      setRandomReviews(reviews);
      toast.success("Marked as unsolved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setActionLoading(null);
    }
  }

  // Today's picks — prefer due-for-review, fall back to random marked
  const todaysPicks = useMemo<Problem[]>(() => {
    if (randomReviews.length > 0) {
      return randomReviews.map((r) => r.problem);
    }
    const marked = problems.filter((p) => markedIds.has(p.id));
    if (marked.length === 0) return [];
    return [...marked].sort(() => Math.random() - 0.5).slice(0, 3);
  }, [randomReviews, problems, markedIds]);

  const filteredProblems = useMemo(() => {
    return problems.filter((p) => {
      if (difficultyFilter && p.difficulty !== difficultyFilter) return false;
      if (topicFilter && p.topic !== topicFilter) return false;
      if (showMarkedOnly && !markedIds.has(p.id)) return false;
      if (search) {
        const q = search.toLowerCase();
        return p.title.toLowerCase().includes(q) || p.topic.toLowerCase().includes(q);
      }
      return true;
    });
  }, [problems, difficultyFilter, topicFilter, showMarkedOnly, search, markedIds]);

  const allTopics = useMemo(() => {
    return Array.from(new Set(problems.map((p) => p.topic))).sort();
  }, [problems]);

  const solvedCount = markedIds.size;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">LeetCode Tracker</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {solvedCount} / {problems.length} solved
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Today's Picks */}
      {todaysPicks.length > 0 && (
        <div className="bg-gradient-to-br from-orange-50 to-yellow-50 border border-orange-100 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <h2 className="text-sm font-semibold text-orange-700">Today&apos;s Review Picks</h2>
            <span className="text-xs text-orange-500 ml-auto">
              {randomReviews.length > 0 ? "Due for review" : "Random from solved"}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {todaysPicks.map((p) => (
              <a
                key={p.id}
                href={`https://leetcode.com/problems/${p.slug}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col gap-2 bg-white rounded-xl p-3.5 border border-orange-100
                  hover:border-orange-200 hover:shadow-sm transition-all"
              >
                <span className="text-sm font-medium text-gray-900 leading-snug">{p.title}</span>
                <div className="flex items-center gap-2">
                  <DifficultyBadge difficulty={p.difficulty} />
                  <TopicBadge topic={p.topic} />
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Problem list card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        {/* Filters */}
        <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
          <input
            type="search"
            placeholder="Search problems…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[180px] px-3 py-2 rounded-xl border border-gray-200 text-sm
              focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400
              placeholder:text-gray-400"
          />
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-600
              focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
          >
            <option value="">All difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <select
            value={topicFilter}
            onChange={(e) => setTopicFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-600
              focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
          >
            <option value="">All topics</option>
            {allTopics.map((t) => (
              <option key={t} value={t}>{t.replace(/-/g, " ")}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showMarkedOnly}
              onChange={(e) => setShowMarkedOnly(e.target.checked)}
              className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
            />
            Solved only
          </label>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-sm text-gray-400">
            Loading problems…
          </div>
        ) : filteredProblems.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-sm text-gray-400">
            No problems found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide border-b border-gray-100">
                  <th className="px-5 py-3 w-8"></th>
                  <th className="px-5 py-3">Problem</th>
                  <th className="px-5 py-3">Difficulty</th>
                  <th className="px-5 py-3">Topic</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredProblems.map((p) => {
                  const solved = markedIds.has(p.id);
                  const solvingThis = actionLoading === p.id + "_solve";
                  const unsolvingThis = actionLoading === p.id + "_unsolve";
                  return (
                    <tr key={p.id} className={`hover:bg-gray-50 transition-colors ${solved ? "bg-green-50/30" : ""}`}>
                      <td className="px-5 py-3">
                        {solved && (
                          <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                            <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <a
                          href={`https://leetcode.com/problems/${p.slug}/`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-gray-900 hover:text-orange-600 transition-colors"
                        >
                          {p.title}
                        </a>
                      </td>
                      <td className="px-5 py-3">
                        <DifficultyBadge difficulty={p.difficulty} />
                      </td>
                      <td className="px-5 py-3">
                        <TopicBadge topic={p.topic} />
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!solved ? (
                            <button
                              onClick={() => handleMarkSolved(p.id)}
                              disabled={solvingThis || unsolvingThis}
                              className="px-3 py-1 rounded-lg text-xs font-medium bg-green-50 text-green-700
                                hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {solvingThis ? "Saving…" : "Mark solved"}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleMarkUnsolved(p.id)}
                              disabled={solvingThis || unsolvingThis}
                              className="px-3 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-600
                                hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {unsolvingThis ? "Saving…" : "Mark unsolved"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer count */}
        {!loading && (
          <div className="px-5 py-4 border-t border-gray-100">
            <span className="text-xs text-gray-400">
              {filteredProblems.length} of {problems.length} shown
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
