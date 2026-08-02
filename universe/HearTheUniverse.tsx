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
  timeSlot: string;
  stage: string;
  brief: string;
  starter: string;
  hint: string;
  teacherCue: string;
  assistantCue: string;
  successEvidence: string;
};

type ClassroomChapter = {
  id: string;
  time: string;
  eyebrow: string;
  title: string;
  body: string;
  lecturer: string;
  support: string;
  tags: string[];
  accent: string;
  taskIndex?: number;
  action: string;
};

const MISSIONS: Mission[] = [
  {
    number: '01',
    title: '启动宇宙通讯',
    concept: '输出 output',
    timeSlot: '10–18 分钟',
    stage: '通讯星站',
    brief: '让程序说出“你好，宇宙”。输入完成后运行程序，听一听控制台的结果。',
    starter: 'output "你好，宇宙"',
    hint: 'output 后面要有一个空格，文字要放在英文双引号中。',
    teacherCue: '先建立“输入—运行—听见结果”的闭环，只讲 output 一个概念。',
    assistantCue: '只提示键位或当前行，不触碰学员键盘，不替学员输入。',
    successEvidence: '学员独立输入并运行 output，读屏读出正确结果。',
  },
  {
    number: '02',
    title: '给星星命名',
    concept: '文本变量 text',
    timeSlot: '18–28 分钟',
    stage: '通讯星站',
    brief: '创建一个叫 starName 的文本变量，把你喜欢的星星名字放进去，再输出它。',
    starter: 'text starName = "北极星"\noutput starName',
    hint: '第一行保存名字，第二行直接 output starName，不需要再加双引号。',
    teacherCue: '把变量比作“有标签的收纳盒”，强调变量名可以重复使用。',
    assistantCue: '如果卡住，只确认变量名和双引号，不直接说出整段答案。',
    successEvidence: '学员至少修改一次星星名称，并听到变量的新内容。',
  },
  {
    number: '03',
    title: '输入任务代号',
    concept: '键盘输入 input',
    timeSlot: '28–34 分钟',
    stage: '航行参数站',
    brief: '让程序向你询问任务代号。运行后，页面会把焦点送到输入框。',
    starter: 'text missionCode = input("请输入任务代号")\noutput missionCode',
    hint: 'input 的问题要放在括号和双引号里，下一行输出 missionCode。',
    teacherCue: '提醒大家：程序暂停不是坏掉了，它正在等待人的输入。',
    assistantCue: '读屏宣布“等待输入”后，让学员自己键入代号并按回车。',
    successEvidence: '学员听见输入请求，自主输入任务代号并提交。',
  },
  {
    number: '04',
    title: '计算星际距离',
    concept: '整数与运算',
    timeSlot: '34–40 分钟',
    stage: '航行参数站',
    brief: '把两个观测段合在一起。将下划线替换成数字 2，让程序算出 84。',
    starter: 'integer distance = 42\noutput distance * __',
    hint: '找到第二行末尾的两个下划线，把它们替换成数字 2。',
    teacherCue: '只让学员改一个数值，听到 84 就算成功，不扩展复杂公式。',
    assistantCue: '可提示“第二行最后”，不要替学员移动光标或删除字符。',
    successEvidence: '学员先预测、再替换一个数值，最后听到 84。',
  },
  {
    number: '05',
    title: '修复信号判断',
    concept: '条件判断与调试',
    timeSlot: '40–50 分钟',
    stage: '安全判断站',
    brief: '程序里少了一个英文双引号。找到错误、补上它，再运行并锁定信号。',
    starter: 'integer signal = 75\nif signal >= 60\n  output "信号已锁定\nelse\n  output "继续搜索"\nend',
    hint: '检查“信号已锁定”这一行：一句文字的开头和结尾都需要双引号。',
    teacherCue: '把错误当作线索：先听反馈，再只改一个地方，然后重试。',
    assistantCue: '先复述错误类型，等待 5 到 8 秒；仍卡住再提示所在行。',
    successEvidence: '学员根据错误信息定位一处问题，修正后再次运行。',
  },
];

