import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';

const OFFICIAL_REPO = 'https://github.com/microsoft/cat-agent-skills';
const args = process.argv.slice(2);
const sourceArgIndex = args.indexOf('--source');
let sourceRoot = sourceArgIndex >= 0 ? resolve(args[sourceArgIndex + 1]) : '';
let temporarySource = '';

if (!sourceRoot) {
  temporarySource = mkdtempSync(join(tmpdir(), 'cat-agent-skills-'));
  execFileSync('git', ['clone', '--depth', '1', `${OFFICIAL_REPO}.git`, temporarySource], { stdio: 'inherit' });
  sourceRoot = temporarySource;
}

const contentRoot = join(sourceRoot, 'src', 'content', 'skills');
const submissionsRoot = join(sourceRoot, 'submissions');
const bundlesRoot = join(sourceRoot, 'public', 'bundles');
const outputRoot = resolve('public', 'cat-skills-data');
const outputMarkdown = join(outputRoot, 'markdown');
const outputFiles = join(outputRoot, 'files');
const outputBundles = join(outputRoot, 'bundles');
const outputData = resolve('catskills', 'data');

if (!existsSync(contentRoot)) {
  throw new Error(`CAT content directory not found: ${contentRoot}`);
}

rmSync(outputRoot, { recursive: true, force: true });
mkdirSync(outputMarkdown, { recursive: true });
mkdirSync(outputFiles, { recursive: true });
mkdirSync(outputBundles, { recursive: true });
mkdirSync(outputData, { recursive: true });

const stripQuotes = (value) => {
  const trimmed = value.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    try { return JSON.parse(trimmed); } catch { return trimmed.slice(1, -1); }
  }
  return trimmed;
};

const parseArray = (value) => value
  .replace(/^\[/, '')
  .replace(/\]$/, '')
  .split(',')
  .map((part) => stripQuotes(part))
  .filter(Boolean);

const parseFrontmatter = (markdown) => {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!match) throw new Error('Missing frontmatter');
  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    const separator = line.indexOf(':');
    if (separator < 0) continue;
    const key = line.slice(0, separator).trim();
    const raw = line.slice(separator + 1).trim();
    data[key] = raw.startsWith('[') ? parseArray(raw) : stripQuotes(raw);
  }
  return data;
};

const cleanMetadataText = (value = '') => String(value).replace(/\s+/g, ' ').trim();
const sourceCommit = execFileSync('git', ['-C', sourceRoot, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const sourceCommitDate = execFileSync('git', ['-C', sourceRoot, 'show', '-s', '--format=%cI', 'HEAD'], { encoding: 'utf8' }).trim();
const generatedAt = new Date().toISOString();
const downloadCountsPath = join(sourceRoot, 'src', 'data', 'downloads.json');
const downloadCounts = existsSync(downloadCountsPath) ? JSON.parse(readFileSync(downloadCountsPath, 'utf8')) : {};

const records = readdirSync(contentRoot)
  .filter((file) => file.endsWith('.md'))
  .map((file) => {
    const slug = basename(file, '.md');
    const sourceMarkdown = join(contentRoot, file);
    const markdown = readFileSync(sourceMarkdown, 'utf8');
    const meta = parseFrontmatter(markdown);
    const type = meta.type || 'skill';
    const bundleName = meta.bundle ? basename(meta.bundle) : '';
    const submissionRoot = join(submissionsRoot, slug);
    const skillFile = join(submissionRoot, 'SKILL.md');
    const localMarkdownUrl = `/cat-skills-data/markdown/${slug}.md`;

    copyFileSync(sourceMarkdown, join(outputMarkdown, `${slug}.md`));

    let downloadUrl = '';
    let downloadName = '';
    let downloadSize = 0;

    if (bundleName && existsSync(join(bundlesRoot, bundleName))) {
      const sourceBundle = join(bundlesRoot, bundleName);
      copyFileSync(sourceBundle, join(outputBundles, bundleName));
      downloadUrl = `/cat-skills-data/bundles/${bundleName}`;
      downloadName = bundleName;
      downloadSize = statSync(sourceBundle).size;
    } else if (existsSync(skillFile)) {
      const targetFolder = join(outputFiles, slug);
      mkdirSync(targetFolder, { recursive: true });
      copyFileSync(skillFile, join(targetFolder, 'SKILL.md'));
      downloadUrl = `/cat-skills-data/files/${slug}/SKILL.md`;
      downloadName = 'SKILL.md';
      downloadSize = statSync(skillFile).size;
    }

    return {
      slug,
      name: cleanMetadataText(meta.name || slug),
      description: cleanMetadataText(meta.description || ''),
      platforms: Array.isArray(meta.platforms) ? meta.platforms : [],
      type,
      tags: Array.isArray(meta.tags) ? meta.tags : [],
      author: cleanMetadataText(meta.author || 'Community contributor'),
      authorUrl: meta.authorUrl || '',
      version: meta.version || '',
      createdAt: meta.createdAt || '',
      updatedAt: meta.updatedAt || meta.createdAt || '',
      downloadUrl,
      downloadName,
      downloadSize,
      recordedDownloads: Number(downloadCounts[slug] || 0),
      markdownUrl: localMarkdownUrl,
      officialUrl: `https://microsoft.github.io/cat-agent-skills/skills/${slug}/`,
      sourceUrl: `${OFFICIAL_REPO}/tree/${sourceCommit}/submissions/${slug}`,
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name, 'en'));

const catalogMeta = {
  source: OFFICIAL_REPO,
  sourceCommit,
  sourceCommitDate,
  generatedAt,
  license: 'MIT',
  total: records.length,
};

const catalogTs = `// Generated by scripts/sync-cat-agent-skills.mjs. Do not edit by hand.\n` +
  `export const CAT_CATALOG_META = ${JSON.stringify(catalogMeta, null, 2)} as const;\n\n` +
  `export const CAT_SKILLS = ${JSON.stringify(records, null, 2)} as const;\n\n` +
  `export type CatSkillRecord = (typeof CAT_SKILLS)[number];\n`;

writeFileSync(join(outputData, 'catalog.ts'), catalogTs);
writeFileSync(join(outputRoot, 'catalog.json'), `${JSON.stringify({ meta: catalogMeta, items: records }, null, 2)}\n`);
copyFileSync(join(sourceRoot, 'LICENSE'), join(outputRoot, 'LICENSE'));
writeFileSync(join(outputRoot, 'SOURCE.json'), `${JSON.stringify(catalogMeta, null, 2)}\n`);

const notice = `# Third-party notice\n\nThe files in this directory were synchronized from ${OFFICIAL_REPO} at commit ${sourceCommit}.\n\nThe upstream project is licensed under the MIT License. See LICENSE in this directory. Individual submissions retain their contributor attribution in the generated catalog and source files. Review every Skill, Plugin, or Automation before installing it because it may run with your agent's permissions.\n`;
writeFileSync(join(outputRoot, 'NOTICE.md'), notice);

console.log(JSON.stringify({
  total: records.length,
  skills: records.filter((item) => item.type === 'skill').length,
  plugins: records.filter((item) => item.type === 'plugin').length,
  automations: records.filter((item) => item.type === 'automation').length,
  downloads: records.filter((item) => item.downloadUrl).length,
  sourceCommit,
  outputRoot,
}, null, 2));

if (temporarySource) rmSync(temporarySource, { recursive: true, force: true });
