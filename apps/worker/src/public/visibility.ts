function normalizeMonitorIds(monitorIds: number[]): number[] {
  return [...new Set(monitorIds.filter((id) => Number.isInteger(id) && id > 0))];
}

export function monitorVisibilityPredicate(includeHiddenMonitors: boolean, alias?: string): string {
  const column = alias ? `${alias}.show_on_status_page` : 'show_on_status_page';
  return includeHiddenMonitors ? '1 = 1' : `${column} = 1`;
}

export async function listStatusPageVisibleMonitorIds(
  db: D1Database,
  monitorIds: number[],
): Promise<Set<number>> {
  const ids = normalizeMonitorIds(monitorIds);
  if (ids.length === 0) return new Set();

  const placeholders = ids.map((_, idx) => `?${idx + 1}`).join(', ');
  const { results } = await db
    .prepare(
      `
        SELECT id
        FROM monitors
        WHERE id IN (${placeholders})
          AND show_on_status_page = 1
      `,
    )
    .bind(...ids)
    .all<{ id: number }>();

  return new Set((results ?? []).map((row) => row.id));
}

export function filterStatusPageScopedMonitorIds(
  monitorIds: number[],
  visibleMonitorIds: Set<number>,
  includeHiddenMonitors: boolean,
): number[] {
  return includeHiddenMonitors ? monitorIds : monitorIds.filter((id) => visibleMonitorIds.has(id));
}

export function shouldIncludeStatusPageScopedItem(
  originalMonitorIds: number[],
  visibleMonitorIds: number[],
): boolean {
  return originalMonitorIds.length === 0 || visibleMonitorIds.length > 0;
}
