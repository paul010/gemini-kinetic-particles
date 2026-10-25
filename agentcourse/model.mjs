export const stageNames = ['看成果', '拆思路', '搭结构', '跟着做', '测结果', '交作业'];
export const storageKey = 'dalei-agent-course-v1';

export function readPosition(search = '') {
  const q = new URLSearchParams(search);
  const bounded = (value, max) => Math.min(max, Math.max(0, Number.parseInt(value, 10) - 1 || 0));
  return { lesson: bounded(q.get('lesson'), 4), step: bounded(q.get('step'), 5), present: q.get('present') === '1' };
}
export function nextPosition(lesson, step, direction) {
  const index = Math.min(29, Math.max(0, lesson * 6 + step + direction));
  return { lesson: Math.floor(index / 6), step: index % 6 };
}
export function safeChecks(value, validIds) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter(([key, checked]) => validIds.includes(key) && checked === true));
}
export function seconds(time) {
  return time.split(':').reduce((n, part) => n * 60 + Number(part), 0);
}
export function filterReplay(rows, mode) {
  const baseline = '2026-10-23';
  return rows.filter(row => ['Open','Pending','InProgress'].includes(row.Status) && /^\d{4}-\d{2}-\d{2}$/.test(row.NeededBy) && (mode === 'today' ? row.NeededBy === baseline : row.NeededBy <= baseline));
}
