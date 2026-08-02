import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './hear-the-universe.css';

interface HearTheUniverseProps {
  onHome: () => void;
}

type RunResult = {
  ok: boolean;
  output: string;
  feedback: string;
  needsInput?: boolean;
};

type Mission = {
  number: string;
  title: string;
  concept: string;
  brief: string;
  starter: string;
  hint: string;
  teacherCue: string;
  assistantCue: string;
};

const MISSIONS: Mission[] = [
  {
    number: '01',
    title: '启动宇宙通讯',
    concept: '输出 output',
    brief: '让程序说出“你好，宇宙”。输入完成后运行程序，听一听控制台的结果。',
    starter: 'output "你好，宇宙"',
    hint: 'output 后面要有一个空格，文字要放在英文双引号中。',
    teacherCue: '先建立“输入—运行—听见结果”的闭环，只讲 output 一个概念。',
    assistantCue: '只提示键位或当前行，不触碰学员键盘，不替学员输入。',
  },
  {
    number: '02',
    title: '给星星命名',
    concept: '文本变量 text',
    brief: '创建一个叫 starName 的文本变量，把你喜欢的星星名字放进去，再输出它。',
    starter: 'text starName = "北极星"\noutput starName',
    hint: '第一行保存名字，第二行直接 output starName，不需要再加双引号。',
    teacherCue: '把变量比作“有标签的收纳盒”，强调变量名可以重复使用。',
    assistantCue: '如果卡住，只确认变量名和双引号，不直接说出整段答案。',
  },
  {
    number: '03',
    title: '输入任务代号',
    concept: '键盘输入 input',
    brief: '让程序向你询问任务代号。运行后，页面会把焦点送到输入框。',
    starter: 'text missionCode = input("请输入任务代号")\noutput missionCode',
    hint: 'input 的问题要放在括号和双引号里，下一行输出 missionCode。',
    teacherCue: '提醒大家：程序暂停不是坏掉了，它正在等待人的输入。',
    assistantCue: '读屏宣布“等待输入”后，让学员自己键入代号并按回车。',
  },
  {
    number: '04',
    title: '计算星际距离',
    concept: '整数与运算',
    brief: '把两个观测段合在一起。将下划线替换成数字 2，让程序算出 84。',
    starter: 'integer distance = 42\noutput distance * __',
    hint: '找到第二行末尾的两个下划线，把它们替换成数字 2。',
    teacherCue: '只让学员改一个数值，听到 84 就算成功，不扩展复杂公式。',
    assistantCue: '可提示“第二行最后”，不要替学员移动光标或删除字符。',
  },
  {
    number: '05',
    title: '修复信号判断',
    concept: '条件判断与调试',
    brief: '程序里少了一个英文双引号。找到错误、补上它，再运行并锁定信号。',
    starter: 'integer signal = 75\nif signal >= 60\n  output "信号已锁定\nelse\n  output "继续搜索"\nend',
    hint: '检查“信号已锁定”这一行：一句文字的开头和结尾都需要双引号。',
    teacherCue: '把错误当作线索：先听反馈，再只改一个地方，然后重试。',
    assistantCue: '先复述错误类型，等待 5 到 8 秒；仍卡住再提示所在行。',
  },
];

const isEditableTarget = (target: EventTarget | null) => {
  const element = target as HTMLElement | null;
  return element?.tagName === 'TEXTAREA' || element?.tagName === 'INPUT' || element?.isContentEditable;
};

const normalizeQuotes = (value: string) => value.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");

