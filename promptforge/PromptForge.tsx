import React, { useEffect, useMemo, useState } from 'react';

/* ---------------------------------------------------------------------------
 * /promptforge — 提示词锻造台 PromptForge
 *
 * A fully client-side, RULE-BASED prompt builder (no LLM call): paste a rough
 * task description, the analyzer decomposes it into slots via bilingual
 * keyword/regex heuristics, you pick a popular framework (CO-STAR / CRISPE /
 * ICIO / BROKE / RTF / a 2026 best-practice composite), edit the slots, and
 * the tool assembles a complete prompt — with optional "verification loop"
 * clauses (step-by-step, admit uncertainty, cite evidence, self-critique,
 * clarifying questions) that bake in the company loop of
 * write prompt → verify output → challenge conclusions.
 *
 * Best-practice grounding (2026): structure with XML tags/delimiters, ask for
 * evidence before conclusions, assign a specific role, request step-by-step
 * reasoning, prefer curated examples over long instructions, and keep context
 * high-signal (context engineering).
 * ------------------------------------------------------------------------- */

type Lang = 'en' | 'zh' | 'zhHant';
interface T { en: string; zh: string }

const STORAGE_KEY = 'dalei-lang-v2';
const detectInitialLang = (): Lang => {
  if (typeof window === 'undefined') return 'en';
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return saved === 'zh' || saved === 'zhHant' ? saved : 'en';
};

