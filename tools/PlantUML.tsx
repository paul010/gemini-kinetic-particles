import React, { useEffect, useMemo, useRef, useState } from 'react';

/* ---------------------------------------------------------------------------
 * PlantUML renderer. Encodes the UML source with raw-DEFLATE (CompressionStream,
 * no deps) + PlantUML's base64 variant, then renders SVG/PNG from the public
 * PlantUML server. Copy the real image (PNG via ClipboardItem), the SVG, the
 * URL, or download. All client-side; the diagram is fetched by the user's
 * browser from plantuml.com.
 * ------------------------------------------------------------------------- */

interface Props { onHome: () => void }

const SERVER = 'https://www.plantuml.com/plantuml';

/* PlantUML's custom base64 alphabet (0-9 A-Z a-z - _) over raw-deflate bytes. */
const encode6bit = (b: number): string => {
  if (b < 10) return String.fromCharCode(48 + b);
  b -= 10;
  if (b < 26) return String.fromCharCode(65 + b);
  b -= 26;
  if (b < 26) return String.fromCharCode(97 + b);
  b -= 26;
  if (b === 0) return '-';
  if (b === 1) return '_';
  return '?';
};
const append3 = (b1: number, b2: number, b3: number): string =>
  encode6bit((b1 >> 2) & 0x3f) +
  encode6bit((((b1 & 0x3) << 4) | (b2 >> 4)) & 0x3f) +
  encode6bit((((b2 & 0xf) << 2) | (b3 >> 6)) & 0x3f) +
  encode6bit(b3 & 0x3f);
const encode64 = (data: Uint8Array): string => {
  let r = '';
  for (let i = 0; i < data.length; i += 3) {
    if (i + 2 === data.length) r += append3(data[i], data[i + 1], 0);
    else if (i + 1 === data.length) r += append3(data[i], 0, 0);
    else r += append3(data[i], data[i + 1], data[i + 2]);
  }
  return r;
};

async function deflateRaw(text: string): Promise<Uint8Array> {
  const cs = new (window as any).CompressionStream('deflate-raw');
  const writer = cs.writable.getWriter();
  writer.write(new TextEncoder().encode(text));
  writer.close();
  const buf = await new Response(cs.readable).arrayBuffer();
  return new Uint8Array(buf);
}

const EXAMPLES: { name: string; code: string }[] = [
  {
    name: '时序图 Sequence',
    code: `@startuml
actor 用户 as U
participant "前端" as FE
participant "Agent" as A
database "向量库" as DB

U -> FE : 提问
FE -> A : 转发查询
A -> DB : 检索相关片段
DB --> A : top-k chunks
A --> FE : 带引用的答案
FE --> U : 展示结果
@enduml`,
  },
  {
    name: '类图 Class',
    code: `@startuml
class Agent {
  +name: string
  +run(task): Result
}
class Skill {
  +id: string
  +invoke(input): Output
}
class Tool {
  +provider: string
}
Agent "1" o-- "many" Skill
Skill --> Tool
@enduml`,
  },
  {
    name: '活动图 Activity',
    code: `@startuml
start
:看到一个 AI 项目;
if (值得做?) then (是)
  :配好 Skill;
  :复制开工 Prompt;
  :跑出 Demo;
  :转化成内容;
else (否)
  :仅观察;
endif
stop
@enduml`,
  },
  {
    name: '思维导图 Mindmap',
    code: `@startmindmap
* 大雷的 AI 工作流
** 使用
*** Copilot
*** Cowork
** 无代码
*** Agent Builder
*** Copilot Studio
** 开发
*** Foundry
*** 开发栈
@endmindmap`,
  },
  {
    name: '用例图 Use case',
    code: `@startuml
left to right direction
actor 创作者 as C
rectangle "大雷工具箱" {
  C --> (Markdown 转排版)
  C --> (PlantUML 渲染)
  C --> (Agent 模板)
  C --> (Skill 技能库)
}
@enduml`,
  },
  {
    name: '甘特图 Gantt',
    code: `@startgantt
[选题调研] lasts 2 days
[写脚本] lasts 1 day
[写脚本] starts at [选题调研]'s end
[录制] lasts 1 day
[录制] starts at [写脚本]'s end
[剪辑发布] lasts 1 day
[剪辑发布] starts at [录制]'s end
@endgantt`,
  },
];

