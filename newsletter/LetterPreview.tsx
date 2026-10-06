import React from 'react';
import { ArrowUpRight } from '@phosphor-icons/react/ArrowUpRight';
import type { NewsletterLetter } from './content';

/** A useful, sourced letter can stand alone without a related video. */
export default function LetterPreview({ letter }: { letter: NewsletterLetter }) {
  return (
    <article id="sample-letter" className="nl-letter" aria-labelledby="sample-title">
      <div className="nl-letter-meta"><span>示例草稿 · 未发送</span><time dateTime={letter.date}>{letter.date}</time></div>
      <h2 id="sample-title">{letter.title}</h2>
      <p className="nl-letter-greeting">早上好，</p>
      {letter.sections.map((section) => <section key={section.label}>
        <h3>{section.label}</h3><p>{section.text}</p>
      </section>)}
      <div className="nl-evidence">
        <h3>证据与延伸</h3>
        <a href={letter.source.url} target="_blank" rel="noopener noreferrer">{letter.source.label}<ArrowUpRight aria-hidden="true" /></a>
        <p>2026-10-05 核查。原创方法示例，不含模型实测或性能承诺。</p>
        {letter.video && <>
          <h3>相关公开视频</h3>
          <a href={letter.video.url} target="_blank" rel="noopener noreferrer">{letter.video.label}<ArrowUpRight aria-hidden="true" /></a>
          <p>旧视频 · {letter.video.date} · 不作为当日模型身份或能力证据</p>
        </>}
      </div>
      <p className="nl-signature">明天继续，今天先试一步。<br /><strong>大雷</strong></p>
    </article>
  );
}
