import React, { useEffect, useMemo, useState } from 'react';

/* ---------------------------------------------------------------------------
 * /skills — 大雷's Skill Library. Modular capabilities you add to an agent
 * (each backed by a provider/API), grouped by domain. Companion to /agents:
 * agents are the persona, skills are the powers. Inspired by chorus.com/skills,
 * built native + i18n. Each card carries a copyable "skill brief".
 * ------------------------------------------------------------------------- */

type Lang = 'en' | 'zh' | 'zhHant';
interface LocalizedText { en: string; zh: string }

const STORAGE_KEY = 'dalei-lang-v2';
const detectInitialLang = (): Lang => {
  if (typeof window === 'undefined') return 'en';
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return saved === 'zh' || saved === 'zhHant' ? saved : 'en';
};

let _s2t: ((s: string) => string) | null = null;
const useS2T = (active: boolean) => {
  const [conv, setConv] = useState<((s: string) => string) | null>(() => _s2t);
  useEffect(() => {
    if (!active || _s2t) { if (_s2t && !conv) setConv(() => _s2t); return; }
    let alive = true;
    import('opencc-js').then((m) => { _s2t = (m as any).Converter({ from: 'cn', to: 'tw' }); if (alive) setConv(() => _s2t); }).catch(() => {});
    return () => { alive = false; };
  }, [active, conv]);
  return conv;
};

type DomainKey = 'media' | 'research' | 'data' | 'commerce' | 'dev';
const DOMAINS: { key: DomainKey; label: LocalizedText }[] = [
  { key: 'media', label: { en: 'Media & Creation', zh: '媒体创作' } },
  { key: 'research', label: { en: 'Research & Web', zh: '研究检索' } },
  { key: 'data', label: { en: 'Data & Places', zh: '数据与地点' } },
  { key: 'commerce', label: { en: 'Commerce & Travel', zh: '电商出行' } },
  { key: 'dev', label: { en: 'Dev & Productivity', zh: '开发与效率' } },
];
const domainLabel = (k: DomainKey) => DOMAINS.find((d) => d.key === k)!.label;

interface Skill {
  id: string;
  emoji: string;
  domain: DomainKey;
  title: LocalizedText;
  oneLiner: LocalizedText;
  providers: string[];
  examples: LocalizedText[];
  brief: string; // English capability brief — paste into an agent's tool/skill definition
}