const CLASSROOM_CHAPTERS: ClassroomChapter[] = [
  {
    id: 'arrival', time: '00–05', eyebrow: 'PRE-FLIGHT', title: '入场与设备定位',
    body: '先让每位学员知道房间、座位、耳机、退出方式和当前焦点，再开始教代码。',
    lecturer: '口头说明教室方位，统一确认读屏、耳机、Tab 顺序和 F2。',
    support: '固定座位与陪护；活动中不移动键盘、线缆和个人物品。',
    tags: ['4–5 名全盲青年', '1 主讲 + 5 陪护 + 1 技术', '固定座位'], accent: '#70E1FF', action: '进入指令热身',
  },
  {
    id: 'warmup', time: '05–10', eyebrow: 'ORBIT 01', title: '理解“代码＝可执行指令”',
    body: '用生活中的顺序指令热身：人发出命令，计算机执行，结果告诉我们下一步。',
    lecturer: '只建立“输入—运行—听结果”一个闭环，不提前讲语法细节。',
    support: '让学员复述一个生活算法，用学员选择的节奏继续。',
    tags: ['一次只讲一个概念', '先预测再运行', '无竞速'], accent: '#70E58B', action: '打开第 1 个任务', taskIndex: 0,
  },
  {
    id: 'communication', time: '10–28', eyebrow: 'ORBIT 02', title: '通讯星站',
    body: '用 output 让电脑说话，再用 text 变量给星星命名。目标是每个人听见自己第一段程序。',
    lecturer: '任务 1 与 2 各只增加一个新概念，演示后留出 5–8 秒安静操作时间。',
    support: '只读提示、描述焦点、记录成功证据；不代打、不抓手。',
    tags: ['任务 1–2', 'output', 'text 变量'], accent: '#FFD166', action: '从任务 1 开始', taskIndex: 0,
  },
  {
    id: 'navigation', time: '28–40', eyebrow: 'ORBIT 03', title: '航行参数站',
    body: '程序开始向学员提问，并使用整数完成一次简单运算。',
    lecturer: '强调程序暂停是在等待输入；每次改动前先请学员预测结果。',
    support: '报出当前焦点和可选动作，学员决定键入什么。',
    tags: ['任务 3–4', 'input', '整数与运算'], accent: '#70E1FF', action: '继续当前任务', taskIndex: 2,
  },
  {
    id: 'safety', time: '40–50', eyebrow: 'ORBIT 04', title: '安全判断站',
    body: '从错误信息中找线索，修好一处字符串问题，让条件判断锁定信号。',
    lecturer: '把“错了”改成“程序给了我们一条线索”，先听、再改一处、然后重试。',
    support: '先复述错误类型并等待 5–8 秒，必要时只提示行号。',
    tags: ['任务 5', '条件判断', '完成一次调试'], accent: '#FF6FA8', action: '进入调试任务', taskIndex: 4,
  },
  {
    id: 'bonus', time: '50–56', eyebrow: 'OPTIONAL', title: '可选声波航道',
    body: '只有在读屏、耳机和键盘路径已提前实测通过时，才开启浏览器语音或提示音。',
    lecturer: '设备路径不稳定时，直接回到文本任务：修改星星名或任务代号。',
    support: '技术支持负责设备问题，固定陪护不中断学员的操作节奏。',
    tags: ['通过设备实测才开启', '可随时降级', '不临场冒险'], accent: '#70E1FF', action: '返回任务台',
  },
  {
    id: 'return', time: '56–60', eyebrow: 'RETURN', title: '返回地球·分享与完成证明',
    body: '每人用一句话说“我让电脑做了什么”。参与、尝试和自主操作都值得被看见。',
    lecturer: '不排名、不比较速度；给每位学员发放完成证明和奖品。',
    support: '可以帮学员复述完成的行动，不要代替学员评价自己。',
    tags: ['一句话分享', '人人完成', '无排名'], accent: '#FFD166', action: '前往任务台完成任务',
  },
];

const isEditableTarget = (target: EventTarget | null) => {
  const element = target as HTMLElement | null;
  return element?.tagName === 'TEXTAREA' || element?.tagName === 'INPUT' || element?.isContentEditable;
};

