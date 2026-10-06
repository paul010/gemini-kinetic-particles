import { EDITORIAL_LANGUAGE_NOTE, useNewsletterLanguage } from './locale';
import React from 'react';
import { NEWSLETTER_CARD_PATH } from './paths';
import KitSignup from './KitSignup';
import './home-newsletter-promo.css';

/** The published Kit form owns consent, confirmation and unsubscribe state. */
export default function HomeNewsletterPromo({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { t, languageTag } = useNewsletterLanguage();
  return (
    <section id="home" className="home-newsletter" lang={languageTag} aria-labelledby="home-newsletter-title">
      <div className="home-newsletter__copy">
        <p className="home-newsletter__eyebrow">
          <img className="home-newsletter__avatar" src="/newsletter/dalei-channel-avatar.jpg" width="36" height="36" alt="" />
          <span className="home-newsletter__identity">{t("大雷早上好·AI 实战信")}<span className="home-newsletter__handle">@dalei2025</span></span>
        </p>
        <h2 id="home-newsletter-title" className="home-newsletter__title">
          {t("把 AI 方法，")}<br />{t("变成你能检查的小成果")}</h2>
        <p className="home-newsletter__subtitle">
          {t("每天一封 300–500 字：一个结论、一个原理、一个判断，再动手练一次")}</p>
        <p className="home-newsletter__resource">
          {t("从")}<a href={NEWSLETTER_CARD_PATH} aria-label={t("查看第一张 AI 实战卡预览")} onClick={event => {
            if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && event.button === 0) {
              event.preventDefault(); onNavigate(NEWSLETTER_CARD_PATH);
            }
          }}>{t("《第一张 AI 实战卡》")}</a>{t("开始，内含原创样例、三轮提示、空白卡和检查方法")}</p>
        <KitSignup />
        <div className="home-newsletter__actions">
          <a className="home-newsletter__preview" href="/newsletter" onClick={(event) => {
            if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && event.button === 0) {
              event.preventDefault();
              onNavigate('/newsletter');
            }
          }}>
            {t("查看实战信预览")}<span aria-hidden="true">↗</span>
          </a>
        </div>
        <p id="home-newsletter-status" className="home-newsletter__status">
          {t("确认邮箱后才进入每日发送名单。实战卡是公开资源，访问页面不代表已订阅。")}</p>
        <p className="home-newsletter__language-note">{t(EDITORIAL_LANGUAGE_NOTE)}</p>
      </div>

      <div className="home-newsletter__visual" aria-hidden="true">
        <div className="home-newsletter__card-back" />
        <div className="home-newsletter__card">
          <div className="home-newsletter__card-top"><span>{t("AI 实战 · 从一张卡开始")}</span><span>01</span></div>
          <p className="home-newsletter__card-kicker">{t("先整理，再确认")}</p>
          <p className="home-newsletter__card-title">{t("第一张")}<br />{t("AI 实战卡")}</p>
          <div className="home-newsletter__card-rows">
            <div><span>01</span><strong>{t("事实")}</strong><i /></div>
            <div><span>02</span><strong>{t("猜测")}</strong><i /></div>
            <div><span>03</span><strong>{t("缺项")}</strong><i /></div>
          </div>
          <div className="home-newsletter__card-bottom"><span>{t("样例 · 提示词 · 检查方法")}</span><span>＋</span></div>
        </div>
        <p className="home-newsletter__visual-note">{t("原创资源 · 确认后从第一张卡开始")}</p>
      </div>
    </section>
  );
}
