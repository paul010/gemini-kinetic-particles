import { useCallback, useEffect, useState } from 'react';
import type { Lang, LocalizedText } from '../data/site';

export const SITE_LANGUAGE_KEY = 'dalei-lang-v2';
const LANGUAGE_EVENT = 'dalei-language-change';
let sessionLanguage: Lang | undefined;
const validLanguage = (value: unknown): value is Lang => value === 'en' || value === 'zh' || value === 'zhHant';

/** Explicit reader choice only; preserve the site's existing English default. */
export function readSiteLanguage(): Lang {
  if (sessionLanguage) return sessionLanguage;
  try {
    const saved = typeof window === 'undefined' ? null : window.localStorage.getItem(SITE_LANGUAGE_KEY);
    return validLanguage(saved) ? saved : 'en';
  } catch { return 'en'; }
}

let sharedConverter: ((text: string) => string) | null = null;
let converterPromise: Promise<(text: string) => string> | null = null;
function getConverter() {
  if (!converterPromise) converterPromise = import('opencc-js').then(module => {
    sharedConverter = module.Converter({ from: 'cn', to: 'tw' });
    return sharedConverter;
  }).catch(error => { converterPromise = null; throw error; });
  return converterPromise;
}

export const languageTag = (lang: Lang) => lang === 'zh' ? 'zh-CN' : lang === 'zhHant' ? 'zh-Hant' : 'en';

/** Shared across SPA pages; storage failures still preserve the choice in this tab. */
export function useSiteLanguage({ documentLanguage = true } = {}) {
  const [lang, updateLanguage] = useState<Lang>(readSiteLanguage);
  const [converter, setConverter] = useState<((text: string) => string) | null>(() => sharedConverter);
  useEffect(() => {
    const onChoice = (event: Event) => {
      const next = (event as CustomEvent<Lang>).detail;
      if (validLanguage(next)) updateLanguage(next);
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key !== SITE_LANGUAGE_KEY && event.key !== null) return;
      sessionLanguage = validLanguage(event.newValue) ? event.newValue : 'en';
      updateLanguage(sessionLanguage);
    };
    window.addEventListener(LANGUAGE_EVENT, onChoice);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(LANGUAGE_EVENT, onChoice);
      window.removeEventListener('storage', onStorage);
    };
  }, []);
  useEffect(() => {
    if (documentLanguage) document.documentElement.lang = languageTag(lang);
  }, [lang, documentLanguage]);
  useEffect(() => {
    if (lang !== 'zhHant' || converter) return;
    let alive = true;
    getConverter().then(convert => { if (alive) setConverter(() => convert); }).catch(() => {});
    return () => { alive = false; };
  }, [lang, converter]);
  const setLang = useCallback((next: Lang) => {
    sessionLanguage = next;
    try { window.localStorage.setItem(SITE_LANGUAGE_KEY, next); } catch { /* Restricted/private storage. */ }
    updateLanguage(next);
    window.dispatchEvent(new CustomEvent(LANGUAGE_EVENT, { detail: next }));
  }, []);
  const t = useCallback((text: LocalizedText) => lang === 'en' ? text.en : lang === 'zhHant' && converter ? converter(text.zh) : text.zh, [lang, converter]);
  return { lang, setLang, t, languageTag: languageTag(lang) };
}
