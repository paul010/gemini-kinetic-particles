import type { Project, Skill, Recipe } from '../types';

const MAX_SKILLS = 6;

// Tag → skill-id rules (first-version rule engine, no AI).
const TAG_RULES: { match: string[]; skills: string[] }[] = [
  { match: ['frontend', 'dashboard', 'form', 'tool'], skills: ['shadcn-ui', 'playwright', 'vercel'] },
  { match: ['3d', 'three', 'webgl'], skills: ['react-three-fiber', 'threejs', 'screenshot-review'] },
  { match: ['document', 'pdf', 'markdown', 'rag'], skills: ['document-skills', 'markitdown', 'pdf-extract'] },
  { match: ['video', 'cover', 'image', 'subtitle'], skills: ['canva', 'imagegen', 'video-workflow'] },
  { match: ['agent', 'llm', 'memory'], skills: ['llm-docs', 'memory', 'browser-automation'] },
  { match: ['automation', 'workflow', 'browser', 'qa'], skills: ['browser-automation', 'playwright', 'inngest'] },
  { match: ['content', 'wechat'], skills: ['markitdown', 'canva', 'video-workflow'] },
];

/**
 * Skills recommended for a project. Manual overrides (recommendedSkillIds) win
 * and come first; rule-based matches by tag fill the rest. Capped at MAX_SKILLS.
 */
export function recommendSkills(project: Project, skills: Skill[]): Skill[] {
  const byId = new Map(skills.map((s) => [s.id, s]));
  const ordered: string[] = [];
  const add = (id: string) => {
    if (id && byId.has(id) && !ordered.includes(id)) ordered.push(id);
  };

  // 1) manual overrides first
  project.recommendedSkillIds.forEach(add);

  // 2) tag rules
  const tags = project.tags.map((t) => t.toLowerCase());
  for (const rule of TAG_RULES) {
    if (rule.match.some((m) => tags.includes(m))) rule.skills.forEach(add);
  }

  // 3) github projects always get the CLI
  if (project.sourceType === 'github') add('github-cli');

  return ordered.slice(0, MAX_SKILLS).map((id) => byId.get(id)!);
}

/** Recipes recommended for a project: explicit ids + recipes that list it. */
export function recommendRecipes(project: Project, recipes: Recipe[]): Recipe[] {
  const out: Recipe[] = [];
  const seen = new Set<string>();
  const push = (r?: Recipe) => {
    if (r && !seen.has(r.id)) {
      seen.add(r.id);
      out.push(r);
    }
  };
  project.recommendedRecipeIds.forEach((id) => push(recipes.find((r) => r.id === id)));
  recipes.forEach((r) => {
    if (r.projectIds?.includes(project.id)) push(r);
  });
  return out;
}

/** Projects that a given skill pairs well with (uses the full recommendation). */
export function projectsForSkill(skillId: string, projects: Project[], allSkills: Skill[]): Project[] {
  return projects.filter((p) => recommendSkills(p, allSkills).some((s) => s.id === skillId));
}
