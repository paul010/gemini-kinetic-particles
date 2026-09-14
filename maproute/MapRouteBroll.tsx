import React, { useEffect, useState } from 'react';
import './maproute.css';

const REPO = 'https://github.com/paul010/map-route-broll-skill';
const ZIP = `${REPO}/releases/download/v1.0.0/map-route-broll-v1.0.0.zip`;
type Lang = 'zh' | 'en' | 'zhHant';
export default function MapRouteBroll({ onHome }: { onHome: () => void }) {
  const [lang, setLang] = useState<Lang>(() => {
    const saved = localStorage.getItem('dalei-lang-v2');
    return saved === 'zh' || saved === 'zhHant' ? saved : 'en';
  });
  const [convert, setConvert] = useState<((s: string) => string) | null>(null);
  const [demo, setDemo] = useState<'four' | 'two'>('four');
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  useEffect(() => {
    if (lang !== 'zhHant') return;
    let active = true;
    import('opencc-js').then(m => { if (active) setConvert(() => (m as any).Converter({ from: 'cn', to: 'tw' })); });
    return () => { active = false; };
  }, [lang]);
  const t = (zh: string, en: string) => lang === 'en' ? en : lang === 'zhHant' && convert ? convert(zh) : zh;
  const prompt = t('使用 $map-route-broll 制作旅顺 → 北京 → 天津 → 青岛 → 旅顺的微缩地图视频。逐站停留，保留已走航线，返程换成青绿色。16 秒、横屏 1080p、静音，交付 MP4 和可编辑源码。', 'Use $map-route-broll to create a miniature map video: Lüshun → Beijing → Tianjin → Qingdao → Lüshun. Pause at each stop, retain completed routes and use teal for the return leg. Deliver a silent 16-second 1080p landscape MP4 and editable source.');
  const changeLang = (v: Lang) => { setLang(v); localStorage.setItem('dalei-lang-v2', v); setCopied(false); };
  const copyPrompt = async () => {
    try { await navigator.clipboard.writeText(prompt); setCopied(true); setCopyFailed(false); }
    catch { setCopyFailed(true); setCopied(false); }
  };
  const filename = demo === 'four' ? 'four-cities' : 'two-cities';
  return <div className="maproute-page min-h-screen bg-paper text-ink">
    <header className="mr-nav">
      <button onClick={onHome} className="mr-home">← {t('大雷的主页', 'Dalei / Home')}</button>
      <nav aria-label={t('语言', 'Language')} className="mr-languages">
        {(['zh', 'en', 'zhHant'] as Lang[]).map(v => <button key={v} aria-pressed={lang === v} onClick={() => changeLang(v)}>{v === 'zh' ? '简' : v === 'zhHant' ? '繁' : 'EN'}</button>)}
      </nav>
    </header>
    <main>
      <section className="mr-intro">
        <p className="mr-eyebrow">OPEN-SOURCE SKILL / 2026</p>
        <div className="mr-heading"><h1>{t('把行程，画成一段旅程。', 'Give your journey a little world.')}</h1>
          <p>{t('微缩城市从地图中浮现，飞机逐站划出航线。把双城直达、多城停留和返程，做成可以直接放进剪辑的 B-roll。', 'Miniature cities rise from the map as a plane traces your itinerary. Turn direct trips, stopovers and return journeys into B-roll ready for your edit.')}</p></div>
        <div className="mr-actions"><a className="mr-primary" href={ZIP}>{t('下载 Skill', 'Download skill')} ↗</a><a href={REPO} target="_blank" rel="noreferrer">{t('GitHub 源码', 'View on GitHub')} ↗</a></div>
      </section>
      <section className="mr-screen" aria-label={t('视频演示', 'Video demos')}>
        <div className="mr-screen-top"><span>MAP ROUTE B-ROLL</span><div className="mr-tabs" aria-label={t('选择演示', 'Choose a demo')}>
          <button aria-pressed={demo === 'two'} onClick={() => setDemo('two')}>{t('双城直达', 'Two cities')} / 08s</button>
          <button aria-pressed={demo === 'four'} onClick={() => setDemo('four')}>{t('四城往返', 'Round trip')} / 16s</button>
        </div></div>
        <video key={demo} controls playsInline preload="metadata" poster={`/map-route-broll/${demo === 'four' ? 'cover' : 'two-cities'}.webp`} aria-label={demo === 'four' ? t('旅顺经北京、天津、青岛返回旅顺', 'Lüshun, Beijing, Tianjin, Qingdao and back') : t('旅顺飞往北京', 'Lüshun to Beijing')}>
          <source src={`/map-route-broll/${filename}.mp4`} type="video/mp4" />
          <a href={`/map-route-broll/${filename}.mp4`}>{t('下载视频观看', 'Download this video')}</a>
        </video>
        <div className="mr-caption"><span>{demo === 'four' ? t('旅顺 → 北京 → 天津 → 青岛 → 旅顺', 'Lüshun → Beijing → Tianjin → Qingdao → Lüshun') : t('旅顺 → 北京', 'Lüshun → Beijing')}</span><a href={`/map-route-broll/${filename}.mp4`} download>{t('下载 MP4', 'Download MP4')} ↓</a></div>
      </section>
      <div className="mr-specs"><span>1920 × 1080</span><span>30 FPS</span><span>{t('静音，方便配口播', 'Silent, ready for voiceover')}</span><span>HTML / SVG / MP4</span></div>
      <section className="mr-details">
        <div><p className="mr-eyebrow">MAKE IT YOURS</p><h2>{t('下一站，由你决定。', 'Your next stop. Your story.')}</h2>
          <p>{t('告诉 Agent 城市、顺序和风格。背景、城市文字、飞机与路线分层制作，方便继续改路线、改节奏，或用于下一条视频。', 'Give your agent the cities, order and visual style. The background, labels, plane and routes stay separate, so you can revise the itinerary or reuse the setup for your next video.')}</p>
          <ol className="mr-steps"><li>{t('下载后，将 map-route-broll 文件夹放入 Agent 的技能目录。', 'Download and place the map-route-broll folder in your agent’s skills directory.')}</li><li>{t('重新打开会话，复制右侧提示开始制作。', 'Open a new session and use the prompt beside this guide.')}</li><li>{t('查看演示与源码，替换自己的城市和地图素材。', 'Use the demos and source to adapt the cities and map.')}</li></ol>
          <a className="mr-text-link" href={`${REPO}#安装`} target="_blank" rel="noreferrer">{t('完整安装说明与运行环境', 'Setup guide and requirements')} ↗</a>
        </div>
        <div className="mr-prompt"><div className="mr-prompt-heading"><span>{t('试试这句提示', 'TRY THIS PROMPT')}</span><button onClick={copyPrompt}>{copied ? t('已复制 ✓', 'Copied ✓') : t('复制', 'Copy')}</button></div><p>{prompt}</p><p className="mr-copy-status" role="status">{copyFailed ? t('复制未成功，请选中上方文字手动复制。', 'Copy failed. Select and copy the text above.') : copied ? t('可粘贴到已安装 Skill 的 Agent 中。', 'Paste into an agent with the skill installed.') : ''}</p></div>
      </section>
      <footer className="mr-footer"><p>{t('地图与地标为艺术化微缩素材，航线表示城市行程，不代表真实航班轨迹。', 'Maps and landmarks are artistic miniatures. Routes illustrate an itinerary, not actual flight tracks.')}</p><a href="/skills">{t('浏览更多 Skills', 'Explore more skills')} ↗</a></footer>
    </main>
  </div>;
}
