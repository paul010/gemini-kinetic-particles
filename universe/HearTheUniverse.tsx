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
  warmup?: boolean;
};

type ViewMode = 'student' | 'instructor';
type SoundMode = 'screen-reader' | 'narration' | 'text';
type FeedbackKind = 'info' | 'run' | 'success' | 'retry';
type ClassroomState = 'listen' | 'work' | 'close';
type SeatState = 'ready' | 'help' | 'paused' | 'tech';

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
  voiceIntro: string;
  voiceRetry: string;
  voiceSuccess: string;
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
    title: '唤醒沉睡的星站',
    concept: '输出 output',
    timeSlot: '10-18 分钟',
    stage: '通讯星站',
    brief: '宇宙突然失去了声音。写下第一句呼唤，让沉睡的星站重新回应。',
    starter: 'output "你好，宇宙"',
    hint: 'output 后面要有一个空格，文字要放在英文双引号中。',
    teacherCue: '先建立“输入、运行、听见结果”的闭环，只讲 output 一个概念。',
    assistantCue: '只提示键位或当前行，不触碰学员键盘，不替学员输入。',
    successEvidence: '学员修改双引号中的广播，自己运行，并听到新结果。',
    voiceIntro: '第一关，唤醒沉睡的星站。请修改双引号里的宇宙广播，然后运行程序。我们正在等待你的第一个信号。',
    voiceRetry: '星站收到了信号，但还没有听清。请检查 output 后的空格和英文双引号，一次只改一处。',
    voiceSuccess: '星站已经醒来。你写下的第一句话，正在宇宙中回响。',
  },
  {
    number: '02',
    title: '为无名星点亮名字',
    concept: '文本变量 text',
    timeSlot: '18-28 分钟',
    stage: '通讯星站',
    brief: '星站找到一颗没有名字的星星。为它命名，再让程序把这个名字传向宇宙。',
    starter: 'text starName = "北极星"\noutput starName',
    hint: '第一行保存名字，第二行直接 output starName，不需要再加双引号。',
    teacherCue: '把变量比作“有标签的收纳盒”，强调变量名可以重复使用。',
    assistantCue: '如果卡住，只确认变量名和双引号，不直接说出整段答案。',
    successEvidence: '学员至少修改一次星星名称，并听到变量的新内容。',
    voiceIntro: '第二关，为无名星点亮名字。请找到双引号中的星星名称，换成你想起的名字，再运行。',
    voiceRetry: '名字还没有传出去。请检查第一行的 starName，以及第二行的 output starName。',
    voiceSuccess: '命名完成。这颗星星从现在起有了名字，宇宙也记住了它。',
  },
  {
    number: '03',
    title: '接收来自远方的密令',
    concept: '键盘输入 input',
    timeSlot: '28-34 分钟',
    stage: '航行参数站',
    brief: '一段很弱的信号正在等待回答。让程序询问你的任务代号，输入密令后按回车。',
    starter: 'text missionCode = input("请输入任务代号")\noutput missionCode',
    hint: 'input 的问题要放在括号和双引号里，下一行输出 missionCode。',
    teacherCue: '提醒大家：程序暂停不是坏掉了，它正在等待人的输入。',
    assistantCue: '读屏宣布“等待输入”后，让学员自己键入代号并按回车。',
    successEvidence: '学员听见输入请求，自主输入任务代号并提交。',
    voiceIntro: '第三关，接收来自远方的密令。运行后程序会暂停，这不是故障，它正在等你输入任务代号。',
    voiceRetry: '密令通道还没有完全打开。请检查 input 的括号和双引号，然后再运行。',
    voiceSuccess: '密令已确认。远方的信号认出了你，下一段航路已经打开。',
  },
  {
    number: '04',
    title: '穿越八十四光年',
    concept: '整数与运算',
    timeSlot: '34-40 分钟',
    stage: '航行参数站',
    brief: '求救信号来自两段星路之外。补上缺少的数字，让飞船算出 84 光年的航程。',
    starter: 'integer distance = 42\noutput distance * __',
    hint: '找到第二行末尾的两个下划线，把它们替换成数字 2。',
    teacherCue: '只让学员改一个数值，听到 84 就算成功，不扩展复杂公式。',
    assistantCue: '可提示“第二行最后”，不要替学员移动光标或删除字符。',
    successEvidence: '学员先预测、再替换一个数值，最后听到 84。',
    voiceIntro: '第四关，穿越八十四光年。请找到第二行最后的两个下划线，换成一个数字，让计算结果变成八十四。',
    voiceRetry: '飞船已经起飞，但航程还不是八十四光年。请只检查第二行最后的乘数。',
    voiceSuccess: '航程锁定，八十四光年。飞船正在穿越星海，声音灯塔就在前方。',
  },
  {
    number: '05',
    title: '修复最后一座声音灯塔',
    concept: '条件判断与调试',
    timeSlot: '40-50 分钟',
    stage: '安全判断站',
    brief: '声音灯塔的程序少了一个符号。听完错误线索，只修好一处，让整个宇宙再次发声。',
    starter: 'integer signal = 75\nif signal >= 60\n  output "信号已锁定\nelse\n  output "继续搜索"\nend',
    hint: '检查“信号已锁定”这一行：一句文字的开头和结尾都需要双引号。',
    teacherCue: '把错误当作线索：先听反馈，再只改一个地方，然后重试。',
    assistantCue: '先复述错误类型，等待 5 到 8 秒；仍卡住再提示所在行。',
    successEvidence: '学员根据错误信息定位一处问题，修正后再次运行。',
    voiceIntro: '第五关，修复最后一座声音灯塔。程序里只少了一个英文双引号。先听错误，只修一处，然后重新运行。',
    voiceRetry: '灯塔发出了一条错误线索。请检查“信号已锁定”这一行的结尾，文字开头和结尾都需要双引号。',
    voiceSuccess: '灯塔已点亮。星站、航线和灯塔重新连接。你修好了最后的信号，宇宙又有声音了。',
  },
];