const PlantUML: React.FC<Props> = ({ onHome }) => {
  const [code, setCode] = useState(EXAMPLES[0].code);
  const [format, setFormat] = useState<'svg' | 'png'>('svg');
  const [encoded, setEncoded] = useState('');
  const [encErr, setEncErr] = useState('');
  const [imgErr, setImgErr] = useState(false);
  const [msg, setMsg] = useState('');
  const [fit, setFit] = useState(true);
  const supported = typeof window !== 'undefined' && 'CompressionStream' in window;

  // Debounced encode of the UML source.
  useEffect(() => {
    if (!supported) { setEncErr('当前浏览器不支持 CompressionStream（请用较新版 Chrome/Edge/Firefox/Safari）'); return; }
    let alive = true;
    const id = window.setTimeout(async () => {
      try {
        const bytes = await deflateRaw(code);
        if (alive) { setEncoded(encode64(bytes)); setEncErr(''); setImgErr(false); }
      } catch (e: any) {
        if (alive) setEncErr(String(e?.message || e));
      }
    }, 350);
    return () => { alive = false; window.clearTimeout(id); };
  }, [code, supported]);

  const urlFor = (fmt: string) => (encoded ? `${SERVER}/${fmt}/${encoded}` : '');
  const imgUrl = urlFor(format);

  const flash = (t: string) => { setMsg(t); window.setTimeout(() => setMsg(''), 1600); };

  const copyImage = async () => {
    try {
      const res = await fetch(urlFor('png'));
      const blob = await res.blob();
      await navigator.clipboard.write([new (window as any).ClipboardItem({ 'image/png': blob })]);
      flash('已复制图片 ✓');
    } catch {
      flash('复制图片失败（浏览器或网络限制）');
    }
  };
  const copySvg = async () => {
    try {
      const res = await fetch(urlFor('svg'));
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      flash('已复制 SVG ✓');
    } catch {
      flash('复制 SVG 失败');
    }
  };
  const copyUrl = async () => {
    try { await navigator.clipboard.writeText(imgUrl); flash('已复制链接 ✓'); } catch { flash('复制失败'); }
  };
  const download = () => {
    const a = document.createElement('a');
    a.href = imgUrl;
    a.download = `diagram.${format}`;
    a.target = '_blank';
    a.rel = 'noreferrer';
    document.body.appendChild(a); a.click(); a.remove();
  };

  const btn = 'rounded-full border border-ink/15 bg-ink/[0.03] px-3 py-1.5 font-mono text-xs text-ink/70 transition-colors hover:border-gold/40 hover:text-gold';

  return (
    <div className="flex h-screen flex-col bg-paper font-sans text-ink">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 px-5 py-3 sm:px-8">
        <div className="flex items-center gap-3">
          <button onClick={onHome} className="font-mono text-xs text-ink/55 hover:text-ink">← Da Lei · 大雷</button>
          <span className="font-display text-lg font-semibold tracking-tight">PlantUML 渲染器</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {msg && <span className="font-mono text-xs text-gold">{msg}</span>}
          <div className="flex overflow-hidden rounded-full border border-ink/15">
            {(['svg', 'png'] as const).map((f) => (
              <button key={f} onClick={() => { setFormat(f); setImgErr(false); }}
                className={`px-2.5 py-1 font-mono text-[11px] uppercase transition-colors ${format === f ? 'bg-ink text-paper' : 'text-ink/55 hover:text-ink'}`}>{f}</button>
            ))}
          </div>
          <button onClick={copyImage} className="rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-paper transition-transform hover:scale-[1.03]">复制图片</button>
          <button onClick={copySvg} className={btn}>复制 SVG</button>
          <button onClick={copyUrl} className={btn}>复制链接</button>
          <button onClick={download} className={btn}>下载</button>
        </div>
      </header>

      {/* examples */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-ink/10 px-5 py-2 sm:px-8">
        <span className="mr-1 shrink-0 font-mono text-[11px] uppercase tracking-wider text-ink/40">示例</span>
        {EXAMPLES.map((ex) => (
          <button key={ex.name} onClick={() => setCode(ex.code)}
            className="shrink-0 rounded-full px-3 py-1 text-sm text-ink/60 transition-colors hover:bg-ink/5 hover:text-ink">{ex.name}</button>
        ))}
      </div>

      {/* panes */}
      <div className="grid flex-1 grid-rows-2 overflow-hidden md:grid-cols-2 md:grid-rows-1">
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck={false}
          className="h-full w-full resize-none border-b border-ink/10 bg-paper p-5 font-mono text-[13px] leading-relaxed text-ink outline-none md:border-b-0 md:border-r"
          placeholder="@startuml ... @enduml"
        />
        <div className="relative flex h-full flex-col overflow-hidden bg-surface/40">
          <div className="flex items-center justify-between border-b border-ink/10 px-4 py-1.5">
            <span className="font-mono text-[11px] uppercase tracking-wider text-ink/40">预览 · {format.toUpperCase()}</span>
            <button onClick={() => setFit((v) => !v)} className="font-mono text-[11px] text-ink/50 hover:text-ink">{fit ? '适应 Fit' : '原始 1:1'}</button>
          </div>
          <div className="flex-1 overflow-auto p-4">
            {encErr ? (
              <div className="grid h-full place-items-center px-6 text-center font-mono text-xs leading-relaxed text-ember">{encErr}</div>
            ) : !encoded ? (
              <div className="grid h-full place-items-center font-mono text-xs text-ink/35">编码中…</div>
            ) : (
              <div className="grid min-h-full place-items-center">
                {imgErr ? (
                  <div className="px-6 text-center font-mono text-xs leading-relaxed text-ember">
                    渲染失败 —— 可能是 UML 语法错误，或暂时无法连接 plantuml.com。<br />
                    <a href={imgUrl} target="_blank" rel="noreferrer" className="text-gold underline">在新标签打开</a>
                  </div>
                ) : (
                  <img
                    key={imgUrl}
                    src={imgUrl}
                    alt="PlantUML diagram"
                    onError={() => setImgErr(true)}
                    className={`rounded bg-white p-2 shadow-sm ${fit ? 'max-h-full max-w-full object-contain' : ''}`}
                  />
                )}
              </div>
            )}
          </div>
          <div className="border-t border-ink/10 px-4 py-1.5 font-mono text-[10px] text-ink/35">
            渲染由 plantuml.com 提供 · 你的 UML 文本会发送到该公共服务器渲染
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlantUML;
