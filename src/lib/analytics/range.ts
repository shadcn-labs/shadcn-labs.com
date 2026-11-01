import type { ReportingPeriod } from "./types";

export const DAY_MS = 24 * 60 * 60 * 1000;
export const PERIOD_DAYS = 30;

export const isoDate = (timestamp: number): string =>
  new Date(timestamp).toISOString().slice(0, 10);

/**
 * Whole UTC days ending yesterday, so the last point is never a partial day.
 * The prior period is the equally long window immediately before it.
 */
export const createReportingPeriod = (now = Date.now()): ReportingPeriod => {
  const today = Date.parse(`${isoDate(now)}T00:00:00.000Z`);
  const lastDay = today - DAY_MS;
  const firstDay = lastDay - (PERIOD_DAYS - 1) * DAY_MS;

  return {
    dates: Array.from({ length: PERIOD_DAYS }, (_, index) =>
      isoDate(firstDay + index * DAY_MS)
    ),
    end: lastDay + DAY_MS - 1,
    previousEnd: firstDay - 1,
    previousStart: firstDay - PERIOD_DAYS * DAY_MS,
    start: firstDay,
  };
};
