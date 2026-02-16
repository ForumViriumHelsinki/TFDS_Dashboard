const DEFAULT_END_DATE = new Date(Math.floor(Date.now() / 60_000) * 60_000);
const DEFAULT_START_DATE = new Date(
  DEFAULT_END_DATE.getTime() - 12 * 60 * 60 * 1000,
);

export function getDefaultDateRange(): { start: Date; end: Date } {
  return {
    start: DEFAULT_START_DATE,
    end: DEFAULT_END_DATE,
  };
}
