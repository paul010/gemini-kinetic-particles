import React, { useEffect, useMemo, useRef, useState } from 'react';
import { marked } from 'marked';

interface Props {
  onHome: () => void;
}

type Tab = 'wechat' | 'youtube' | 'thread' | 'toc' | 'plain';

const SAMPLE = `# 用 AI 一句话生成排版

> 大雷｜AI 自动化实践者 × 跑步爱好者

## 视频亮点

正文支持 **加粗**、*斜体*、\`行内代码\` 与 [我的频道](https://www.youtube.com/@dalei2025)。

### 三步走

- 看到项目
- 配好 Skill
- 复制开工 Prompt

\`\`\`js
console.log('Hello')
\`\`\`

> 加入会员：https://www.youtube.com/channel/UCk9tu0mFtXj_rOEfIncxuJQ/join

---

0:00 开场
1:20 实操演示
`;

marked.use({ breaks: true, gfm: true });

/** Strip Markdown to clean plain text. */
function stripToPlain(md: string): string {
  let s = md;
  s = s.replace(/!\[[^\]]*\]\([^)]*\)/g, '');
  s = s.replace(/```[^\n]*\n([\s\S]*?)```/g, '$1');
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)');
  s = s.replace(/^\s{0,3}#{1,6}\s*(.+?)\s*$/gm, '$1');
  s = s.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/__([^_]+)__/g, '$1');
  s = s.replace(/(?<![*\w])\*([^*\n]+)\*(?!\*)/g, '$1').replace(/(?<![_\w])_([^_\n]+)_(?!_)/g, '$1');
  s = s.replace(/`([^`]+)`/g, '$1');
  s = s.replace(/^\s*>\s?/gm, '');
  s = s.replace(/^\s*([-*_])\1{2,}\s*$/gm, '');
  s = s.replace(/^\s*[-*]\s+/gm, '• ');
  s = s.replace(/\n{3,}/g, '\n\n');
  return s.trim();
}

/** Markdown → YouTube-description-ready plain text. */
function toYouTube(md: string): string {
  let s = md;
  s = s.replace(/!\[[^\]]*\]\([^)]*\)/g, '');
  s = s.replace(/```[^\n]*\n([\s\S]*?)```/g, '$1');
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)');
  s = s.replace(/^\s{0,3}#{1,6}\s*(.+?)\s*$/gm, '$1');
  s = s.replace(/\*\*([^*]+)\*\*/g, '@@B@@$1@@B@@');
  s = s.replace(/__([^_]+)__/g, '@@B@@$1@@B@@');
  s = s.replace(/(?<![*\w])\*([^*\n]+)\*(?!\*)/g, '_$1_');
  s = s.replace(/@@B@@([\s\S]*?)@@B@@/g, '*$1*');
  s = s.replace(/`([^`]+)`/g, '$1');
  s = s.replace(/^\s*>\s?/gm, '');
  s = s.replace(/^\s*([-*_])\1{2,}\s*$/gm, '——————————');
  s = s.replace(/^\s*[-*]\s+/gm, '• ');
  s = s.replace(/\n{3,}/g, '\n\n');
  return s.trim();
}

const slugify = (t: string) =>
  t.toLowerCase().trim().replace(/[^\w一-龥\s-]/g, '').replace(/\s+/g, '-');

/** Markdown headings → a nested Markdown table of contents. */
function toTOC(md: string): string {
  const out: string[] = [];
  let inFence = false;
  for (const ln of md.split('\n')) {
    if (/^```/.test(ln)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = /^(#{1,6})\s+(.+?)\s*$/.exec(ln);
    if (m) {
      const level = m[1].length;
      const text = m[2].replace(/[*_`]/g, '');
      out.push(`${'  '.repeat(Math.max(0, level - 1))}- [${text}](#${slugify(text)})`);
    }
  }
  return out.join('\n') || '（没有检测到标题）';
}

