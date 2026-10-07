export interface GitHubLabel {
  name: string;
}

export interface GitHubIssue {
  comments: number;
  created_at: string;
  html_url: string;
  labels: GitHubLabel[];
  number: number;
  repository_url: string;
  title: string;
}

export interface RepoIssues {
  count: number;
  issues: GitHubIssue[];
  name: string;
  url: string;
}

export interface IssuesSnapshot {
  /** ISO timestamp of the last successful fetch; `null` if there never was one. */
  fetchedAt: string | null;
  /** `null` only when we have never had a successful fetch. */
  groups: RepoIssues[] | null;
  /** True when a refresh failed and we are serving the previous snapshot. */
  stale: boolean;
}

interface SearchPage {
  items: GitHubIssue[];
  totalCount: number;
}

export interface GitHubContributor {
  avatar_url: string;
  contributions: number;
  html_url: string;
  login: string;
  type: string;
}

export interface GitHubRepo {
  fork: boolean;
  name: string;
}

export interface Contributor {
  avatarUrl: string;
  contributions: number;
  htmlUrl: string;
  login: string;
  repos: string[];
}

const API_URL = "https://api.github.com";
const ORG = "shadcn-labs";
const SEARCH_URL = `${API_URL}/search/issues`;
const ORG_QUERY = `org:${ORG} type:issue state:open`;
const PAGE_SIZE = 100;
/** GitHub's search API refuses to page past 1000 results for one query. */
const SEARCH_RESULT_CAP = 1000;
const MAX_PAGES = SEARCH_RESULT_CAP / PAGE_SIZE;
/**
 * Repos combined into one search query when the org-wide query hits the
 * result cap. Several `repo:` qualifiers OR together (verified against the
 * live API), so a chunk of repos needs one query instead of one per repo,
 * which keeps the request count as close to ceil(total / PAGE_SIZE) as the
 * API allows.
 */
const REPOS_PER_QUERY = 4;
const CONTRIBUTOR_LABELS = new Set(["good first issue", "help wanted"]);

/** How long the issues data stays fresh, in seconds. */
export const ISSUES_CACHE_TTL_SECONDS = 300;

/** How long contributor data stays fresh, in seconds. */
export const CONTRIBUTORS_CACHE_TTL_SECONDS = 3600;

/**
 * How long a failed refresh is remembered, in seconds. Short, so the page
 * recovers as soon as GitHub does, but long enough that a burst of visitors
 * cannot spend the whole anonymous budget on retries.
 */
export const FAILURE_CACHE_TTL_SECONDS = 60;

/**
 * Agent logins that are still typed as a `User` account, so the `[bot]` suffix
 * does not catch them. Bounded on the right so `codysmith` survives a `cody`
 * match.
 */
const AGENT_LOGIN =
  /^(?:aider|cody|cohere|codex|claude|copilot|cursor|deepseek|dependabot|devin|gemini|greptile|qwen|renovate|replit|sourcery|sweep|windsurf)(?:$|[-_.[\d])/iu;

const contributorPriority = (issue: GitHubIssue): number => {
  const labels = new Set(issue.labels.map((label) => label.name.toLowerCase()));

  for (const name of CONTRIBUTOR_LABELS) {
    if (labels.has(name)) {
      return 0;
    }
  }

  return 1;
};

const isHuman = (contributor: GitHubContributor): boolean =>
  contributor.type === "User" &&
  !contributor.login.endsWith("[bot]") &&
  !AGENT_LOGIN.test(contributor.login);

class GitHubRequestError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`GitHub request failed with ${status}`);
    this.name = "GitHubRequestError";
    this.status = status;
  }
}

const isRateLimited = (reason: unknown): boolean =>
  reason instanceof GitHubRequestError &&
  (reason.status === 403 || reason.status === 429);

const githubFetch = async <T>(url: URL): Promise<T> => {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
    },
  });

  if (!response.ok) {
    throw new GitHubRequestError(response.status);
  }

  return (await response.json()) as T;
};

const fetchAllPages = async <T>(path: string, page = 1): Promise<T[]> => {
  if (page > MAX_PAGES) {
    return [];
  }

  const url = new URL(`${API_URL}${path}`);
  url.searchParams.set("page", String(page));
  url.searchParams.set("per_page", String(PAGE_SIZE));

  const items = await githubFetch<T[]>(url);

  if (items.length < PAGE_SIZE) {
    return items;
  }

  const rest = await fetchAllPages<T>(path, page + 1);

  return [...items, ...rest];
};

