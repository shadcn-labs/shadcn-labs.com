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

const SEARCH_URL = "https://api.github.com/search/issues";
const QUERY = "org:shadcn-labs type:issue state:open";
const PAGE_SIZE = 100;
const MAX_PAGES = 5;
const CONTRIBUTOR_LABELS = new Set(["good first issue", "help wanted"]);

const contributorPriority = (issue: GitHubIssue): number => {
  const labels = new Set(issue.labels.map((label) => label.name.toLowerCase()));

  for (const name of CONTRIBUTOR_LABELS) {
    if (labels.has(name)) {
      return 0;
    }
  }

  return 1;
};

const fetchIssuesPage = async (
  page: number
): Promise<{ items: GitHubIssue[]; totalCount: number }> => {
  const url = new URL(SEARCH_URL);
  url.searchParams.set("q", QUERY);
  url.searchParams.set("per_page", String(PAGE_SIZE));
  url.searchParams.set("page", String(page));
  url.searchParams.set("sort", "created");
  url.searchParams.set("order", "desc");

  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub search failed with ${response.status}`);
  }

  const data = (await response.json()) as {
    items: GitHubIssue[];
    total_count: number;
  };

  return { items: data.items, totalCount: data.total_count };
};

export const getIssuesByRepo = async (): Promise<RepoIssues[] | null> => {
  try {
    const firstPage = await fetchIssuesPage(1);
    const pageCount = Math.min(
      Math.ceil(firstPage.totalCount / PAGE_SIZE),
      MAX_PAGES
    );

    const pages =
      pageCount > 1
        ? await Promise.all(
            Array.from({ length: pageCount - 1 }, (_, index) =>
              fetchIssuesPage(index + 2)
            )
          )
        : [];

    const issues = [...firstPage.items, ...pages.flatMap((page) => page.items)];

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
        url: `https://github.com/shadcn-labs/${name}`,
      }))
      .toSorted((a, b) => b.count - a.count);
  } catch {
    return null;
  }
};