const validateMission = (missionIndex: number, rawCode: string): RunResult => {
  const code = normalizeQuotes(rawCode).trim();

  if (!code) {
    return { ok: false, output: '没有可运行的代码。', feedback: '请先在代码编辑区输入内容。' };
  }

  if (missionIndex === 0) {
    const match = code.match(/^\s*output\s+"([^"]+)"\s*$/im);
    if (!match) return { ok: false, output: '语法检查未通过。', feedback: '请检查 output、空格和英文双引号。' };
    if (!match[1].includes('宇宙')) return { ok: false, output: match[1], feedback: '程序运行了。再试一次，让输出中包含“宇宙”。' };
    return { ok: true, output: match[1], feedback: '通讯成功。你让计算机输出了第一句话。' };
  }

  if (missionIndex === 1) {
    const variable = code.match(/text\s+starName\s*=\s*"([^"]+)"/i);
    const output = /output\s+starName\b/i.test(code);
    if (!variable) return { ok: false, output: '没有找到 starName 的文本内容。', feedback: '请检查 text、starName、等号和双引号。' };
    if (!output) return { ok: false, output: '变量已经保存，但还没有输出。', feedback: '请在下一行输入 output starName。' };
    return { ok: true, output: variable[1], feedback: `命名成功。控制台读到了${variable[1]}。` };
  }

  if (missionIndex === 2) {
    const hasInput = /text\s+missionCode\s*=\s*input\s*\(\s*"[^"]+"\s*\)/i.test(code);
    const hasOutput = /output\s+missionCode\b/i.test(code);
    if (!hasInput || !hasOutput) {
      return { ok: false, output: '输入程序还不完整。', feedback: '请检查 input 的括号、双引号，以及下一行的 output missionCode。' };
    }
    return { ok: false, output: '程序正在等待输入。', feedback: '焦点已移动到任务代号输入框，请输入代号并按回车。', needsInput: true };
  }

  if (missionIndex === 3) {
    const distance = code.match(/integer\s+distance\s*=\s*(-?\d+)/i);
    const multiplier = code.match(/output\s+distance\s*\*\s*(-?\d+)/i);
    if (!distance) return { ok: false, output: '没有找到整数 distance。', feedback: '请检查第一行的 integer distance。' };
    if (!multiplier) return { ok: false, output: '公式中还有空白。', feedback: '请把第二行末尾的下划线替换成数字。' };
    const answer = Number(distance[1]) * Number(multiplier[1]);
    if (answer !== 84) return { ok: false, output: String(answer), feedback: '程序运行了，但目标是 84。请检查乘数。' };
    return { ok: true, output: '84', feedback: '距离计算成功。你修改了数值并完成了一次运算。' };
  }

  const signal = code.match(/integer\s+signal\s*=\s*(-?\d+)/i);
  const condition = /if\s+signal\s*>=\s*60/i.test(code);
  const successOutput = /output\s+"信号已锁定"/i.test(code);
  const elseOutput = /else[\s\S]*output\s+"继续搜索"[\s\S]*end/i.test(code);
  if (!signal || !condition) return { ok: false, output: '条件程序不完整。', feedback: '请保留 signal 和 if signal >= 60。' };
  if (!successOutput) return { ok: false, output: '第 3 行字符串没有闭合。', feedback: '“信号已锁定”后面缺少一个英文双引号。' };
  if (!elseOutput) return { ok: false, output: 'else 分支不完整。', feedback: '请检查 else、继续搜索和 end。' };
  const locked = Number(signal[1]) >= 60;
  return {
    ok: locked,
    output: locked ? '信号已锁定' : '继续搜索',
    feedback: locked ? '调试成功。你修复了错误，并让程序完成了条件判断。' : '程序运行了，但信号还没有达到 60。',
  };
};