const SKILLS: Skill[] = [
  // ---- Media & Creation ----
  {
    id: 'yt-research', emoji: '🔎', domain: 'media', providers: ['SerpAPI', 'YouTube Data'],
    title: { en: 'YouTube Researcher', zh: 'YouTube 选题研究' },
    oneLiner: { en: 'Pulls transcripts + metadata into a research brief before you script.', zh: '抓取字幕与元数据，写脚本前先给一份选题研究简报。' },
    examples: [{ en: 'Research brief on “AI agents”, last 30 days', zh: '近 30 天「AI Agent」选题简报' }, { en: 'What angles are competitors missing?', zh: '竞品还没讲到的角度有哪些？' }],
    brief: 'Given a topic or channel, pull video transcripts and metadata and return a research brief: top videos, common angles, content gaps, and 5 fresh title ideas. Use before scripting a new video.',
  },
  {
    id: 'thumbnail', emoji: '🖼️', domain: 'media', providers: ['Gemini Image', 'DALL·E'],
    title: { en: 'Thumbnail Designer', zh: '封面设计' },
    oneLiner: { en: 'Generates thumbnail options from a title + hook.', zh: '从标题和钩子生成多个封面方案。' },
    examples: [{ en: 'Thumbnails for “一句话生成游戏”', zh: '为「一句话生成游戏」做封面' }, { en: 'High-contrast, shocked-face option', zh: '高对比 + 惊讶表情版' }],
    brief: 'Generate 3–4 thumbnail design options from a video title and hook. Return image-generation prompts plus composition notes (face, big bold text, high contrast).',
  },
  {
    id: 'tts', emoji: '🔊', domain: 'media', providers: ['ElevenLabs'],
    title: { en: 'Text-to-Speech', zh: '文字转语音' },
    oneLiner: { en: 'Natural voiceover in many voices, pace and emotion.', zh: '多音色、可调语速情绪的自然配音。' },
    examples: [{ en: 'Read this intro, energetic male voice', zh: '用有活力的男声读这段开场' }, { en: 'Calm narration for a 60s explainer', zh: '60 秒讲解的平稳旁白' }],
    brief: 'Convert a script into natural voiceover audio; choose voice, pace and emotion. Use for narration, shorts, and audio versions of articles.',
  },
  {
    id: 'video-gen', emoji: '🎬', domain: 'media', providers: ['Google Veo', 'Runway'],
    title: { en: 'Video Generation', zh: '视频生成' },
    oneLiner: { en: 'Short b-roll or clips from a text prompt (+ optional image).', zh: '从文字（可选参考图）生成短片 / B-roll。' },
    examples: [{ en: '5s shot of particles forming a hand', zh: '5 秒：粒子聚成一只手' }, { en: 'Cinematic server-room b-roll', zh: '电影感机房 B-roll' }],
    brief: 'Generate short b-roll or clips from a text prompt (and optional reference image). Use for openers, transitions and concept shots.',
  },
  {
    id: 'diagram', emoji: '✏️', domain: 'media', providers: ['Mermaid', 'Excalidraw'],
    title: { en: 'Diagram Maker', zh: '图表生成' },
    oneLiner: { en: 'Turns an idea or process into an editable diagram.', zh: '把想法或流程变成可编辑的图表。' },
    examples: [{ en: 'Flowchart: agent → skill → tool', zh: '流程图：agent → skill → tool' }, { en: 'Sequence diagram for OAuth login', zh: 'OAuth 登录时序图' }],
    brief: 'Turn an idea or process into an editable diagram (flow, architecture, sequence). Output Mermaid or Excalidraw the user can tweak.',
  },
  // ---- Research & Web ----
  {
    id: 'web-search', emoji: '🌐', domain: 'research', providers: ['Tavily', 'Brave', 'SerpAPI'],
    title: { en: 'Web Search', zh: '联网搜索' },
    oneLiner: { en: 'Fresh, ranked results with snippets and citable links.', zh: '最新、可引用的检索结果与链接。' },
    examples: [{ en: 'Latest on Microsoft Foundry pricing', zh: 'Microsoft Foundry 最新定价' }, { en: 'Who shipped an agent framework this week?', zh: '本周谁发了 agent 框架？' }],
    brief: 'Fetch fresh, ranked web results with snippets and links for a query. Use to ground answers in current information and to cite sources.',
  },
  {
    id: 'reader', emoji: '📄', domain: 'research', providers: ['Jina Reader', 'Firecrawl'],
    title: { en: 'Webpage Reader', zh: '网页阅读器' },
    oneLiner: { en: 'Fetches a URL and returns clean markdown (no nav/ads).', zh: '抓取网址，返回干净的 Markdown（去导航/广告）。' },
    examples: [{ en: 'Summarize this release-notes URL', zh: '总结这条更新日志链接' }, { en: 'Extract the pricing table from this page', zh: '提取该页的价格表' }],
    brief: 'Fetch a URL and return clean, readable markdown (stripping nav and ads). Use to read articles, docs and changelogs the model cannot access directly.',
  },
  {
    id: 'papers', emoji: '📚', domain: 'research', providers: ['Semantic Scholar', 'arXiv'],
    title: { en: 'Academic Search', zh: '论文检索' },
    oneLiner: { en: 'Papers by topic — abstracts, citations, links.', zh: '按主题找论文 —— 摘要、引用数、链接。' },
    examples: [{ en: 'Papers on LLM model orchestration', zh: '关于 LLM 模型编排的论文' }, { en: 'Most-cited CMA-ES work, 2024+', zh: '2024 年起引用最高的 CMA-ES 工作' }],
    brief: 'Search papers by topic; return titles, abstracts, citation counts and links. Use to ground a research piece or trace a method’s origin.',
  },
  // ---- Data & Places ----
  {
    id: 'stocks', emoji: '📈', domain: 'data', providers: ['Alpha Vantage', 'Finnhub'],
    title: { en: 'Market Data', zh: '行情数据' },
    oneLiner: { en: 'Live quotes and historical prices for a ticker.', zh: '股票实时报价与历史价格。' },
    examples: [{ en: 'MSFT price + 6-month chart data', zh: 'MSFT 价格 + 6 个月走势数据' }, { en: 'Compare NVDA vs AMD YTD', zh: '对比 NVDA 与 AMD 年初至今' }],
    brief: 'Get live quotes and historical prices for a ticker, plus basic indicators. Use for finance commentary or a market dashboard.',
  },
  {
    id: 'weather', emoji: '☀️', domain: 'data', providers: ['OpenWeather'],
    title: { en: 'Weather', zh: '天气' },
    oneLiner: { en: 'Current conditions and forecast for any place.', zh: '任意地点的实时天气与预报。' },
    examples: [{ en: '5-day forecast for Tokyo', zh: '东京 5 天预报' }, { en: 'Will it rain in Shenzhen tomorrow?', zh: '深圳明天会下雨吗？' }],
    brief: 'Get current conditions and a forecast for a place. Use for travel planning, event scheduling, or location-aware replies.',
  },
  {
    id: 'maps', emoji: '🗺️', domain: 'data', providers: ['Google Maps'],
    title: { en: 'Maps & Places', zh: '地图与地点' },
    oneLiner: { en: 'Geocode, directions, and nearby places with ratings.', zh: '地理编码、导航、附近地点与评分。' },
    examples: [{ en: 'Coffee near this address, open now', zh: '这个地址附近、现在营业的咖啡' }, { en: 'Driving time airport → downtown', zh: '机场到市区的车程' }],
    brief: 'Geocode addresses, get directions, and look up nearby places with ratings. Use for travel, logistics and local recommendations.',
  },
  // ---- Commerce & Travel ----
  {
    id: 'travel', emoji: '✈️', domain: 'commerce', providers: ['SerpAPI', 'Amadeus'],
    title: { en: 'Flights & Hotels', zh: '机票与酒店' },
    oneLiner: { en: 'Search flights & hotels — prices, schedules, reviews.', zh: '搜机票酒店 —— 价格、时刻、评价。' },
    examples: [{ en: 'Cheapest SFO→NRT next month', zh: '下月最便宜的 SFO→NRT' }, { en: '4-star near Shibuya under ¥30k', zh: '涩谷附近 ¥3 万内四星' }],
    brief: 'Search flights and hotels with prices, schedules and reviews. Use for trip planning and budget comparison.',
  },
  {
    id: 'price', emoji: '🛒', domain: 'commerce', providers: ['SerpAPI Shopping'],
    title: { en: 'Price Comparison', zh: '比价' },
    oneLiner: { en: 'Compare a product’s price across retailers; track stock.', zh: '跨平台比价、查库存。' },
    examples: [{ en: 'Best price for Sony WH-1000XM6', zh: 'Sony WH-1000XM6 最低价' }, { en: 'Where’s the RTX 5080 in stock?', zh: 'RTX 5080 哪里有货？' }],
    brief: 'Compare a product’s price across retailers and track availability. Use for buying decisions and deal-hunting.',
  },
  // ---- Dev & Productivity ----
  {
    id: 'code', emoji: '🧮', domain: 'dev', providers: ['Sandbox'],
    title: { en: 'Code Interpreter', zh: '代码执行' },
    oneLiner: { en: 'Runs Python for math, data wrangling and charts.', zh: '跑 Python 做计算、数据处理与画图。' },
    examples: [{ en: 'Plot this CSV’s monthly trend', zh: '画出这个 CSV 的月度趋势' }, { en: 'Solve and verify this optimization', zh: '求解并验证这个优化问题' }],
    brief: 'Run Python in a sandbox for math, data wrangling and charts; return results and plots. Use for analysis you want computed, not guessed.',
  },
  {
    id: 'sql', emoji: '🗄️', domain: 'dev', providers: ['Postgres', 'MySQL'],
    title: { en: 'SQL / DB Query', zh: 'SQL 数据库查询' },
    oneLiner: { en: 'Natural language → read-only SQL over your schema.', zh: '自然语言 → 只读 SQL，查你的库。' },
    examples: [{ en: 'Top 10 customers by revenue this quarter', zh: '本季度营收前 10 客户' }, { en: 'DAU trend for the last 30 days', zh: '近 30 天 DAU 趋势' }],
    brief: 'Translate a natural-language question into SQL over the user’s schema, run it read-only, and explain the result. Use for self-serve analytics.',
  },
  {
    id: 'mailcal', emoji: '📧', domain: 'dev', providers: ['Gmail', 'Google Calendar'],
    title: { en: 'Email & Calendar', zh: '邮件与日历' },
    oneLiner: { en: 'Draft mail and schedule events — always for approval first.', zh: '起草邮件、安排日程 —— 先给你确认再执行。' },
    examples: [{ en: 'Draft a reply declining this meeting', zh: '起草一封婉拒这个会的回复' }, { en: 'Find 30 min with Alex next week', zh: '下周和 Alex 约 30 分钟' }],
    brief: 'Draft emails and schedule events from natural language; always return a draft for approval before sending. Use as a scheduling / inbox assistant.',
  },
  // ---- more Media & Creation ----
  {
    id: 'image-gen', emoji: '🎨', domain: 'media', providers: ['Flux', 'SDXL', 'Gemini Image'],
    title: { en: 'Image Generation', zh: '图像生成' },
    oneLiner: { en: 'Generate or edit images from a text prompt.', zh: '从文字生成或编辑图像。' },
    examples: [{ en: 'A warm, editorial hero illustration', zh: '暖色编辑风的 hero 插画' }, { en: 'Remove the background, keep the subject', zh: '抠掉背景、保留主体' }],
    brief: 'Generate or edit images from a text prompt (and optional reference). Return the image plus the final prompt used. Use for hero art, illustrations and mockups.',
  },
  {
    id: 'stt', emoji: '🎙️', domain: 'media', providers: ['Whisper', 'Deepgram'],
    title: { en: 'Speech-to-Text', zh: '语音转文字' },
    oneLiner: { en: 'Transcribe audio/video with timestamps and speakers.', zh: '把音视频转成带时间戳、分说话人的文字。' },
    examples: [{ en: 'Transcribe this interview, by speaker', zh: '按说话人转写这段访谈' }, { en: 'Make captions for a 10-min video', zh: '为 10 分钟视频生成字幕' }],
    brief: 'Transcribe audio or video to text with timestamps and speaker labels. Use for subtitles, meeting notes, and turning recordings into searchable text.',
  },
  {
    id: 'ocr', emoji: '🔡', domain: 'media', providers: ['Google Vision', 'Tesseract'],
    title: { en: 'OCR', zh: '图片识字 OCR' },
    oneLiner: { en: 'Extract text from images, screenshots and scans.', zh: '从图片、截图、扫描件提取文字。' },
    examples: [{ en: 'Pull the text from this screenshot', zh: '提取这张截图里的文字' }, { en: 'Digitize a scanned receipt', zh: '把扫描小票数字化' }],
    brief: 'Extract text (and layout) from images, screenshots, scans and PDFs. Use to digitize documents or read text the model can’t see directly.',
  },
  // ---- more Research & Web ----
  {
    id: 'doc-parse', emoji: '🧾', domain: 'research', providers: ['LlamaParse', 'Unstructured'],
    title: { en: 'Document Parser', zh: '文档解析' },
    oneLiner: { en: 'Turn PDFs/Docx/slides into clean structured text.', zh: '把 PDF/Word/PPT 解析成干净的结构化文本。' },
    examples: [{ en: 'Extract tables from this PDF report', zh: '提取这份 PDF 报告里的表格' }, { en: 'Chunk a contract for Q&A', zh: '把合同切块用于问答' }],
    brief: 'Parse PDFs, Word, slides and spreadsheets into clean structured text (with tables and headings preserved). Use as the front-end for RAG or document Q&A.',
  },
  {
    id: 'translate', emoji: '🌍', domain: 'research', providers: ['DeepL'],
    title: { en: 'Translation', zh: '翻译' },
    oneLiner: { en: 'High-quality translation that keeps tone and formatting.', zh: '保留语气与排版的高质量翻译。' },
    examples: [{ en: 'EN → 简/繁, keep markdown', zh: '英译简/繁，保留 markdown' }, { en: 'Localize this UI string set', zh: '本地化这组 UI 文案' }],
    brief: 'Translate text between languages while preserving tone, terminology and formatting. Use for localization, subtitles, and cross-language research.',
  },
  {
    id: 'news', emoji: '📰', domain: 'research', providers: ['NewsAPI', 'GDELT'],
    title: { en: 'News Feed', zh: '新闻聚合' },
    oneLiner: { en: 'Recent articles on a topic, deduped and dated.', zh: '某主题的最新文章，去重并标注时间。' },
    examples: [{ en: 'Top AI news in the last 24h', zh: '近 24 小时 AI 头条' }, { en: 'Track mentions of a company', zh: '追踪某公司被提及' }],
    brief: 'Pull recent news articles on a topic or entity, deduplicated and dated, with sources. Use for daily briefings and trend monitoring.',
  },
  // ---- more Dev & Productivity ----
  {
    id: 'github', emoji: '🐙', domain: 'dev', providers: ['GitHub API'],
    title: { en: 'GitHub', zh: 'GitHub' },
    oneLiner: { en: 'Read/manage repos, issues, PRs and CI.', zh: '读取/管理仓库、issue、PR 与 CI。' },
    examples: [{ en: 'Summarize this PR diff', zh: '总结这条 PR diff' }, { en: 'Open an issue from a bug report', zh: '把 bug 反馈开成 issue' }],
    brief: 'Read and manage GitHub repos, issues, pull requests, files and CI status. Use to triage, summarize diffs, or automate repo chores (with review before writes).',
  },
  {
    id: 'slack', emoji: '💬', domain: 'dev', providers: ['Slack API'],
    title: { en: 'Slack', zh: 'Slack' },
    oneLiner: { en: 'Read channels, post updates, summarize threads.', zh: '读频道、发更新、总结线程。' },
    examples: [{ en: 'Summarize #incidents today', zh: '总结今天的 #incidents' }, { en: 'Post the release notes to #eng', zh: '把发布说明发到 #eng' }],
    brief: 'Read Slack channels/threads, post messages, and summarize conversations. Use for stand-up digests, alerts and team updates (confirm before posting).',
  },
  {
    id: 'notion', emoji: '🗒️', domain: 'dev', providers: ['Notion API'],
    title: { en: 'Notion', zh: 'Notion' },
    oneLiner: { en: 'Query databases and create/update pages.', zh: '查询数据库、新建/更新页面。' },
    examples: [{ en: 'Add this lead to the CRM database', zh: '把这条线索写入 CRM 库' }, { en: 'Find notes tagged “agent”', zh: '找标了「agent」的笔记' }],
    brief: 'Query Notion databases and create or update pages with structured properties. Use as a knowledge base / lightweight CRM backend for an agent.',
  },
  {
    id: 'rag', emoji: '📌', domain: 'dev', providers: ['pgvector', 'Pinecone'],
    title: { en: 'Vector Search (RAG)', zh: '向量检索 (RAG)' },
    oneLiner: { en: 'Semantic search over your own documents.', zh: '在你自己的文档上做语义检索。' },
    examples: [{ en: 'Answer from our internal docs', zh: '基于内部文档作答' }, { en: 'Find the 5 most relevant chunks', zh: '找最相关的 5 个片段' }],
    brief: 'Embed and semantically search the user’s own documents, returning the most relevant chunks with sources. The retrieval half of a RAG pipeline; pair with Document Parser.',
  },
  {
    id: 'browser', emoji: '🕹️', domain: 'dev', providers: ['Playwright', 'Browserbase'],
    title: { en: 'Browser Automation', zh: '浏览器自动化' },
    oneLiner: { en: 'Drive a real browser to click, fill and extract.', zh: '驱动真实浏览器点击、填表、抓取。' },
    examples: [{ en: 'Log in and export a report', zh: '登录并导出一份报表' }, { en: 'Scrape a JS-rendered page', zh: '抓取 JS 渲染的页面' }],
    brief: 'Drive a headless browser to navigate, click, fill forms, and extract content from sites that need JS or login. Use when an API isn’t available; keep a human in the loop for actions.',
  },
];

