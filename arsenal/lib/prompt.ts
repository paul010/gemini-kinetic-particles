import type { Project, Skill, Recipe } from '../types';

/** Build the "kick-off" prompt a user can paste into Codex / Claude Code. */
export function buildPrompt(project: Project, skills: Skill[], recipes: Recipe[]): string {
  const skillLines = skills.length
    ? skills.map((s) => `- ${s.name}（${s.summary}）`).join('\n')
    : '- 根据项目实际需要自行选择合适的 Skill';

  const criteria = recipes[0]?.acceptanceCriteria ?? [
    '能跑出一个可展示的 demo',
    '关键流程可用、无明显报错',
    '说明清楚如何运行',
  ];
  const criteriaLines = criteria.map((c) => `- ${c}`).join('\n');

  return `你是 Codex / Claude Code，请帮我复现这个项目。

项目名称：${project.title}
项目链接：${project.sourceUrl}
项目方向：${project.category.join(' / ')}
我想先做出的效果：${project.mvp}

请先不要急着写代码，先做一次项目体检：
1. 阅读 README、安装说明、示例和依赖文件。
2. 判断这个项目对新手是否值得做。
3. 找出可能卡住的地方，例如 API Key、Docker、数据库、模型、硬件、浏览器权限或网络问题。
4. 如果适合继续，请用最短路径帮我跑通一个可展示 demo。
5. 如果原项目太复杂，请抽取最有趣/最实用的核心体验，做一个轻量可运行版本。
6. 遇到报错时，请先定位原因，再给出修复方案，不要盲目重装。

建议使用这些 Skill / 工具：
${skillLines}

验收标准：
${criteriaLines}`;
}
