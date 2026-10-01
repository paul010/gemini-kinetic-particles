import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft } from '@phosphor-icons/react/ArrowLeft';
import { ArrowUpRight } from '@phosphor-icons/react/ArrowUpRight';
import { Moon } from '@phosphor-icons/react/Moon';
import { Sun } from '@phosphor-icons/react/Sun';
import './lifequest.css';

type Lang = 'zh' | 'zhHant' | 'en';
const PLAY_URL = 'https://ai-passport.folotoy.cn/en/plays/802/';
const PHOTOS = [
  { name: 'home', zh: '完整的你，今天的新关卡', en: 'Your own card. A fresh daily quest.', altZh: '人生冒险真机首页，完整头像、经验与今日小怪；生日已遮挡', altEn: 'Physical Life Quest home with the full portrait, XP and daily monster; birthday masked' },
  { name: 'quests', zh: '小事做完，成长看得见', en: 'Small actions become visible progress.', altZh: '真机任务列表与三项完成后的经验反馈', altEn: 'Physical task list with the three-task completion feedback' },
  { name: 'life-tokens', zh: '用生命词元，换个角度看时间', en: 'See time from a different perspective.', altZh: '真机生命词元页，说明一分钟等于一个自定义 LT', altEn: 'Physical Life Token page explaining the custom one-minute LT unit' },
  { name: 'tipo', zh: 'Tipo 大招，清除一格干扰', en: 'Tipo helps clear one distraction.', altZh: '真机原创伙伴与 Tipo 大招入口；生日已遮挡', altEn: 'Physical original buddy and Tipo move on home; birthday masked' },
];

function Photo({ src, alt, eager = false, unavailable }: { src: string; alt: string; eager?: boolean; unavailable: string }) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  return <div className="lq-photo" data-state={status} aria-busy={status === 'loading'}>
    {status === 'error' ? <p role="img" aria-label={alt}>{unavailable}</p> :
      <img src={src} width="900" height="1200" alt={alt} loading={eager ? 'eager' : 'lazy'} fetchPriority={eager ? 'high' : 'auto'} decoding="async" onLoad={() => setStatus('ready')} onError={() => setStatus('error')} />}
  </div>;
}

