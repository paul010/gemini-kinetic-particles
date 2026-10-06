import { useCallback } from 'react';
import { useSiteLanguage } from './site-language';
import { newsletterEnglish } from './translations';

/** Chinese editorial originals remain canonical; English is a reading translation. */
export function useNewsletterLanguage() {
  const locale = useSiteLanguage();
  const t = useCallback((zh: string) => locale.t({ zh, en: newsletterEnglish[zh] ?? zh }), [locale.t]);
  return { ...locale, t };
}
export const EDITORIAL_LANGUAGE_NOTE = '界面提供三种语言；每日邮件内容为中文。英文示例为阅读译稿，不代表提供英文邮件。';
