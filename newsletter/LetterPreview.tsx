import { useNewsletterLanguage } from './locale';
import React from 'react';
import { ArrowUpRight } from '@phosphor-icons/react/ArrowUpRight';
import type { NewsletterLetter } from './content';

/** A useful, sourced letter can stand alone without a related video. */
export default function LetterPreview({ letter }: { letter: NewsletterLetter }) {
  const { t } = useNewsletterLanguage();
  return (
    <article id="sample-letter" className="nl-letter" aria-labelledby="sample-title">
      <div className="nl-letter-meta"><span>{t("示例草稿 · 未发送")}</span><time dateTime={letter.date}>{letter.date}</time></div>
      <h2 id="sample-title">{t(letter.title)}</h2>
      <p className="nl-letter-greeting">{t("早上好，")}</p>
      {letter.sections.map((section) => <section key={section.label}>
        <h3>{t(section.label)}</h3><p>{t(section.text)}</p>
      </section>)}
      <div className="nl-evidence">
        <h3>{t("证据与延伸")}</h3>
        <a href={letter.source.url} target="_blank" rel="noopener noreferrer">{t(letter.source.label)}<ArrowUpRight aria-hidden="true" /></a>
        <p>{t("2026-10-05 核查。原创方法示例，不含模型实测或性能承诺。")}</p>
        {letter.video && <>
          <h3>{t("相关公开视频")}</h3>
          <a href={letter.video.url} target="_blank" rel="noopener noreferrer">{t(letter.video.label)}<ArrowUpRight aria-hidden="true" /></a>
          <p>{t("旧视频 ·")}{letter.video.date} {t("· 不作为当日模型身份或能力证据")}</p>
        </>}
      </div>
      <p className="nl-signature">{t("明天继续，今天先试一步。")}<br /><strong>{t("大雷")}</strong></p>
    </article>
  );
}