/** Split text into ≤limit-char tweets, numbered (i/n). */
function splitThread(md: string, limit = 270): { text: string; count: number } {
  const text = stripToPlain(md);
  const chunks: string[] = [];
  let cur = '';
  const push = () => {
    if (cur.trim()) chunks.push(cur.trim());
    cur = '';
  };
  for (const para of text.split(/\n{2,}/)) {
    if (cur && (cur + '\n\n' + para).length <= limit) {
      cur = cur + '\n\n' + para;
    } else if (para.length <= limit) {
      push();
      cur = para;
    } else {
      push();
      for (const sen of para.split(/(?<=[。！？.!?])\s*/)) {
        if ((cur + sen).length <= limit) {
          cur += sen;
        } else {
          push();
          if (sen.length <= limit) {
            cur = sen;
          } else {
            for (let i = 0; i < sen.length; i += limit) chunks.push(sen.slice(i, i + limit));
          }
        }
      }
    }
  }
  push();
  const n = chunks.length || 1;
  const text2 = chunks.map((c, i) => `${c}\n\n(${i + 1}/${n})`).join('\n\n———\n\n');
  return { text: text2, count: chunks.length };
}

const TABS: [Tab, string][] = [
  ['wechat', '公众号排版'],
  ['youtube', 'YouTube 简介'],
  ['thread', 'X 推文拆条'],
  ['toc', '目录 TOC'],
  ['plain', '纯文本'],
];

const MarkdownStudio: React.FC<Props> = ({ onHome }) => {
  const [tab, setTab] = useState<Tab>('wechat');
  const [md, setMd] = useState(SAMPLE);
  const [msg, setMsg] = useState('');
  const previewRef = useRef<HTMLDivElement>(null);

  const html = useMemo(() => {
    try {
      return marked.parse(md, { async: false }) as string;
    } catch {
      return '<p>解析出错</p>';
    }
  }, [md]);
  const youtube = useMemo(() => toYouTube(md), [md]);
  const plain = useMemo(() => stripToPlain(md), [md]);
  const toc = useMemo(() => toTOC(md), [md]);
  const thread = useMemo(() => splitThread(md), [md]);

  const output = tab === 'youtube' ? youtube : tab === 'thread' ? thread.text : tab === 'toc' ? toc : plain;

  useEffect(() => {
    if (!msg) return;
    const id = setTimeout(() => setMsg(''), 2000);
    return () => clearTimeout(id);
  }, [msg]);

  const copyRich = () => {
    const node = previewRef.current;
    if (!node) return;
    const range = document.createRange();
    range.selectNodeContents(node);
    const sel = window.getSelection();
    if (!sel) return;
    sel.removeAllRanges();
    sel.addRange(range);
    try {
      document.execCommand('copy');
      setMsg('已复制富文本，去公众号后台粘贴即可');
    } catch {
      setMsg('复制失败，请手动选择');
    }
    sel.removeAllRanges();
  };

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setMsg(label);
    } catch {
      setMsg('复制失败');
    }
  };

  return (
    <div className="flex h-screen flex-col bg-paper font-sans text-ink">
      <style>{WX_STYLE}</style>

      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 px-5 py-3 sm:px-8">
        <div className="flex items-center gap-3">
          <button onClick={onHome} className="font-mono text-xs text-ink/55 hover:text-ink">← Da Lei · 大雷</button>
          <span className="font-display text-lg font-semibold tracking-tight">Markdown 工具箱</span>
        </div>
        <div className="flex items-center gap-2">
          {msg && <span className="hidden font-mono text-xs text-gold sm:inline">{msg}</span>}
          <button
            onClick={() => setMd(SAMPLE)}
            className="rounded-full border border-ink/15 bg-ink/[0.03] px-3 py-1.5 font-mono text-xs text-ink/70 hover:text-ink"
          >
            重置
          </button>
          {tab === 'wechat' ? (
            <>
              <button onClick={() => copyText(html, '已复制 HTML 源码')} className="rounded-full border border-ink/15 bg-ink/[0.03] px-3 py-1.5 font-mono text-xs text-ink/70 hover:text-ink">
                复制 HTML
              </button>
              <button onClick={copyRich} className="rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-paper transition-transform hover:scale-[1.03]">
                复制到公众号
              </button>
            </>
          ) : (
            <button onClick={() => copyText(output, '已复制')} className="rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-paper transition-transform hover:scale-[1.03]">
              复制
            </button>
          )}
        </div>
      </header>

      {/* Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-ink/10 px-5 py-2 sm:px-8">
        {TABS.map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`shrink-0 rounded-full px-3.5 py-1 text-sm transition-colors ${
              tab === k ? 'bg-accent text-paper' : 'text-ink/60 hover:text-ink'
            }`}
          >
            {label}
          </button>
        ))}
        {tab === 'youtube' && (
          <span className={`ml-auto shrink-0 font-mono text-xs ${youtube.length > 5000 ? 'text-ember' : 'text-ink/45'}`}>
            {youtube.length} / 5000
          </span>
        )}
        {tab === 'thread' && <span className="ml-auto shrink-0 font-mono text-xs text-ink/45">{thread.count} 条推文</span>}
      </div>

      {/* Panes */}
      <div className="grid flex-1 grid-rows-2 overflow-hidden md:grid-cols-2 md:grid-rows-1">
        <textarea
          value={md}
          onChange={(e) => setMd(e.target.value)}
          spellCheck={false}
          className="h-full w-full resize-none border-b border-ink/10 bg-paper p-5 font-mono text-sm leading-relaxed text-ink/85 outline-none md:border-b-0 md:border-r"
          placeholder="在这里写 Markdown…"
        />
        {tab === 'wechat' ? (
          <div className="h-full overflow-y-auto bg-surface/30 p-5 sm:p-8">
            <div ref={previewRef} className="wx-body mx-auto max-w-[420px]" dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        ) : (
          <textarea
            value={output}
            readOnly
            spellCheck={false}
            className="h-full w-full resize-none bg-surface/30 p-5 font-mono text-sm leading-relaxed text-ink/80 outline-none sm:p-8"
          />
        )}
      </div>
    </div>
  );
};