const CLASSROOM_CHAPTERS: ClassroomChapter[] = [
  {
    id: 'arrival', time: '00-05', eyebrow: 'PRE-FLIGHT', title: '入场与设备定位',
    body: '先让每位学员知道房间、座位、耳机、退出方式和当前焦点，再开始教代码。',
    lecturer: '口头说明教室方位，统一确认读屏、耳机、Tab 顺序和 F2。',
    support: '固定座位与陪护；活动中不移动键盘、线缆和个人物品。',
    tags: ['4-5 名全盲青年', '1 主讲 + 5 陪护 + 1 技术', '固定座位'], accent: '#70E1FF', action: '进入指令热身',
  },
  {
    id: 'warmup', time: '05-10', eyebrow: 'PROLOGUE', title: '宇宙为什么失去了声音？',
    body: '一场宇宙风暴让星站、航线和声音灯塔全部沉默。今天，我们要用代码把声音一段一段找回来。',
    lecturer: '只建立“输入、运行、听结果”一个闭环，不提前讲语法细节。',
    support: '让学员复述一个生活算法，用学员选择的节奏继续。',
    tags: ['听清任务', '自己输入', '运行后听结果'], accent: '#70E58B', action: '唤醒第一座星站', taskIndex: 0,
  },
  {
    id: 'communication', time: '10-28', eyebrow: 'CHAPTER 01', title: '星站醒来了',
    body: '发出第一句呼唤，再为一颗无名星点亮名字。宇宙中出现了第一个回应。',
    lecturer: '任务 1 与 2 各只增加一个新概念，演示后留出 5-8 秒安静操作时间。',
    support: '只读提示、描述焦点、记录成功证据；不代打、不抓手。',
    tags: ['任务 1-2', 'output', 'text 变量'], accent: '#FFD166', action: '从任务 1 开始', taskIndex: 0,
  },
  {
    id: 'navigation', time: '28-40', eyebrow: 'CHAPTER 02', title: '远方传来了密令',
    body: '接收任务代号，再计算穿越星海的距离。程序开始与我们对话。',
    lecturer: '强调程序暂停是在等待输入；每次改动前先请学员预测结果。',
    support: '报出当前焦点和可选动作，学员决定键入什么。',
    tags: ['任务 3-4', 'input', '整数与运算'], accent: '#70E1FF', action: '继续当前任务', taskIndex: 2,
  },
  {
    id: 'safety', time: '40-50', eyebrow: 'CHAPTER 03', title: '点亮声音灯塔',
    body: '最后一座灯塔出现故障。听错误、找线索、修好一处，宇宙的声音就会重新连成一片。',
    lecturer: '把“错了”改成“程序给了我们一条线索”，先听、再改一处、然后重试。',
    support: '先复述错误类型并等待 5-8 秒，必要时只提示行号。',
    tags: ['任务 5', '条件判断', '完成一次调试'], accent: '#FF6FA8', action: '进入调试任务', taskIndex: 4,
  },
  {
    id: 'bonus', time: '50-56', eyebrow: 'OPTIONAL', title: '可选声波航道',
    body: '只有在读屏、耳机和键盘路径已提前实测通过时，才开启浏览器语音或提示音。',
    lecturer: '设备路径不稳定时，直接回到文本任务：修改星星名或任务代号。',
    support: '技术支持负责设备问题，固定陪护不中断学员的操作节奏。',
    tags: ['通过设备实测才开启', '可随时降级', '不临场冒险'], accent: '#70E1FF', action: '返回任务台',
  },
  {
    id: 'return', time: '56-60', eyebrow: 'EPILOGUE', title: '宇宙重新有了声音',
    body: '每人发出一句自己的宇宙广播：我唤醒了什么，或者我修好了什么。',
    lecturer: '不排名、不比较速度；给每位学员发放完成证明和奖品。',
    support: '可以帮学员复述完成的行动，不要代替学员评价自己。',
    tags: ['一句话分享', '人人完成', '无排名'], accent: '#FFD166', action: '前往任务台完成任务',
  },
];

