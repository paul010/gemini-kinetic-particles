import React from 'react';
import { ArrowRight } from '@phosphor-icons/react/ArrowRight';
import { NEWSLETTER_CARD_PATH } from './paths';
import { useSiteLanguage } from './site-language';
import './home-newsletter-promo.css';

/** One invitation inside the creator's homepage; Kit remains on /newsletter. */
export default function HomeNewsletterPromo({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { t, languageTag } = useSiteLanguage();
  const navigate = (event: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && event.button === 0) {
      event.preventDefault();
      onNavigate(path);
    }
  };

  return (
    <div className="home-newsletter" lang={languageTag}>
      <a className="home-newsletter__subscribe btn-sheen" href="/newsletter" onClick={event => navigate(event, '/newsletter')}>
        {t({ zh: '免费订阅 AI 实战信', en: 'Get the free AI letter' })}
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </a>
      <p className="home-newsletter__note">
        {t({ zh: '中文实战思路，送到你的邮箱。需确认，可随时退订。', en: 'Practical AI ideas in Chinese, by email. Confirm to join; unsubscribe anytime.' })}
      </p>
      <p className="home-newsletter__resource">
        <a href={NEWSLETTER_CARD_PATH} onClick={event => navigate(event, NEWSLETTER_CARD_PATH)}>
          {t({ zh: '先看一张原创实战卡', en: 'Explore an original practice card' })}
        </a>
      </p>
    </div>
  );
}
