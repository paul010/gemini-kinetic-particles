// AI Coding Arsenal — shared types for the static data model.

export type ReproStatus =
  | 'unverified'
  | 'readme_checked'
  | 'reproduced'
  | 'deployed'
  | 'video_ready'
  | 'tutorial_ready';

export interface Source {
  id: string;
  type: 'github' | 'article' | 'tweet' | 'video' | 'site';
  title: string;
  url: string;
  author: string;
  capturedAt: string;
  credibility: 'high' | 'medium' | 'low';
  notes?: string;
}

export interface Skill {
  id: string;
  name: string;
  category: string;
  summary: string;
  whatItDoes: string;
  bestFor: string[];
  setupLevel: 'easy' | 'medium' | 'hard';
  pairsWellWith: string[];
  officialUrl: string;
  localSkillName?: string;
  status: 'available' | 'experimental' | 'planned';
  beginnerFriendly: boolean;
  risk?: string;
}

export interface Recipe {
  id: string;
  name: string;
  goal: string;
  skillIds: string[];
  projectIds?: string[];
  steps: string[];
  promptTemplate: string;
  difficulty: 'easy' | 'medium' | 'hard';
  expectedOutput: string;
  acceptanceCriteria: string[];
}

export interface Project {
  id: string;
  title: string;
  summary: string;
  whyItMatters: string;
  sourceIds: string[];
  sourceUrl: string;
  sourceType: Source['type'];
  category: string[]; // play | use | content | engineering | agent ...
  tags: string[];
  difficulty: number; // 1-5
  estimatedTime: string;
  audience: string[];
  mvp: string;
  status: ReproStatus;
  recommendedSkillIds: string[];
  recommendedRecipeIds: string[];
  contentValueScore: number; // 1-5
  daleiTake?: string;
  // Project checkup (体检) fields
  verdict: 'worth' | 'cautious' | 'skip';
  reason: string;
  prepItems: string[];
  risks: string[];
  nextStep: string;
}

export interface ContentOutput {
  id: string;
  projectId: string;
  shortVideoTitle: string;
  xThreadAngle: string;
  linkedinAngle: string;
  zsxqPostTitle: string;
  wechatAngle: string;
  demoShots: string[];
  status: 'draft' | 'ready' | 'published';
}
