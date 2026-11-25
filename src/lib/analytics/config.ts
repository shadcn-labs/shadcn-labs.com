import { getSecret } from "astro:env/server";

import { PROJECTS } from "@/constants/projects";

import type { AnalyticsSource, ResolvedSource } from "./types";

const ENV_VAR = "ANALYTICS_SOURCES";

/** skills.sh is an external directory, not a site whose traffic belongs to us. */
export const ANALYTICS_PROJECTS = PROJECTS.filter(
  (project) => project.name !== "skills"
);
const ANALYTICS_PROJECT_NAMES = new Set(
  ANALYTICS_PROJECTS.map((project) => project.name)
);

const asObject = (value: unknown, index: number): Record<string, unknown> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new TypeError(`${ENV_VAR}[${index}] must be an object`);
  }
  return value as Record<string, unknown>;
};

const readString = (
  entry: Record<string, unknown>,
  field: string,
  index: number
): string => {
  const value = entry[field];
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(
      `${ENV_VAR}[${index}].${field} must be a non-empty string`
    );
  }
  return value.trim();
};

/** An API origin, without a path, trailing slash, or credentials. */
const readOrigin = (
  entry: Record<string, unknown>,
  field: string,
  index: number
): string => {
  const value = readString(entry, field, index);
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new TypeError(`${ENV_VAR}[${index}].${field} must be a URL`);
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new TypeError(`${ENV_VAR}[${index}].${field} must use http or https`);
  }
  return url.origin;
};

const readProject = (entry: Record<string, unknown>, index: number): string => {
  const project = readString(entry, "project", index);
  if (!ANALYTICS_PROJECT_NAMES.has(project)) {
    throw new Error(
      `${ENV_VAR}[${index}].project "${project}" is not an analytics-enabled project`
    );
  }
  return project;
};

const parseSource = (
  entry: Record<string, unknown>,
  index: number
): AnalyticsSource => {
  const provider = readString(entry, "provider", index);
  const tokenEnv = readString(entry, "tokenEnv", index);

  switch (provider) {
    case "vercel": {
      return {
        provider,
        teamId: readString(entry, "teamId", index),
        tokenEnv,
      };
    }
    case "cloudflare": {
      return {
        accountId: readString(entry, "accountId", index),
        project: readProject(entry, index),
        provider,
        siteTag: readString(entry, "siteTag", index),
        tokenEnv,
      };
    }
    case "posthog": {
      return {
        host: readOrigin(entry, "host", index),
        project: readProject(entry, index),
        projectId: readString(entry, "projectId", index),
        provider,
        tokenEnv,
      };
    }
    default: {
      throw new Error(
        `${ENV_VAR}[${index}].provider "${provider}" is not supported (use "vercel", "cloudflare", or "posthog")`
      );
    }
  }
};

/**
 * Parses `ANALYTICS_SOURCES`, a JSON array of the sources to merge. Each entry
 * names the env var holding its token; a missing token fails the refresh
 * instead of falling back to a shared token.
 */
export const readAnalyticsSources = (): ResolvedSource[] => {
  const raw = getSecret(ENV_VAR);
  if (!raw) {
    throw new Error(`${ENV_VAR} must be set`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`${ENV_VAR} must be valid JSON`);
  }
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error(`${ENV_VAR} must be a non-empty JSON array`);
  }

  const sources = parsed.map((value, index) =>
    parseSource(asObject(value, index), index)
  );

  const explicitProjects = new Map<string, string>();
  for (const source of sources) {
    if (source.provider === "vercel") {
      continue;
    }
    const previous = explicitProjects.get(source.project);
    if (previous) {
      throw new Error(
        `${ENV_VAR} configures project "${source.project}" more than once (${previous}, ${source.provider})`
      );
    }
    explicitProjects.set(source.project, source.provider);
  }

  return sources.map((source, index) => {
    const token = (getSecret(source.tokenEnv) ?? "").trim();
    if (!token) {
      throw new Error(
        `${ENV_VAR}[${index}].tokenEnv "${source.tokenEnv}" is not set`
      );
    }
    return { ...source, token };
  });
};