const WX_STYLE = `
.wx-body { color: #1c1a17; font-size: 15px; line-height: 1.75; word-break: break-word; }
.wx-body h1 { font-size: 22px; font-weight: 700; margin: 1.2em 0 0.6em; line-height: 1.3; }
.wx-body h2 { font-size: 19px; font-weight: 700; margin: 1.2em 0 0.6em; padding-left: 10px; border-left: 4px solid #8a682c; }
.wx-body h3 { font-size: 17px; font-weight: 600; margin: 1.1em 0 0.5em; }
.wx-body p { margin: 0.8em 0; }
.wx-body a { color: #8a682c; text-decoration: none; border-bottom: 1px solid rgba(138,104,44,0.4); }
.wx-body strong { color: #0f0e0c; }
.wx-body em { color: #5b5650; }
.wx-body ul, .wx-body ol { margin: 0.8em 0; padding-left: 1.4em; }
.wx-body li { margin: 0.35em 0; }
.wx-body blockquote { margin: 1em 0; padding: 0.6em 1em; border-left: 3px solid #8a682c; background: rgba(138,104,44,0.06); color: #5b5650; border-radius: 0 6px 6px 0; }
.wx-body blockquote p { margin: 0.3em 0; }
.wx-body code { font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 13px; background: rgba(28,26,23,0.06); padding: 0.1em 0.4em; border-radius: 4px; }
.wx-body pre { margin: 1em 0; padding: 1em; background: #1c1a17; border-radius: 8px; overflow-x: auto; }
.wx-body pre code { background: none; color: #ece6da; padding: 0; font-size: 13px; line-height: 1.6; }
.wx-body hr { border: none; border-top: 1px solid rgba(28,26,23,0.15); margin: 1.6em 0; }
.wx-body img { max-width: 100%; border-radius: 8px; }
.wx-body h1, .wx-body h2, .wx-body h3 { font-family: 'Inter', system-ui, sans-serif; }
`;

export default MarkdownStudio;
