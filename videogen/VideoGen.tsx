import React, { useEffect, useState } from 'react';

/* ---------------------------------------------------------------------------
 * /videogen — a curated field note on Kiana Liang (@Kiana_Liang0609)'s AI video
 * workflow: "3 models, 1 API key". A fake 2026 World Cup highlight reel made
 * with GPT Image 2 (storyboard) → Seedance 2.0 (image-to-video), plus Nano
 * Banana 2 for keyframes — all through one Atlas Cloud key, automated as a
 * Claude Code "drama-director" skill. This is my bilingual summary; the real
 * video, prompts and code are Kiana's — links up top and in the footer.
 * Native + bilingual (繁 on the fly).
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

const TWEET = 'https://x.com/Kiana_Liang0609/status/2072695324242796617';
const POSTER = 'https://pbs.twimg.com/amplify_video_thumb/2072691953825931264/img/FMg_0dJS_baF8NMa.jpg';
const BLOG = 'https://www.atlascloud.ai/blog/guides/ultimate-drama-workflow-gpt-image-2-seedance-2-0';
const SKILL_REPO = 'https://github.com/kianaliang-dev/drama-director-skill';

interface Model { name: string; role: LocalizedText; note: LocalizedText; accent: string }
const MODELS: Model[] = [
  {
    name: 'GPT Image 2', accent: '#3a7a7a',
    role: { en: 'The storyboard', zh: '分镜画师' },
    note: { en: 'Text-to-image. Draws the whole scene as one 3×3 nine-panel comic page — locking character design, outfit, lighting and palette across every beat.', zh: '文生图。把整场戏画成一张 3×3 九宫格漫画页 —— 把人物设定、服装、光线、色调,一次性锁死在所有画面里。' },
  },
  {
    name: 'Seedance 2.0', accent: '#8a682c',
    role: { en: 'The animator', zh: '动效导演' },
    note: { en: 'Image-to-video. Takes the nine-panel image as “visual DNA” and generates a 15-second clip with real scene motion and camera work — not a pan across the comic.', zh: '图生视频。把九宫格当作「视觉 DNA」,生成 15 秒、有真实场景运动与运镜的视频 —— 而不是在漫画上平移镜头。' },
  },
  {
    name: 'Nano Banana 2', accent: '#c1614e',
    role: { en: 'The keyframe/text specialist', zh: '关键帧 / 文字担当' },
    note: { en: 'Google’s Gemini 3.1 Flash Image — native 4K, accurate text rendering (scoreboards, jerseys) and consistent characters across up to 14 reference images.', zh: 'Google 的 Gemini 3.1 Flash Image —— 原生 4K、能把文字(比分牌、球衣)写对,并在多达 14 张参考图间保持人物一致。' },
  },
];

const STEPS: { n: string; title: LocalizedText; body: LocalizedText; time: string }[] = [
  {
    n: '01', time: '~1 min',
    title: { en: 'Script → 9-panel storyboard', zh: '剧本 → 九宫格分镜' },
    body: { en: 'Feed a script (9 narrative beats) to GPT Image 2 as one image prompt. Out comes a single 3×3 comic page — the visual reference for everything downstream.', zh: '把剧本(9 个叙事节拍)作为一条图像提示词交给 GPT Image 2,得到一张 3×3 漫画页 —— 后面一切的视觉参照。' },
  },
  {
    n: '02', time: '~2–3 min',
    title: { en: 'Storyboard → 15s video', zh: '分镜 → 15 秒视频' },
    body: { en: 'Hand the nine-panel image + a motion prompt to Seedance 2.0 (image-to-video). It animates the beats into one continuous 15-second clip at 720p.', zh: '把九宫格图 + 一条运动提示词交给 Seedance 2.0(图生视频),它把这些节拍动画成一段连续的 15 秒、720p 视频。' },
  },
];

const MOTION: { k: string; label: LocalizedText; body: LocalizedText }[] = [
  { k: 'a', label: { en: 'Style & mood', zh: '风格与氛围' }, body: { en: 'Lighting, color grade, lens feel.', zh: '光线、调色、镜头质感。' } },
  { k: 'b', label: { en: 'Dynamic description', zh: '动态描述' }, body: { en: 'Shot-by-shot action, hard cuts, camera moves.', zh: '逐镜头动作、硬切、运镜。' } },
  { k: 'c', label: { en: 'Static description', zh: '静态描述' }, body: { en: 'Locations, props, how the character looks.', zh: '场景、道具、人物长相。' } },
];

interface Props { onHome: () => void }

/* Original illustration: a 3×3 storyboard grid → one continuous clip. Shows the
 * method's "shape" without rehosting anyone's media. */
