"use client";

import { useMemo, useState } from "react";

import { EChartsLineChart } from "@/components/evilcharts/charts/echarts-line-chart";
import type { ChartConfig } from "@/components/evilcharts/charts/echarts-line-chart";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  AnalyticsRow,
  AnalyticsSnapshot,
  ProjectAnalytics,
} from "@/lib/vercel-analytics";

const ALL_PROJECTS = "all";
const TOP_ROWS = 6;

const compact = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
  notation: "compact",
});

const day = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

const chartConfig = {
  pageviews: {
    colors: { dark: ["#f06292"], light: ["#f06292"] },
    label: "Pageviews",
  },
  visitors: {
    colors: { dark: ["#f5f4ef"], light: ["#111111"] },
    label: "Visitors",
  },
} satisfies ChartConfig;

const change = (current: number, previous: number): string | null => {
  if (previous === 0) {
    return null;
  }
  const percent = Math.round(((current - previous) / previous) * 100);
  return `${percent > 0 ? "+" : ""}${percent}% vs prior 30 days`;
};

/** Sums rows with the same name across projects and keeps the top ones. */
const mergeTop = (lists: AnalyticsRow[][]): AnalyticsRow[] => {
  const merged = new Map<string, AnalyticsRow>();
  for (const row of lists.flat()) {
    const entry = merged.get(row.name) ?? {
      name: row.name,
      pageviews: 0,
      visitors: 0,
    };
    entry.visitors += row.visitors;
    entry.pageviews += row.pageviews;
    merged.set(row.name, entry);
  }
  return [...merged.values()]
    .toSorted((a, b) => b.visitors - a.visitors)
    .slice(0, TOP_ROWS);
};

const summarize = (projects: ProjectAnalytics[], dates: string[]) => {
  let visitors = 0;
  let pageviews = 0;
  let previousVisitors = 0;
  let previousPageviews = 0;
  for (const project of projects) {
    visitors += project.visitors;
    pageviews += project.pageviews;
    previousVisitors += project.previous.visitors;
    previousPageviews += project.previous.pageviews;
  }
  return {
    countries: mergeTop(projects.map((project) => project.countries)),
    referrers: mergeTop(projects.map((project) => project.referrers)),
    stats: [
      {
        change: change(visitors, previousVisitors),
        label: "visitors",
        value: visitors,
      },
      {
        change: change(pageviews, previousPageviews),
        label: "pageviews",
        value: pageviews,
      },
    ],
    trend: dates.map((date, index) => ({
      date: day.format(new Date(`${date}T00:00:00.000Z`)),
      pageviews: projects.reduce(
        (total, project) => total + (project.dailyPageviews[index] ?? 0),
        0
      ),
      visitors: projects.reduce(
        (total, project) => total + (project.dailyVisitors[index] ?? 0),
        0
      ),
    })),
  };
};

export const SponsorAnalytics = ({
  snapshot,
}: {
  snapshot: AnalyticsSnapshot;
}) => {
  const [selected, setSelected] = useState<string>(ALL_PROJECTS);

  const visible = useMemo(
    () =>
      selected === ALL_PROJECTS
        ? snapshot.projects
        : snapshot.projects.filter((project) => project.name === selected),
    [selected, snapshot.projects]
  );
  const summary = useMemo(
    () => summarize(visible, snapshot.dates),
    [visible, snapshot.dates]
  );
  const projectPeak = Math.max(
    1,
    ...snapshot.projects.map((project) => project.visitors)
  );
  const items = {
    [ALL_PROJECTS]: `All ${snapshot.projects.length} projects`,
    ...Object.fromEntries(
      snapshot.projects.map((project) => [project.name, project.name])
    ),
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p>
          Production traffic over the last{" "}
          <span className="font-mono">{snapshot.dates.length}</span> days,
          straight from Vercel Web Analytics.
        </p>
        <Select
          value={selected}
          onValueChange={(value) => {
            if (value !== null) {
              setSelected(value);
            }
          }}
          items={items}
        >
          <SelectTrigger
            size="sm"
            aria-label="Filter analytics by project"
            className="min-w-40"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {Object.entries(items).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <dl className="grid grid-cols-2 gap-4 pt-2">
        {summary.stats.map((stat) => (
          <div key={stat.label}>
            <dt className="text-muted-foreground">{stat.label}</dt>
            <dd className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
              <span
                className="font-mono text-2xl tracking-tight"
                title={stat.value.toLocaleString("en-US")}
              >
                {compact.format(stat.value)}
              </span>
              {stat.change && (
                <span className="text-muted-foreground font-mono text-xs">
                  {stat.change}
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>

      <EChartsLineChart
        data={summary.trend}
        config={chartConfig}
        xDataKey="date"
        className="h-56 w-full"
        curveType="monotone"
        enableHoverHighlight
      >
        <EChartsLineChart.XAxis dataKey="date" />
        <EChartsLineChart.YAxis
          tickFormatter={(value) => compact.format(value)}
        />
        <EChartsLineChart.Legend isClickable align="right" />
        <EChartsLineChart.Tooltip cursor />
        <EChartsLineChart.Line dataKey="visitors" isClickable>
          <EChartsLineChart.ActiveDot variant="colored-border" />
        </EChartsLineChart.Line>
        <EChartsLineChart.Line dataKey="pageviews" isClickable>
          <EChartsLineChart.ActiveDot variant="colored-border" />
        </EChartsLineChart.Line>
      </EChartsLineChart>

      <h3 className="text-muted-foreground pt-4">By project</h3>
      <ul className="space-y-1">
        {snapshot.projects.map((project) => {
          const active = selected === project.name;
          const dimmed = selected !== ALL_PROJECTS && !active;
          return (
            <li key={project.name}>
              <button
                type="button"
                aria-pressed={active}
                onClick={() =>
                  setSelected(active ? ALL_PROJECTS : project.name)
                }
                className={`relative flex w-full cursor-pointer justify-between gap-4 rounded-sm px-2 py-0.5 text-left transition-opacity ${dimmed ? "opacity-50 hover:opacity-100" : ""}`}
              >
                <span
                  className={`absolute inset-y-0 left-0 rounded-sm ${active ? "bg-highlight/20" : "bg-muted"}`}
                  style={{
                    width: `${(project.visitors / projectPeak) * 100}%`,
                  }}
                  aria-hidden="true"
                />
                <span className="relative">{project.name}</span>
                <span
                  className="relative font-mono"
                  title={`${project.pageviews.toLocaleString("en-US")} pageviews`}
                >
                  {compact.format(project.visitors)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="grid grid-cols-1 gap-x-6 gap-y-2 pt-2 sm:grid-cols-2">
        {[
          { rows: summary.countries, title: "Top countries" },
          { rows: summary.referrers, title: "Top referrers" },
        ].map((list) => (
          <div key={list.title} className="space-y-1">
            <h3 className="text-muted-foreground pt-2">{list.title}</h3>
            {list.rows.length === 0 ? (
              <p className="text-muted-foreground">No data yet.</p>
            ) : (
              <ul className="space-y-1">
                {list.rows.map((row) => (
                  <li key={row.name} className="flex justify-between gap-4">
                    <span className="truncate">{row.name}</span>
                    <span className="font-mono">
                      {compact.format(row.visitors)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      <p className="text-muted-foreground pt-2 text-xs">
        Visitors are counted per project, so someone visiting two projects
        counts twice. Pick a project above, or click one in the list, to filter.
      </p>
    </div>
  );
};