const searchIssuesPage = async (
  query: string,
  page: number
): Promise<SearchPage> => {
  const url = new URL(SEARCH_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("per_page", String(PAGE_SIZE));
  url.searchParams.set("page", String(page));
  url.searchParams.set("sort", "created");
  url.searchParams.set("order", "desc");

  const data = await githubFetch<{
    items: GitHubIssue[];
    total_count: number;
  }>(url);

  return { items: data.items, totalCount: data.total_count };
};

const remainingPages = (totalCount: number): number[] => {
  const count = Math.min(Math.ceil(totalCount / PAGE_SIZE), MAX_PAGES);

  return Array.from(
    { length: Math.max(count - 1, 0) },
    (_, index) => index + 2
  );
};

const repoQuery = (repos: GitHubRepo[]): string =>
  `${repos.map((repo) => `repo:${ORG}/${repo.name}`).join(" ")} type:issue state:open`;

/**
 * Every open issue in a group of repos, fetched with one query for the group.
 *
 * Several `repo:` qualifiers OR together, so a chunk of repos needs one query
 * instead of one per repo. A single search query cannot page past
 * SEARCH_RESULT_CAP results, so a group over the cap is split in half until
 * each query fits. Any failure — rate limiting included — is thrown, never
 * skipped, so getIssuesByRepo can serve the last good snapshot marked stale
 * instead of caching a partial org as if it were complete.
 */
const fetchIssuesForRepos = async (
  repos: GitHubRepo[]
): Promise<GitHubIssue[]> => {
  const query = repoQuery(repos);
  const first = await searchIssuesPage(query, 1);

  if (first.totalCount > SEARCH_RESULT_CAP && repos.length > 1) {
    const middle = Math.ceil(repos.length / 2);
    const [left, right] = await Promise.all([
      fetchIssuesForRepos(repos.slice(0, middle)),
      fetchIssuesForRepos(repos.slice(middle)),
    ]);

    return [...left, ...right];
  }

  if (first.totalCount > SEARCH_RESULT_CAP) {
    console.warn(
      `[github] ${repos[0].name} has more than ${SEARCH_RESULT_CAP} open issues; GitHub only returns the first ${SEARCH_RESULT_CAP}.`
    );
  }

  const rest = await Promise.all(
    remainingPages(first.totalCount).map((page) =>
      searchIssuesPage(query, page)
    )
  );

  return [first.items, ...rest.map((entry) => entry.items)].flat();
};

/**
 * Split-repo replacement for the org-wide query, reached only once the org is
 * past the SEARCH_RESULT_CAP result cap.
 *
 * Unauthenticated search allows 10 requests a minute while a complete refresh
 * needs ceil(total / PAGE_SIZE) requests, so well past the cap a single burst
 * can outrun the budget. That case fails as a whole and serves the previous
 * snapshot marked stale (see getIssuesByRepo) rather than a half-org list.
 */
const fetchIssuesInChunks = async (): Promise<GitHubIssue[]> => {
  const all = await fetchAllPages<GitHubRepo>(`/orgs/${ORG}/repos?type=public`);
  const repos = all.filter((repo) => !repo.fork);

  if (repos.length === 0) {
    throw new Error("The split-repo issues fallback found no repositories");
  }

  const chunks = Array.from(
    { length: Math.ceil(repos.length / REPOS_PER_QUERY) },
    (_, index) =>
      repos.slice(index * REPOS_PER_QUERY, (index + 1) * REPOS_PER_QUERY)
  );

  const results = await Promise.all(
    chunks.map((chunk) => fetchIssuesForRepos(chunk))
  );

  return results.flat();
};

const fetchAllIssues = async (): Promise<GitHubIssue[]> => {
  const first = await searchIssuesPage(ORG_QUERY, 1);

  if (first.totalCount > SEARCH_RESULT_CAP) {
    console.warn(
      `[github] ${first.totalCount} open issues is over the ${SEARCH_RESULT_CAP} result search cap, falling back to split repo queries.`
    );

    return fetchIssuesInChunks();
  }

  const rest = await Promise.all(
    remainingPages(first.totalCount).map((page) =>
      searchIssuesPage(ORG_QUERY, page)
    )
  );

  return [first.items, ...rest.map((entry) => entry.items)].flat();
};

const groupByRepo = (issues: GitHubIssue[]): RepoIssues[] => {
  const grouped = new Map<string, GitHubIssue[]>();

  for (const issue of issues) {
    const name = issue.repository_url.split("/").at(-1);

    if (!name) {
      continue;
    }

    const bucket = grouped.get(name);

    if (bucket) {
      bucket.push(issue);
    } else {
      grouped.set(name, [issue]);
    }
  }

  return [...grouped.entries()]
    .map(([name, repoIssues]) => ({
      count: repoIssues.length,
      issues: repoIssues.toSorted(
        (a, b) =>
          contributorPriority(a) - contributorPriority(b) ||
          b.created_at.localeCompare(a.created_at)
      ),
      name,
      url: `https://github.com/${ORG}/${name}/issues`,
    }))
    .toSorted((a, b) => b.count - a.count);
};

interface CachedIssues {
  expires: number;
  snapshot: IssuesSnapshot;
}

const snapshotCache = new Map<string, CachedIssues>();

/**
 * Open issues across the org, grouped by repo, plus the time the data was
 * actually fetched so the page can show how stale it is.
 *
 * Cached in-process for ISSUES_CACHE_TTL_SECONDS. The server island also
 * sets an edge cache, so an edge hit never reaches GitHub at all. If a refresh
 * fails we keep serving the last good snapshot rather than blanking the page,
 * and remember the failure for FAILURE_CACHE_TTL_SECONDS so the retries do not
 * stack up while GitHub is down.
 */
export const getIssuesByRepo = async (): Promise<IssuesSnapshot> => {
  const cached = snapshotCache.get(ORG);

  if (cached && cached.expires > Date.now()) {
    return cached.snapshot;
  }

  try {
    const issues = await fetchAllIssues();
    const snapshot: IssuesSnapshot = {
      fetchedAt: new Date().toISOString(),
      groups: groupByRepo(issues),
      stale: false,
    };

    snapshotCache.set(ORG, {
      expires: Date.now() + ISSUES_CACHE_TTL_SECONDS * 1000,
      snapshot,
    });

    return snapshot;
  } catch (error) {
    const snapshot: IssuesSnapshot = cached
      ? { ...cached.snapshot, stale: true }
      : { fetchedAt: null, groups: null, stale: true };

    snapshotCache.set(ORG, {
      expires: Date.now() + FAILURE_CACHE_TTL_SECONDS * 1000,
      snapshot,
    });

    console.warn(
      cached
        ? `[github] Issues refresh failed, serving the snapshot from ${cached.snapshot.fetchedAt}.`
        : "[github] Issues fetch failed and there is no snapshot to fall back on.",
      error
    );

    return snapshot;
  }
};

interface CachedContributors {
  expires: number;
  value: Contributor[] | null;
}

const contributorCache = new Map<string, CachedContributors>();

const loadContributors = async (org: string): Promise<Contributor[] | null> => {
  let repos: GitHubRepo[];

  try {
    const all = await fetchAllPages<GitHubRepo>(`/orgs/${org}/repos`);

    repos = all.filter((repo) => !repo.fork);
  } catch {
    return null;
  }

  if (repos.length === 0) {
    return [];
  }

  // allSettled: one missing repo should not blank the page. Rate limiting is
  // handled separately below, because a partial list is worse than none.
  const results = await Promise.allSettled(
    repos.map((repo) =>
      fetchAllPages<GitHubContributor>(
        `/repos/${org}/${repo.name}/contributors`
      )
    )
  );
  const merged = new Map<string, Contributor>();
  let rateLimited = false;
  let succeeded = 0;

  for (const [index, result] of results.entries()) {
    if (result.status === "rejected") {
      rateLimited ||= isRateLimited(result.reason);
      continue;
    }

    succeeded += 1;

    for (const entry of result.value.filter(isHuman)) {
      const existing = merged.get(entry.login);

      if (existing) {
        existing.contributions += entry.contributions;
        existing.repos.push(repos[index].name);
        continue;
      }

      merged.set(entry.login, {
        avatarUrl: entry.avatar_url,
        contributions: entry.contributions,
        htmlUrl: entry.html_url,
        login: entry.login,
        repos: [repos[index].name],
      });
    }
  }

  // A partial list would be cached as if it were complete, so any rate limit
  // fails the refresh. Every repo failing is an auth problem, not an empty org.
  if (rateLimited || succeeded === 0) {
    return null;
  }

  return [...merged.values()].toSorted(
    (a, b) =>
      b.contributions - a.contributions || a.login.localeCompare(b.login)
  );
};

/**
 * Every human who has committed to any public repo in the org, aggregated
 * across repos. Bots and coding agents are filtered out.
 *
 * There is no aggregate endpoint on the GitHub REST API, so this costs one
 * request per repo. The server island caches its response for
 * CONTRIBUTORS_CACHE_TTL_SECONDS, and this in-process memo is a second layer
 * that keeps a warm server from re-fetching inside that window. Failures are
 * memoized too, for FAILURE_CACHE_TTL_SECONDS, so a rate-limited burst cannot
 * spend the anonymous 60 req/hr budget on retries. No token needed.
 */
export const getContributors = async (
  org = ORG
): Promise<Contributor[] | null> => {
  const cached = contributorCache.get(org);

  if (cached && cached.expires > Date.now()) {
    return cached.value;
  }

  const contributors = await loadContributors(org);

  if (contributors === null) {
    console.warn(
      "[github] Could not load contributors — the GitHub API may be rate limited."
    );
  }

  contributorCache.set(org, {
    expires:
      Date.now() +
      (contributors === null
        ? FAILURE_CACHE_TTL_SECONDS
        : CONTRIBUTORS_CACHE_TTL_SECONDS) *
        1000,
    value: contributors,
  });

  return contributors;
};