const StoryboardArt: React.FC<{ label: (t: LocalizedText) => string }> = ({ label }) => (
  <svg viewBox="0 0 640 260" className="h-auto w-full" role="img" aria-label={label({ en: '9-panel storyboard becomes a 15-second video', zh: '九宫格分镜变成 15 秒视频' })}>
    {/* 3x3 grid */}
    <g>
      {Array.from({ length: 9 }).map((_, i) => {
        const col = i % 3, row = Math.floor(i / 3);
        return (
          <g key={i}>
            <rect x={18 + col * 74} y={26 + row * 66} width="66" height="58" rx="5" fill="#ece6da" stroke="rgba(28,26,23,0.18)" />
            <circle cx={18 + col * 74 + 33} cy={26 + row * 66 + 22} r="8" fill="rgba(138,104,44,0.35)" />
            <rect x={18 + col * 74 + 12} y={26 + row * 66 + 38} width="42" height="6" rx="3" fill="rgba(28,26,23,0.14)" />
            <rect x={18 + col * 74 + 12} y={26 + row * 66 + 48} width="28" height="6" rx="3" fill="rgba(28,26,23,0.1)" />
          </g>
        );
      })}
      <text x="18" y="18" fontFamily="'JetBrains Mono', monospace" fontSize="11" fill="rgba(28,26,23,0.45)">GPT Image 2 · 3×3</text>
    </g>
    {/* arrow */}
    <g stroke="#8a682c" strokeWidth="2" fill="none">
      <path d="M262 145 h44" />
      <path d="M300 139 l8 6 -8 6" />
    </g>
    <text x="262" y="128" fontFamily="'JetBrains Mono', monospace" fontSize="10" fill="#8a682c">Seedance 2.0</text>
    {/* video frame (vertical 8:9-ish) */}
    <g>
      <rect x="330" y="26" width="180" height="208" rx="10" fill="#1c1a17" />
      <rect x="342" y="40" width="156" height="150" rx="6" fill="#2a2723" />
      <circle cx="420" cy="115" r="22" fill="rgba(246,243,236,0.12)" />
      <path d="M413 104 l18 11 -18 11 z" fill="#f6f3ec" />
      <rect x="342" y="200" width="90" height="8" rx="4" fill="rgba(246,243,236,0.25)" />
      <rect x="342" y="214" width="60" height="8" rx="4" fill="rgba(246,243,236,0.15)" />
      <text x="330" y="18" fontFamily="'JetBrains Mono', monospace" fontSize="11" fill="rgba(28,26,23,0.45)">15s · 720p</text>
    </g>
    {/* one-key badge */}
    <g>
      <rect x="536" y="104" width="90" height="52" rx="10" fill="rgba(138,104,44,0.1)" stroke="rgba(138,104,44,0.4)" />
      <text x="581" y="128" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="12" fill="#8a682c">1 key</text>
      <text x="581" y="144" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="10" fill="rgba(28,26,23,0.45)">2 calls</text>
    </g>
  </svg>
);

