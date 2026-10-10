import { EDITORIAL_LANGUAGE_NOTE, useNewsletterLanguage } from './locale';
import LanguageSelector from './LanguageSelector';
import React, { useEffect, useState } from 'react';
import { allPrompts, handoffCard, blankPracticeCard, fictionalSource, firstCardLesson, promptRounds } from './practice-card-content';
import './practice-card.css';

export default function PracticeCard({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { lang, setLang, t, languageTag } = useNewsletterLanguage();
  const [copying, setCopying] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ key: 'copied' | 'failed' | 'download-failed'; name?: string } | null>(null);
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
  const downloadStarter = () => {
    try {
      const contents = [
        '# ' + t('第一张 AI 实战卡'),
        '2026-10-06 · ' + t('原创虚构练习；不代表模型实测效果。'),
        '## ' + t('原创样例') + '\n' + t(fictionalSource),
        '## ' + t('三轮提示') + '\n' + t(allPrompts),
        '## ' + t('空白卡') + '\n' + t(blankPracticeCard),
        '## ' + t('八行交接卡') + '\n' + t(handoffCard),
        '## ' + t('检查方法') + '\n' + [
          t('每个数字和日期，能不能回到原文找到依据？'),
          t('猜测有没有被写成确定结论？'),
          t('缺项有没有明确说“暂时不知道”？'),
          t('下一步是否仍由你来核实和确认？'),
        ].map(item => '- [ ] ' + item).join('\n'),
        'https://dailycosmos.net/newsletter/first-ai-card',
      ].join('\n\n');
      const url = URL.createObjectURL(new Blob([contents], { type: 'text/markdown;charset=utf-8' }));
      const anchor = document.createElement('a');
      anchor.href = url; anchor.download = `dalei-ai-starter-${lang}.md`;
      document.body.appendChild(anchor); anchor.click(); anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { setNotice({ key: 'download-failed' }); }
  };
  return (
    <div className="practice-card" lang={languageTag}>
      <a className="practice-card__skip" href="#practice-card-main">{t("跳到正文")}</a>
      <header className="practice-card__header practice-card__wrap">
        <a href="/" onClick={event => navigate(event, '/')}>{t("大雷")}<span>DA LEI</span></a>
        <a href="/newsletter" onClick={event => navigate(event, '/newsletter')}>{t("免费订阅 ↗")}</a>
        <LanguageSelector lang={lang} setLang={setLang} />
      </header>
      <main id="practice-card-main" className="practice-card__wrap">
        <p className="practice-card__preview">{t("公开资源 · 原创 AI 实战卡")}</p>
        <p className="nl-language-note">{t(EDITORIAL_LANGUAGE_NOTE)}</p>
        <div className="practice-card__intro">
          <p className="practice-card__eyebrow">{t("大雷早上好·AI 实战信 / 第一课")}</p>
          <h1>{t("第一张 AI 实战卡")}</h1>
          <p className="practice-card__lead">{t("今天交给 AI 一个清楚的小任务，拿回能检查的结果")}</p>
          <p>{t("读一个样例，填八行交接卡，再检查结果。纸笔或已有笔记就能开始，AI 可选。")}</p>
          <div className="practice-card__actions" aria-label={t("领取新人练习")}>
            <button className="practice-card__button" type="button" disabled={copying !== null} onClick={() => copy('八行交接卡', t(handoffCard))}>{t("复制八行交接卡")}</button>
            <button className="practice-card__button practice-card__button--secondary" type="button" onClick={downloadStarter}>{t("下载新人练习包（Markdown）")}</button>
          </div>
          <p className="practice-card__notice" role="status" aria-live="polite">{notice?.key === 'download-failed' ? t('下载未完成。请复制卡片或使用浏览器打印保存。') : notice?.key === 'failed' ? t('当前浏览器未允许复制。请直接选中下方文字复制；内容仍可完整阅读。') : notice ? (lang === 'en' ? `Copied ${t(notice.name!)}. Paste it into your own notes.` : t('已复制') + t(notice.name!) + t('。可以粘贴到你自己的笔记中。')) : ''}</p>
          <nav className="practice-card__steps" aria-label={t("三步开始")}>
            <a href="#practice-example-title">{t("1 · 读样例")}</a>
            <a href="#handoff-title">{t("2 · 填交接卡")}</a>
            <a href="#practice-check-title">{t("3 · 检查结果")}</a>
          </nav>
          <p className="practice-card__disclosure">{t("这是公开资源预览。访问本页不代表邮箱已确认或已订阅；本页不收集邮箱。")}</p>
          <details className="practice-card__delivery"><summary>{t("邮件与确认说明")}</summary><p>{t("确认后的欢迎内容在这里开始；访问此页本身不能证明邮箱已确认。先保存你的交接卡，日报随后按审核后的日历排期发送，不是从订阅当天自动补发七课。")}</p></details>
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
        <section className="practice-card__lesson" aria-labelledby="handoff-title">
          <div className="practice-card__section-heading"><span>{t("06 / 新人交接卡")}</span><h2 id="handoff-title">{t("今天交给 AI 一个清楚的小任务，拿回能检查的结果")}</h2></div>
          <p>{t("读样例 → 填八行 → 检查再保存。纸笔或已有笔记即可，AI 可选。")}</p>
          <blockquote>{t("示意交接：只整理上方虚构活动原文，交一张事实、猜测和缺项分开的卡到自己的笔记，状态为待自己核对；不发布、不补造天气或场地。")}</blockquote>
          <button className="practice-card__button" type="button" disabled={copying !== null} onClick={() => copy('八行交接卡', t(handoffCard))}>{t("复制八行交接卡")}</button>{' '}
          <button className="practice-card__button" type="button" onClick={downloadStarter}>{t("下载新人练习包（Markdown）")}</button>
          <pre className="practice-card__blank">{t(handoffCard)}</pre>
          <p>{t("三个小测试：材料齐全只做草稿，接到待审；缺天气，整理已知信息并留下问题；要求直接发群，暂停发送并等待确认。请分别写出继续什么、暂停什么、缺什么。")}</p>
          <p className="practice-card__source">{t("这张卡是原创方法练习，不是模型效果证明。写下停止条件，也不代表软件已实现权限拦截。")}</p>
        </section>
      </main>
      <footer className="practice-card__footer practice-card__wrap">
        <p>{t("大雷早上好·AI 实战信 · 每日中文实践")}</p>
        <a href="https://www.youtube.com/@dalei2025" target="_blank" rel="noopener noreferrer">{t("继续看大雷的公开视频 ↗")}</a>
      </footer>
    </div>
  );
}