const normalizeQuotes = (value: string) => value.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
const normalizeCode = (value: string) => normalizeQuotes(value).replace(/\s+/g, ' ').trim();
const clamp = (value: number, minimum = 0, maximum = 1) => Math.min(maximum, Math.max(minimum, value));
const MISSION_CHAPTER_INDEX = [2, 2, 3, 3, 4];
const MISSION_TYPES = ['核心创作', '核心创作', '可选挑战', '可选挑战', '核心调试'] as const;
const CLASSROOM_STATE_COPY: Record<ClassroomState, { label: string; phrase: string }> = {
  listen: { label: '统一听讲', phrase: '请先停下键盘，我们只听这一句。' },
  work: { label: '安静操作', phrase: '现在请自己修改一处，运行后听完程序的回答。' },
  close: { label: '分享收尾', phrase: '不比速度。请用一句话说出：你让宇宙回应了什么？' },
};
const SEAT_STATE_COPY: Record<SeatState, string> = { ready: '在操作', help: '需提示', paused: '已靠泊', tech: '设备支持' };
const NEXT_SEAT_STATE: Record<SeatState, SeatState> = { ready: 'help', help: 'paused', paused: 'tech', tech: 'ready' };

const validateMission = (missionIndex: number, rawCode: string): RunResult => {
  const code = normalizeQuotes(rawCode).trim();

  if (!code) {
    return { ok: false, output: '没有可运行的代码。', feedback: '请先在代码编辑区输入内容。' };
  }

  if (missionIndex === 0) {
    const match = code.match(/^\s*output\s+"([^"]+)"\s*$/im);
    if (!match) return { ok: false, output: '语法检查未通过。', feedback: '请检查 output、空格和英文双引号。' };
    if (!match[1].includes('宇宙')) return { ok: false, output: match[1], feedback: '程序运行了。再试一次，让输出中包含“宇宙”。' };
    if (normalizeCode(rawCode) === normalizeCode(MISSIONS[0].starter)) {
      return { ok: false, warmup: true, output: match[1], feedback: '热身运行成功。现在请修改双引号里的广播，再运行一次。' };
    }
    return { ok: true, output: match[1], feedback: '通讯成功。你让计算机输出了自己的宇宙广播。' };
  }

  if (missionIndex === 1) {
    const variable = code.match(/text\s+starName\s*=\s*"([^"]+)"/i);
    const output = /output\s+starName\b/i.test(code);
    if (!variable) return { ok: false, output: '没有找到 starName 的文本内容。', feedback: '请检查 text、starName、等号和双引号。' };
    if (!output) return { ok: false, output: '变量已经保存，但还没有输出。', feedback: '请在下一行输入 output starName。' };
    if (normalizeCode(rawCode) === normalizeCode(MISSIONS[1].starter)) {
      return { ok: false, warmup: true, output: variable[1], feedback: '热身运行成功。请把北极星改成你想要的名字，再运行一次。' };
    }
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
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window === 'undefined') return 'student';
    return new URLSearchParams(window.location.search).get('mode') === 'instructor' ? 'instructor' : 'student';
  });
  const [current, setCurrent] = useState(0);
  const [codes, setCodes] = useState(() => MISSIONS.map((mission) => mission.starter));
  const [completed, setCompleted] = useState<boolean[]>(() => MISSIONS.map(() => false));
  const [consoleText, setConsoleText] = useState('系统就绪。任务 1：启动宇宙通讯。');
  const [feedback, setFeedback] = useState('请阅读任务说明，然后在编辑区运行代码。');
  const [announcement, setAnnouncement] = useState('听见宇宙已打开。');
  const [waitingForInput, setWaitingForInput] = useState(false);
  const [missionCode, setMissionCode] = useState('');
  const [soundMode, setSoundMode] = useState<SoundMode>('screen-reader');
  const [effectsEnabled, setEffectsEnabled] = useState(false);
  const [celebration, setCelebration] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [showTeacher, setShowTeacher] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [classroomState, setClassroomState] = useState<ClassroomState>('listen');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [seatStates, setSeatStates] = useState<SeatState[]>(['ready', 'ready', 'ready', 'ready', 'ready']);
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
  const helpDialogRef = useRef<HTMLElement>(null);
  const helpWasOpenRef = useRef(false);
  const currentMission = MISSIONS[current];
  const classroomChapter = CLASSROOM_CHAPTERS[MISSION_CHAPTER_INDEX[current]];
  const completedCount = completed.filter(Boolean).length;
  const firstSignalRecovered = completed[0] || completed[1];
  const coreExperienceComplete = firstSignalRecovered && completed[4];

  const playEffect = useCallback((kind: Exclude<FeedbackKind, 'info'>) => {
    if (!effectsEnabled) return;
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const now = context.currentTime;

    const noiseBuffer = context.createBuffer(1, Math.floor(context.sampleRate * 0.16), context.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let index = 0; index < noiseData.length; index += 1) {
      const envelope = 1 - index / noiseData.length;
      noiseData[index] = (Math.random() * 2 - 1) * envelope;
    }
    const paperSource = context.createBufferSource();
    const paperFilter = context.createBiquadFilter();
    const paperGain = context.createGain();
    paperSource.buffer = noiseBuffer;
    paperFilter.type = 'bandpass';
    paperFilter.frequency.value = kind === 'run' ? 2100 : 1600;
    paperFilter.Q.value = 0.8;
    paperGain.gain.setValueAtTime(kind === 'run' ? 0.024 : 0.016, now);
    paperGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
    paperSource.connect(paperFilter).connect(paperGain).connect(context.destination);
    paperSource.start(now);

    const frequencies = kind === 'success' ? [392, 523, 659] : kind === 'retry' ? [247, 196] : [330];
    frequencies.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = kind === 'success' ? 'sine' : kind === 'retry' ? 'triangle' : 'square';
      oscillator.frequency.value = frequency;
      const start = now + (kind === 'success' ? 0.16 + index * 0.07 : 0.1 + index * 0.11);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(kind === 'success' ? 0.034 : 0.022, start + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + (kind === 'success' ? 0.34 : 0.14));
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.36);
    });
    window.setTimeout(() => void context.close(), 900);
  }, [effectsEnabled]);

  const speak = useCallback((text: string, kind: FeedbackKind = 'info') => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    if (kind !== 'info') playEffect(kind);
    const delay = effectsEnabled && kind !== 'info' ? (kind === 'success' ? 620 : kind === 'retry' ? 380 : 240) : 0;
    window.setTimeout(() => {
      if (soundMode === 'screen-reader') {
        setAnnouncement('');
        window.requestAnimationFrame(() => setAnnouncement(text));
        return;
      }
      if (soundMode === 'narration' && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        const chineseVoice = window.speechSynthesis.getVoices().find((voice) => /zh(-|_)(CN|Hans)/i.test(voice.lang))
          ?? window.speechSynthesis.getVoices().find((voice) => voice.lang.toLowerCase().startsWith('zh'));
        if (chineseVoice) utterance.voice = chineseVoice;
        utterance.lang = 'zh-CN';
        utterance.rate = 0.9;
        utterance.pitch = 1.02;
        utterance.volume = 0.92;
        window.speechSynthesis.speak(utterance);
      }
    }, delay);
  }, [effectsEnabled, playEffect, soundMode]);

  const announceLocation = useCallback(() => {
    const active = document.activeElement as HTMLElement | null;
    const focusName = active === editorRef.current ? '代码编辑区' : active === inputRef.current ? '任务代号输入框' : active?.textContent?.trim().slice(0, 24) || '页面';
    const state = `你在任务 ${current + 1}，${currentMission.title}。当前焦点：${focusName}。${completed[current] ? '这一关已成功。' : '这一关正在尝试。'}`;
    speak(state);
  }, [completed, current, currentMission.title, speak]);

  const runCode = useCallback(() => {
    setWaitingForInput(false);
    const result = validateMission(current, codes[current]);
    setConsoleText(result.output);
    setFeedback(result.feedback);

    if (result.needsInput) {
      setWaitingForInput(true);
      speak(`信号提示。${result.output}。${result.feedback}`, 'run');
      window.setTimeout(() => inputRef.current?.focus(), 0);
      return;
    }

    if (result.ok) {
      setCompleted((previous) => previous.map((value, index) => index === current ? true : value));
      setCelebration((value) => value + 1);
    }
    if (result.warmup) {
      speak(`热身成功。${result.feedback}`, 'run');
    } else {
      speak(
        result.ok ? `成功。${currentMission.voiceSuccess}` : `线索。${currentMission.voiceRetry}`,
        result.ok ? 'success' : 'retry',
      );
    }
  }, [codes, current, currentMission, speak]);

  const submitMissionCode = useCallback(() => {
    const trimmed = missionCode.trim();
    if (!trimmed) {
      setConsoleText('没有收到任务代号。');
      setFeedback('请输入至少一个字符，然后按回车。');
      speak(`线索。${currentMission.voiceRetry}`, 'retry');
      return;
    }
    setConsoleText(trimmed);
    setFeedback('输入成功。程序收到了你的任务代号。');
    setWaitingForInput(false);
    setCompleted((previous) => previous.map((value, index) => index === current ? true : value));
    setCelebration((value) => value + 1);
    speak(`成功。程序输出${trimmed}。${currentMission.voiceSuccess}`, 'success');
  }, [current, currentMission, missionCode, speak]);

  const changeMission = useCallback((next: number) => {
    if (next < 0 || next >= MISSIONS.length) return;
    setCurrent(next);
    setWaitingForInput(false);
    setMissionCode('');
    setConsoleText(`任务 ${next + 1}：${MISSIONS[next].title}。`);
    setFeedback(MISSIONS[next].brief);
    speak(`关卡开始信号。${MISSIONS[next].voiceIntro}`);
    window.setTimeout(() => editorRef.current?.focus(), 0);
  }, [speak]);

  const scrollToChapter = useCallback((index: number) => {
    chapterRefs.current[index]?.scrollIntoView({ behavior: motionReduced ? 'auto' : 'smooth', block: 'center' });
  }, [motionReduced]);

  const openTaskLab = useCallback((requested?: number) => {
    const target = typeof requested === 'number' ? requested : current;
    changeMission(target);
    labRef.current?.scrollIntoView({ behavior: motionReduced ? 'auto' : 'smooth', block: 'start' });
    window.setTimeout(() => editorRef.current?.focus(), motionReduced ? 0 : 450);
  }, [changeMission, current, motionReduced]);

  const switchViewMode = useCallback((nextMode: ViewMode) => {
    const url = new URL(window.location.href);
    if (nextMode === 'instructor') url.searchParams.set('mode', 'instructor');
    else url.searchParams.delete('mode');
    window.history.replaceState({}, '', url);
    setViewMode(nextMode);
    setShowTeacher(false);
    window.scrollTo({ top: 0, behavior: motionReduced ? 'auto' : 'smooth' });
  }, [motionReduced]);

  const printDocument = useCallback((view: 'instructor' | 'certificate') => {
    setPrintView(view);
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => window.print()));
  }, []);

  const repeatInstruction = useCallback(() => {
    speak(currentMission.voiceIntro);
  }, [currentMission, speak]);

  const readHint = useCallback(() => {
    speak(`提示。${currentMission.hint}`);
  }, [currentMission.hint, speak]);

  const previewFeedbackSound = useCallback(() => {
    if (!effectsEnabled) {
      setFeedback('请先开启宇宙反馈音，再试听。');
      speak('请先开启宇宙反馈音。');
      return;
    }
    speak('声音试听。笔尖落下，星站已经收到信号。', 'success');
  }, [effectsEnabled, speak]);

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
      if (event.key === 'Escape') {
        setShowHelp(false);
        setShowTeacher(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [announceLocation, repeatInstruction, runCode, stopProgram]);

  useEffect(() => {
    if (!timerRunning) return;
    const timer = window.setInterval(() => setElapsedSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [timerRunning]);

  useEffect(() => {
    if (!celebration) return;
    const timer = window.setTimeout(() => setCelebration(0), motionReduced ? 900 : 1900);
    return () => window.clearTimeout(timer);
  }, [celebration, motionReduced]);

  useEffect(() => {
    if (soundMode !== 'narration' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
  }, [soundMode]);

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
    if (!showHelp) return;
    const dialog = helpDialogRef.current;
    if (!dialog) return;
    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
        .filter((element) => !element.hasAttribute('disabled'));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    dialog.addEventListener('keydown', trapFocus);
    return () => dialog.removeEventListener('keydown', trapFocus);
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
    mode: coreExperienceComplete ? 'core-complete' : firstSignalRecovered ? 'first-signal' : waitingForInput ? 'waiting-for-input' : 'mission',
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
  }), [activeChapter, classroomChapter, codes, completed, completedCount, consoleText, coreExperienceComplete, current, currentMission, feedback, firstSignalRecovered, motionReduced, waitingForInput]);

  useEffect(() => {
    window.render_game_to_text = () => JSON.stringify(textState);
    window.advanceTime = () => window.render_game_to_text();
    return () => {
      delete window.render_game_to_text;
      delete window.advanceTime;
    };
  }, [textState]);

  const timerText = `${String(Math.floor(elapsedSeconds / 60)).padStart(2, '0')}:${String(elapsedSeconds % 60).padStart(2, '0')}`;

  return (
    <main className={`htu-page ${motionReduced ? 'is-reduced-motion' : ''}`} data-testid="hear-the-universe" data-view-mode={viewMode} data-print-view={printView ?? undefined}>
      <canvas ref={canvasRef} className="htu-stars" aria-hidden="true" />
      <div className="htu-world-stage" aria-hidden="true">
        <img src="/hear-the-universe-world.webp" alt="" style={worldImageStyle} />
        <div className="htu-world-shade" />
      </div>
      {viewMode === 'instructor' && <a className="htu-skip" href="#classroom-story">跳到 60 分钟课堂路线</a>}
      <a className={`htu-skip ${viewMode === 'instructor' ? 'htu-skip-lab' : ''}`} href="#code-lab">跳到代码任务台</a>
      <div className="htu-sr-live" role="status" aria-live={soundMode === 'screen-reader' ? 'polite' : 'off'} aria-atomic="true">{announcement}</div>

      {celebration > 0 && (
        <div className="htu-celebration" aria-hidden="true">
          <i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i />
          <span>{motionReduced ? '成功信号已点亮' : '宇宙收到了你的信号'}</span>
        </div>
      )}

      <header className="htu-header">
        <button type="button" className="htu-brand" onClick={onHome} aria-label="◀ 大雷 / LAB，返回大雷个人主页">
          <span aria-hidden="true">◀</span> 大雷 / LAB
        </button>
        <div className="htu-title-group">
          <p>{viewMode === 'student' ? '学员任务台 · 键盘优先' : '讲师控制台 · 60 分钟活动'}</p>
          <h1 className="htu-handwritten">听见宇宙</h1>
        </div>
        <nav className="htu-header-actions" aria-label="页面工具">
          <button type="button" onClick={() => switchViewMode(viewMode === 'student' ? 'instructor' : 'student')}>{viewMode === 'student' ? '讲师模式' : '学员模式'}</button>
          <button type="button" onClick={() => setMotionReduced((value) => !value)} aria-pressed={motionReduced}>低动态 {motionReduced ? '开' : '关'}</button>
          <button ref={helpButtonRef} type="button" onClick={() => setShowHelp(true)}>键盘帮助</button>
          {viewMode === 'instructor' && <button type="button" onClick={() => setShowSupport((value) => !value)} aria-pressed={showSupport}>陪护速查</button>}
          {viewMode === 'instructor' && <button type="button" onClick={() => setShowTeacher((value) => !value)} aria-pressed={showTeacher}>本关话术</button>}
          {viewMode === 'instructor' && <button type="button" onClick={() => printDocument('instructor')}>打印讲师卡</button>}
        </nav>
      </header>

      {viewMode === 'instructor' ? (
        <>
      <section className="htu-instructor-console" aria-labelledby="instructor-console-title">
        <div className="htu-instructor-clock">
          <span>活动计时</span>
          <strong aria-label={`已计时 ${Math.floor(elapsedSeconds / 60)} 分 ${elapsedSeconds % 60} 秒`}>{timerText}</strong>
          <div>
            <button type="button" onClick={() => setTimerRunning((value) => !value)}>{timerRunning ? '暂停' : elapsedSeconds ? '继续' : '开始'}</button>
            <button type="button" onClick={() => { setTimerRunning(false); setElapsedSeconds(0); }}>归零</button>
          </div>
        </div>
        <div className="htu-instructor-command">
          <span>NOW / 全班状态</span>
          <h2 id="instructor-console-title">{CLASSROOM_STATE_COPY[classroomState].label}</h2>
          <p>统一口令：“{CLASSROOM_STATE_COPY[classroomState].phrase}”</p>
          <div role="group" aria-label="选择全班状态">
            {(Object.keys(CLASSROOM_STATE_COPY) as ClassroomState[]).map((state) => (
              <button key={state} type="button" aria-pressed={classroomState === state} onClick={() => setClassroomState(state)}>{CLASSROOM_STATE_COPY[state].label}</button>
            ))}
          </div>
        </div>
        <div className="htu-seat-board">
          <span>匿名座位信号</span>
          <div>
            {seatStates.map((state, index) => (
              <button
                key={index}
                type="button"
                data-seat-state={state}
                aria-label={`座位 ${index + 1}，${SEAT_STATE_COPY[state]}。按下切换状态`}
                onClick={() => setSeatStates((previous) => previous.map((value, seatIndex) => seatIndex === index ? NEXT_SEAT_STATE[value] : value))}
              >{index + 1}<small>{SEAT_STATE_COPY[state]}</small></button>
            ))}
          </div>
          <div className="htu-instructor-quick-actions">
            <button type="button" onClick={() => openTaskLab(4)}>直达调试任务</button>
            <button type="button" onClick={() => openTaskLab(0)}>回到核心任务</button>
          </div>
        </div>
      </section>

      <section className="htu-hero" aria-labelledby="htu-hero-title">
        <div className="htu-hero-copy">
          <span className="htu-kicker">中文 · 键盘优先 · 读屏友好</span>
          <h2 id="htu-hero-title" className="htu-handwritten">宇宙失去了声音。<br />你能把它找回来吗？</h2>
          <p>用五段简单代码，唤醒星站、接收密令、穿越星海，最后点亮声音灯塔。</p>
          <div className="htu-hero-actions">
            <button type="button" className="htu-primary" onClick={() => openTaskLab(0)}>开始找回声音</button>
            <button type="button" onClick={() => scrollToChapter(0)}>听完整个故事</button>
          </div>
        </div>
        <aside className="htu-hero-brief" aria-label="活动关键配置">
          <span>THREE SIMPLE RULES</span>
          <h3>今天只有三条规则</h3>
          <dl>
            <div><dt>01</dt><dd>先听清这一关要找回什么</dd></div>
            <div><dt>02</dt><dd>自己输入，需要时可以请求提示</dd></div>
            <div><dt>03</dt><dd>自己运行，听完程序的回答</dd></div>
          </dl>
          <p>不比速度，不要求全部通关。只要亲手让宇宙回应一次，就是成功。</p>
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

        </>
      ) : (
        <section className="htu-student-start" aria-labelledby="student-start-title">
          <div>
            <span>故事任务</span>
            <h2 id="student-start-title" className="htu-handwritten">宇宙失声了。<br />请发出第一个信号。</h2>
            <p>你可以先修改一句宇宙广播，也可以为星星命名。程序回应一次，就算找回了第一段声音。</p>
            <p className="htu-hand-note">写一行，听一声，宇宙就醒一点。</p>
            <button type="button" className="htu-primary" onClick={() => openTaskLab(0)}>进入代码编辑区</button>
          </div>
          <ol aria-label="今天的三条规则">
            <li><strong>1</strong><span>听清这一关要做什么</span></li>
            <li><strong>2</strong><span>自己修改一处，需要时请求提示</span></li>
            <li><strong>3</strong><span>自己运行，听完程序的回答</span></li>
          </ol>
          <p className="htu-student-promise">不比速度 · 不必全部通关 · 错误是程序给的线索</p>
        </section>
      )}

      <section ref={labRef} id="code-lab" className="htu-lab-section" aria-labelledby="code-lab-title">
        <header className="htu-lab-intro">
          <div>
            <span>{viewMode === 'student' ? '学员任务台 · 核心两任务 + 一次调试' : '11-51 分钟 · 课堂任务台'}</span>
            <h2 id="code-lab-title">用代码，让宇宙回应你</h2>
          </div>
          <p><strong>{MISSION_TYPES[current]} · {currentMission.stage}</strong><br />{viewMode === 'student' ? '任务可以跳转。完成一次自己的修改，就会收到成功信号。' : '陪护只描述焦点和提示，不替学员操作。'}</p>
        </header>

      <section className="htu-statusbar" aria-label="课程状态">
        <div>
          <span>当前状态</span>
          <strong>{completed[current] ? '宇宙已回应' : waitingForInput ? '等待输入' : '正在尝试'}</strong>
        </div>
        <div className="htu-sound-mode">
          <label htmlFor="htu-sound-mode">反馈方式</label>
          <select id="htu-sound-mode" value={soundMode} aria-describedby="htu-sound-guidance" onChange={(event) => setSoundMode(event.target.value as SoundMode)}>
            <option value="screen-reader">读屏状态（默认）</option>
            <option value="narration">浏览器朗读（请先暂停读屏）</option>
            <option value="text">仅文字</option>
          </select>
          <span id="htu-sound-guidance" className="htu-sr-only">三种播报方式互斥，不会同时播放读屏状态和浏览器朗读。</span>
        </div>
        <div className="htu-effect-controls">
          <label className="htu-effect-toggle"><input type="checkbox" checked={effectsEnabled} onChange={(event) => setEffectsEnabled(event.target.checked)} /> 宇宙反馈音<span className="htu-sr-only">，效果声会先播放，之后再播报结果</span></label>
          <button type="button" onClick={previewFeedbackSound}>试听</button>
        </div>
      </section>

      <div className="htu-layout">
        <aside className="htu-missions" aria-labelledby="mission-list-title">
          <div className="htu-panel-heading">
            <span>MISSION MAP</span>
            <h2 id="mission-list-title">五个宇宙任务</h2>
          </div>
          <ol>
            {MISSIONS.map((mission, index) => {
              return (
                <li key={mission.number}>
                  <button
                    type="button"
                    onClick={() => changeMission(index)}
                    className={index === current ? 'is-current' : ''}
                    aria-current={index === current ? 'step' : undefined}
                  >
                    <span>{completed[index] ? '宇宙已回应' : `${mission.number} · ${MISSION_TYPES[index]}`}</span>
                    <strong>{mission.title}</strong>
                    <small>{mission.timeSlot} · {mission.concept}</small>
                  </button>
                </li>
              );
            })}
          </ol>
          <button type="button" className="htu-location" onClick={announceLocation}>F2 · 我在哪里？</button>
          <p className="htu-mission-note">可以跳过可选挑战。建议至少完成一个核心创作和最后的调试。</p>
        </aside>

        <section className="htu-workspace" aria-labelledby="current-mission-title">
          <div className="htu-mission-brief" id="mission-instruction">
            <div>
              <span>{currentMission.timeSlot} · {currentMission.stage} · 任务 {currentMission.number}</span>
              <h2 id="current-mission-title" className="htu-handwritten" tabIndex={-1}>{currentMission.title}</h2>
            </div>
            <p>{currentMission.brief}</p>
            <div className="htu-instruction-actions">
              <button type="button" onClick={repeatInstruction}>F1 · 重复任务</button>
              <button type="button" onClick={readHint}>只听提示</button>
            </div>
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
                <span>RESULT</span>
              </div>
              <div ref={consoleRef} className="htu-output" tabIndex={-1} role="region" aria-labelledby="output-title">
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
              <button type="button" className="htu-back-editor" onClick={() => editorRef.current?.focus()}>返回代码编辑区</button>
            </section>
          </div>

          <div className="htu-next-row">
            <button type="button" onClick={() => changeMission(current - 1)} disabled={current === 0}>上一个任务</button>
            {current < MISSIONS.length - 1 ? (
              <button type="button" className="htu-next" onClick={() => changeMission(current + 1)}>选择下一个任务</button>
            ) : (
              <span>{completed[current] ? '调试成功，声音灯塔已点亮' : '听错误、只修一处、再次运行'}</span>
            )}
          </div>
        </section>
      </div>
      </section>

      {firstSignalRecovered && (
        <section className="htu-complete" aria-labelledby="complete-title">
          <span aria-hidden="true">✦</span>
          <div>
            <p>HP 代码一小时</p>
            <h2 id="complete-title" className="htu-handwritten">{coreExperienceComplete ? '核心任务已完成' : '你找回了第一段声音'}</h2>
            <p>{coreExperienceComplete ? '你完成了自己的创作，也听线索修好了一处错误。可选挑战不影响活动完成。' : '你亲手修改了代码，程序已经回答你。接下来可以进入最后的调试任务。'}</p>
          </div>
          {coreExperienceComplete ? <button type="button" onClick={() => printDocument('certificate')}>打印完成证明</button> : <button type="button" onClick={() => openTaskLab(4)}>进入调试任务</button>}
        </section>
      )}

      {viewMode === 'instructor' && showTeacher && (
        <aside className="htu-teacher" aria-labelledby="teacher-title">
          <button type="button" className="htu-close" onClick={() => setShowTeacher(false)} aria-label="关闭讲师提示">×</button>
          <span>讲师本关话术</span>
          <h2 id="teacher-title">{currentMission.title}</h2>
          <dl>
            <div><dt>计划时段</dt><dd>{currentMission.timeSlot} · {currentMission.stage}</dd></div>
            <div><dt>讲师口令</dt><dd>{currentMission.teacherCue}</dd></div>
            <div><dt>助教边界</dt><dd>{currentMission.assistantCue}</dd></div>
            <div><dt>成功证据</dt><dd>{currentMission.successEvidence}</dd></div>
          </dl>
        </aside>
      )}

      {viewMode === 'instructor' && showSupport && (
        <aside className="htu-support-card" aria-labelledby="support-card-title">
          <button type="button" className="htu-close" onClick={() => setShowSupport(false)} aria-label="关闭陪护速查">×</button>
          <span>SUPPORT QUICK CARD</span>
          <h2 id="support-card-title">陪护只给信号，不代替操作</h2>
          <ol>
            <li>先问：“你希望我读提示、说焦点，还是只等你操作？”</li>
            <li>只说当前焦点、错误类型和可选动作。</li>
            <li>给出提示后安静等待 5-8 秒。</li>
            <li>不抢键盘、不抓手、不代输入。</li>
          </ol>
          <p><strong>靠泊方案：</strong>如果设备或读屏不稳定，保留当前代码和成功证据，跳过可选任务，由技术支持处理设备。</p>
        </aside>
      )}

      {showHelp && (
        <div className="htu-dialog-backdrop" role="presentation">
          <section ref={helpDialogRef} className="htu-dialog" role="dialog" aria-modal="true" aria-labelledby="help-title">
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
              <div><dt>Esc</dt><dd>关闭弹层或讲师提示</dd></div>
              {viewMode === 'instructor' && <div><dt>课堂路线</dt><dd>使用地标或时间点跳转；滚动动画不影响任务操作</dd></div>}
            </dl>
            <p>页面不拦截普通字母输入；焦点在编辑区时，可以正常输入代码。</p>
            <button type="button" className="htu-run" onClick={() => setShowHelp(false)}>我知道了</button>
          </section>
        </div>
      )}

      <section className="htu-print-sheet htu-instructor-sheet" aria-label="听见宇宙讲师执行卡">
        <header><p>HP 代码一小时 · 视障青年场</p><h1>听见宇宙·60 分钟讲师执行卡</h1></header>
        <p><strong>配置：</strong>4-5 名全盲青年；1 主讲 + 5 固定陪护 + 1 机动技术支持；能力差异不大，不分组。</p>
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
        <p>完成至少一次个人化代码创作和一次错误调试，亲手让计算机执行了自己的指令。</p>
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