export default function LifeQuest({ onHome }: { onHome: () => void }) {
  const [lang, setLang] = useState<Lang>(() => {
    try { const value = localStorage.getItem('dalei-lang-v2'); return value === 'zh' || value === 'zhHant' ? value : 'en'; }
    catch { return 'en'; }
  });
  const [convert, setConvert] = useState<((s: string) => string) | null>(null);
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
  const [selected, setSelected] = useState(0);
  const photoRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (lang !== 'zhHant') return;
    let active = true;
    import('opencc-js').then(m => { if (active) setConvert(() => m.Converter({ from: 'cn', to: 'tw' })); }).catch(() => {});
    return () => { active = false; };
  }, [lang]);
  useEffect(() => {
    const previous = document.documentElement.lang;
    document.documentElement.lang = lang === 'zhHant' ? 'zh-Hant' : lang === 'zh' ? 'zh-CN' : 'en';
    return () => { document.documentElement.lang = previous; };
  }, [lang]);
  const t = (zh: string, en: string) => lang === 'en' ? en : lang === 'zhHant' && convert ? convert(zh) : zh;
  const changeLang = (value: Lang) => { setLang(value); try { localStorage.setItem('dalei-lang-v2', value); } catch {} };
  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next); document.documentElement.dataset.theme = next;
    try { localStorage.setItem('dalei-theme', next); } catch {}
  };
  const photo = PHOTOS[selected];
  const selectPhoto = (index: number) => {
    setSelected(index);
    const bounds = photoRef.current?.getBoundingClientRect();
    if (bounds && (bounds.top < 0 || bounds.bottom > window.innerHeight)) {
      photoRef.current?.scrollIntoView({ block: 'center', behavior: 'instant' });
    }
  };
  const unavailable = t('图片暂时无法加载，请刷新页面。', 'Image unavailable. Please refresh the page.');
  return <div className="lifequest-page">
    <header className="lq-nav">
      <button className="lq-home" onClick={onHome}><ArrowLeft aria-hidden="true" />{t('大雷的主页', 'Dalei / Home')}</button>
      <nav aria-label={t('页面偏好', 'Page preferences')}>
        {(['zh', 'zhHant', 'en'] as Lang[]).map(value => <button key={value} aria-pressed={lang === value} aria-label={value === 'zh' ? '简体中文' : value === 'zhHant' ? '繁體中文' : 'English'} onClick={() => changeLang(value)}>{value === 'zh' ? '简' : value === 'zhHant' ? '繁' : 'EN'}</button>)}
        <button className="lq-theme" aria-label={theme === 'light' ? t('切换深色模式', 'Switch to dark mode') : t('切换浅色模式', 'Switch to light mode')} onClick={toggleTheme}>{theme === 'light' ? <Moon aria-hidden="true" /> : <Sun aria-hidden="true" />}</button>
      </nav>
    </header>
    <main>
      <section className="lq-hero" aria-labelledby="lq-title">
        <div className="lq-hero-copy">
          <p className="lq-eyebrow">{t('人生冒险', 'LIFE QUEST')}</p>
          <h1 id="lq-title"><span>{t('每天一小步，', 'Little actions.')}</span><span>{t('打败拖延怪。', 'Real progress.')}</span></h1>
          <p className="lq-intro">{t('把人生时间卡，变成每日小冒险。现实完成行动，再让经验和成长留在口袋里。', 'Turn a personal time card into a daily adventure. Real-world actions become progress you can keep.')}</p>
          <div className="lq-actions"><a className="lq-primary" href={PLAY_URL} target="_blank" rel="noreferrer">{t('社区玩法', 'Community app')}<ArrowUpRight aria-hidden="true" /></a><a className="lq-secondary" href="#life-quest-controls">{t('怎么操作', 'How to play')}</a></div>
        </div>
        <figure className="lq-hero-photo" ref={photoRef}>
          <Photo key={photo.name} src={`/life-quest/real-${photo.name}.webp`} alt={t(photo.altZh, photo.altEn)} eager unavailable={unavailable} />
          <figcaption aria-live="polite">{t(photo.zh, photo.en)}<span>{t('真机实拍，生日已遮挡', 'Physical-device photo; birthday masked')}</span></figcaption>
        </figure>
      </section>

      <section className="lq-gallery" aria-label={t('选择真机展示画面', 'Choose a physical-device photo')}>
        {PHOTOS.map((item, index) => <button key={item.name} aria-pressed={selected === index} onClick={() => selectPhoto(index)}>
          <img src={`/life-quest/real-${item.name}.webp`} width="900" height="1200" loading="lazy" decoding="async" alt="" />
          <span>{t(['营地首页', '今日任务', '生命词元', 'Tipo 伙伴'][index], ['Camp', 'Daily tasks', 'Life Tokens', 'Tipo buddy'][index])}</span>
        </button>)}
        <p className="lq-gallery-note">{t('10 月 1 日实拍。画面中的人生数字和任务状态仅作演示，不是本人真实年龄或完成现实行动的证明。', 'Photographed on October 1. Life numbers and task states are demonstration data, not personal age or proof of real-world activities.')}</p>
      </section>

      <section className="lq-day" aria-labelledby="lq-day-title">
        <div><h2 id="lq-day-title">{t('你做的小事，\n会留下经验。', 'Small efforts.\nLasting progress.')}</h2><p>{t('不和别人竞赛，只让今天多一点行动。漏一天不扣分，误打卡也可以撤销。', 'No race against anyone else. Missed days never deduct XP, and mistaken check-ins can be undone.')}</p></div>
        <div className="lq-quest-list">
          <dl><div><dt>{t('学习 20 分钟', 'Learn for 20 minutes')}</dt><dd>+20 XP</dd></div><div><dt>{t('活动或休息 15 分钟', 'Move or rest for 15 minutes')}</dt><dd>+20 XP</dd></div><div><dt>{t('做一个小作品', 'Make one small thing')}</dt><dd>+20 XP</dd></div></dl>
          <p className="lq-bonus">{t('三项全完成，再加 40 XP', 'All three complete? Add 40 XP.')}<span>{t('每 100 XP 升一级', 'Every 100 XP, one new level.')}</span></p>
        </div>
      </section>

      <section className="lq-archive" aria-labelledby="lq-archive-title">
        <figure><Photo src="/life-quest/cover-illustration.webp" alt={t('人生倒计时也能打怪，原创像素角色与三项任务的 AI 玩法示意海报', 'Illustrated Life Quest poster with original pixel characters and the three real activity categories')} unavailable={unavailable} /><figcaption>{t('AI 玩法示意图，不是设备截图', 'AI gameplay illustration, not a device screenshot')}</figcaption></figure>
        <div><h2 id="lq-archive-title">{t('看见时间，\n也期待下一关。', 'Reflect on time.\nLook forward, too.')}</h2><p>{t('从年月周天到生日、千日里程碑，给时间一个可以回看的刻度。Tipo 每日清除一格干扰，成长还是来自你的行动。', 'Calendar numbers and milestones give time a shape. Tipo clears one daily distraction, but progress still comes from your own actions.')}</p>
          <dl className="lq-definitions"><div><dt>1 {t('分钟', 'minute')} = 1 LT</dt><dd>{t('生命词元是自定义时间单位，不是模型词元，也不是钱。', 'Life Tokens are custom time units, not model tokens or money.')}</dd></div><div><dt>{t('计划是参考，不是预测', 'A plan, not a prediction')}</dt><dd>{t('计划年龄不是寿命预测，人口对照不是个人能力排行榜。', 'Planning age does not predict lifespan. Population references do not rank your ability.')}</dd></div></dl>
        </div>
      </section>

      <section className="lq-controls" id="life-quest-controls" aria-labelledby="lq-controls-title">
        <h2 id="lq-controls-title">{t('拿起来，就能开始。', 'Pick it up. Find your next small step.')}</h2>
        <div className="lq-control-grid"><div><h3>{t('三键就够', 'Three simple buttons')}</h3><p>{t('上／下选择，OK 确认，长按 OK 返回营地或取消编辑。现实完成任务后，再确认打卡。', 'UP/DOWN selects, OK confirms, and holding OK returns to Camp or cancels an edit. Check in only after the real activity.')}</p></div><div><h3>{t('第一次，先核对日期', 'Check the date first')}</h3><p>{t('完全断电后先到设置校准日期。新安装默认生日为 2000 年示例，已有存档不会自动替换。', 'After full power loss, confirm the date in Settings. New installations use a year-2000 example birthday; existing saves are preserved.')}</p></div></div>
        <details><summary>{t('声音、休眠和重置', 'Sound, sleep and reset')}</summary><p>{t('音效可以静音，动画可以减少；空闲五分钟熄屏，任意键唤醒后先松开。重置游戏需要再次确认，只清理经验和任务，保留资料；重置不可撤销。', 'Mute sounds or reduce motion in Settings. Five idle minutes turns the screen off; release the wake key before navigating. Confirmed game reset clears tasks and XP, not your profile; that reset cannot be undone.')}</p></details>
        <details><summary>{t('版本、隐私与独立项目', 'Versions, privacy and the independent project')}</summary><p>{t('独立于 AB-731 维护，固件仓库暂时私有。图集展示中文 1.3 界面，新构建为 1.3.1；社区入口只提供审核通过的公开版本，新版通过审核后才会替换。照片已遮挡生日并去除元数据。网页设计稿与设备存档独立，此作品没有接入 AI 服务或自动上传个人资料。', 'Maintained independently of AB-731; the firmware repository is private. Photos show the Chinese 1.3 UI; the new build is 1.3.1. The community page offers only approved releases, and updates replace them after review. Birthdays are masked and image metadata removed. Browser-design saves are separate from device saves. No AI service or automatic personal-data upload is connected.')}</p></details>
      </section>
    </main>
    <footer className="lq-footer">{t('大雷的独立作品。每天完成一件小事，也值得记录。', 'An independent project by Dalei. One small action is worth remembering.')}</footer>
  </div>;
}
