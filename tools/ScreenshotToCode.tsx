import React, { useEffect, useRef, useState } from 'react';

interface Props {
  onHome: () => void;
}

const KEY_STORE = 'dalei-gemini-key';
const MODEL_STORE = 'dalei-gemini-model';
const DEFAULT_MODEL = 'gemini-2.5-flash';

const PROMPT = `You are an expert front-end engineer. Reproduce the UI in this screenshot as a SINGLE self-contained HTML file.
Rules:
- Use Tailwind via <script src="https://cdn.tailwindcss.com"></script> in <head>.
- Match layout, spacing, colors, fonts and text content as closely as possible.
- Use semantic, responsive HTML. No external images (use solid color / gradient placeholders).
- Output ONLY the raw HTML document. No markdown fences, no explanation.`;

const stripFences = (s: string) =>
  s.replace(/^\s*```(?:html)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();

const ScreenshotToCode: React.FC<Props> = ({ onHome }) => {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [imgData, setImgData] = useState<{ mime: string; b64: string } | null>(null);
  const [code, setCode] = useState('');
  const [view, setView] = useState<'preview' | 'code'>('preview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setApiKey(localStorage.getItem(KEY_STORE) || '');
    setModel(localStorage.getItem(MODEL_STORE) || DEFAULT_MODEL);
  }, []);
  useEffect(() => {
    if (!msg) return;
    const id = setTimeout(() => setMsg(''), 1800);
    return () => clearTimeout(id);
  }, [msg]);

  const saveKey = (v: string) => {
    setApiKey(v);
    localStorage.setItem(KEY_STORE, v);
  };
  const saveModel = (v: string) => {
    setModel(v);
    localStorage.setItem(MODEL_STORE, v);
  };

  const loadFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setImgSrc(dataUrl);
      setImgData({ mime: file.type, b64: dataUrl.split(',')[1] });
      setCode('');
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const generate = async () => {
    if (!apiKey) {
      setError('请先填入 Gemini API Key。');
      return;
    }
    if (!imgData) {
      setError('请先上传一张界面截图。');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey });
      const res = await ai.models.generateContent({
        model: model || DEFAULT_MODEL,
        contents: [
          {
            role: 'user',
            parts: [
              { inlineData: { mimeType: imgData.mime, data: imgData.b64 } },
              { text: PROMPT },
            ],
          },
        ],
      });
      const text = stripFences(res.text || '');
      if (!text) {
        setError('模型没有返回内容，换张图或换个模型再试。');
      } else {
        setCode(text);
        setView('preview');
      }
    } catch (e) {
      setError('生成失败：' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setMsg('已复制代码');
    } catch {
      setMsg('复制失败');
    }
  };
  const download = () => {
    const blob = new Blob([code], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'screenshot.html';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="flex h-screen flex-col bg-paper font-sans text-ink">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 px-5 py-3 sm:px-8">
        <div className="flex items-center gap-3">
          <button onClick={onHome} className="font-mono text-xs text-ink/55 hover:text-ink">← Da Lei · 大雷</button>
          <span className="font-display text-lg font-semibold tracking-tight">截图转代码</span>
          <span className="hidden rounded-full border border-ember/40 bg-ember/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ember sm:inline">实验性 · 自带 Key</span>
        </div>
        <div className="flex items-center gap-2">
          {msg && <span className="font-mono text-xs text-gold">{msg}</span>}
          {code && (
            <>
              <button onClick={copy} className="rounded-full border border-ink/15 bg-ink/[0.03] px-3 py-1.5 font-mono text-xs text-ink/70 hover:text-ink">复制代码</button>
              <button onClick={download} className="rounded-full border border-ink/15 bg-ink/[0.03] px-3 py-1.5 font-mono text-xs text-ink/70 hover:text-ink">下载 HTML</button>
            </>
          )}
          <button
            onClick={generate}
            disabled={loading}
            className="rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-paper transition-transform hover:scale-[1.03] disabled:opacity-50"
          >
            {loading ? '生成中…' : '生成代码'}
          </button>
        </div>
      </header>

      {/* Settings */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-ink/10 px-5 py-2.5 sm:px-8">
        <input
          type="password"
          value={apiKey}
          onChange={(e) => saveKey(e.target.value)}
          placeholder="Gemini API Key（仅存在你本地浏览器）"
          className="min-w-[240px] flex-1 rounded-full border border-ink/15 bg-ink/[0.02] px-3.5 py-1.5 font-mono text-xs outline-none focus:border-gold/50"
        />
        <input
          value={model}
          onChange={(e) => saveModel(e.target.value)}
          className="w-40 rounded-full border border-ink/15 bg-ink/[0.02] px-3.5 py-1.5 font-mono text-xs outline-none focus:border-gold/50"
        />
        <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="font-mono text-xs text-gold underline-offset-2 hover:underline">
          获取 Key ↗
        </a>
      </div>

      {error && <div className="border-b border-ember/30 bg-ember/10 px-5 py-2 font-mono text-xs text-ember sm:px-8">{error}</div>}

      {/* Body */}
      <div className="grid flex-1 grid-rows-2 overflow-hidden md:grid-cols-2 md:grid-rows-1">
        {/* Source */}
        <div
          className="flex flex-col items-center justify-center border-b border-ink/10 bg-paper p-6 md:border-b-0 md:border-r"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) loadFile(f); }}
        >
          {imgSrc ? (
            <div className="flex w-full flex-col items-center gap-3">
              <img src={imgSrc} alt="screenshot" className="max-h-[60vh] max-w-full rounded-lg object-contain shadow" />
              <button onClick={() => inputRef.current?.click()} className="font-mono text-xs text-gold hover:underline">换一张</button>
            </div>
          ) : (
            <button
              onClick={() => inputRef.current?.click()}
              className="flex h-full w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-ink/20 p-10 text-center hover:border-gold/50"
            >
              <span className="font-display text-xl font-semibold">拖入或点击上传界面截图</span>
              <span className="font-mono text-xs text-ink/45">Gemini 会据此生成自包含 HTML</span>
            </button>
          )}
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) loadFile(f); }} />
        </div>

        {/* Output */}
        <div className="flex h-full flex-col bg-surface/30">
          <div className="flex items-center gap-1 border-b border-ink/10 px-4 py-2">
            {(['preview', 'code'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`rounded-full px-3 py-0.5 text-xs transition-colors ${view === v ? 'bg-accent text-paper' : 'text-ink/55 hover:text-ink'}`}
              >
                {v === 'preview' ? '预览' : '代码'}
              </button>
            ))}
          </div>
          {code ? (
            view === 'preview' ? (
              <iframe title="preview" srcDoc={code} sandbox="allow-scripts" className="h-full w-full flex-1 bg-white" />
            ) : (
              <textarea value={code} readOnly spellCheck={false} className="h-full w-full flex-1 resize-none bg-paper p-4 font-mono text-xs leading-relaxed text-ink/80 outline-none" />
            )
          ) : (
            <div className="grid flex-1 place-items-center p-6 text-center font-mono text-xs text-ink/40">
              {loading ? 'Gemini 正在生成…' : '上传截图并点「生成代码」'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScreenshotToCode;
