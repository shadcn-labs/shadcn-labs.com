import { fetchCloudflareProject } from "./cloudflare";
import { readAnalyticsSources } from "./config";
import { fetchPostHogProject } from "./posthog";
import { createReportingPeriod } from "./range";
import type {
  AnalyticsResult,
  AnalyticsSnapshot,
  ProjectAnalytics,
  ReportingPeriod,
  ResolvedSource,
} from "./types";
import { fetchVercelProjects } from "./vercel";

export type {
  AnalyticsResult,
  AnalyticsRow,
  AnalyticsSnapshot,
  AnalyticsSource,
  CloudflareSource,
  PostHogSource,
  ProjectAnalytics,
  ReportingPeriod,
  ResolvedSource,
  VercelSource,
} from "./types";

/**
 * How long a good snapshot stays fresh, in seconds. A refresh costs a few
 * requests per source, so an hourly refresh stays far below provider limits.
 */
export const ANALYTICS_CACHE_TTL_SECONDS = 3600;

/**
 * How long a failed refresh is remembered, in seconds, so a provider outage or
 * rate limit is not hammered by every visitor.
 */
export const ANALYTICS_FAILURE_CACHE_TTL_SECONDS = 300;

const fetchSource = (
  source: ResolvedSource,
  period: ReportingPeriod
): Promise<ProjectAnalytics[]> => {
  switch (source.provider) {
    case "vercel": {
      return fetchVercelProjects(source, period);
    }
    case "cloudflare": {
      return fetchCloudflareProject(source, period).then((project) => [
        project,
      ]);
    }
    case "posthog": {
      return fetchPostHogProject(source, period).then((project) => [project]);
    }
    default: {
      throw new Error("Unsupported analytics provider");
    }
  }
};

const refresh = async (): Promise<AnalyticsSnapshot> => {
  const sources = readAnalyticsSources();
  const period = createReportingPeriod();
  const projects: ProjectAnalytics[] = [];
  const seen = new Set<string>();

  // Sequential on purpose: Vercel's per-token budget check is stateful, and a
  // snapshot that merges sources must not race itself.
  for (const source of sources) {
    // oxlint-disable-next-line no-await-in-loop
    for (const project of await fetchSource(source, period)) {
      if (seen.has(project.name)) {
        throw new Error(
          `Analytics project "${project.name}" was returned by more than one source`
        );
      }
      seen.add(project.name);
      projects.push(project);
    }
  }

  if (projects.length === 0) {
    throw new Error(
      "No analytics projects were returned; check ANALYTICS_SOURCES and each source's token"
    );
  }

  return {
    dates: period.dates,
    fetchedAt: new Date().toISOString(),
    projects: projects.toSorted((a, b) => b.visitors - a.visitors),
  };
};

let cached: { expires: number; result: AnalyticsResult } | undefined;
let inflight: Promise<AnalyticsResult> | undefined;

/**
 * Production traffic across every configured source for the last 30 whole UTC
 * days. Cached in-process for ANALYTICS_CACHE_TTL_SECONDS and deduplicated
 * while a refresh is running; the server island also sets an edge cache, so an
 * edge hit never reaches a provider. A failed refresh keeps serving the last
 * good snapshot marked stale and is not retried for
 * ANALYTICS_FAILURE_CACHE_TTL_SECONDS.
 */
export const getSponsorAnalytics = (): Promise<AnalyticsResult> => {
  if (cached && cached.expires > Date.now()) {
    return Promise.resolve(cached.result);
  }
  inflight ??= (async () => {
    const previous = cached?.result.snapshot ?? null;
    try {
      const result = { snapshot: await refresh(), stale: false };
      cached = {
        expires: Date.now() + ANALYTICS_CACHE_TTL_SECONDS * 1000,
        result,
      };
      return result;
    } catch (error) {
      const result = { snapshot: previous, stale: true };
      cached = {
        expires: Date.now() + ANALYTICS_FAILURE_CACHE_TTL_SECONDS * 1000,
        result,
      };
      console.warn(
        previous
          ? `[analytics] Refresh failed, serving the snapshot from ${previous.fetchedAt}.`
          : "[analytics] Refresh failed and there is no snapshot to fall back on.",
        error
      );
      return result;
    } finally {
      inflight = undefined;
    }
  })();
  return inflight;
};
