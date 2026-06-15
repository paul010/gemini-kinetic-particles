import React, { useCallback, useEffect, useRef, useState } from 'react';

interface Props {
  onHome: () => void;
}

type Fmt = 'image/jpeg' | 'image/webp' | 'image/png';

const FMT_LABEL: Record<Fmt, string> = {
  'image/jpeg': 'JPG',
  'image/webp': 'WebP',
  'image/png': 'PNG',
};

const PRESETS: { label: string; maxW: number; fmt: Fmt; q: number }[] = [
  { label: 'YouTube 封面 1280', maxW: 1280, fmt: 'image/jpeg', q: 0.9 },
  { label: '宽 1920', maxW: 1920, fmt: 'image/jpeg', q: 0.85 },
  { label: '宽 800', maxW: 800, fmt: 'image/webp', q: 0.85 },
];

const fmtSize = (n: number) => (n < 1024 ? `${n} B` : n < 1024 * 1024 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1024 / 1024).toFixed(2)} MB`);

interface Source {
  img: HTMLImageElement;
  name: string;
  size: number;
  w: number;
  h: number;
}
interface Output {
  url: string;
  size: number;
  w: number;
  h: number;
}

const ImageStudio: React.FC<Props> = ({ onHome }) => {
  const [src, setSrc] = useState<Source | null>(null);
  const [maxW, setMaxW] = useState(1280);
  const [fmt, setFmt] = useState<Fmt>('image/jpeg');
  const [quality, setQuality] = useState(0.85);
  const [out, setOut] = useState<Output | null>(null);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastUrl = useRef<string | null>(null);
  const srcUrl = useRef<string | null>(null);

  const loadFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      if (srcUrl.current) URL.revokeObjectURL(srcUrl.current); // free the previous source
      srcUrl.current = url;
      setSrc({ img, name: file.name, size: file.size, w: img.naturalWidth, h: img.naturalHeight });
    };
    img.src = url;
  }, []);

  // Re-encode whenever the source or settings change.
  useEffect(() => {
    if (!src) return;
    const scale = Math.min(1, maxW / src.w);
    const w = Math.round(src.w * scale);
    const h = Math.round(src.h * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(src.img, 0, 0, w, h);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        if (lastUrl.current) URL.revokeObjectURL(lastUrl.current);
        const url = URL.createObjectURL(blob);
        lastUrl.current = url;
        setOut({ url, size: blob.size, w, h });
      },
      fmt,
      fmt === 'image/png' ? undefined : quality
    );
  }, [src, maxW, fmt, quality]);

  useEffect(() => () => {
    if (lastUrl.current) URL.revokeObjectURL(lastUrl.current);
    if (srcUrl.current) URL.revokeObjectURL(srcUrl.current);
  }, []);

  const download = () => {
    if (!out || !src) return;
    const a = document.createElement('a');
    const base = src.name.replace(/\.[^.]+$/, '');
    a.href = out.url;
    a.download = `${base}-${out.w}x${out.h}.${FMT_LABEL[fmt].toLowerCase()}`;
    a.click();
  };

  const pct = src && out ? Math.round((1 - out.size / src.size) * 100) : 0;

  return (
    <div className="flex min-h-screen flex-col bg-paper font-sans text-ink">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 px-5 py-3 sm:px-8">
        <div className="flex items-center gap-3">
          <button onClick={onHome} className="font-mono text-xs text-ink/55 hover:text-ink">← Da Lei · 大雷</button>
          <span className="font-display text-lg font-semibold tracking-tight">图片工具箱</span>
          <span className="hidden font-mono text-[11px] uppercase tracking-[0.18em] text-gold sm:inline">Image Studio</span>
        </div>
        {out && (
          <button onClick={download} className="rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-paper transition-transform hover:scale-[1.03]">
            下载 {FMT_LABEL[fmt]}
          </button>
        )}
      </header>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-ink/10 px-5 py-3 sm:px-8">
        <label className="flex items-center gap-2 font-mono text-xs text-ink/60">
          最大宽度 {maxW}px
          <input type="range" min={320} max={3840} step={20} value={maxW} onChange={(e) => setMaxW(Number(e.target.value))} className="accent-[#8a682c]" />
        </label>
        <div className="flex items-center gap-1">
          {(Object.keys(FMT_LABEL) as Fmt[]).map((f) => (
            <button
              key={f}
              onClick={() => setFmt(f)}
              className={`rounded-full px-3 py-1 font-mono text-xs transition-colors ${fmt === f ? 'bg-accent text-paper' : 'border border-ink/15 text-ink/60 hover:text-ink'}`}
            >
              {FMT_LABEL[f]}
            </button>
          ))}
        </div>
        {fmt !== 'image/png' && (
          <label className="flex items-center gap-2 font-mono text-xs text-ink/60">
            质量 {Math.round(quality * 100)}
            <input type="range" min={0.3} max={1} step={0.05} value={quality} onChange={(e) => setQuality(Number(e.target.value))} className="accent-[#8a682c]" />
          </label>
        )}
        <div className="flex flex-wrap items-center gap-1">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => { setMaxW(p.maxW); setFmt(p.fmt); setQuality(p.q); }}
              className="rounded-full border border-gold/40 bg-gold/10 px-3 py-1 font-mono text-[11px] text-gold hover:bg-gold/20"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="grid flex-1 gap-px bg-ink/10 md:grid-cols-2">
        {/* Source */}
        <div
          className={`flex flex-col items-center justify-center bg-paper p-6 ${drag ? 'bg-gold/5' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) loadFile(f); }}
        >
          {!src ? (
            <button
              onClick={() => inputRef.current?.click()}
              className="flex h-full w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-ink/20 p-10 text-center transition-colors hover:border-gold/50"
            >
              <span className="font-display text-xl font-semibold">拖入或点击选择图片</span>
              <span className="font-mono text-xs text-ink/45">支持 JPG / PNG / WebP，全程本地处理，不上传</span>
            </button>
          ) : (
            <div className="flex w-full flex-col items-center gap-3">
              <img src={src.img.src} alt="source" className="max-h-[52vh] max-w-full rounded-lg object-contain" />
              <p className="font-mono text-xs text-ink/55">
                原图 {src.w}×{src.h} · {fmtSize(src.size)}
                <button onClick={() => inputRef.current?.click()} className="ml-3 text-gold hover:underline">换一张</button>
              </p>
            </div>
          )}
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) loadFile(f); }} />
        </div>

        {/* Output */}
        <div className="flex flex-col items-center justify-center bg-paper p-6">
          {out ? (
            <div className="flex w-full flex-col items-center gap-3">
              <img src={out.url} alt="output" className="max-h-[52vh] max-w-full rounded-lg object-contain" />
              <p className="text-center font-mono text-xs text-ink/55">
                输出 {out.w}×{out.h} · {fmtSize(out.size)}
                {pct > 0 && <span className="ml-2 text-gold">↓ 体积减少 {pct}%</span>}
              </p>
            </div>
          ) : (
            <p className="font-mono text-xs text-ink/40">选择图片后这里显示压缩结果</p>
          )}
        </div>
      </div>

      <footer className="border-t border-ink/10 px-5 py-3 text-center font-mono text-[11px] text-ink/40 sm:px-8">
        全程在你的浏览器本地处理，图片不会上传到任何服务器。
      </footer>
    </div>
  );
};

export default ImageStudio;
