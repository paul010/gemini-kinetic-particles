// Prints the next pending roadmap item for the daily project task.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const read = (p) => JSON.parse(readFileSync(join(here, '..', p), 'utf8'));

const roadmap = read('roadmap.json');
const projects = read('data/projects.json');
const byId = new Map(projects.map((p) => [p.id, p]));

const counts = roadmap.queue.reduce((m, q) => ((m[q.status] = (m[q.status] || 0) + 1), m), {});
const next = roadmap.queue.find((q) => q.status === 'pending');

console.log('Roadmap:', Object.entries(counts).map(([k, v]) => `${k}=${v}`).join('  '));
if (!next) {
  console.log('\n🎉 队列已清空，没有 pending 项目了。');
  process.exit(0);
}
const p = byId.get(next.projectId);
console.log(`\n下一个 (#${next.order})  ${next.projectId}`);
console.log(`  标题   ${p ? p.title : '(未在 projects.json 找到)'}`);
console.log(`  plan   ${next.plan}`);
console.log(`  难度   ${p ? p.difficulty + '/5' : '?'}   预计 ${p ? p.estimatedTime : '?'}`);
console.log(`  来源   ${p ? p.sourceUrl : '?'}`);
console.log(`  备注   ${next.note || ''}`);
console.log('\n开工：把 arsenal/DAILY_PLAYBOOK.md 里的「开工指令」粘贴给 Claude Code。');