const VideoGen: React.FC<Props> = ({ onHome }) => {
  const [lang, setLang] = useState<Lang>(detectInitialLang);
  const s2t = useS2T(lang === 'zhHant');
  const t = (txt: LocalizedText) => (lang === 'en' ? txt.en : lang === 'zhHant' ? (s2t ? s2t(txt.zh) : txt.zh) : txt.zh);
  useEffect(() => { if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, lang); }, [lang]);
  const [posterOk, setPosterOk] = useState(true);

  const LANGS: { code: Lang; label: string }[] = [{ code: 'en', label: 'EN' }, { code: 'zh', label: '简' }, { code: 'zhHant', label: '繁' }];

  return (
    <div className="min-h-screen bg-paper font-sans text-ink">
      <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <button onClick={onHome} className="font-mono text-xs text-ink/55 transition-colors hover:text-ink">← Da Lei · 大雷</button>
          <div className="flex items-center gap-3">
            <span className="hidden font-mono text-[11px] uppercase tracking-[0.2em] text-gold sm:inline">AI Video Workflow</span>
            <div className="flex overflow-hidden rounded-full border border-ink/15">
              {LANGS.map((l) => (
                <button key={l.code} onClick={() => setLang(l.code)}
                  className={`px-2.5 py-1 font-mono text-[11px] transition-colors ${lang === l.code ? 'bg-ink text-paper' : 'text-ink/55 hover:text-ink'}`}>{l.label}</button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-ink/45">{t({ en: 'Field note · AI video', zh: '实测笔记 · AI 视频' })}</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          {t({ en: '3 models, 1 API key: a match that never happened', zh: '3 个模型,1 个 API Key:一场没发生过的比赛' })}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink/65">
          {t({
            en: 'Kiana Liang (@Kiana_Liang0609) generated a “France vs Norway — 2026 World Cup highlights” reel for a match that never took place. The whole trick is two API calls: GPT Image 2 draws a nine-panel storyboard, then Seedance 2.0 animates it — with Nano Banana 2 on keyframes, all through one Atlas Cloud key. This is my walkthrough of her workflow.',
            zh: 'Kiana Liang(@Kiana_Liang0609)做了一段「法国 vs 挪威 —— 2026 世界杯集锦」,而这场比赛从未发生。全部诀窍就两次 API 调用:GPT Image 2 画一张九宫格分镜,Seedance 2.0 把它动画化 —— Nano Banana 2 负责关键帧,全都走一个 Atlas Cloud 的 key。这是我对她这套流程的拆解。',
          })}
        </p>

        {/* result — poster of the real clip, links out to the source */}
        <div className="mt-8 grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
          <a href={TWEET} target="_blank" rel="noreferrer" className="group relative mx-auto block w-[240px] overflow-hidden rounded-2xl border border-ink/15 bg-ink shadow-lg">
            <div className="relative aspect-[8/9] w-full">
              {posterOk ? (
                <img src={POSTER} alt={t({ en: 'AI-generated World Cup highlight (by @Kiana_Liang0609)', zh: 'AI 生成的世界杯集锦(作者 @Kiana_Liang0609)' })}
                  loading="lazy" onError={() => setPosterOk(false)} className="h-full w-full object-cover opacity-95 transition-opacity group-hover:opacity-100" referrerPolicy="no-referrer" />
              ) : (
                <div className="grid h-full w-full place-items-center bg-gradient-to-br from-ink to-[#2a2723] text-paper/60">
                  <span className="font-mono text-xs">🇫🇷 vs 🇳🇴 · AI</span>
                </div>
              )}
              <span className="absolute inset-0 grid place-items-center">
                <span className="grid h-14 w-14 place-items-center rounded-full bg-paper/90 text-ink shadow-lg transition-transform group-hover:scale-110">
                  <svg viewBox="0 0 24 24" className="ml-0.5 h-6 w-6" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                </span>
              </span>
              <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 font-mono text-[11px] text-white">0:15</span>
            </div>
          </a>
          <div>
            <p className="font-display text-xl font-semibold leading-snug tracking-tight sm:text-2xl">
              {t({ en: '“France 🇫🇷 vs Norway 🇳🇴 — 2026 World Cup. Except… this match never happened.”', zh: '「法国 🇫🇷 vs 挪威 🇳🇴 —— 2026 世界杯。只不过…这场比赛从未发生。」' })}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-ink/60">
              {t({ en: 'The 15-second clip is Kiana’s — watch the real thing on X. What follows is how it’s made.', zh: '这段 15 秒视频是 Kiana 的 —— 到 X 上看原片。下面讲的是它怎么做出来的。' })}
            </p>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 font-mono text-[13px]">
              <a className="text-gold hover:underline" href={TWEET} target="_blank" rel="noreferrer">▶ {t({ en: 'Watch on X', zh: '在 X 观看' })} ↗</a>
              <a className="text-gold hover:underline" href="https://x.com/Kiana_Liang0609" target="_blank" rel="noreferrer">@Kiana_Liang0609 ↗</a>
            </div>
          </div>
        </div>

        {/* the pipeline illustration */}
        <section className="mt-12 rounded-3xl border border-ink/10 bg-surface/40 p-6 sm:p-8">
          <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{t({ en: 'The whole pipeline', zh: '整条流水线' })}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink/60">
            {t({ en: 'One canvas holds all nine shots, so the character can’t drift between them — then one video call brings it to life.', zh: '一张画布装下全部九个镜头,人物就不会在镜头之间「跑样」—— 再用一次视频调用让它动起来。' })}
          </p>
          <div className="mt-5 rounded-2xl border border-ink/10 bg-paper/60 p-5">
            <StoryboardArt label={t} />
          </div>
        </section>

        {/* two steps */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {STEPS.map((s) => (
            <div key={s.n} className="rounded-2xl border border-ink/10 bg-surface/40 p-5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-gold">{s.n}</span>
                <span className="font-mono text-[11px] text-ink/40">{s.time}</span>
              </div>
              <h3 className="mt-2 font-display text-lg font-semibold tracking-tight">{t(s.title)}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-ink/60">{t(s.body)}</p>
            </div>
          ))}
        </div>

        {/* why 9 panels */}
        <div className="mt-6 rounded-2xl border border-gold/25 bg-gold/[0.05] px-5 py-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-gold">{t({ en: 'The one trick', zh: '关键的一招' })}</p>
          <p className="mt-2 text-sm leading-relaxed text-ink/70">
            {t({
              en: 'Why nine panels on one image instead of nine separate shots? Because a single canvas forces the model to keep the same face, outfit and proportions across every beat — character consistency for free, one image + one video instead of 6–8× the cost.',
              zh: '为什么是一张图九宫格,而不是分别生成九个镜头?因为同一张画布逼着模型在每个节拍里保持同一张脸、同一套衣服、同样的比例 —— 白送的人物一致性,一张图 + 一段视频,而不是 6–8 倍的成本。',
            })}
          </p>
        </div>

        {/* three models */}
        <h2 className="mt-12 font-display text-2xl font-semibold tracking-tight sm:text-3xl">{t({ en: 'The three models', zh: '三个模型' })}</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {MODELS.map((m) => (
            <div key={m.name} className="flex flex-col rounded-2xl border border-ink/10 bg-surface/40 p-5" style={{ borderTop: `3px solid ${m.accent}` }}>
              <h3 className="font-mono text-sm font-semibold">{m.name}</h3>
              <p className="mt-1 text-sm font-medium" style={{ color: m.accent }}>{t(m.role)}</p>
              <p className="mt-3 text-[13px] leading-relaxed text-ink/60">{t(m.note)}</p>
            </div>
          ))}
        </div>

        {/* numbers */}
        <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-ink/10 bg-ink/10 sm:grid-cols-4">
          {[
            { v: '2', l: { en: 'API calls', zh: '次 API 调用' } as LocalizedText },
            { v: '3–5', l: { en: 'minutes total', zh: '分钟出片' } as LocalizedText },
            { v: '~$1.5–2', l: { en: 'per 15s clip', zh: '每段 15 秒' } as LocalizedText },
            { v: '1', l: { en: 'API key', zh: '个 API Key' } as LocalizedText },
          ].map((s, i) => (
            <div key={i} className="bg-surface/60 px-4 py-5 sm:px-6">
              <dt className="font-display text-2xl font-semibold leading-none tracking-tight sm:text-3xl">{s.v}</dt>
              <dd className="mt-2 font-mono text-[10.5px] uppercase leading-tight tracking-wider text-ink/45">{t(s.l)}</dd>
            </div>
          ))}
        </dl>

        {/* prompt anatomy */}
        <h2 className="mt-12 font-display text-2xl font-semibold tracking-tight sm:text-3xl">{t({ en: 'What the prompts look like', zh: '提示词长什么样' })}</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-ink/10 bg-surface/40 p-5">
            <h3 className="font-display text-lg font-semibold tracking-tight">{t({ en: 'Image prompt (GPT Image 2)', zh: '图像提示词(GPT Image 2)' })}</h3>
            <ul className="mt-3 space-y-1.5 text-[13px] leading-relaxed text-ink/60">
              <li>• {t({ en: 'Nine panels described in reading order (→, ↓)', zh: '九格按阅读顺序逐格描述(→、↓)' })}</li>
              <li>• {t({ en: 'Style: photoreal, cinematic, production quality', zh: '风格:照片级、电影感、成片质量' })}</li>
              <li>• {t({ en: 'Format: bold borders, white gutters, 1:1', zh: '版式:粗黑边框、白色间隔、1:1' })}</li>
              <li>• {t({ en: 'Character-consistency directives baked in', zh: '把「人物一致性」写进提示词' })}</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-ink/10 bg-surface/40 p-5">
            <h3 className="font-display text-lg font-semibold tracking-tight">{t({ en: 'Motion prompt (Seedance 2.0)', zh: '运动提示词(Seedance 2.0)' })}</h3>
            <ul className="mt-3 space-y-2">
              {MOTION.map((m) => (
                <li key={m.k} className="text-[13px] leading-relaxed">
                  <span className="font-medium text-ink/80">{t(m.label)}</span>
                  <span className="text-ink/55"> — {t(m.body)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* automated as a skill */}
        <section className="mt-10 overflow-hidden rounded-3xl border border-ink/15 bg-ink text-paper">
          <div className="p-7 sm:p-9">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-gold">{t({ en: 'Automated', zh: '已自动化' })}</p>
            <h2 className="mt-3 font-display text-2xl font-semibold leading-snug tracking-tight sm:text-3xl">
              {t({ en: 'Two messages, start to finish: the script, and “confirm.”', zh: '从头到尾只发两条消息:剧本,和「确认」。' })}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-paper/70">
              {t({
                en: 'Kiana packaged the whole thing as a Claude Code skill (“drama-director”). It detects the trigger, distills your material into nine beats, writes the image prompt, routes the scene through an archetype picker (Impact / Duel / Pursuit / Reveal / Confrontation …), writes the motion prompt, fires both API calls, and hands back a report with the URLs.',
                zh: 'Kiana 把整套流程打包成一个 Claude Code skill(「drama-director」)。它识别触发词、把素材提炼成九个节拍、写好图像提示词、按场景原型选择器(冲击 / 对决 / 追逐 / 反转 / 对峙…)分流、写运动提示词、连发两次 API 调用,最后交回一份带链接的报告。',
              })}
            </p>
            <a href={SKILL_REPO} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-full border border-paper/25 bg-paper/10 px-4 py-2 font-mono text-xs text-paper/90 transition-colors hover:border-paper/50">
              {t({ en: 'drama-director skill (GitHub)', zh: 'drama-director skill(GitHub)' })} ↗
            </a>
          </div>
        </section>

        <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-ink/10 pt-8 font-mono text-[13px]">
          <a className="text-gold hover:underline" href={TWEET} target="_blank" rel="noreferrer">{t({ en: 'The original post ↗', zh: '原推文 ↗' })}</a>
          <a className="text-gold hover:underline" href={BLOG} target="_blank" rel="noreferrer">{t({ en: 'Full write-up (Atlas Cloud) ↗', zh: '完整教程(Atlas Cloud)↗' })}</a>
          <a className="text-gold hover:underline" href={SKILL_REPO} target="_blank" rel="noreferrer">{t({ en: 'Skill repo ↗', zh: 'Skill 仓库 ↗' })}</a>
        </div>
        <p className="mt-5 text-xs leading-relaxed text-ink/45">
          {t({
            en: 'The video, prompts, skill and numbers are Kiana Liang’s (@Kiana_Liang0609); models by OpenAI, ByteDance and Google, served via Atlas Cloud. This page is my condensed, bilingual walkthrough — all credit is hers. Summarized as of July 2026.',
            zh: '视频、提示词、skill 与数据均出自 Kiana Liang(@Kiana_Liang0609);模型分别来自 OpenAI、字节跳动与 Google,经 Atlas Cloud 提供。本页是我对它的浓缩双语拆解 —— 功劳都是她的。整理截至 2026 年 7 月。',
          })}
        </p>
      </main>
    </div>
  );
};

export default VideoGen;
