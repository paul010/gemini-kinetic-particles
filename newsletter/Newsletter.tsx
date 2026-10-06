import { EDITORIAL_LANGUAGE_NOTE, useNewsletterLanguage } from './locale';
import LanguageSelector from './LanguageSelector';
import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight } from '@phosphor-icons/react/ArrowUpRight';
import { EnvelopeSimple } from '@phosphor-icons/react/EnvelopeSimple';
import { sampleLetter } from './content';
import LetterPreview from './LetterPreview';
import './newsletter.css';
import KitSignup from './KitSignup';

type Phase = 'idle' | 'submitting' | 'pending' | 'welcome' | 'error';
type DemoOutcome = 'pending' | 'error';

/** Actual Kit subscriptions and the explicit /newsletter/demo review route stay separate. */
export default function Newsletter({ onHome, demo = false }: { onHome: () => void; demo?: boolean }) {
  const { lang, setLang, t, languageTag } = useNewsletterLanguage();
  const [phase, setPhase] = useState<Phase>('idle');
  const [email, setEmail] = useState('');
  const [validation, setValidation] = useState('');
  const [notice, setNotice] = useState('');
  const [outcome, setOutcome] = useState<DemoOutcome>('pending');
  const inputRef = useRef<HTMLInputElement>(null);
  const statusRef = useRef<HTMLHeadingElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const busyRef = useRef(false);

  useEffect(() => {
    const existing = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    const previous = existing?.getAttribute('content');
    const robots = existing ?? document.createElement('meta');
    robots.name = 'robots';
    robots.content = 'noindex, nofollow';
    if (!existing) document.head.appendChild(robots);
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      busyRef.current = false;
      if (!existing) robots.remove();
      else if (previous === null) robots.removeAttribute('content');
      else if (previous !== undefined) robots.content = previous;
    };
  }, []);

  useEffect(() => {
    if (phase === 'pending' || phase === 'welcome' || phase === 'error') {
      statusRef.current?.focus();
    } else if (phase === 'idle' && notice) {
      inputRef.current?.focus();
    }
  }, [phase, notice]);

  const reset = () => {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = null;
    busyRef.current = false;
    setEmail('');
    setValidation('');
    setNotice('已清空演示。没有保存邮箱，也没有发送邮件。');
    setPhase('idle');
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busyRef.current || phase !== 'idle') return;
    const candidate = email.trim();
    const valid = candidate.length <= 254 && inputRef.current?.validity.valid;
    if (!candidate || !valid || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate)) {
      setValidation('请输入完整的邮箱格式，例如 reader@example.com。');
      inputRef.current?.focus();
      return;
    }
    if (candidate.slice(candidate.lastIndexOf('@') + 1).toLowerCase() !== 'example.com') {
      setValidation('当前只演示，请使用 example.com 测试地址，不要填写真实邮箱。');
      inputRef.current?.focus();
      return;
    }
    busyRef.current = true;
    setValidation('');
    setNotice('');
    setEmail('');
    setPhase('submitting');
    // A local delay lets reviewers exercise duplicate clicks and cancellation.
    // No address is retained in this callback and no request is sent.
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      busyRef.current = false;
      setPhase(outcome);
    }, 900);
  };

  return (
    <div className="newsletter" lang={languageTag}>
      <a className="nl-skip" href="#newsletter-main">{t("跳到正文")}</a>
      <header className="nl-header nl-wrap">
        <a href="/" className="nl-wordmark" onClick={(event) => {
          if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && event.button === 0) {
            event.preventDefault();
            onHome();
          }
        }} title={t("返回大雷主站")}>{t("大雷")}<span>DA LEI</span></a>
        <nav aria-label={t("实战信导航")}>
          <a href="#sample-letter">{t("读一封示例")}</a>
          <a href="https://www.youtube.com/@dalei2025" target="_blank" rel="noopener noreferrer">YouTube <ArrowUpRight aria-hidden="true" /></a>
        </nav>
        <LanguageSelector lang={lang} setLang={setLang} />
      </header>

      <main id="newsletter-main" className="nl-wrap" tabIndex={-1}>
        {demo && <div className="nl-demo-notice" role="note">
          <strong>{t("订阅体验演示")}</strong><span>{t("尚未开放订阅。本页不收集邮箱，也不会发送邮件。")}</span>
        </div>}
        <p className="nl-language-note">{t(EDITORIAL_LANGUAGE_NOTE)}</p>
        <div className="nl-hero">
          <section className="nl-intro" aria-labelledby="newsletter-title">
            <p className="nl-eyebrow">{t("大雷早上好 · AI 实战信")}</p>
            <h1 id="newsletter-title">{t("把 AI 新知，")}<br />{t("变成今天的行动。")}</h1>
            <p className="nl-lead">{t("一封短邮件，读懂一个问题，")}<br className="nl-desktop-break" />{t("再动手做一件小事。")}</p>
            <div className="nl-author">
              <img src="/avatar-480.webp" alt="" width="44" height="44" />
              <p>{t("潘雷 · @dalei2025")}<span>{t("从公开视频到可实践的方法")}</span></p>
            </div>

            <section className="nl-signup" aria-labelledby="signup-title">
              <h2 id="signup-title">{t("给早晨留一点新想法")}</h2>
              <p className="nl-promise">{t("每日一封 · 读者免费 · 有相关视频时推荐")}</p>
              {!demo && <KitSignup />}
              {demo && <><form onSubmit={submit} noValidate aria-label={t("订阅流程演示")} aria-busy={phase === 'submitting'}>
                <div hidden={phase !== 'idle' && phase !== 'submitting'}>
                  <label htmlFor="newsletter-email">{t("邮箱（仅演示）")}</label>
                  <div className="nl-input-row">
                    <input ref={inputRef} id="newsletter-email" type="email" inputMode="email"
                      autoComplete="off" autoCapitalize="none" spellCheck={false} required maxLength={254}
                      placeholder="reader@example.com" value={email} disabled={phase === 'submitting'}
                      aria-describedby={`email-hint${validation ? ' email-error' : ''}`}
                      aria-invalid={Boolean(validation)}
                      onChange={(event) => { setEmail(event.target.value); setValidation(''); setNotice(''); }} />
                    <button className="nl-primary" type="submit" disabled={phase === 'submitting'}>
                      {phase === 'submitting' ? t("演示处理中…") : t("演示订阅流程")}
                    </button>
                  </div>
                  <p id="email-hint" className="nl-hint">{t("只接受 example.com 测试地址。请勿填写真实邮箱。")}</p>
                  {validation && <p id="email-error" className="nl-error" role="alert">{t(validation)}</p>}
                  {phase === 'submitting' && <button type="button" className="nl-text-button" onClick={reset}>{t("取消演示")}</button>}
                </div>
              </form>

              <div className="nl-status" aria-live="polite" aria-atomic="true">
                {notice && <p className="nl-hint">{t(notice)}</p>}
                {phase === 'submitting' && <p className="nl-hint">{t("正在模拟流程，没有向外部服务提交数据。")}</p>}
                {phase === 'pending' && <div className="nl-result">
                  <EnvelopeSimple size={28} aria-hidden="true" />
                  <h3 ref={statusRef} tabIndex={-1}>{t("演示：下一步是确认邮箱")}</h3>
                  <p>{t("正式开放后，请按确认邮件中的说明完成订阅。未确认前，不会进入每日发送名单。")}</p>
                  <p className="nl-hint">{t("本次未发送确认邮件，未创建订阅。")}</p>
                  <button type="button" className="nl-primary" onClick={() => setPhase('welcome')}>{t("查看欢迎内容（演示）")}</button>
                  <button type="button" className="nl-text-button" onClick={reset}>{t("返回并清空演示")}</button>
                </div>}
                {phase === 'welcome' && <div className="nl-result">
                  <h3 ref={statusRef} tabIndex={-1}>{t("演示：确认后的欢迎内容")}</h3>
                  <p>{t("先从页面中的示例开始：给一个小工具写三条验收，再亲手试一次。把一个没通过的步骤记下来，它就是下一次改进的起点。")}</p>
                  <p>{t("正式订阅后，每封邮件都会附退订入口，可随时停止接收。")}</p>
                  <p className="nl-hint">{t("这是欢迎内容预览。没有验证邮箱，也没有实际订阅。")}</p>
                  <button type="button" className="nl-text-button" onClick={reset}>{t("返回并清空演示")}</button>
                </div>}
                {phase === 'error' && <div className="nl-result">
                  <h3 ref={statusRef} tabIndex={-1}>{t("演示：服务暂不可用")}</h3>
                  <p>{t("如果真实服务故障，页面应明确提示流程未完成，并让你稍后重试。")}</p>
                  <p className="nl-hint">{t("这里模拟失败，没有保存邮箱或发起网络请求。")}</p>
                  <button type="button" className="nl-primary" onClick={reset}>{t("返回重试（演示）")}</button>
                </div>}
              </div>

              </>}
              <p className="nl-consent">{t(demo ? "正式开放后，订阅将用于接收每日中文 AI 内容，有相关视频时附上推荐；需确认邮箱才生效。每封可退订。" : 'Kit 处理邮箱、确认和退订；仅确认后接收每日中文 AI 邮件及适当视频推荐。每封可退订。')}<a href="#newsletter-privacy">{t("查看隐私说明")}</a></p>
              {demo &&
              <details className="nl-demo-options">
                <summary>{t("演示状态选项")}</summary>
                <label htmlFor="demo-outcome">{t("模拟结果")}</label>
                <select id="demo-outcome" value={outcome} disabled={phase !== 'idle'} onChange={(event) => setOutcome(event.target.value as DemoOutcome)}>
                  <option value="pending">{t("正常：等待邮箱确认")}</option>
                  <option value="error">{t("故障：服务暂不可用")}</option>
                </select>
                <p className="nl-hint">{t("重复地址、未确认或退订再订阅，正式页面都使用通用反馈，不展示名单状态。")}</p>
              </details>}
            </section>
          </section>

          <LetterPreview letter={sampleLetter} />
        </div>

        <section className="nl-about" aria-labelledby="about-title">
          <div><h2 id="about-title">{t("读完，能带走什么？")}</h2><p>{t("一个结论、一个原理、一个判断。再加一个动手练习和证据来源；有合适的相关视频时附上链接。")}</p></div>
          <div><p>{t("每封约 300–500 中文字。先准备一周内容，由潘雷审核，再逐封定时发送。")}</p><p>{t("新视频不必每天发布；旧经验标日期，没有证据的“实测”不写进邮件。")}</p></div>
        </section>

        <section className="nl-faq" aria-labelledby="faq-title">
          <h2 id="faq-title">{t("订阅前，先说清楚")}</h2>
          <details><summary>{t("读者需要付费吗？")}</summary><p>{t("读者免费。每日一封中文 AI 干货，包含练习和来源，有合适的相关公开视频时附上推荐；具体发送时间会在正式开放前确定。")}</p></details>
          <details><summary>{t("订阅 YouTube 就会收到邮件吗？")}</summary><p>{t("不会。频道订阅与邮件订阅是两个独立选择。只有主动留下邮箱并确认的人，才会进入邮件活跃名单。")}</p></details>
          <details><summary>{t("如果没有收到确认邮件呢？")}</summary><p>{t(demo ? "正式开放后，请检查垃圾箱，并按页面说明稍后重试。重复提交使用同样的通用提示，不公开邮箱是否在名单中。此演示没有发送任何邮件。" : '请先检查垃圾箱和收件箱。重复点击不会加快送达；平台可能限制确认邮件的重发频率。提交不代表邮箱已确认，也不公开该地址的名单状态。')}</p></details>
          <details><summary>{t("我可以随时退订吗？")}</summary><p>{t("可以。正式邮件由 Kit 提供退订入口并管理退订状态。重新提交不代表已恢复订阅；请按平台确认提示操作，最终状态以 Kit 为准。")}</p></details>
        </section>

        <section id="newsletter-privacy" className="nl-privacy" aria-labelledby="privacy-title">
          <h2 id="privacy-title">{t("你的邮箱，只用于这封信")}</h2>
          <p>{t(demo ? "正式开放后，Kit 将处理邮箱、订阅确认、发送和退订状态，用于每日中文 AI 邮件，并在有相关视频时附上推荐。名单不会放进公开仓库或公开文档；来源统计也不记录邮箱输入。" : '邮箱通过官方表单直接提交给 Kit，用于确认、每日中文邮件及适当视频推荐。Kit 管理发送、退订和必要的表单访问记录；网站不另建名单库，不将邮箱写入 URL、分析日志或公开文档。')}</p>
          <p>{t(demo ? "当前页面仅为演示，邮箱只在页面内存中临时存在，提交演示、取消、离开或刷新后清空，不上传、不保存。正式服务的联系信息与完整隐私文本会在开放前补齐。" : '你可以通过每封邮件的退订入口停止接收，或联系 support@dailycosmos.net 询问订阅及资料处理。平台的隐私政策可在 Kit 官网查看。')}</p>
          {!demo && <a href="https://kit.com/privacy" target="_blank" rel="noopener noreferrer">{t('Kit 隐私政策')} ↗</a>}
        </section>
      </main>
      <footer className="nl-footer nl-wrap"><span>{t("大雷早上好 · AI 实战信")}</span><a href="https://dailycosmos.net" target="_blank" rel="noopener noreferrer">dailycosmos.net <ArrowUpRight aria-hidden="true" /></a></footer>
    </div>
  );
}