interface Props { onHome: () => void }

const Skills: React.FC<Props> = ({ onHome }) => {
  const [lang, setLang] = useState<Lang>(detectInitialLang);
  const s2t = useS2T(lang === 'zhHant');
  const t = (txt: LocalizedText) => (lang === 'en' ? txt.en : lang === 'zhHant' ? (s2t ? s2t(txt.zh) : txt.zh) : txt.zh);
  useEffect(() => { if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, lang); }, [lang]);

  const [domain, setDomain] = useState<'all' | DomainKey>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const list = useMemo(() => (domain === 'all' ? SKILLS : SKILLS.filter((x) => x.domain === domain)), [domain]);

  const copy = (sk: Skill) => {
    navigator.clipboard?.writeText(sk.brief).then(() => {
      setCopiedId(sk.id);
      window.setTimeout(() => setCopiedId((c) => (c === sk.id ? null : c)), 1600);
    }).catch(() => {});
  };

  const LANGS: { code: Lang; label: string }[] = [
    { code: 'en', label: 'EN' }, { code: 'zh', label: '简' }, { code: 'zhHant', label: '繁' },
  ];

  return (
    <div className="min-h-screen bg-paper font-sans text-ink">
      <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <button onClick={onHome} className="font-mono text-xs text-ink/55 transition-colors hover:text-ink">← Da Lei · 大雷</button>
          <div className="flex items-center gap-3">
            <span className="hidden font-mono text-[11px] uppercase tracking-[0.2em] text-gold sm:inline">Skill Library</span>
            <div className="flex overflow-hidden rounded-full border border-ink/15">
              {LANGS.map((l) => (
                <button key={l.code} onClick={() => setLang(l.code)}
                  className={`px-2.5 py-1 font-mono text-[11px] transition-colors ${lang === l.code ? 'bg-ink text-paper' : 'text-ink/55 hover:text-ink'}`}>{l.label}</button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-ink/45">{t({ en: 'Skill library', zh: 'Skill 技能库' })}</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          {t({ en: 'Powers you can give your agent', zh: '给你的 Agent 加点技能' })}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink/65">
          {t({
            en: 'If agents are the persona, skills are the powers. Each is a modular capability — backed by a provider/API — you add to an agent so it can search, render, fetch, compute, or transact. Copy the skill brief into your agent’s tool definition. Pairs with the Agent Templates.',
            zh: '如果说 Agent 是「人设」，那 Skill 就是「能力」。每一个都是可插拔的能力（背后接一个服务/API），加到 Agent 上，它就能搜索、生成、抓取、计算或交易。把技能简介复制进 Agent 的工具定义即可。和 Agent 模板库配套使用。',
          })}
        </p>

        {/* domain filter */}
        <div className="mt-7 flex flex-wrap gap-2">
          <button onClick={() => setDomain('all')}
            className={`rounded-full border px-3.5 py-1.5 font-mono text-xs transition-colors ${domain === 'all' ? 'border-ink bg-ink text-paper' : 'border-ink/15 text-ink/60 hover:border-ink/40'}`}>
            {t({ en: 'All', zh: '全部' })}
          </button>
          {DOMAINS.map((d) => (
            <button key={d.key} onClick={() => setDomain(d.key)}
              className={`rounded-full border px-3.5 py-1.5 font-mono text-xs transition-colors ${domain === d.key ? 'border-ink bg-ink text-paper' : 'border-ink/15 text-ink/60 hover:border-ink/40'}`}>
              {t(d.label)}
            </button>
          ))}
        </div>

        {/* skill grid */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((sk) => (
            <article key={sk.id} className="flex flex-col rounded-2xl border border-ink/10 bg-surface/50 p-5 transition-colors hover:border-gold/40">
              <div className="flex items-center justify-between gap-2">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-ink/[0.04] text-xl">{sk.emoji}</span>
                <span className="rounded-full border border-ink/10 bg-ink/5 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ink/50">{t(domainLabel(sk.domain))}</span>
              </div>
              <h3 className="mt-3 font-display text-lg font-semibold tracking-tight">{t(sk.title)}</h3>
              <p className="mt-1.5 flex-1 text-sm leading-relaxed text-ink/60">{t(sk.oneLiner)}</p>

              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="font-mono text-[10px] uppercase tracking-wider text-ink/35">{t({ en: 'via', zh: '接入' })}</span>
                {sk.providers.map((pr) => (
                  <span key={pr} className="rounded-md border border-gold/25 bg-gold/[0.06] px-2 py-0.5 font-mono text-[11px] text-gold/90">{pr}</span>
                ))}
              </div>

              <ul className="mt-3 space-y-1 text-[13px] text-ink/55">
                {sk.examples.map((ex, i) => (
                  <li key={i} className="flex items-start gap-2"><span className="mt-0.5 text-gold">›</span> {t(ex)}</li>
                ))}
              </ul>

              <button onClick={() => copy(sk)}
                className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-full border border-ink/15 bg-paper px-3.5 py-1.5 font-mono text-xs text-ink/75 transition-colors hover:border-gold/50 hover:text-gold">
                {copiedId === sk.id ? t({ en: 'Copied ✓', zh: '已复制 ✓' }) : t({ en: 'Copy skill brief', zh: '复制技能简介' })}
              </button>
            </article>
          ))}
        </div>

        <p className="mt-10 text-xs leading-relaxed text-ink/45">
          {t({
            en: 'Skills by 大雷 — capability references, not turnkey installs. Each needs its provider/API and credentials wired up; keys live in your own environment, never here. Keep a human in the loop for anything that sends, books, or spends.',
            zh: '技能由大雷整理 —— 是能力参考，不是一键安装。每个都需要接好对应的服务/API 与凭证；密钥放在你自己的环境里，不在本站。凡是会「发送 / 预订 / 花钱」的动作请保留人工确认。',
          })}
        </p>
      </main>
    </div>
  );
};

export default Skills;