const normalizeQuotes = (value: string) => value.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
const clamp = (value: number, minimum = 0, maximum = 1) => Math.min(maximum, Math.max(minimum, value));
const MISSION_CHAPTER_INDEX = [2, 2, 3, 3, 4];

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
  const [activeChapter, setActiveChapter] = useState(0);
  const [journeyProgress, setJourneyProgress] = useState(0);
  const [motionReduced, setMotionReduced] = useState(false);
  const [printView, setPrintView] = useState<'instructor' | 'certificate' | null>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const consoleRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const storyRef = useRef<HTMLElement>(null);
  const labRef = useRef<HTMLElement>(null);
  const chapterRefs = useRef<Array<HTMLElement | null>>([]);
  const helpButtonRef = useRef<HTMLButtonElement>(null);
  const helpCloseRef = useRef<HTMLButtonElement>(null);
  const helpWasOpenRef = useRef(false);
  const currentMission = MISSIONS[current];
  const classroomChapter = CLASSROOM_CHAPTERS[MISSION_CHAPTER_INDEX[current]];
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
    const state = `当前课堂时段 ${currentMission.timeSlot}，${currentMission.stage}。你在任务 ${current + 1}，${currentMission.title}。已经完成 ${completedCount} 个任务。当前焦点可以用 Tab 键继续移动。`;
    speak(state);
  }, [completedCount, current, currentMission.stage, currentMission.timeSlot, currentMission.title, speak]);

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

  const scrollToChapter = useCallback((index: number) => {
    chapterRefs.current[index]?.scrollIntoView({ behavior: motionReduced ? 'auto' : 'smooth', block: 'center' });
  }, [motionReduced]);

  const openTaskLab = useCallback((requested?: number) => {
    const firstIncomplete = completed.findIndex((value) => !value);
    const furthestUnlocked = firstIncomplete === -1 ? MISSIONS.length - 1 : firstIncomplete;
    const target = typeof requested === 'number' ? Math.min(requested, furthestUnlocked) : current;
    changeMission(target);
    labRef.current?.scrollIntoView({ behavior: motionReduced ? 'auto' : 'smooth', block: 'start' });
    window.setTimeout(() => editorRef.current?.focus(), motionReduced ? 0 : 450);
  }, [changeMission, completed, current, motionReduced]);

  const printDocument = useCallback((view: 'instructor' | 'certificate') => {
    setPrintView(view);
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => window.print()));
  }, []);

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
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setMotionReduced(query.matches);
    const onChange = (event: MediaQueryListEvent) => setMotionReduced(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    document.documentElement.style.scrollBehavior = motionReduced ? 'auto' : '';
    return () => { document.documentElement.style.scrollBehavior = ''; };
  }, [motionReduced]);

  useEffect(() => {
    let frame = 0;
    const readJourney = () => {
      frame = 0;
      const story = storyRef.current;
      if (!story) return;
      const rect = story.getBoundingClientRect();
      const storyTop = window.scrollY + rect.top;
      const span = Math.max(story.offsetHeight - window.innerHeight, 1);
      const nextProgress = clamp((window.scrollY - storyTop) / span);
      setJourneyProgress((previous) => Math.abs(previous - nextProgress) > 0.001 ? nextProgress : previous);

      const viewportCenter = window.innerHeight * 0.5;
      let closestIndex = 0;
      let closestDistance = Number.POSITIVE_INFINITY;
      chapterRefs.current.forEach((chapter, index) => {
        if (!chapter) return;
        const bounds = chapter.getBoundingClientRect();
        const distance = Math.abs(bounds.top + bounds.height * 0.5 - viewportCenter);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });
      setActiveChapter((previous) => previous === closestIndex ? previous : closestIndex);
    };
    const scheduleRead = () => {
      if (!frame) frame = window.requestAnimationFrame(readJourney);
    };
    readJourney();
    window.addEventListener('scroll', scheduleRead, { passive: true });
    window.addEventListener('resize', scheduleRead);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', scheduleRead);
      window.removeEventListener('resize', scheduleRead);
    };
  }, []);

  useEffect(() => {
    const clearPrintView = () => setPrintView(null);
    window.addEventListener('afterprint', clearPrintView);
    return () => window.removeEventListener('afterprint', clearPrintView);
  }, []);

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
        const parallax = motionReduced ? 0 : journeyProgress * (36 + (index % 4) * 18);
        const rawX = (index * 83 + 29 - parallax) % Math.max(width, 1);
        const x = rawX < 0 ? rawX + width : rawX;
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
  }, [journeyProgress, motionReduced]);

  const cameraProgress = motionReduced ? activeChapter / (CLASSROOM_CHAPTERS.length - 1) : journeyProgress;
  const worldImageStyle = useMemo<React.CSSProperties>(() => ({
    objectPosition: `${10 + cameraProgress * 80}% 52%`,
    transform: `translate3d(${(0.5 - cameraProgress) * 7}vw, ${(0.5 - Math.abs(cameraProgress - 0.5)) * -1.8}vh, 0) scale(${1.06 + cameraProgress * 0.12})`,
  }), [cameraProgress]);

  const textState = useMemo(() => ({
    coordinateSystem: 'DOM课堂界面；滚动世界是装饰性视觉，所有内容都可用 Tab 和地标导航',
    mode: allComplete ? 'complete' : waitingForInput ? 'waiting-for-input' : 'mission',
    classroom: {
      duration: '60 分钟',
      scrollChapter: { index: activeChapter + 1, time: CLASSROOM_CHAPTERS[activeChapter].time, title: CLASSROOM_CHAPTERS[activeChapter].title },
      currentMissionPhase: { time: classroomChapter.time, title: classroomChapter.title },
      support: '1 主讲 + 5 固定陪护 + 1 机动技术支持',
      rule: '不排名、不比较速度、陪护不代操作',
      reducedMotion: motionReduced,
    },
    mission: { index: current + 1, title: currentMission.title, concept: currentMission.concept, timeSlot: currentMission.timeSlot, stage: currentMission.stage },
    progress: { completed: completedCount, total: MISSIONS.length, flags: completed },
    editor: codes[current],
    console: consoleText,
    feedback,
    waitingForInput,
    shortcuts: ['Alt+Shift+R 运行', 'Alt+Shift+S 停止', 'Alt+Shift+E 编辑区', 'Alt+Shift+C 控制台', 'F1 重复任务', 'F2 我在哪里'],
  }), [activeChapter, allComplete, classroomChapter, codes, completed, completedCount, consoleText, current, currentMission, feedback, motionReduced, waitingForInput]);

  useEffect(() => {
    window.render_game_to_text = () => JSON.stringify(textState);
    window.advanceTime = () => window.render_game_to_text();
    return () => {
      delete window.render_game_to_text;
      delete window.advanceTime;
    };
  }, [textState]);

  return (
    <main className={`htu-page ${motionReduced ? 'is-reduced-motion' : ''}`} data-testid="hear-the-universe" data-print-view={printView ?? undefined}>
      <canvas ref={canvasRef} className="htu-stars" aria-hidden="true" />
      <div className="htu-world-stage" aria-hidden="true">
        <img src="/hear-the-universe-world.webp" alt="" style={worldImageStyle} />
        <div className="htu-world-shade" />
      </div>
      <a className="htu-skip" href="#classroom-story">跳到 60 分钟课堂路线</a>
      <a className="htu-skip htu-skip-lab" href="#code-lab">跳到代码任务台</a>
      <div className="htu-sr-live" role="status" aria-live="polite" aria-atomic="true">{announcement}</div>

      <header className="htu-header">
        <button type="button" className="htu-brand" onClick={onHome} aria-label="返回大雷个人主页">
          <span aria-hidden="true">◀</span> 大雷 / LAB
        </button>
        <div className="htu-title-group">
          <p>HP 代码一小时 · 视障青年场</p>
          <h1>听见宇宙</h1>
        </div>
        <nav className="htu-header-actions" aria-label="页面工具">
          <button type="button" onClick={() => setMotionReduced((value) => !value)} aria-pressed={motionReduced}>低动态 {motionReduced ? '开' : '关'}</button>
          <button ref={helpButtonRef} type="button" onClick={() => setShowHelp(true)}>键盘帮助</button>
          <button type="button" onClick={() => setShowTeacher((value) => !value)} aria-pressed={showTeacher}>讲师提示</button>
          <button type="button" onClick={() => printDocument('instructor')}>打印讲师卡</button>
        </nav>
      </header>

      <section className="htu-hero" aria-labelledby="htu-hero-title">
        <div className="htu-hero-copy">
          <span className="htu-kicker">中文 · 键盘优先 · 读屏友好</span>
          <h2 id="htu-hero-title">一小时，从按下第一个键<br />到听见自己的程序。</h2>
          <p>这既是学员的五个代码任务，也是讲师当天可直接使用的滚动课件。页面从入场定位、键盘热身一直带到分享和完成证明。</p>
          <div className="htu-hero-actions">
            <button type="button" className="htu-primary" onClick={() => scrollToChapter(0)}>开始 60 分钟课堂路线</button>
            <button type="button" onClick={() => openTaskLab(0)}>直接进入代码任务</button>
          </div>
        </div>
        <aside className="htu-hero-brief" aria-label="活动关键配置">
          <span>MISSION BRIEF</span>
          <h3>视障青年场·现场配置</h3>
          <dl>
            <div><dt>4–5</dt><dd>名全盲青年，熟练使用电脑、键盘与读屏</dd></div>
            <div><dt>1+5+1</dt><dd>1 主讲、5 固定陪护、1 机动技术支持</dd></div>
            <div><dt>60</dt><dd>分钟主线，五个任务，不分组、不竞速</dd></div>
          </dl>
          <p>成功不是过完所有关，而是自己输入、自己运行，至少完成一次调试。</p>
        </aside>
        <button type="button" className="htu-scroll-cue" onClick={() => scrollToChapter(0)}>
          <span>滚动推进课堂</span><i aria-hidden="true" />
        </button>
      </section>

      <section ref={storyRef} id="classroom-story" className="htu-world-story" aria-labelledby="classroom-story-title">
        <h2 id="classroom-story-title" className="htu-sr-only">视障青年场 60 分钟课堂路线</h2>
        <nav className="htu-route-rail" aria-label="60 分钟课堂路线">
          <span>课堂路线</span>
          <ol>
            {CLASSROOM_CHAPTERS.map((chapter, index) => (
              <li key={chapter.id}>
                <button
                  type="button"
                  className={index === activeChapter ? 'is-active' : ''}
                  aria-current={index === activeChapter ? 'step' : undefined}
                  aria-label={`${chapter.time} ${chapter.title}`}
                  onClick={() => scrollToChapter(index)}
                >
                  <i style={{ backgroundColor: chapter.accent }} aria-hidden="true" />
                  <span>{chapter.time}</span>
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <div className="htu-chapter-stack">
          {CLASSROOM_CHAPTERS.map((chapter, index) => (
            <section
              key={chapter.id}
              id={`chapter-${chapter.id}`}
              ref={(element) => { chapterRefs.current[index] = element; }}
              className={`htu-chapter ${index === activeChapter ? 'is-active' : ''}`}
              aria-labelledby={`chapter-${chapter.id}-title`}
              style={{ '--chapter-accent': chapter.accent } as React.CSSProperties}
            >
              <article className="htu-chapter-card">
                <div className="htu-chapter-meta"><span>{chapter.eyebrow}</span><strong>{chapter.time}</strong></div>
                <p className="htu-chapter-count">{String(index + 1).padStart(2, '0')} / {String(CLASSROOM_CHAPTERS.length).padStart(2, '0')}</p>
                <h3 id={`chapter-${chapter.id}-title`}>{chapter.title}</h3>
                <p className="htu-chapter-body">{chapter.body}</p>
                <ul className="htu-chapter-tags">{chapter.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>
                <dl className="htu-chapter-roles">
                  <div><dt>讲师动作</dt><dd>{chapter.lecturer}</dd></div>
                  <div><dt>陪护与验收</dt><dd>{chapter.support}</dd></div>
                </dl>
                <button type="button" onClick={() => index === 0 ? scrollToChapter(1) : openTaskLab(chapter.taskIndex)}>{chapter.action}</button>
              </article>
            </section>
          ))}
        </div>
      </section>

      <section ref={labRef} id="code-lab" className="htu-lab-section" aria-labelledby="code-lab-title">
        <header className="htu-lab-intro">
          <div>
            <span>10–50 分钟 · 学员任务台</span>
            <h2 id="code-lab-title">五个任务，一条清晰主线</h2>
          </div>
          <p><strong>{currentMission.timeSlot}·{currentMission.stage}</strong><br />讲师统一口头节奏，陪护只描述焦点和提示，不替学员操作。</p>
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
                    <small>{mission.timeSlot} · {mission.concept}</small>
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
              <span>{currentMission.timeSlot} · {currentMission.stage} · 任务 {currentMission.number}</span>
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
      </section>

      {allComplete && (
        <section className="htu-complete" aria-labelledby="complete-title">
          <span aria-hidden="true">✦</span>
          <div>
            <p>HP 代码一小时</p>
            <h2 id="complete-title">听见宇宙 · 代码探索者</h2>
            <p>你已经完成输出、变量、输入、运算和条件调试五个任务。</p>
          </div>
          <button type="button" onClick={() => printDocument('certificate')}>打印完成证明</button>
        </section>
      )}

      {showTeacher && (
        <aside className="htu-teacher" aria-labelledby="teacher-title">
          <button type="button" className="htu-close" onClick={() => setShowTeacher(false)} aria-label="关闭讲师提示">×</button>
          <span>讲师模式 · N 键开关</span>
          <h2 id="teacher-title">{currentMission.title}</h2>
          <dl>
            <div><dt>计划时段</dt><dd>{currentMission.timeSlot} · {currentMission.stage}</dd></div>
            <div><dt>讲师口令</dt><dd>{currentMission.teacherCue}</dd></div>
            <div><dt>助教边界</dt><dd>{currentMission.assistantCue}</dd></div>
            <div><dt>成功证据</dt><dd>{currentMission.successEvidence}</dd></div>
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
              <div><dt>课堂路线</dt><dd>使用地标或页面右侧时间点跳转；滚动动画不影响任务操作</dd></div>
            </dl>
            <p>页面不拦截普通字母输入；焦点在编辑区时，可以正常输入代码。</p>
            <button type="button" className="htu-run" onClick={() => setShowHelp(false)}>我知道了</button>
          </section>
        </div>
      )}

      <section className="htu-print-sheet htu-instructor-sheet" aria-label="听见宇宙讲师执行卡">
        <header><p>HP 代码一小时 · 视障青年场</p><h1>听见宇宙·60 分钟讲师执行卡</h1></header>
        <p><strong>配置：</strong>4–5 名全盲青年；1 主讲 + 5 固定陪护 + 1 机动技术支持；能力差异不大，不分组。</p>
        <table>
          <thead><tr><th>时间</th><th>课堂阶段</th><th>讲师动作</th><th>陪护与验收</th></tr></thead>
          <tbody>{CLASSROOM_CHAPTERS.map((chapter) => <tr key={chapter.id}><td>{chapter.time}</td><td>{chapter.title}</td><td>{chapter.lecturer}</td><td>{chapter.support}</td></tr>)}</tbody>
        </table>
        <div className="htu-print-notes">
          <p><strong>陪护口令：</strong>“你希望我读提示、解释概念，还是只等你操作？”</p>
          <p><strong>底线：</strong>不抢键盘、不抓手、不代输入；先报当前焦点、错误信息和可选动作。</p>
          <p><strong>降级：</strong>读屏或网络不稳定时，保留同一概念任务，切换本地文本与终端输出，不临时换成视觉积木课。</p>
        </div>
      </section>

      <section className="htu-print-sheet htu-certificate-sheet" aria-label="听见宇宙完成证明">
        <p>HP 代码一小时</p>
        <span aria-hidden="true">✦</span>
        <h1>听见宇宙·代码探索者</h1>
        <p>完成输出、变量、输入、运算和条件调试任务，亲手让计算机执行了自己的指令。</p>
        <footer><span>参与优先 · 不比速度</span><span>活动完成证明</span></footer>
      </section>

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
