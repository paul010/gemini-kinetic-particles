import React, { useEffect, useState } from 'react';
import { allPrompts, blankPracticeCard, fictionalSource, firstCardLesson, promptRounds } from './practice-card-content';
import './practice-card.css';

export default function PracticeCard({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [copying, setCopying] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  useEffect(() => {
    const previousLang = document.documentElement.lang;
    document.documentElement.lang = 'zh-CN';
    const existing = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    const previous = existing?.getAttribute('content');
    const robots = existing ?? document.createElement('meta');
    robots.name = 'robots'; robots.content = 'noindex, nofollow';
    if (!existing) document.head.appendChild(robots);
    return () => {
      document.documentElement.lang = previousLang;
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
    try { await navigator.clipboard.writeText(text); setNotice(`已复制${name}。可以粘贴到你自己的笔记中。`); }
    catch { setNotice('当前浏览器未允许复制。请直接选中下方文字复制；内容仍可完整阅读。'); }
    finally { setCopying(null); }
  };
  return (
    <div className="practice-card" lang="zh-CN">
      <a className="practice-card__skip" href="#practice-card-main">跳到正文</a>
      <header className="practice-card__header practice-card__wrap">
        <a href="/" onClick={event => navigate(event, '/')}>大雷 <span>DA LEI</span></a>
        <a href="/newsletter" onClick={event => navigate(event, '/newsletter')}>实战信预览 ↗</a>
      </header>
      <main id="practice-card-main" className="practice-card__wrap">
        <p className="practice-card__preview">资源预览 · 原创 AI 实战卡 · 订阅入口筹备中</p>
        <div className="practice-card__intro">
          <p className="practice-card__eyebrow">大雷早上好·AI 实战信 / 第一课</p>
          <h1>第一张 AI 实战卡</h1>
          <p className="practice-card__lead">让 AI 先整理，再由你确认</p>
          <p>原创样例、三轮提示、空白卡和检查方法都在这一页。先做出一张你能核对的小卡片。</p>
          <p className="practice-card__disclosure">这是公开资源预览。访问本页不代表邮箱已确认或已订阅；本页不收集邮箱。</p>
        </div>

        <section className="practice-card__lesson" aria-labelledby="practice-lesson-title">
          <div className="practice-card__section-heading"><span>01 / 第一课</span><h2 id="practice-lesson-title">先把三种信息分开</h2></div>
          <div className="practice-card__lesson-grid">{firstCardLesson.map(section => <div key={section.label}><h3>{section.label}</h3><p>{section.text}</p></div>)}</div>
          <p className="practice-card__source">依据：下方原创虚构样例及逐项检查方法 · 2026-10-06。这里展示整理方法，不声称模型实测表现。</p>
        </section>

        <section aria-labelledby="practice-example-title">
          <div className="practice-card__section-heading"><span>02 / 原创样例</span><h2 id="practice-example-title">准备一场 AI 入门分享</h2></div>
          <p className="practice-card__source">虚构练习材料，无真实个人或活动数据。以下是按给定原文整理的示意答案。</p>
          <blockquote>{fictionalSource}</blockquote>
          <div className="practice-card__categories">
            <article><h3>事实</h3><p>原文写明的计划：周六上午、45 分钟、预算 300 元；目前 6 人明确回复会来。</p><p className="practice-card__source">数字与安排只以此练习原文为依据。</p></article>
            <article><h3>猜测</h3><p>“20 人会来”是朋友的预计，不能当作已确认人数。</p><p className="practice-card__source">保留推断者和“预计”的性质。</p></article>
            <article><h3>缺项</h3><p>场地与天气暂时不知道。可先核实场地，判断计划是否具备继续安排的条件。</p><p className="practice-card__source">没有依据的内容留空，写出核实问题。</p></article>
          </div>
        </section>

        <section aria-labelledby="practice-prompts-title">
          <div className="practice-card__section-heading"><span>03 / 三轮提示</span><h2 id="practice-prompts-title">整理 → 核对 → 留下一张卡</h2></div>
          <button className="practice-card__button" type="button" disabled={copying !== null} onClick={() => copy('三轮提示', allPrompts)}>复制三轮提示</button>
          <div className="practice-card__prompts">{promptRounds.map((round, index) => <article key={round.title}><h3>第 {index + 1} 轮 · {round.title}</h3><pre>{round.text}</pre></article>)}</div>
        </section>

        <section aria-labelledby="practice-blank-title">
          <div className="practice-card__section-heading"><span>04 / 空白卡</span><h2 id="practice-blank-title">带走这个骨架，再换成自己的材料</h2></div>
          <button className="practice-card__button" type="button" disabled={copying !== null} onClick={() => copy('空白卡', blankPracticeCard)}>复制空白卡</button>
          <pre className="practice-card__blank">{blankPracticeCard}</pre>
        </section>

        <section className="practice-card__check" aria-labelledby="practice-check-title">
          <div className="practice-card__section-heading"><span>05 / 检查方法</span><h2 id="practice-check-title">完成前，亲自问这四句</h2></div>
          <ol><li>每个数字和日期，能不能回到原文找到依据？</li><li>猜测有没有被写成确定结论？</li><li>缺项有没有明确说“暂时不知道”？</li><li>下一步是否仍由你来核实和确认？</li></ol>
          <p>把一处不满足检查的结果修正，再保存这张卡。日期和原文依据一起留下，方便以后重新判断。</p>
        </section>
        <p className="practice-card__notice" role="status" aria-live="polite">{notice}</p>
      </main>
      <footer className="practice-card__footer practice-card__wrap">
        <p>大雷早上好·AI 实战信 · 订阅入口筹备中</p>
        <a href="https://www.youtube.com/@dalei2025" target="_blank" rel="noopener noreferrer">继续看大雷的公开视频 ↗</a>
      </footer>
    </div>
  );
}
