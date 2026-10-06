import { EDITORIAL_LANGUAGE_NOTE, useNewsletterLanguage } from './locale';
import LanguageSelector from './LanguageSelector';
import React, { useEffect, useState } from 'react';
import { allPrompts, blankPracticeCard, fictionalSource, firstCardLesson, promptRounds } from './practice-card-content';
import './practice-card.css';

export default function PracticeCard({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { lang, setLang, t, languageTag } = useNewsletterLanguage();
  const [copying, setCopying] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ key: 'copied' | 'failed'; name?: string } | null>(null);
  useEffect(() => {
    const existing = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    const previous = existing?.getAttribute('content');
    const robots = existing ?? document.createElement('meta');
    robots.name = 'robots'; robots.content = 'noindex, nofollow';
    if (!existing) document.head.appendChild(robots);
    return () => {
      if (!existing) robots.remove();
      else if (previous === null) robots.removeAttribute('content');
      else if (previous !== undefined) robots.content = previous;
    };
  }, []);
  const navigate = (event: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && event.button === 0) {
      event.preventDefault(); onNavigate(path);
    }
  };
  const copy = async (name: string, text: string) => {
    if (copying) return;
    setCopying(name);
    try { await navigator.clipboard.writeText(text); setNotice({ key: 'copied', name }); }
    catch { setNotice({ key: 'failed' }); }
    finally { setCopying(null); }
  };
  return (
    <div className="practice-card" lang={languageTag}>
      <a className="practice-card__skip" href="#practice-card-main">{t("跳到正文")}</a>
      <header className="practice-card__header practice-card__wrap">
        <a href="/" onClick={event => navigate(event, '/')}>{t("大雷")}<span>DA LEI</span></a>
        <a href="/newsletter" onClick={event => navigate(event, '/newsletter')}>{t("实战信预览 ↗")}</a>
        <LanguageSelector lang={lang} setLang={setLang} />
      </header>
      <main id="practice-card-main" className="practice-card__wrap">
        <p className="practice-card__preview">{t("公开资源 · 原创 AI 实战卡")}</p>
        <p className="nl-language-note">{t(EDITORIAL_LANGUAGE_NOTE)}</p>
        <div className="practice-card__intro">
          <p className="practice-card__eyebrow">{t("大雷早上好·AI 实战信 / 第一课")}</p>
          <h1>{t("第一张 AI 实战卡")}</h1>
          <p className="practice-card__lead">{t("让 AI 先整理，再由你确认")}</p>
          <p>{t("原创样例、三轮提示、空白卡和检查方法都在这一页。先做出一张你能核对的小卡片。")}</p>
          <p className="practice-card__disclosure">{t("这是公开资源预览。访问本页不代表邮箱已确认或已订阅；本页不收集邮箱。")}</p>
        </div>

        <section className="practice-card__lesson" aria-labelledby="practice-lesson-title">
          <div className="practice-card__section-heading"><span>{t("01 / 第一课")}</span><h2 id="practice-lesson-title">{t("先把三种信息分开")}</h2></div>
          <div className="practice-card__lesson-grid">{firstCardLesson.map(section => <div key={section.label}><h3>{t(section.label)}</h3><p>{t(section.text)}</p></div>)}</div>
          <p className="practice-card__source">{t("依据：下方原创虚构样例及逐项检查方法 · 2026-10-06。这里展示整理方法，不声称模型实测表现。")}</p>
        </section>

        <section aria-labelledby="practice-example-title">
          <div className="practice-card__section-heading"><span>{t("02 / 原创样例")}</span><h2 id="practice-example-title">{t("准备一场 AI 入门分享")}</h2></div>
          <p className="practice-card__source">{t("虚构练习材料，无真实个人或活动数据。以下是按给定原文整理的示意答案。")}</p>
          <blockquote>{t(fictionalSource)}</blockquote>
          <div className="practice-card__categories">
            <article><h3>{t("事实")}</h3><p>{t("原文写明的计划：周六上午、45 分钟、预算 300 元；目前 6 人明确回复会来。")}</p><p className="practice-card__source">{t("数字与安排只以此练习原文为依据。")}</p></article>
            <article><h3>{t("猜测")}</h3><p>{t("“20 人会来”是朋友的预计，不能当作已确认人数。")}</p><p className="practice-card__source">{t("保留推断者和“预计”的性质。")}</p></article>
            <article><h3>{t("缺项")}</h3><p>{t("场地与天气暂时不知道。可先核实场地，判断计划是否具备继续安排的条件。")}</p><p className="practice-card__source">{t("没有依据的内容留空，写出核实问题。")}</p></article>
          </div>
        </section>

        <section aria-labelledby="practice-prompts-title">
          <div className="practice-card__section-heading"><span>{t("03 / 三轮提示")}</span><h2 id="practice-prompts-title">{t("整理 → 核对 → 留下一张卡")}</h2></div>
          <button className="practice-card__button" type="button" disabled={copying !== null} onClick={() => copy('三轮提示', t(allPrompts))}>{t("复制三轮提示")}</button>
          <div className="practice-card__prompts">{promptRounds.map((round, index) => <article key={round.title}><h3>{t("第")}{index + 1} {t("轮 ·")}{t(round.title)}</h3><pre>{t(round.text)}</pre></article>)}</div>
        </section>

        <section aria-labelledby="practice-blank-title">
          <div className="practice-card__section-heading"><span>{t("04 / 空白卡")}</span><h2 id="practice-blank-title">{t("带走这个骨架，再换成自己的材料")}</h2></div>
          <button className="practice-card__button" type="button" disabled={copying !== null} onClick={() => copy('空白卡', t(blankPracticeCard))}>{t("复制空白卡")}</button>
          <pre className="practice-card__blank">{t(blankPracticeCard)}</pre>
        </section>

        <section className="practice-card__check" aria-labelledby="practice-check-title">
          <div className="practice-card__section-heading"><span>{t("05 / 检查方法")}</span><h2 id="practice-check-title">{t("完成前，亲自问这四句")}</h2></div>
          <ol><li>{t("每个数字和日期，能不能回到原文找到依据？")}</li><li>{t("猜测有没有被写成确定结论？")}</li><li>{t("缺项有没有明确说“暂时不知道”？")}</li><li>{t("下一步是否仍由你来核实和确认？")}</li></ol>
          <p>{t("把一处不满足检查的结果修正，再保存这张卡。日期和原文依据一起留下，方便以后重新判断。")}</p>
        </section>
        <p className="practice-card__notice" role="status" aria-live="polite">{notice?.key === 'failed' ? t('当前浏览器未允许复制。请直接选中下方文字复制；内容仍可完整阅读。') : notice ? (lang === 'en' ? `Copied ${t(notice.name!)}. Paste it into your own notes.` : t('已复制') + t(notice.name!) + t('。可以粘贴到你自己的笔记中。')) : ''}</p>
      </main>
      <footer className="practice-card__footer practice-card__wrap">
        <p>{t("大雷早上好·AI 实战信 · 每日中文实践")}</p>
        <a href="https://www.youtube.com/@dalei2025" target="_blank" rel="noopener noreferrer">{t("继续看大雷的公开视频 ↗")}</a>
      </footer>
    </div>
  );
}