const HearTheUniverse: React.FC<HearTheUniverseProps> = ({ onHome }) => {
  const [current, setCurrent] = useState(0);
  const [codes, setCodes] = useState(() => MISSIONS.map((mission) => mission.starter));
  const [completed, setCompleted] = useState<boolean[]>(() => MISSIONS.map(() => false));
  const [consoleText, setConsoleText] = useState('系统就绪。任务 1：启动宇宙通讯。');
  const [feedback, setFeedback] = useState('请阅读任务说明，然后在编辑区运行代码。');
  const [announcement, setAnnouncement] = useState('听见宇宙已打开。');
  const [waitingForInput, setWaitingForInput] = useState(false);
  const [missionCode, setMissionCode] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showTeacher, setShowTeacher] = useState(false);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const consoleRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const helpButtonRef = useRef<HTMLButtonElement>(null);
  const helpCloseRef = useRef<HTMLButtonElement>(null);
  const helpWasOpenRef = useRef(false);
  const currentMission = MISSIONS[current];
  const completedCount = completed.filter(Boolean).length;
  const allComplete = completedCount === MISSIONS.length;

  const speak = useCallback((text: string) => {
    setAnnouncement(text);
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.92;
    window.speechSynthesis.speak(utterance);
  }, [voiceEnabled]);

  const playTone = useCallback((success: boolean) => {
    if (!soundEnabled) return;
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = success ? 660 : 220;
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.18);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.2);
    oscillator.addEventListener('ended', () => void context.close());
  }, [soundEnabled]);

  const announceLocation = useCallback(() => {
    const state = `你在任务 ${current + 1}，${currentMission.title}。已经完成 ${completedCount} 个任务。当前焦点可以用 Tab 键继续移动。`;
    speak(state);
  }, [completedCount, current, currentMission.title, speak]);

  const runCode = useCallback(() => {
    setWaitingForInput(false);
    const result = validateMission(current, codes[current]);
    setConsoleText(result.output);
    setFeedback(result.feedback);
    playTone(result.ok);

    if (result.needsInput) {
      setWaitingForInput(true);
      speak(`${result.output}${result.feedback}`);
      window.setTimeout(() => inputRef.current?.focus(), 0);
      return;
    }

    if (result.ok) {
      setCompleted((previous) => previous.map((value, index) => index === current ? true : value));
    }
    speak(`${result.output}。${result.feedback}`);
    window.setTimeout(() => consoleRef.current?.focus(), 0);
  }, [codes, current, playTone, speak]);

  const submitMissionCode = useCallback(() => {
    const trimmed = missionCode.trim();
    if (!trimmed) {
      setConsoleText('没有收到任务代号。');
      setFeedback('请输入至少一个字符，然后按回车。');
      playTone(false);
      speak('没有收到任务代号。请输入至少一个字符，然后按回车。');
      return;
    }
    setConsoleText(trimmed);
    setFeedback('输入成功。程序收到了你的任务代号。');
    setWaitingForInput(false);
    setCompleted((previous) => previous.map((value, index) => index === current ? true : value));
    playTone(true);
    speak(`程序输出${trimmed}。输入成功。`);
    window.setTimeout(() => consoleRef.current?.focus(), 0);
  }, [current, missionCode, playTone, speak]);

  const changeMission = useCallback((next: number) => {
    if (next < 0 || next >= MISSIONS.length) return;
    const unlocked = next === 0 || completed.slice(0, next).every(Boolean);
    if (!unlocked) {
      speak(`任务 ${next + 1} 尚未解锁，请先完成前面的任务。`);
      return;
    }
    setCurrent(next);
    setWaitingForInput(false);
    setMissionCode('');
    setConsoleText(`任务 ${next + 1}：${MISSIONS[next].title}。`);
    setFeedback(MISSIONS[next].brief);
    speak(`任务 ${next + 1}，${MISSIONS[next].title}。${MISSIONS[next].brief}`);
    window.setTimeout(() => editorRef.current?.focus(), 0);
  }, [completed, speak]);

  const repeatInstruction = useCallback(() => {
    speak(`任务 ${current + 1}，${currentMission.title}。${currentMission.brief}。提示：${currentMission.hint}`);
  }, [current, currentMission, speak]);

  const stopProgram = useCallback(() => {
    setWaitingForInput(false);
    setConsoleText('程序已停止。');
    setFeedback('代码仍然保留，可以修改后再次运行。');
    speak('程序已停止。代码仍然保留。');
  }, [speak]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey && event.shiftKey && event.key.toLowerCase() === 'r') {
        event.preventDefault();
        runCode();
        return;
      }
      if (event.altKey && event.shiftKey && event.key.toLowerCase() === 's') {
        event.preventDefault();
        stopProgram();
        return;
      }
      if (event.altKey && event.shiftKey && event.key.toLowerCase() === 'c') {
        event.preventDefault();
        consoleRef.current?.focus();
        return;
      }
      if (event.altKey && event.shiftKey && event.key.toLowerCase() === 'e') {
        event.preventDefault();
        editorRef.current?.focus();
        return;
      }
      if (event.key === 'F1') {
        event.preventDefault();
        repeatInstruction();
        return;
      }
      if (event.key === 'F2') {
        event.preventDefault();
        announceLocation();
        return;
      }
      if (!isEditableTarget(event.target) && event.key.toLowerCase() === 'n') {
        event.preventDefault();
        setShowTeacher((value) => !value);
        return;
      }
      if (!isEditableTarget(event.target) && event.key.toLowerCase() === 'f') {
        event.preventDefault();
        if (!document.fullscreenElement) void document.documentElement.requestFullscreen();
        else void document.exitFullscreen();
      }
      if (event.key === 'Escape') {
        setShowHelp(false);
        setShowTeacher(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [announceLocation, repeatInstruction, runCode, stopProgram]);

  useEffect(() => {
    if (waitingForInput) inputRef.current?.focus();
  }, [waitingForInput]);

  useEffect(() => {
    if (showHelp) {
      helpWasOpenRef.current = true;
      window.requestAnimationFrame(() => helpCloseRef.current?.focus());
      return;
    }
    if (helpWasOpenRef.current) {
      helpWasOpenRef.current = false;
      window.requestAnimationFrame(() => helpButtonRef.current?.focus());
    }
  }, [showHelp]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    const draw = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, width, height);
      for (let index = 0; index < 90; index += 1) {
        const x = (index * 83 + 29) % Math.max(width, 1);
        const y = (index * 47 + 61) % Math.max(height, 1);
        const radius = index % 13 === 0 ? 1.8 : 0.8;
        context.beginPath();
        context.fillStyle = index % 9 === 0 ? 'rgba(112, 225, 255, .7)' : 'rgba(255, 255, 255, .34)';
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
      }
    };
    draw();
    window.addEventListener('resize', draw);
    return () => window.removeEventListener('resize', draw);
  }, []);

  const textState = useMemo(() => ({
    coordinateSystem: 'DOM界面，无空间坐标；使用Tab在交互元素间移动',
    mode: allComplete ? 'complete' : waitingForInput ? 'waiting-for-input' : 'mission',
    mission: { index: current + 1, title: currentMission.title, concept: currentMission.concept },
    progress: { completed: completedCount, total: MISSIONS.length, flags: completed },
    editor: codes[current],
    console: consoleText,
    feedback,
    waitingForInput,
    shortcuts: ['Alt+Shift+R 运行', 'Alt+Shift+S 停止', 'Alt+Shift+E 编辑区', 'Alt+Shift+C 控制台', 'F1 重复任务', 'F2 我在哪里'],
  }), [allComplete, codes, completed, completedCount, consoleText, current, currentMission, feedback, waitingForInput]);

  useEffect(() => {
    window.render_game_to_text = () => JSON.stringify(textState);
    window.advanceTime = () => window.render_game_to_text();
    return () => {
      delete window.render_game_to_text;
      delete window.advanceTime;
    };
  }, [textState]);

  return (
    <main className="htu-page" data-testid="hear-the-universe">
      <canvas ref={canvasRef} className="htu-stars" aria-hidden="true" />
      <a className="htu-skip" href="#htu-editor">跳到代码编辑区</a>
      <div className="htu-sr-live" role="status" aria-live="polite" aria-atomic="true">{announcement}</div>

      <header className="htu-header">
        <button type="button" className="htu-brand" onClick={onHome} aria-label="返回大雷个人主页">
          <span aria-hidden="true">◀</span> 大雷 / LAB
        </button>
        <div className="htu-title-group">
          <p>HP 代码一小时 · 中文无障碍实验</p>
          <h1>听见宇宙</h1>
        </div>
        <nav className="htu-header-actions" aria-label="页面工具">
          <button ref={helpButtonRef} type="button" onClick={() => setShowHelp(true)}>键盘帮助</button>
          <button type="button" onClick={() => setShowTeacher((value) => !value)} aria-pressed={showTeacher}>讲师提示</button>
        </nav>
      </header>

      <section className="htu-statusbar" aria-label="课程状态">
        <div>
          <span>任务进度</span>
          <strong>{completedCount} / {MISSIONS.length}</strong>
        </div>
        <progress max={MISSIONS.length} value={completedCount} aria-label={`已完成 ${completedCount} 个任务，共 ${MISSIONS.length} 个`} />
        <label><input type="checkbox" checked={voiceEnabled} onChange={(event) => setVoiceEnabled(event.target.checked)} /> 浏览器语音反馈</label>
        <label><input type="checkbox" checked={soundEnabled} onChange={(event) => setSoundEnabled(event.target.checked)} /> 简短提示音</label>
      </section>

      <div className="htu-layout">
        <aside className="htu-missions" aria-labelledby="mission-list-title">
          <div className="htu-panel-heading">
            <span>MISSION MAP</span>
            <h2 id="mission-list-title">五个宇宙任务</h2>
          </div>
          <ol>
            {MISSIONS.map((mission, index) => {
              const unlocked = index === 0 || completed.slice(0, index).every(Boolean);
              return (
                <li key={mission.number}>
                  <button
                    type="button"
                    onClick={() => changeMission(index)}
                    className={index === current ? 'is-current' : ''}
                    disabled={!unlocked}
                    aria-current={index === current ? 'step' : undefined}
                  >
                    <span>{completed[index] ? '已完成' : unlocked ? mission.number : '未解锁'}</span>
                    <strong>{mission.title}</strong>
                    <small>{mission.concept}</small>
                  </button>
                </li>
              );
            })}
          </ol>
          <button type="button" className="htu-location" onClick={announceLocation}>F2 · 我在哪里？</button>
        </aside>

        <section className="htu-workspace" aria-labelledby="current-mission-title">
          <div className="htu-mission-brief" id="mission-instruction">
            <div>
              <span>任务 {currentMission.number}</span>
              <h2 id="current-mission-title">{currentMission.title}</h2>
            </div>
            <p>{currentMission.brief}</p>
            <button type="button" onClick={repeatInstruction}>F1 · 重复任务与提示</button>
          </div>

          <div className="htu-code-grid">
            <section className="htu-editor-panel" aria-labelledby="editor-title">
              <div className="htu-console-title">
                <div><span aria-hidden="true">●</span><span aria-hidden="true">●</span><span aria-hidden="true">●</span></div>
                <h3 id="editor-title">代码编辑区</h3>
                <span>Main.quorum</span>
              </div>
              <label className="htu-editor-label" htmlFor="htu-editor">在这里输入或修改代码</label>
              <textarea
                ref={editorRef}
                id="htu-editor"
                value={codes[current]}
                onChange={(event) => setCodes((previous) => previous.map((value, index) => index === current ? event.target.value : value))}
                aria-describedby="mission-instruction htu-shortcut-note"
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
              />
              <p id="htu-shortcut-note">快捷键：Alt + Shift + R 运行；Alt + Shift + S 停止。</p>
              <div className="htu-run-actions">
                <button type="button" className="htu-run" onClick={runCode}>运行程序</button>
                <button type="button" onClick={stopProgram}>停止</button>
              </div>
            </section>

            <section className="htu-output-panel" aria-labelledby="output-title">
              <div className="htu-console-title">
                <div><span aria-hidden="true">●</span><span aria-hidden="true">●</span><span aria-hidden="true">●</span></div>
                <h3 id="output-title">读屏输出控制台</h3>
                <span>ARIA LIVE</span>
              </div>
              <div ref={consoleRef} className="htu-output" tabIndex={-1} role="log" aria-live="polite" aria-atomic="true">
                <span>程序输出</span>
                <strong>{consoleText}</strong>
                <p>{feedback}</p>
              </div>

              {waitingForInput && (
                <form className="htu-input-request" onSubmit={(event) => { event.preventDefault(); submitMissionCode(); }}>
                  <label htmlFor="mission-code">程序询问：请输入任务代号</label>
                  <input ref={inputRef} id="mission-code" value={missionCode} onChange={(event) => setMissionCode(event.target.value)} />
                  <button type="submit">提交输入</button>
                </form>
              )}

              <details className="htu-hint">
                <summary>需要一点提示</summary>
                <p>{currentMission.hint}</p>
              </details>
            </section>
          </div>

          <div className="htu-next-row">
            <button type="button" onClick={() => changeMission(current - 1)} disabled={current === 0}>上一个任务</button>
            {current < MISSIONS.length - 1 ? (
              <button type="button" className="htu-next" onClick={() => changeMission(current + 1)} disabled={!completed[current]}>进入下一个任务</button>
            ) : (
              <span>{completed[current] ? '全部任务已完成' : '完成调试后即可获得结业徽章'}</span>
            )}
          </div>
        </section>
      </div>

      {allComplete && (
        <section className="htu-complete" aria-labelledby="complete-title">
          <span aria-hidden="true">✦</span>
          <div>
            <p>HP 代码一小时</p>
            <h2 id="complete-title">听见宇宙 · 代码探索者</h2>
            <p>你已经完成输出、变量、输入、运算和条件调试五个任务。</p>
          </div>
          <button type="button" onClick={() => window.print()}>打印完成页</button>
        </section>
      )}

      {showTeacher && (
        <aside className="htu-teacher" aria-labelledby="teacher-title">
          <button type="button" className="htu-close" onClick={() => setShowTeacher(false)} aria-label="关闭讲师提示">×</button>
          <span>讲师模式 · N 键开关</span>
          <h2 id="teacher-title">{currentMission.title}</h2>
          <dl>
            <div><dt>讲师口令</dt><dd>{currentMission.teacherCue}</dd></div>
            <div><dt>助教边界</dt><dd>{currentMission.assistantCue}</dd></div>
            <div><dt>成功条件</dt><dd>{current < 4 ? '学员独立输入、运行并听到正确结果。' : '学员根据错误反馈完成一次修正并重试。'}</dd></div>
          </dl>
        </aside>
      )}

      {showHelp && (
        <div className="htu-dialog-backdrop" role="presentation">
          <section className="htu-dialog" role="dialog" aria-modal="true" aria-labelledby="help-title">
            <button ref={helpCloseRef} type="button" className="htu-close" onClick={() => setShowHelp(false)} aria-label="关闭键盘帮助">×</button>
            <span>KEYBOARD MAP</span>
            <h2 id="help-title">键盘操作说明</h2>
            <dl>
              <div><dt>Tab / Shift + Tab</dt><dd>向前或向后移动焦点</dd></div>
              <div><dt>Alt + Shift + R</dt><dd>运行程序</dd></div>
              <div><dt>Alt + Shift + S</dt><dd>停止程序</dd></div>
              <div><dt>Alt + Shift + E</dt><dd>回到代码编辑区</dd></div>
              <div><dt>Alt + Shift + C</dt><dd>跳到输出控制台</dd></div>
              <div><dt>F1 / F2</dt><dd>重复任务 / 告诉我在哪里</dd></div>
              <div><dt>F / Esc</dt><dd>进入全屏 / 退出或关闭弹层</dd></div>
            </dl>
            <p>页面不拦截普通字母输入；焦点在编辑区时，可以正常输入代码。</p>
            <button type="button" className="htu-run" onClick={() => setShowHelp(false)}>我知道了</button>
          </section>
        </div>
      )}

      <footer className="htu-footer">
        <p>原创中文无障碍教学改编 · 不保存姓名与输入内容 · 无需摄像头或 API</p>
        <a href="https://quorumlanguage.com/hourofcode/astro1.html" target="_blank" rel="noreferrer">学习逻辑参考 Quorum Astronomy Hour of Code</a>
      </footer>
    </main>
  );
};

declare global {
  interface Window {
    render_game_to_text?: () => string;
    advanceTime?: (ms: number) => string;
    webkitAudioContext?: typeof AudioContext;
  }
}

export default HearTheUniverse;
