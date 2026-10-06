import React from 'react';
import type { Lang } from '../data/site';
import './language-selector.css';

export default function LanguageSelector({ lang, setLang }: { lang: Lang; setLang: (lang: Lang) => void }) {
  return <div className="nl-language" role="group" aria-label={lang === 'en' ? 'Interface language' : lang === 'zhHant' ? '介面語言' : '界面语言'}>
    {([['en', 'EN', 'English'], ['zh', '简', '简体中文'], ['zhHant', '繁', '繁體中文']] as const).map(([code, label, name]) =>
      <button key={code} type="button" lang={code === 'en' ? 'en' : code === 'zh' ? 'zh-CN' : 'zh-Hant'} aria-label={code === 'en' ? 'EN · English' : name} aria-pressed={lang === code} onClick={() => setLang(code)}>{label}</button>)}
  </div>;
}
