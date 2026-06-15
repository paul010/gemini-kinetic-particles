import type { Project } from '../types';

export interface Checkup {
  verdict: Project['verdict'];
  verdictLabel: string;
  reason: string;
  difficulty: number;
  estimatedTime: string;
  mvp: string;
  prepItems: string[];
  risks: string[];
  nextStep: string;
}

const VERDICT_LABEL: Record<Project['verdict'], string> = {
  worth: '值得做',
  cautious: '谨慎做',
  skip: '暂不做',
};

export const verdictLabel = (v: Project['verdict']) => VERDICT_LABEL[v];

/** The project checkup (体检) — derived from the project's stored fields. */
export function getCheckup(project: Project): Checkup {
  return {
    verdict: project.verdict,
    verdictLabel: VERDICT_LABEL[project.verdict],
    reason: project.reason,
    difficulty: project.difficulty,
    estimatedTime: project.estimatedTime,
    mvp: project.mvp,
    prepItems: project.prepItems,
    risks: project.risks,
    nextStep: project.nextStep,
  };
}