let _s2t: ((s: string) => string) | null = null;
const useS2T = (active: boolean) => {
  const [conv, setConv] = useState<((s: string) => string) | null>(() => _s2t);
  useEffect(() => {
    if (!active || _s2t) {
      if (_s2t && !conv) setConv(() => _s2t);
      return;
    }
    let alive = true;
    import('opencc-js')
      .then((m) => {
        _s2t = (m as any).Converter({ from: 'cn', to: 'tw' });
        if (alive) setConv(() => _s2t);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [active, conv]);
  return conv;
};

/* ============================= slot model ================================= */

type SlotKey =
  | 'role' | 'task' | 'context' | 'audience' | 'format'
  | 'tone' | 'constraints' | 'examples' | 'success' | 'variants';

type Slots = Record<SlotKey, string>;

const EMPTY_SLOTS: Slots = {
  role: '', task: '', context: '', audience: '', format: '',
  tone: '', constraints: '', examples: '', success: '', variants: '',
};

const SLOT_META: Record<SlotKey, { label: T; hint: T }> = {
  role: {
    label: { en: 'Role / Persona', zh: '角色' },
    hint: { en: 'Who should the AI be? A specific persona lifts quality.', zh: 'AI 应该是谁？具体的角色设定能显著提升质量。' },
  },
  task: {
    label: { en: 'Task / Objective', zh: '任务 / 目标' },
    hint: { en: 'The single outcome you want. Outcome-oriented beats step lists.', zh: '你要的那个结果。以结果为导向，胜过罗列步骤。' },
  },
  context: {
    label: { en: 'Context (high-signal only)', zh: '背景（只留高信噪比）' },
    hint: { en: 'The smallest set of facts the AI truly needs — not a laundry list.', zh: 'AI 真正需要的最小事实集 —— 不是信息倾倒。' },
  },
  audience: {
    label: { en: 'Audience', zh: '受众' },
    hint: { en: 'Who reads the output? Changes wording, depth and framing.', zh: '产出给谁看？决定措辞、深度与立场。' },
  },
  format: {
    label: { en: 'Output format', zh: '输出格式' },
    hint: { en: 'Table / bullets / email / JSON / word limit — be explicit.', zh: '表格 / 要点 / 邮件 / JSON / 字数 —— 明确说出来。' },
  },
  tone: {
    label: { en: 'Style & tone', zh: '风格与语气' },
    hint: { en: 'Formal, concise, persuasive, playful…', zh: '正式、简洁、有说服力、轻松……' },
  },
  constraints: {
    label: { en: 'Constraints', zh: '约束条件' },
    hint: { en: 'Must / must-not / limits / deadlines.', zh: '必须 / 禁止 / 限制 / 截止。' },
  },
  examples: {
    label: { en: 'Examples (few-shot)', zh: '示例（few-shot）' },
    hint: { en: 'One good example beats three paragraphs of instructions.', zh: '一个好示例，胜过三段说明。' },
  },
  success: {
    label: { en: 'Success criteria', zh: '成功标准' },
    hint: { en: 'How will you judge the output is good? (BROKE: Key results)', zh: '你用什么标准验收产出？（BROKE 的 Key results）' },
  },
  variants: {
    label: { en: 'Variants to try', zh: '实验 / 多版本' },
    hint: { en: 'Ask for N different versions to compare. (CRISPE: Experiment)', zh: '要求给出 N 个不同版本对比。（CRISPE 的 Experiment）' },
  },
};

/* ============================ rule analyzer =============================== */

const pick = (m: RegExpMatchArray | null) => (m && m[1] ? m[1].trim() : '');

/** Rule-based bilingual decomposition — pure regex/keyword heuristics, no LLM. */
export function analyze(raw: string): { slots: Slots; detected: Set<SlotKey> } {
  const text = raw.trim();
  const slots: Slots = { ...EMPTY_SLOTS };
  const detected = new Set<SlotKey>();
  if (!text) return { slots, detected };

  // --- role ---
  slots.role = pick(text.match(/(?:作为|扮演|你是|你现在是)\s*([^，。,.\n]{2,16})/))
    || pick(text.match(/\b(?:act as|you are|as an?)\s+([^,.\n]{3,40})/i));
  if (!slots.role) {
    const prof = text.match(/(资深|高级|专业)?(工程师|程序员|产品经理|设计师|律师|医生|老师|教练|营销专家|文案|编辑|翻译|分析师|顾问|HR|面试官|销售|运营|客服|架构师|科学家|研究员)/);
    if (prof) slots.role = `${prof[1] ?? '资深'}${prof[2]}`;
  }
  if (slots.role) detected.add('role');

  // --- audience ---
  slots.audience = pick(text.match(/(?:发给|写给|面向|讲给|汇报给|给)\s*(老板|领导|上级|客户|甲方|团队|同事|新人|新手|小白|高管|管理层|投资人|面试官|学生|小学生|家长|用户|粉丝|读者)/))
    || pick(text.match(/\bfor\s+(beginners|executives|customers|clients|my (?:boss|team|manager)|students|investors)\b/i));
  if (slots.audience) detected.add('audience');

  // --- output format ---
  const fmts: string[] = [];
  const fmtMap: [RegExp, string][] = [
    [/表格|table/i, '表格 (table)'],
    [/(要点|列表|bullet|清单)/i, '要点列表 (bullet points)'],
    [/邮件|email/i, '邮件 (email)'],
    [/(周报|日报|月报|报告|report)/i, '报告 (report)'],
    [/(PPT|幻灯片|slides?)/i, '演示大纲 (slides outline)'],
    [/大纲|outline/i, '大纲 (outline)'],
    [/\bjson\b/i, 'JSON'],
    [/markdown/i, 'Markdown'],
    [/(代码|code)/i, '代码 (code)'],
    [/(推文|朋友圈|小红书|微博|tweet|post)/i, '社媒帖子 (social post)'],
    [/(标题|headline|title)/i, '标题 (headlines)'],
  ];
  for (const [re, label] of fmtMap) if (re.test(text)) fmts.push(label);
  const wordLimit = text.match(/(\d{2,5})\s*(?:个?字|words?)\s*(?:以内|左右|以下)?/);
  if (wordLimit) fmts.push(`不超过 ${wordLimit[1]} 字/词 (≤ ${wordLimit[1]} words)`);
  slots.format = fmts.join('；');
  if (slots.format) detected.add('format');

  // --- tone ---
  const tones = text.match(/(正式|专业|严谨|轻松|口语化?|幽默|风趣|亲切|友好|简洁|克制|有说服力|礼貌|温暖|犀利|formal|professional|casual|humorous|concise|persuasive|friendly)/g);
  if (tones) {
    slots.tone = [...new Set(tones)].join('、');
    detected.add('tone');
  }

  // --- constraints: sentences carrying must/avoid words ---
  const sentences = text.split(/(?<=[。.!?！？;；\n])/).map((s) => s.trim()).filter(Boolean);
  const consRe = /(不要|不能|避免|禁止|切勿|必须|务必|至少|至多|不超过|限制|截止|之前完成|deadline|must(?:n't| not)?|avoid|don't|no more than|at least)/i;
  const cons = sentences.filter((s) => consRe.test(s));
  if (cons.length) {
    slots.constraints = cons.map((s) => s.replace(/[。.；;]$/, '')).join('；');
    detected.add('constraints');
  }

  // --- examples ---
  const exIdx = text.search(/(例如|比如|示例|举个例子|参考[:：]|e\.g\.|for example|example:)/i);
  if (exIdx >= 0) {
    slots.examples = text.slice(exIdx).split(/\n{2,}/)[0].slice(0, 300);
    detected.add('examples');
  }

  // --- context: sentences with background markers (excluding constraint lines) ---
  const ctxRe = /(背景|目前|现在|我们(?:公司|团队)?|公司|项目|因为|由于|情况是|现状|this (?:project|company)|currently|background)/i;
  const ctx = sentences.filter((s) => ctxRe.test(s) && !consRe.test(s));
  if (ctx.length) {
    slots.context = ctx.map((s) => s.replace(/[。.；;]$/, '')).join('；');
    detected.add('context');
  }

  // --- task: the cleaned core ask. Prefer sentences with an action verb. ---
  const verbRe = /(写|撰写|总结|概括|翻译|分析|对比|比较|生成|改写|润色|优化|评审|审查|规划|设计|提炼|整理|回复|起草|制定|拆解|头脑风暴|write|summarize|translate|analy[sz]e|compare|generate|rewrite|review|plan|draft|brainstorm|create)/i;
  const taskSents = sentences.filter((s) => verbRe.test(s) && !consRe.test(s));
  slots.task = (taskSents.length ? taskSents.join(' ') : text).replace(/\s+/g, ' ').slice(0, 400);
  detected.add('task');

  // --- output language, folded into format ---
  const langM = text.match(/(用|使用|以)(英文|英语|中文|日文|日语)(回复|回答|输出|写)?|in (English|Chinese|Japanese)/i);
  if (langM) {
    const l = langM[2] ?? langM[4] ?? '';
    slots.format = slots.format ? `${slots.format}；输出语言：${l}` : `输出语言：${l}`;
    detected.add('format');
  }

  return { slots, detected };
}

/* ============================ frameworks ================================== */

interface FrameworkSection { letter: string; name: T; slot: SlotKey; tag: string }
interface Framework {
  id: string;
  name: string;
  full: T;
  when: T;
  sections: FrameworkSection[];
}

const FRAMEWORKS: Framework[] = [
  {
    id: 'best2026',
    name: 'BEST · 2026',
    full: { en: 'A composite of 2026 best practices — role, outcome, high-signal context, examples, explicit format', zh: '2026 最佳实践合成框架 —— 角色、结果、高信噪比背景、示例、明确格式' },
    when: { en: 'Default choice for serious work prompts', zh: '正经工作提示词的默认选择' },
    sections: [
      { letter: 'R', name: { en: 'Role', zh: '角色' }, slot: 'role', tag: 'role' },
      { letter: 'G', name: { en: 'Goal', zh: '目标' }, slot: 'task', tag: 'goal' },
      { letter: 'C', name: { en: 'Context', zh: '背景' }, slot: 'context', tag: 'context' },
      { letter: 'E', name: { en: 'Examples', zh: '示例' }, slot: 'examples', tag: 'examples' },
      { letter: 'F', name: { en: 'Format', zh: '格式' }, slot: 'format', tag: 'response_format' },
      { letter: 'S', name: { en: 'Success criteria', zh: '成功标准' }, slot: 'success', tag: 'success_criteria' },
    ],
  },
  {
    id: 'costar',
    name: 'CO-STAR',
    full: { en: 'Context · Objective · Style · Tone · Audience · Response format', zh: 'Context 背景 · Objective 目标 · Style 风格 · Tone 语气 · Audience 受众 · Response 输出格式' },
    when: { en: 'Content & copywriting where voice matters', zh: '注重「声音」的内容创作与文案' },
    sections: [
      { letter: 'C', name: { en: 'Context', zh: '背景' }, slot: 'context', tag: 'context' },
      { letter: 'O', name: { en: 'Objective', zh: '目标' }, slot: 'task', tag: 'objective' },
      { letter: 'S', name: { en: 'Style', zh: '风格' }, slot: 'tone', tag: 'style' },
      { letter: 'T', name: { en: 'Tone', zh: '语气' }, slot: 'tone', tag: 'tone' },
      { letter: 'A', name: { en: 'Audience', zh: '受众' }, slot: 'audience', tag: 'audience' },
      { letter: 'R', name: { en: 'Response format', zh: '输出格式' }, slot: 'format', tag: 'response_format' },
    ],
  },
  {
    id: 'crispe',
    name: 'CRISPE',
    full: { en: 'Capacity/Role · Insight · Statement · Personality · Experiment', zh: 'Capacity 角色 · Insight 背景洞察 · Statement 任务陈述 · Personality 个性 · Experiment 多版本实验' },
    when: { en: 'Deep analysis & persona-heavy tasks', zh: '深度分析与强角色扮演任务' },
    sections: [
      { letter: 'C', name: { en: 'Capacity & Role', zh: '能力与角色' }, slot: 'role', tag: 'role' },
      { letter: 'R', name: { en: 'Insight', zh: '背景洞察' }, slot: 'context', tag: 'insight' },
      { letter: 'I', name: { en: 'Statement', zh: '任务陈述' }, slot: 'task', tag: 'statement' },
      { letter: 'S', name: { en: 'Personality', zh: '个性风格' }, slot: 'tone', tag: 'personality' },
      { letter: 'P', name: { en: 'Experiment', zh: '多版本实验' }, slot: 'variants', tag: 'experiment' },
    ],
  },
  {
    id: 'icio',
    name: 'ICIO',
    full: { en: 'Instruction · Context · Input data · Output indicator', zh: 'Instruction 指令 · Context 背景 · Input 输入数据 · Output 输出要求' },
    when: { en: 'Clear-cut tasks with data attached', zh: '任务清晰、带输入数据的场景' },
    sections: [
      { letter: 'I', name: { en: 'Instruction', zh: '指令' }, slot: 'task', tag: 'instruction' },
      { letter: 'C', name: { en: 'Context', zh: '背景' }, slot: 'context', tag: 'context' },
      { letter: 'I', name: { en: 'Input data', zh: '输入数据' }, slot: 'examples', tag: 'input_data' },
      { letter: 'O', name: { en: 'Output indicator', zh: '输出要求' }, slot: 'format', tag: 'output' },
    ],
  },
  {
    id: 'broke',
    name: 'BROKE',
    full: { en: 'Background · Role · Objectives · Key results · Evolve', zh: 'Background 背景 · Role 角色 · Objectives 目标 · Key results 关键结果 · Evolve 迭代改进' },
    when: { en: 'Requirements, code & OKR-style delivery', zh: '需求 / 代码 / OKR 式交付' },
    sections: [
      { letter: 'B', name: { en: 'Background', zh: '背景' }, slot: 'context', tag: 'background' },
      { letter: 'R', name: { en: 'Role', zh: '角色' }, slot: 'role', tag: 'role' },
      { letter: 'O', name: { en: 'Objectives', zh: '目标' }, slot: 'task', tag: 'objectives' },
      { letter: 'K', name: { en: 'Key results', zh: '关键结果' }, slot: 'success', tag: 'key_results' },
      { letter: 'E', name: { en: 'Evolve', zh: '迭代改进' }, slot: 'variants', tag: 'evolve' },
    ],
  },
  {
    id: 'rtf',
    name: 'RTF',
    full: { en: 'Role · Task · Format — the 10-second everyday frame', zh: 'Role 角色 · Task 任务 · Format 格式 —— 10 秒上手的日常框架' },
    when: { en: 'Quick everyday asks', zh: '日常快速提问' },
    sections: [
      { letter: 'R', name: { en: 'Role', zh: '角色' }, slot: 'role', tag: 'role' },
      { letter: 'T', name: { en: 'Task', zh: '任务' }, slot: 'task', tag: 'task' },
      { letter: 'F', name: { en: 'Format', zh: '格式' }, slot: 'format', tag: 'format' },
    ],
  },
];

/* ====================== verification loop add-ons ======================== */

interface AddOn { id: string; label: T; clause: T }

const ADDONS: AddOn[] = [
  {
    id: 'steps',
    label: { en: 'Reason step by step', zh: '先推理后结论' },
    clause: { en: 'Think through the problem step by step first, then give your conclusion.', zh: '先一步步推理，展示关键思考过程，然后再给出结论。' },
  },
  {
    id: 'uncertain',
    label: { en: 'Admit uncertainty', zh: '不确定就明说' },
    clause: { en: 'If you are unsure about anything, say so explicitly instead of guessing — never fabricate.', zh: '对没有把握的内容，明确标注「不确定」，不要为了流畅而编造。' },
  },
  {
    id: 'evidence',
    label: { en: 'Evidence before claims', zh: '结论给依据' },
    clause: { en: 'Support every key claim with evidence or a source; present evidence before the conclusion.', zh: '每个关键结论都要给出依据或来源，先摆证据、后下结论。' },
  },
  {
    id: 'critique',
    label: { en: 'Self-critique', zh: '自我挑战' },
    clause: { en: 'After answering, list the 2 strongest objections or failure modes of your own answer.', zh: '回答完成后，列出针对你自己答案的 2 个最强反驳或可能的疏漏。' },
  },
  {
    id: 'clarify',
    label: { en: 'Ask before assuming', zh: '先澄清再动手' },
    clause: { en: 'If any requirement is ambiguous, ask me clarifying questions before answering.', zh: '如果需求有歧义，先向我提出澄清问题，再开始回答。' },
  },
];

/* ============================ assembly ==================================== */

const assemble = (
  fw: Framework,
  slots: Slots,
  addons: Set<string>,
  useXml: boolean,
  isZh: boolean
): string => {
  const parts: string[] = [];
  const seen = new Set<string>();
  for (const sec of fw.sections) {
    const val = slots[sec.slot].trim();
    if (!val) continue;
    // CO-STAR maps style+tone to the same slot; don't emit the same text twice.
    const dedupeKey = `${sec.slot}:${val}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    if (useXml) parts.push(`<${sec.tag}>\n${val}\n</${sec.tag}>`);
    else parts.push(`## ${isZh ? sec.name.zh : sec.name.en}\n${val}`);
  }
  const active = ADDONS.filter((a) => addons.has(a.id));
  if (active.length) {
    const lines = active.map((a) => `- ${isZh ? a.clause.zh : a.clause.en}`).join('\n');
    if (useXml) parts.push(`<verification>\n${lines}\n</verification>`);
    else parts.push(`## ${isZh ? '验证要求' : 'Verification'}\n${lines}`);
  }
  return parts.join('\n\n');
};

/* ============================ demo sample ================================= */

const SAMPLE_ZH = '下周要给管理层汇报我们 AI 客服项目的进展。背景是目前项目上线了 3 个月，解决率从 42% 提升到了 67%，但转人工率还是偏高。帮我写一份汇报邮件，要正式、简洁，用要点列表呈现关键数据，不超过 300 字，最后必须包含下一步计划。';
const SAMPLE_EN = "Act as a senior product manager. I need to prepare a report for executives about our AI support bot. Currently resolution rate improved from 42% to 67% in 3 months, but escalation is still high. Write a formal, concise email, bullet points for key data, no more than 300 words, and it must include next steps.";

/* ============================ page ======================================== */

const BEST_PRACTICES: { title: T; body: T }[] = [
  { title: { en: 'Structure with delimiters', zh: '用分隔符结构化' }, body: { en: 'XML tags or ### headers keep instructions, context and data unambiguous — the single highest-leverage habit.', zh: 'XML 标签或 ### 标题把指令、背景、数据清晰隔开 —— 性价比最高的一个习惯。' } },
  { title: { en: 'Assign a specific role', zh: '指定具体角色' }, body: { en: '"You are a senior tax lawyer" beats "you are helpful". Persona shapes vocabulary, depth and judgment.', zh: '「你是资深税务律师」远胜「你是个有用的助手」。角色决定用词、深度与判断力。' } },
  { title: { en: 'Outcome, not steps', zh: '给结果，不给步骤' }, body: { en: 'State the outcome and success criteria; let the model plan. Over-specified steps cap its quality.', zh: '说清想要的结果与验收标准，让模型自己规划。步骤写得太死反而限制质量。' } },
  { title: { en: 'Examples > instructions', zh: '示例胜过说明' }, body: { en: 'One curated, canonical example beats paragraphs of description. Show, don\'t tell.', zh: '一个精心挑选的标准示例，胜过大段描述。演示，别解释。' } },
  { title: { en: 'High-signal context only', zh: '只留高信噪比背景' }, body: { en: 'Context engineering: the smallest set of tokens that maximizes the desired outcome — cut the laundry list.', zh: '上下文工程：用最小的高信号信息集换最大的效果 —— 砍掉信息倾倒。' } },
  { title: { en: 'Build in verification', zh: '把验证写进提示词' }, body: { en: 'Ask for reasoning first, evidence per claim, explicit uncertainty, and self-critique — then challenge it yourself.', zh: '要求先推理、结论给依据、不确定就明说、自我反驳 —— 然后你再亲自挑战它。' } },
];

interface Props { onHome: () => void }

const PromptForge: React.FC<Props> = ({ onHome }) => {
  const [lang, setLang] = useState<Lang>(detectInitialLang);
  const s2t = useS2T(lang === 'zhHant');
  const t = (txt: T) => (lang === 'en' ? txt.en : lang === 'zhHant' ? (s2t ? s2t(txt.zh) : txt.zh) : txt.zh);
  useEffect(() => {
    if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, lang);
  }, [lang]);

  const [input, setInput] = useState('');
  const [slots, setSlots] = useState<Slots>({ ...EMPTY_SLOTS });
  const [detected, setDetected] = useState<Set<SlotKey>>(new Set());
  const [fwId, setFwId] = useState('best2026');
  const [addons, setAddons] = useState<Set<string>>(new Set(['steps', 'uncertain', 'evidence']));
  const [useXml, setUseXml] = useState(true);
  const [analyzed, setAnalyzed] = useState(false);
  const [copied, setCopied] = useState(false);

  const fw = FRAMEWORKS.find((f) => f.id === fwId)!;
  const isZh = lang !== 'en';

  const runAnalyze = () => {
    const r = analyze(input);
    setSlots(r.slots);
    setDetected(r.detected);
    setAnalyzed(true);
  };

  const output = useMemo(
    () => assemble(fw, slots, addons, useXml, isZh),
    [fw, slots, addons, useXml, isZh]
  );

  const copyOut = () => {
    if (!output) return;
    navigator.clipboard?.writeText(output).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    }).catch(() => {});
  };

  const toggleAddon = (id: string) =>
    setAddons((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // Slots this framework actually uses (dedup CO-STAR's shared tone slot).
  const fwSlots = [...new Set(fw.sections.map((s) => s.slot))];

  const LANGS: { code: Lang; label: string }[] = [{ code: 'en', label: 'EN' }, { code: 'zh', label: '简' }, { code: 'zhHant', label: '繁' }];

  return (
    <div className="min-h-screen bg-paper font-sans text-ink">
      <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <button onClick={onHome} className="font-mono text-xs text-ink/55 transition-colors hover:text-ink">← Da Lei · 大雷</button>
          <div className="flex items-center gap-3">
            <span className="hidden font-mono text-[11px] uppercase tracking-[0.2em] text-gold sm:inline">PromptForge · no-LLM</span>
            <div className="flex overflow-hidden rounded-full border border-ink/15">
              {LANGS.map((l) => (
                <button key={l.code} onClick={() => setLang(l.code)}
                  className={`px-2.5 py-1 font-mono text-[11px] transition-colors ${lang === l.code ? 'bg-ink text-paper' : 'text-ink/55 hover:text-ink'}`}>
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-ink/45">{t({ en: 'Rule-based · runs entirely in your browser · no LLM call', zh: '纯规则引擎 · 全程浏览器本地运行 · 不调用大模型' })}</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          {t({ en: 'PromptForge — decompose a rough ask into a real prompt', zh: '提示词锻造台 —— 把一段大白话拆成一条像样的提示词' })}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-ink/65">
          {t({
            en: 'Paste a rough description of what you want. A rule engine decomposes it into framework slots (CO-STAR, CRISPE, ICIO, BROKE, RTF…), you refine each slot, and it assembles a complete prompt — with verification clauses that train the loop: write the prompt, verify the output, challenge the conclusion.',
            zh: '把你想要什么，用大白话贴进来。规则引擎按流行框架（CO-STAR、CRISPE、ICIO、BROKE、RTF…）拆解成槽位，你逐项修订，工具组装出完整提示词 —— 并可注入「验证条款」，练成公司要的闭环：会写 prompt、验证 AI 输出、挑战 AI 结论。',
          })}
        </p>

        {/* ============ input ============ */}
        <section className="mt-8 rounded-3xl border border-ink/10 bg-surface/40 p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-gold">{t({ en: 'Step 1 · Paste your rough ask', zh: '第 1 步 · 贴入你的大白话需求' })}</h2>
            <button
              onClick={() => { const s = lang === 'en' ? SAMPLE_EN : SAMPLE_ZH; setInput(s); const r = analyze(s); setSlots(r.slots); setDetected(r.detected); setAnalyzed(true); }}
              className="rounded-full border border-ink/15 px-3 py-1 font-mono text-[11px] text-ink/60 transition-colors hover:border-gold/50 hover:text-gold"
            >
              {t({ en: 'Try a sample', zh: '试试示例' })}
            </button>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={4}
            placeholder={t({ en: 'e.g. Help me write a progress report email to management about our AI support project… (the messier the better — that\'s the point)', zh: '例如：下周要给管理层汇报 AI 客服项目进展，帮我写一份邮件……（越大白话越好 —— 这正是工具的意义）' })}
            className="mt-4 w-full resize-y rounded-2xl border border-ink/15 bg-paper px-4 py-3 text-[15px] leading-relaxed text-ink outline-none transition-colors placeholder:text-ink/30 focus:border-gold/50"
          />
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={runAnalyze}
              disabled={!input.trim()}
              className="btn-sheen inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 font-mono text-xs font-semibold text-paper transition-transform enabled:hover:scale-[1.02] disabled:opacity-40"
            >
              {t({ en: 'Decompose ⚒', zh: '拆解 ⚒' })}
            </button>
            <span className="font-mono text-[11px] text-ink/40">{t({ en: 'Re-running overwrites your slot edits', zh: '重新拆解会覆盖已编辑的槽位' })}</span>
          </div>
        </section>

        {/* ============ workbench ============ */}
        {analyzed && (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.95fr]">
            {/* left: framework + slots */}
            <section>
              <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-gold">{t({ en: 'Step 2 · Pick a framework & refine slots', zh: '第 2 步 · 选框架，修订槽位' })}</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {FRAMEWORKS.map((f) => (
                  <button key={f.id} onClick={() => setFwId(f.id)}
                    className={`rounded-full border px-3.5 py-1.5 font-mono text-xs transition-colors ${fwId === f.id ? 'border-ink bg-ink text-paper' : 'border-ink/15 text-ink/60 hover:border-ink/40 hover:text-ink'}`}>
                    {f.name}
                  </button>
                ))}
              </div>
              <div className="mt-3 rounded-xl border border-ink/10 bg-surface/40 px-4 py-3">
                <p className="text-[13px] leading-relaxed text-ink/65">{t(fw.full)}</p>
                <p className="mt-1 font-mono text-[11px] text-gold">{t({ en: 'Best for: ', zh: '适用：' })}{t(fw.when)}</p>
              </div>

              <div className="mt-5 space-y-4">
                {fwSlots.map((key) => {
                  const meta = SLOT_META[key];
                  const val = slots[key];
                  const wasDetected = detected.has(key) && !!val;
                  const letters = fw.sections.filter((s) => s.slot === key).map((s) => s.letter).join('/');
                  return (
                    <div key={key} className="rounded-2xl border border-ink/10 bg-surface/30 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-ink">
                          <span className="grid h-6 w-6 place-items-center rounded-md bg-gold/15 font-mono text-[11px] font-bold text-gold">{letters}</span>
                          {t(meta.label)}
                        </label>
                        <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${wasDetected ? 'bg-emerald-500/10 text-emerald-700' : 'bg-ink/[0.06] text-ink/45'}`}>
                          {wasDetected ? t({ en: 'detected', zh: '已识别' }) : t({ en: 'add it', zh: '建议补充' })}
                        </span>
                      </div>
                      <textarea
                        value={val}
                        onChange={(e) => setSlots((s) => ({ ...s, [key]: e.target.value }))}
                        rows={val.length > 120 ? 3 : 2}
                        placeholder={t(meta.hint)}
                        className="mt-2.5 w-full resize-y rounded-xl border border-ink/10 bg-paper px-3 py-2 text-[13.5px] leading-relaxed text-ink/85 outline-none transition-colors placeholder:text-ink/30 focus:border-gold/50"
                      />
                    </div>
                  );
                })}
              </div>
            </section>

            {/* right: verification + output */}
            <section className="lg:sticky lg:top-24 lg:self-start">
              <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-gold">{t({ en: 'Step 3 · Verification loop & output', zh: '第 3 步 · 验证闭环与产出' })}</h2>

              <div className="mt-3 rounded-2xl border border-gold/25 bg-gold/[0.05] p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">{t({ en: 'Verification clauses — the company loop', zh: '验证条款 —— 公司要的那个闭环' })}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {ADDONS.map((a) => (
                    <button key={a.id} onClick={() => toggleAddon(a.id)} title={t(a.clause)}
                      className={`rounded-full border px-3 py-1.5 font-mono text-[11px] transition-colors ${addons.has(a.id) ? 'border-gold bg-gold text-paper' : 'border-ink/15 text-ink/55 hover:border-gold/50 hover:text-gold'}`}>
                      {addons.has(a.id) ? '✓ ' : ''}{t(a.label)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <div className="flex overflow-hidden rounded-full border border-ink/15">
                  {([['xml', 'XML tags'], ['md', 'Markdown']] as const).map(([mode, label]) => (
                    <button key={mode} onClick={() => setUseXml(mode === 'xml')}
                      className={`px-3 py-1.5 font-mono text-[11px] transition-colors ${(mode === 'xml') === useXml ? 'bg-ink text-paper' : 'text-ink/55 hover:text-ink'}`}>
                      {label}
                    </button>
                  ))}
                </div>
                <span className="font-mono text-[11px] text-ink/40">{output.length} {t({ en: 'chars', zh: '字符' })}</span>
              </div>

              <div className="mt-3 overflow-hidden rounded-2xl border border-ink/15 bg-ink/[0.97]">
                <div className="flex items-center justify-between gap-3 border-b border-paper/10 px-4 py-2.5">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-paper/50">{fw.name} · {useXml ? 'XML' : 'Markdown'}</span>
                  <button onClick={copyOut}
                    className="rounded-md border border-paper/25 px-2.5 py-1 font-mono text-[11px] text-paper/80 transition-colors hover:border-gold hover:text-gold">
                    {copied ? t({ en: 'Copied ✓', zh: '已复制 ✓' }) : t({ en: 'Copy prompt', zh: '复制提示词' })}
                  </button>
                </div>
                <pre className="max-h-[26rem] overflow-auto whitespace-pre-wrap px-4 py-4 font-mono text-[12.5px] leading-relaxed text-paper/85">
                  {output || t({ en: '(fill at least the Task slot to assemble a prompt)', zh: '（至少填写「任务」槽位即可组装提示词）' })}
                </pre>
              </div>

              <p className="mt-3 text-[12px] leading-relaxed text-ink/45">
                {t({
                  en: 'Empty slots are omitted from the output — a clean prompt beats a template full of blanks. XML mode follows Anthropic-style tag structuring; Markdown mode uses ## headers.',
                  zh: '空槽位不会出现在产出里 —— 干净的提示词胜过一堆空模板。XML 模式采用 Anthropic 风格的标签结构；Markdown 模式用 ## 标题。',
                })}
              </p>
            </section>
          </div>
        )}

        {/* ============ best practices ============ */}
        <section className="mt-14 border-t border-ink/10 pt-10">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-gold">{t({ en: 'Cheat sheet · 2026 best practices', zh: '速查 · 2026 提示词最佳实践' })}</p>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight">{t({ en: 'The six habits behind every good prompt', zh: '好提示词背后的六个习惯' })}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BEST_PRACTICES.map((bp, i) => (
              <div key={i} className="rounded-2xl border border-ink/10 bg-surface/40 p-5">
                <span className="font-mono text-xs text-gold">0{i + 1}</span>
                <h3 className="mt-1 font-semibold text-ink">{t(bp.title)}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-ink/60">{t(bp.body)}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-xs leading-relaxed text-ink/45">
            {t({ en: 'Grounded in: ', zh: '依据来源：' })}
            <a href="https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents" target="_blank" rel="noopener noreferrer" className="text-gold underline underline-offset-2 hover:opacity-80">Anthropic · Effective context engineering ↗</a>
            {' · '}
            <a href="https://github.com/anthropics/prompt-eng-interactive-tutorial" target="_blank" rel="noopener noreferrer" className="text-gold underline underline-offset-2 hover:opacity-80">Anthropic prompt-eng tutorial ↗</a>
            {' · '}
            <a href="https://www.ibm.com/think/prompt-engineering" target="_blank" rel="noopener noreferrer" className="text-gold underline underline-offset-2 hover:opacity-80">IBM · 2026 guide ↗</a>
            {t({ en: ' — frameworks: CO-STAR / CRISPE / ICIO / BROKE / RTF as popularized in the prompt-engineering community.', zh: ' —— 框架为社区流行的 CO-STAR / CRISPE / ICIO / BROKE / RTF。' })}
          </p>
        </section>

        <p className="mt-10 text-xs leading-relaxed text-ink/45">
          {t({
            en: 'By 大雷 — a teaching tool: the rule engine is deliberately transparent (plain regex heuristics you can read in the source), so the framework thinking sticks even when you write prompts by hand.',
            zh: '大雷出品 —— 这是个教学向工具：规则引擎刻意做成透明的（源码里就是可读的正则启发式），目的是让框架思维留在你脑子里，哪怕以后徒手写提示词。',
          })}
        </p>
      </main>
    </div>
  );
};

export default PromptForge;
