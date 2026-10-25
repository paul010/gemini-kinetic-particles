import React, { useEffect, useRef, useState } from 'react';
import course from './course-data.json';
import { filterReplay, nextPosition, readPosition, safeChecks, seconds, stageNames, storageKey } from './model.mjs';
import './agent-course.css';

const lessons = course.lessons;
const validIds = lessons.flatMap(l => l.checks.map((_, i) => `${l.id}-${i}`));
const intro = '一课一案例，一案一模板，一课一成果。跟着五段实战，从有依据地回答，到确认写入、查询提醒，再到独立交接。';

export default function AgentCourse({ onHome, relatedUrl = '/copilot-demo' }: { onHome: () => void; relatedUrl?: string }) {
  const [position, setPosition] = useState(() => readPosition(window.location.search));
  const [checks, setChecks] = useState<Record<string, boolean>>(() => {
    try { return safeChecks(JSON.parse(localStorage.getItem(storageKey) || '{}'), validIds); } catch { return {}; }
  });
  const [storageNote, setStorageNote] = useState('自检进度只保存在这台设备。');
  const [notice, setNotice] = useState('');
  const [manualCopy, setManualCopy] = useState<{ label: string; text: string } | null>(null);
  const [video, setVideo] = useState<{ lesson: number; start: number } | null>(null);
  const [replayMode, setReplayMode] = useState('due');
  const [localVideo, setLocalVideo] = useState<{ url: string; name: string } | null>(null);
  const videoFileRef = useRef<HTMLInputElement>(null);
  const localPlayerRef = useRef<HTMLVideoElement>(null);
  const stageRef = useRef<HTMLElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const copyTextRef = useRef<HTMLTextAreaElement>(null);
  const copyOriginRef = useRef<HTMLElement | null>(null);
  const lesson = lessons[position.lesson];
  const progress = lesson.checks.filter((_, i) => checks[`${lesson.id}-${i}`]).length;
  const presented = position.present;

  function go(next: typeof position, focus = true) {
    setPosition(next);
    setVideo(null);
    if (next.lesson !== position.lesson) setLocalVideo(null);
    const url = new URL(window.location.href);
    url.searchParams.set('lesson', String(next.lesson + 1));
    url.searchParams.set('step', String(next.step + 1));
    if (next.present) url.searchParams.set('present', '1'); else url.searchParams.delete('present');
    window.history.pushState({}, '', url);
    if (focus) requestAnimationFrame(() => { stageRef.current?.focus({ preventScroll: true }); stageRef.current?.scrollIntoView({ block: 'start', behavior: 'instant' }); });
  }
  function move(direction: number) { go({ ...position, ...nextPosition(position.lesson, position.step, direction) }); }
  useEffect(() => {
    const pop = () => { setPosition(readPosition(window.location.search)); setVideo(null); setLocalVideo(null); };
    window.addEventListener('popstate', pop);
    return () => window.removeEventListener('popstate', pop);
  }, []);
  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(checks)); }
    catch { setStorageNote('浏览器未允许保存：本次仍可自检，请导出记录。'); }
  }, [checks]);
  useEffect(() => () => { if (localVideo) URL.revokeObjectURL(localVideo.url); }, [localVideo]);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 4000);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (!presented || dialogRef.current?.open || target.closest('input,textarea,select,button,a,[contenteditable="true"],iframe') || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1); }
      if (event.key === 'Escape') go({ ...position, present: false }, false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [position]);
  useEffect(() => {
    const oldLang = document.documentElement.lang;
    const selectors = ['meta[name="description"]', 'meta[name="robots"]', 'link[rel="canonical"]', 'meta[property="og:title"]', 'meta[property="og:description"]', 'meta[property="og:url"]', 'meta[property="og:image"]'];
    const saved = selectors.map(selector => {
      const el = document.querySelector(selector);
      const attr = selector.startsWith('link') ? 'href' : 'content';
      return { el, attr, value: el?.getAttribute(attr) };
    });
    document.documentElement.lang = 'zh-CN';
    const values = [intro, 'noindex, nofollow', 'https://dailycosmos.net/copilot-agent-course', 'Copilot Studio Agent｜五课案例实战', intro, 'https://dailycosmos.net/copilot-agent-course', 'https://dailycosmos.net/copilot-agent-course-cover.svg'];
    saved.forEach((item, i) => item.el?.setAttribute(item.attr, values[i]));
    return () => { document.documentElement.lang = oldLang; saved.forEach(item => { if (item.value == null) item.el?.removeAttribute(item.attr); else item.el?.setAttribute(item.attr, item.value); }); };
  }, []);
  useEffect(() => {
    if (manualCopy) { dialogRef.current?.showModal(); copyTextRef.current?.focus(); copyTextRef.current?.select(); }
  }, [manualCopy]);
  async function copy(label: string, text: string) {
    copyOriginRef.current = document.activeElement as HTMLElement;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await Promise.race([navigator.clipboard.writeText(text), new Promise((_, reject) => setTimeout(() => reject(new Error('Clipboard timeout')), 1200))]);
      setNotice(`${label}已复制`);
    } catch { setManualCopy({ label, text }); }
  }
  function closeCopy() { dialogRef.current?.close(); setManualCopy(null); copyOriginRef.current?.focus(); }
  function exportChecks() {
    const text = `# ${lesson.id.toString().padStart(2, '0')} ${lesson.short}｜个人自检\n\n导出时间：${new Date().toLocaleString('zh-CN')}\n\n` + lesson.checks.map((c, i) => `- [${checks[`${lesson.id}-${i}`] ? 'x' : ' '}] ${c}`).join('\n') + '\n\n这是本机自检，不是后台验收。\n\n## 实际输入与结果\n待填写\n\n## 运行 / 清单 / 收件证据\n待填写\n\n## 未测及阻塞\n待填写\n';
    const url = URL.createObjectURL(new Blob([text], { type: 'text/markdown;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = `lesson-${lesson.id.toString().padStart(2, '0')}-my-checks.md`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice('已导出本课自检记录，请补充实际证据。');
  }
  const Copy = ({ label, text }: { label: string; text: string }) => <button type="button" onClick={() => copy(label, text)}>复制{label}</button>;
  const replayRows = 'rows' in lesson && Array.isArray(lesson.rows) ? filterReplay(lesson.rows, replayMode) : [];

  return <div className={`agent-course${presented ? ' ac-present' : ''}`}>
    <a className="ac-skip" href="#ac-stage">跳到本课内容</a>
    <header className="ac-top">
      <button className="ac-brand" onClick={onHome}><span aria-hidden="true">大</span>大雷的实战课</button>
      <div className="ac-top-actions">
        <a href={relatedUrl}>三段 Copilot 练习</a>
        <a href="/copilot-agent-course/materials/copilot-agent-5-lessons.zip" download>下载五课资料</a>
        <button className="ac-primary" aria-pressed={presented} onClick={() => go({ ...position, present: !presented })}>{presented ? '退出投屏' : '进入投屏'}</button>
      </div>
    </header>
    {presented && <h1 className="ac-sr-only">Copilot Studio Agent 五课案例实战</h1>}
    {!presented && <section className="ac-hero" aria-labelledby="ac-title">
      <div>
        <p className="ac-eyebrow">COPILOT STUDIO AGENT · 01—05</p>
        <h1 id="ac-title">让 Agent<br />接住一件<span>具体的事。</span></h1>
        <p className="ac-intro">{intro}</p>
        <div className="ac-actions"><button className="ac-primary" onClick={() => go(position)}>从第 {lesson.id} 课开始</button><a href="/copilot-agent-course/materials/README.md" download>学员使用说明 ↗</a></div>
        <p className="ac-pencil">70% 模板结构 + 30% 你的业务规则</p>
      </div>
      <img src="/copilot-agent-course-cover.svg" width="600" height="420" alt="从资料问答，经过行动清单和申请流程，走到提醒与设备借用交付的五步路径" />
    </section>}
    <div className="ac-body">
      <nav className="ac-lessons" aria-label="五课目录">
        <p className="ac-eyebrow">你的五步路线</p>
        {lessons.map((l, i) => <button key={l.id} aria-current={i === position.lesson ? 'step' : undefined} onClick={() => go({ ...position, lesson: i, step: 0 })}><span className="ac-number">0{l.id}</span><span>{l.short}<small>{l.tagline}</small></span></button>)}
        <div className="ac-side-note">先想清结果，再补知识。<br />每课至少保留一组正常与异常证据。</div>
      </nav>
      <div className="ac-workbook">
        <div className="ac-lesson-heading"><p className="ac-eyebrow">第 0{lesson.id} / 05 课 · {lesson.tool}</p><span>{progress} / {lesson.checks.length} 项自检</span></div>
        <nav className="ac-stages" aria-label="本课六步">
          {stageNames.map((name, i) => <button key={name} aria-current={i === position.step ? 'step' : undefined} onClick={() => go({ ...position, step: i })}><span>{i + 1}</span>{name}</button>)}
        </nav>
        <main className="ac-sheet" id="ac-stage" tabIndex={-1} ref={stageRef} aria-label={`第${lesson.id}课：${stageNames[position.step]}`}>
          <p className="ac-eyebrow">0{lesson.id} · {String(position.step + 1).padStart(2, '0')} / {stageNames[position.step]}</p>
          <h2>{lesson.short}<span className="ac-stage-sub">{lesson.tagline}</span></h2>
          {position.step === 0 && <>
            <p className="ac-goal">今天带走：{lesson.goal}</p>
            <p className="ac-boundary">{lesson.limit}</p>
            <div className="ac-local-video"><button onClick={() => videoFileRef.current?.click()}>选择本课本地视频</button><input ref={videoFileRef} type="file" accept="video/*,.mp4,.mov" aria-label="选择本课本地视频文件" hidden onChange={e => { const file = e.target.files?.[0]; if (file) { setVideo(null); setLocalVideo({url: URL.createObjectURL(file), name: file.name}); } e.target.value = ''; }} /><span>{localVideo ? localVideo.name : '网络受限时，选入已经录好的成片。仅本机播放，不上传。'}</span>{localVideo && <button onClick={() => setLocalVideo(null)}>切回在线视频</button>}</div>
            <div className="ac-video">
              {localVideo ? <video ref={localPlayerRef} src={localVideo.url} controls preload="metadata" onError={() => setNotice('当前浏览器无法解码此文件，请选择兼容的 MP4 成片。')} aria-label={`第${lesson.id}课本地视频`} /> : video?.lesson === lesson.id ? <iframe key={`${lesson.id}-${video.start}`} title={`第${lesson.id}课实操视频`} src={`https://www.youtube-nocookie.com/embed/${lesson.video.id}?start=${video.start}&rel=0`} allow="encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /> : <button className="ac-video-launch" onClick={() => setVideo({ lesson: lesson.id, start: 0 })}><span className="ac-play" aria-hidden="true">▶</span><strong>看第 0{lesson.id} 课真实操作</strong><span>{lesson.video.duration} · 点击后加载 YouTube 视频</span></button>}
            </div>
            <div className="ac-chapters" aria-label="视频关键段">{lesson.video.chapters.map(ch => <button key={ch.time} onClick={() => { if (localVideo && localPlayerRef.current) localPlayerRef.current.currentTime = seconds(ch.time); else setVideo({ lesson: lesson.id, start: seconds(ch.time) }); }}><time>{ch.time}</time>{ch.title}</button>)}</div>
            <p className="ac-small"><a href={`https://www.youtube.com/watch?v=${lesson.video.id}`} target="_blank" rel="noopener noreferrer">单独打开视频 ↗</a> · 视频需可访问 YouTube 的网络；受限时可直接按后面的资料与步骤讲解。</p>
          </>}
          {position.step === 1 && <>
            <p className="ac-goal">先问：这次输入什么，最后用什么证明做成了？</p>
            <ol className="ac-flow">{lesson.flow.map((item, i) => <li key={item}><span>0{i + 1}</span>{item}</li>)}</ol>
            <dl className="ac-concepts">{lesson.concepts.map(c => <div key={c.name}><dt>{c.name}</dt><dd>{c.text}</dd></div>)}</dl>
            <h3>开始前准备</h3><ul>{lesson.prepare.map(p => <li key={p}>{p}</li>)}</ul>
          </>}
          {position.step === 2 && <>
            <p className="ac-boundary">使用虚构或已获准的训练资料。创建、写入和发送前，核对实际账号、连接和范围。</p>
            <ol className="ac-build">{lesson.build.map((s, i) => <li key={s.title}><span>{i + 1}</span><div><h3>{s.title}</h3><p>{s.text}</p></div></li>)}</ol>
            <details className="ac-details"><summary>展开可粘贴的 Agent 说明</summary><div className="ac-prompt-header"><strong>Agent 说明</strong><Copy label="说明" text={lesson.instructions} /></div><pre>{lesson.instructions}</pre></details>
            <p className="ac-small">界面入口与许可因账号而异。下载材料中的搭建步骤用于参考，不能一键导入 Agent / Flow。</p>
          </>}
          {position.step === 3 && <>
            <p className="ac-goal">先复制固定输入，只改一项，再比较结果。</p>
            <div className="ac-prompt"><div className="ac-prompt-header"><h3>{lesson.input.label}</h3><Copy label="输入" text={lesson.input.text} /></div><pre>{lesson.input.text}</pre></div>
            {lesson.id === 4 && <section className="ac-replay" aria-labelledby="ac-replay-title"><h3 id="ac-replay-title">固定日期的本地规则练习</h3><p>基准 2026-10-23 · Asia/Shanghai。此处仅筛选虚构 CSV，不连接清单、不发邮件；REQ 编号是样例标识。</p><label>筛选模式<select value={replayMode} onChange={event => setReplayMode(event.target.value)}><option value="due">到期及过期</option><option value="today">只看当天</option></select></label><p className="ac-result" role="status">人工规则结果：{replayRows.length} 项</p><div className="ac-table-wrap"><table><caption>符合条件的虚构记录</caption><thead><tr><th scope="col">样例编号</th><th scope="col">事项</th><th scope="col">日期</th><th scope="col">状态</th></tr></thead><tbody>{replayRows.map(row => <tr key={row.DemoRequestId}><td>{row.DemoRequestId}</td><td>{row.Title}</td><td>{row.NeededBy}</td><td>{row.Status}</td></tr>)}</tbody></table></div></section>}
            {'expectedActions' in lesson && lesson.expectedActions && <details className="ac-details"><summary>展开人工核对答案（预期，不是 Agent 实际输出）</summary><ul>{lesson.expectedActions.map(a => <li key={a['负责人']}>{a['任务']} / {a['负责人']} / {a['截止日期']}</li>)}</ul></details>}
            <h3>本课材料</h3><p className="ac-small">文本可直接打开；ZIP 包另含 lesson.md 与未填结果的 test-record.csv。Windows 解压文件名使用英文，内容为中文。</p><div className="ac-files">{lesson.files.map(f => <a key={f.href} href={f.href} target="_blank" rel="noopener noreferrer">{f.label} ↗ <small>{f.name}</small></a>)}</div><a className="ac-primary ac-download" href={lesson.download} download>下载第 0{lesson.id} 课完整材料</a>
          </>}
          {position.step === 4 && <>
            <p className="ac-goal">先写预期，再运行；有差异就回到规则。</p>
            <p className="ac-boundary">下面是人工预期，不是本次实际测试结果。每次保留输入、输出与证据；缺权限或尚未运行，记录“未测”。</p>
            <div className="ac-tests">{lesson.tests.map((t, i) => <article key={t.name}><div className="ac-prompt-header"><h3><span>0{i + 1}</span>{t.name}</h3><Copy label={`测试${i + 1}`} text={t.input} /></div><p className="ac-test-input">{t.input}</p><p><strong>人工预期：</strong>{t.expected}</p></article>)}</div>
            <p className="ac-small">源文件的变式与 test-record.csv 在本课 ZIP 中。自动化须补 Flow 运行和下游回读；发送成功须再看收件端。</p><a href={lesson.download} download>下载测试资料与记录表 ↗</a>
          </>}
          {position.step === 5 && <>
            <p className="ac-goal">把模板改成自己的业务，交付可复查的成果。</p><p className="ac-homework">{lesson.homework}</p>
            <fieldset className="ac-checks"><legend>我来核对</legend>{lesson.checks.map((c, i) => <label key={c}><input type="checkbox" checked={!!checks[`${lesson.id}-${i}`]} onChange={e => setChecks({ ...checks, [`${lesson.id}-${i}`]: e.target.checked })} /><span>{c}</span></label>)}</fieldset>
            <p className="ac-small">{storageNote} 勾选表示个人自检，不代表教师评分或平台验收。</p>
            <div className="ac-actions"><button className="ac-primary" onClick={exportChecks}>导出本课自检</button><button onClick={() => window.print()}>打印本课</button><a href={lesson.download} download>下载作业模板</a></div>
            <details className="ac-details"><summary>怎样算完成？三分钟怎样讲？</summary><p>提交：需求卡、Agent 说明与字段映射、输入与人工预期、实际输出、正常与异常证据、一页交接。涉及自动化须有运行与下游回读。</p><p>建议评分：业务 15、实现 25、测试 25、权限 20、迁移与交接 15；总分 100，建议 75 分并满足关键证据要求。</p><p>三分钟展示：30 秒业务问题 → 90 秒主路径 → 30 秒异常 → 30 秒限制与交接。同伴未实际试用时明确记录。</p></details>
          </>}
        </main>
        <footer className="ac-pager"><button disabled={position.lesson === 0 && position.step === 0} onClick={() => move(-1)}>← 上一步</button><span>第 {lesson.id} 课 · {position.step + 1} / 6{presented && <small>方向键切换 · Esc 退出投屏</small>}</span><button className="ac-primary" disabled={position.lesson === 4 && position.step === 5} onClick={() => move(1)}>{position.step === 5 && position.lesson < 4 ? '进入下一课 →' : '下一步 →'}</button></footer>
        <div className="ac-print-only"><h2>第 {lesson.id} 课完整讲义</h2><p>{lesson.goal}</p><h3>搭建步骤</h3>{lesson.build.map(s => <p key={s.title}><strong>{s.title}：</strong>{s.text}</p>)}<h3>Agent 说明</h3><pre>{lesson.instructions}</pre><h3>测试与人工预期</h3>{lesson.tests.map(t => <div key={t.name}><h4>{t.name}</h4><p>{t.input}</p><p>预期：{t.expected}</p></div>)}<h3>作业</h3><p>{lesson.homework}</p><p>{lesson.limit}</p></div>
      </div>
    </div>
    <footer className="ac-bottom"><span>大雷早上好 · 案例实战课</span><span>材料更新 {course.updated} · 虚构数据 · 自检仅本机</span></footer>
    <div className="ac-toast" role="status" aria-live="polite">{notice}</div>
    <dialog className="ac-copy-dialog" ref={dialogRef} onCancel={() => { setManualCopy(null); copyOriginRef.current?.focus(); }} aria-labelledby="ac-copy-title"><h2 id="ac-copy-title">手动复制{manualCopy?.label}</h2><p>浏览器未允许自动复制。文本已选中，请按 ⌘C / Ctrl+C。</p><textarea ref={copyTextRef} readOnly value={manualCopy?.text || ''} aria-label="待复制文本" /><button className="ac-primary" onClick={closeCopy}>关闭</button></dialog>
  </div>;
}
