import React, { useEffect, useId, useRef, useState } from 'react';
import { KIT_FORM } from './kit-config';
import { useNewsletterLanguage } from './locale';
import './kit-signup.css';

type Load = 'loading' | 'ready' | 'unavailable';
type Submission = 'idle' | 'submitting' | 'uncertain';
type KitWindow = Window & { __sv_forms?: { element: HTMLFormElement; initialized?: boolean }[] };

/** Kit owns requests and list state. This wrapper translates the UI and fails closed. */
export default function KitSignup() {
  const { t } = useNewsletterLanguage();
  const host = useRef<HTMLDivElement>(null);
  const translate = useRef(t);
  translate.current = t;
  const localize = useRef<() => void>(() => {});
  const [attempt, setAttempt] = useState(0);
  const [load, setLoad] = useState<Load>('loading');
  const [submission, setSubmission] = useState<Submission>('idle');
  const [notice, setNotice] = useState('');
  const noticeRef = useRef(notice);
  noticeRef.current = notice;
  const fieldId = 'kit-email-' + useId().replace(/:/g, '');

  useEffect(() => {
    const mount = host.current!;
    let stopped = false, failed = false, busy = false;
    let requestTimer: ReturnType<typeof setTimeout> | undefined;
    setLoad('loading'); setSubmission('idle'); setNotice('');
    mount.replaceChildren(); mount.inert = true;
    // The official SDK needs storage; fail closed before it can throw in restricted browsers.
    try {
      const storage = window.localStorage, key = 'dalei-kit-storage-probe';
      const previous = storage.getItem(key);
      storage.setItem(key, '1');
      if (previous === null) storage.removeItem(key); else storage.setItem(key, previous);
    } catch {
      setLoad('unavailable'); localize.current = () => {};
      return () => { mount.replaceChildren(); };
    }
    const form = () => mount.querySelector<HTMLFormElement>(`form[data-sv-form="${KIT_FORM.id}"][data-uid="${KIT_FORM.uid}"]`);
    const initialized = () => {
      const current = form();
      return current?.action === KIT_FORM.action && (window as KitWindow).__sv_forms?.some(entry => entry.element === current && entry.initialized);
    };
    const attr = (node: Element, key: string, value: string) => { if (node.getAttribute(key) !== value) node.setAttribute(key, value); };
    const text = (node: Element, value: string) => { if (node.textContent !== value) node.textContent = value; };
    const translateForm = () => {
      const current = form(); if (!current) return;
      attr(current, 'aria-label', translate.current('免费订阅 AI 实战信'));
      const input = current.querySelector<HTMLInputElement>('input[name="email_address"]');
      if (input) {
        for (const [key, value] of Object.entries({ id: fieldId, type: 'email', inputmode: 'email', autocomplete: 'email', maxlength: '254', 'aria-label': translate.current('邮箱'), placeholder: translate.current('你的邮箱'), 'aria-invalid': String(noticeRef.current === '请输入完整的邮箱格式，例如 reader@example.com。'), 'aria-describedby': fieldId + '-help' + (noticeRef.current ? ' ' + fieldId + '-error' : '') })) attr(input, key, value);
        let label = current.querySelector<HTMLLabelElement>('label[data-site-email-label]');
        if (!label) { label = document.createElement('label'); label.dataset.siteEmailLabel = ''; label.htmlFor = fieldId; input.before(label); }
        text(label, translate.current('邮箱'));
      }
      const caption = current.querySelector('[data-element="submit"] > span');
      if (caption) text(caption, translate.current('免费订阅 · 确认后领实战卡'));
      const pending = current.querySelector<HTMLElement>('[data-element="success"]');
      if (pending) {
        // Translate only the verified Kit pending message; never invent a result.
        const known = [KIT_FORM.pendingMessage, translate.current(KIT_FORM.pendingMessage)];
        if (known.includes(pending.innerText) || pending.dataset.sitePending === 'true') {
          pending.dataset.sitePending = 'true'; text(pending, translate.current(KIT_FORM.pendingMessage));
        }
        attr(pending, 'role', 'status'); attr(pending, 'aria-live', 'polite');
      }
    };
    localize.current = translateForm;
    const unavailable = () => {
      if (stopped || initialized()) return;
      failed = true; mount.inert = true; setLoad('unavailable');
    };
    const refresh = () => {
      if (stopped || failed) return;
      translateForm();
      if (initialized()) { mount.inert = false; setLoad('ready'); }
      const current = form(); if (!current) return;
      const errors = current.querySelector('[data-element="errors"]');
      const pending = current.querySelector('[data-element="success"]');
      if (errors?.childElementCount) {
        // Do not expose account-membership details or echo addresses from platform errors.
        errors.replaceChildren();
        busy = false; clearTimeout(requestTimer); setSubmission('idle');
        setNotice('平台未确认本次提交完成。请检查邮箱地址和收件箱，稍后再试。');
      } else if (pending) {
        busy = false; clearTimeout(requestTimer); setSubmission('idle'); setNotice('');
      }
    };
    const observer = new MutationObserver(refresh);
    observer.observe(mount, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-active', 'disabled'] });
    const script = document.createElement('script');
    script.async = true; script.dataset.uid = KIT_FORM.uid; script.src = KIT_FORM.script;
    script.onerror = unavailable;
    script.onload = refresh;
    const resourceLoad = (event: Event) => { if (event.target instanceof HTMLScriptElement && event.target.src === KIT_FORM.runtime) refresh(); };
    const resourceError = (event: Event) => { if (event.target instanceof HTMLScriptElement && event.target.src === KIT_FORM.runtime) unavailable(); };
    document.addEventListener('load', resourceLoad, true);
    document.addEventListener('error', resourceError, true);
    const invalid = (event: Event) => {
      if (!(event.target instanceof HTMLInputElement)) return;
      event.preventDefault(); setNotice('请输入完整的邮箱格式，例如 reader@example.com。'); event.target.focus();
    };
    const input = () => setNotice('');
    const submit = (event: Event) => {
      const current = form();
      if (!current || event.target !== current) return;
      if (busy || !initialized()) { event.preventDefault(); event.stopImmediatePropagation(); return; }
      const email = current.querySelector<HTMLInputElement>('input[name="email_address"]');
      const candidate = email?.value.trim() ?? '';
      if (!email || !email.validity.valid || candidate.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate)) {
        event.preventDefault(); event.stopImmediatePropagation();
        setNotice('请输入完整的邮箱格式，例如 reader@example.com。'); email?.focus(); return;
      }
      email.value = candidate;
      busy = true; setNotice(''); setSubmission('submitting');
      current.querySelector('[data-element="errors"]')?.replaceChildren();
      // Kit builds FormData after an await: do not disable inputs here.
      requestTimer = setTimeout(() => { if (!stopped && busy) setSubmission('uncertain'); }, 20000);
    };
    mount.addEventListener('invalid', invalid, true);
    mount.addEventListener('input', input);
    mount.addEventListener('submit', submit, true);
    mount.appendChild(script);
    const loadingTimer = setTimeout(unavailable, 12000);
    return () => {
      stopped = true; clearTimeout(loadingTimer); clearTimeout(requestTimer); observer.disconnect();
      document.removeEventListener('load', resourceLoad, true); document.removeEventListener('error', resourceError, true);
      mount.removeEventListener('invalid', invalid, true); mount.removeEventListener('input', input); mount.removeEventListener('submit', submit, true);
      mount.querySelectorAll<HTMLInputElement>('input[name="email_address"]').forEach(input => { input.value = ''; });
      mount.replaceChildren(); localize.current = () => {};
    };
  }, [attempt, fieldId]);

  useEffect(() => { localize.current(); }, [t, notice]);

  return <div className="kit-signup" data-kit-load={load} aria-busy={load === 'loading' || submission === 'submitting'}>
    <div className="kit-signup__status" role="status" aria-live="polite">
      {load === 'loading' && <p>{t('正在加载订阅表单…')}</p>}
      {load === 'unavailable' && <p>{t('订阅表单暂时无法加载。请尝试在 Kit 打开，或换一个浏览器。')}</p>}
      {submission === 'submitting' && <p>{t('正在提交给 Kit。请勿重复点击；仍需在邮箱中确认。')}</p>}
      {submission === 'uncertain' && <p>{t('提交结果尚未确认。请先检查收件箱，不要连续提交。')}</p>}
    </div>
    <div className="kit-signup__mount" ref={host} hidden={load !== 'ready'} />
    {notice && <p id={fieldId + '-error'} className="kit-signup__notice" role="alert">{t(notice)}</p>}
    <p id={fieldId + '-help'} className="kit-signup__help">{t('每日一封中文 AI 实战信，读者免费，附适当相关视频。提交后需点击中文确认邮件中的按钮；每封可退订。')}</p>
    <div className="kit-signup__fallback">
      <a href={KIT_FORM.share} target="_blank" rel="noopener noreferrer">{t('在 Kit 打开订阅表单')} ↗</a>
      <a href="/newsletter#newsletter-privacy">{t('查看隐私说明')}</a>
      {load === 'unavailable' && <button type="button" onClick={() => setAttempt(value => value + 1)}>{t('重新加载表单')}</button>}
    </div>
  </div>;
}
