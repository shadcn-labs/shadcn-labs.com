import { Badge } from "@/components/ui/badge";
import { UTM_PARAMS } from "@/constants/site";
import type { GitHubIssue } from "@/lib/github";
import { addQueryParams } from "@/lib/url";

interface IssueListItemProps {
  issue: GitHubIssue;
}

const formatDate = (value: string): string =>
  new Date(value).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export const IssueListItem = ({ issue }: IssueListItemProps) => (
  <li>
    <a target="_blank" href={addQueryParams(issue.html_url, UTM_PARAMS)}>
      #{issue.number} {issue.title}
    </a>
    <br />
    {issue.labels.length > 0 && (
      <>
        <span className="inline-flex flex-wrap items-center gap-1.5">
          {issue.labels.map((label) => (
            <Badge key={label.name} variant="secondary">
              {label.name}
            </Badge>
          ))}
        </span>
        <br />
      </>
    )}
    <span className="text-muted-foreground text-sm">
      opened {formatDate(issue.created_at)} · {issue.comments} comment
      {issue.comments === 1 ? "" : "s"}
    </span>
  </li>
);
