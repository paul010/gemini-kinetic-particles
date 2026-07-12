import React, { useEffect, useState } from 'react';

/* ---------------------------------------------------------------------------
 * /chengdu — a July business-trip field guide to Chengdu, anchored on Taikoo
 * Li (春熙路站). Three jobs: (1) an interactive prepare-ahead checklist with
 * D-day offsets, persisted in localStorage; (2) the Chengdu-flavor cheat
 * sheet — eat / sip / watch / say; (3) a 4-evening business-trip itinerary
 * grouped by how much time you actually have. Deliberately generic (no
 * personal dates or hotels — this is a public repo); the reservation math is
 * shown with a July 21 departure as the worked example. Bilingual.
 * ------------------------------------------------------------------------- */

type Lang = 'en' | 'zh' | 'zhHant';
interface LocalizedText { en: string; zh: string }

const STORAGE_KEY = 'dalei-lang-v2';
const CHECK_KEY = 'dalei-chengdu-check-v1';
const detectInitialLang = (): Lang => {
  if (typeof window === 'undefined') return 'en';
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return saved === 'zh' || saved === 'zhHant' ? saved : 'en';
};
let _s2t: ((s: string) => string) | null = null;
const useS2T = (active: boolean) => {
  const [conv, setConv] = useState<((s: string) => string) | null>(() => _s2t);
  useEffect(() => {
    if (!active || _s2t) { if (_s2t && !conv) setConv(() => _s2t); return; }
    let alive = true;
    import('opencc-js').then((m) => { _s2t = (m as any).Converter({ from: 'cn', to: 'tw' }); if (alive) setConv(() => _s2t); }).catch(() => {});
    return () => { alive = false; };
  }, [active, conv]);
  return conv;
};

/* ---------- prepare-ahead checklist (D = departure day) ---------- */

interface PrepItem { id: string; when: string; whenNote: LocalizedText; text: LocalizedText; vital?: boolean }
const PREP: PrepItem[] = [
  {
    id: 'panda', when: 'D-14', vital: true,
    whenNote: { en: 'e.g. depart Jul 21 → book from Jul 7', zh: '如 7/21 出发 → 7/7 起可约' },
    text: { en: 'Book the Panda Base morning slot the minute the 14-day window opens — official WeChat mini-program, real-name, ¥55. Summer slots sell out.', zh: '熊猫基地开放提前 14 天实名预约,窗口一开就抢上午票(官方微信小程序,55 元)。暑期票非常紧俏。' },
  },
  {
    id: 'opera', when: 'D-7',
    whenNote: { en: 'a week out', zh: '提前一周' },
    text: { en: 'Book a Sichuan-opera face-changing show (Shufeng Yayun at Qintai Road, or Yuelai Teahouse) — evening shows pair perfectly with a work day.', zh: '订川剧变脸演出(琴台路蜀风雅韵,或悦来茶园)—— 晚场和工作日完美错开。' },
  },
  {
    id: 'train', when: 'D-7',
    whenNote: { en: 'if you have one full free day', zh: '若能空出完整一天' },
    text: { en: 'Check 12306 for the ~30-min high-speed train to Dujiangyan (Xipu / Chengdu West → Dujiangyan) for the irrigation works + Mt. Qingcheng day.', zh: '12306 查犀浦/成都西 → 都江堰的高铁(约 30 分钟),留给都江堰 + 青城山一日。' },
  },
  {
    id: 'food', when: 'D-3',
    whenNote: { en: 'a few days out', zh: '提前几天' },
    text: { en: 'Shortlist hotpot / chuanchuan places on Dianping and note which need queue tickets — good ones near Taikoo Li fill up by 7pm.', zh: '大众点评收藏火锅/串串店,看清哪些要取号 —— 太古里周边的好店晚上 7 点就排起来了。' },
  },
  {
    id: 'apps', when: 'D-1',
    whenNote: { en: 'the day before', zh: '出发前一天' },
    text: { en: 'Install AMap + Dianping; set up the metro QR (Tianfutong app, or the Alipay/WeChat transit code). Line 2/3 Chunxi Road station is the anchor.', zh: '装好高德 + 大众点评;开通地铁乘车码(天府通 App,或支付宝/微信乘车码)。2/3 号线春熙路站就是大本营。' },
  },
  {
    id: 'pack', when: 'D-1',
    whenNote: { en: 'packing list', zh: '装箱清单' },
    text: { en: 'July kit: compact umbrella (afternoon downpours), sunscreen, mosquito repellent, and stomach meds — the 麻辣 will test you.', zh: '七月装备:便携伞(午后雷阵雨)、防晒、驱蚊液、肠胃药 —— 麻辣是要考验人的。' },
  },
  {
    id: 'arrive', when: 'D-0',
    whenNote: { en: 'on landing', zh: '落地当天' },
    text: { en: 'Metro to Chunxi Road station, surface at the IFS climbing panda for your bearings, and walk into Taikoo Li — Daci Temple is right inside.', zh: '地铁到春熙路站,从 IFS 爬墙熊猫那头出站定位,步行进太古里 —— 大慈寺就在里面。' },
  },
];

/* ---------- the Chengdu flavor: eat / sip / watch / say ---------- */

interface FlavorGroup { icon: string; title: LocalizedText; items: { name: LocalizedText; note: LocalizedText }[] }
const FLAVORS: FlavorGroup[] = [
  {
    icon: '🌶️', title: { en: 'Eat — 麻 before 辣', zh: '吃 —— 先麻后辣' },
    items: [
      { name: { en: 'Hotpot (get 鸳鸯锅)', zh: '火锅(点鸳鸯锅)' }, note: { en: 'Half spicy, half mild broth — the sane first-timer move. Dip in sesame oil + garlic.', zh: '一半红汤一半清汤,新手体面之选;香油碟 + 蒜泥是标配。' } },
      { name: { en: 'Chuanchuan & maocai', zh: '串串香 & 冒菜' }, note: { en: 'Hotpot’s casual cousins — skewers by the bundle, solo-friendly bowls.', zh: '火锅的平价表亲 —— 签签按把算,冒菜一人食友好。' } },
      { name: { en: 'Classics sampler', zh: '名小吃一轮' }, note: { en: 'Zhong dumplings, Long wontons, dan dan noodles, sweet-water noodles (甜水面).', zh: '钟水饺、龙抄手、担担面、甜水面,一样来一份。' } },
      { name: { en: 'Street sweets', zh: '街头甜口' }, note: { en: 'Egg pancake (蛋烘糕) and iced 冰粉 — the mandatory post-hotpot rescue.', zh: '蛋烘糕、冰粉 —— 火锅之后的法定救援。' } },
      { name: { en: 'Brave mode', zh: '勇者模式' }, note: { en: 'Rabbit head (兔头) and brain flower (脑花). Locals swear by both.', zh: '兔头、脑花。本地人的心头好,敢不敢随你。' } },
    ],
  },
  {
    icon: '🍵', title: { en: 'Sip & slow down', zh: '喝 —— 慢下来' },
    items: [
      { name: { en: 'Gaiwan tea at Heming Teahouse', zh: '鹤鸣茶社盖碗茶' }, note: { en: 'People’s Park; ¥20-ish buys a lidded bowl and an entire afternoon.', zh: '人民公园里,二十来块一碗盖碗茶,能坐一下午。' } },
      { name: { en: 'Ear cleaning (采耳)', zh: '采耳' }, note: { en: 'The tuning-fork hum next to your ear is peak Chengdu. Try it once.', zh: '音叉在耳边嗡的那一下,就是成都的灵魂。值得体验一次。' } },
      { name: { en: 'Mahjong soundtrack', zh: '麻将背景音' }, note: { en: 'The clatter from every teahouse courtyard — 血战到底 is the local rule set.', zh: '茶馆院子里此起彼伏的哗啦声 —— 本地打法叫「血战到底」。' } },
      { name: { en: 'Craft beer & jazz bars', zh: '精酿与小酒馆' }, note: { en: 'Tangba Street (镋钯街) beside Taikoo Li — one of the world’s coolest streets per Time Out.', zh: '太古里旁的镋钯街 —— Time Out 评过的全球最酷街区之一。' } },
    ],
  },
  {
    icon: '🎭', title: { en: 'Watch', zh: '看' },
    items: [
      { name: { en: 'Face-changing (变脸)', zh: '川剧变脸' }, note: { en: 'Plus fire-spitting and the rolling-lamp act — 90 minutes, perfect after work.', zh: '加上吐火、滚灯,90 分钟一场,下班后刚刚好。' } },
      { name: { en: 'Pandas, early', zh: '熊猫要赶早' }, note: { en: 'Gates 7:30 in summer; they’re active at breakfast and asleep by noon.', zh: '夏季 7:30 开园;早饭时间最活跃,中午全体睡觉。' } },
      { name: { en: 'Three Kingdoms nights', zh: '三国之夜' }, note: { en: 'Wuhou Shrine + Jinli’s red lanterns — Chengdu’s signature night view.', zh: '武侯祠 + 锦里红灯笼 —— 成都招牌夜景。' } },
      { name: { en: 'The Golden Sun Bird', zh: '太阳神鸟' }, note: { en: 'Jinsha Site Museum — the 3,000-year-old gold foil that became the city emblem.', zh: '金沙遗址博物馆 —— 三千年前的金箔,如今是成都城市标志。' } },
    ],
  },
  {
    icon: '💬', title: { en: 'Say — sound local', zh: '说 —— 学两句川话' },
    items: [
      { name: { en: '巴适 bā shì', zh: '巴适' }, note: { en: '“Perfect / comfortable.” The highest compliment. Upgrade: 巴适得板!', zh: '「舒服、安逸、完美」。最高评价,进阶版:巴适得板!' } },
      { name: { en: '安逸 ān yì', zh: '安逸' }, note: { en: 'Contented, at ease — the city’s operating system.', zh: '舒坦、惬意 —— 这座城市的操作系统。' } },
      { name: { en: '摆龙门阵 bǎi lóng mén zhèn', zh: '摆龙门阵' }, note: { en: 'To chat at length over tea. What teahouses are for.', zh: '喝着茶天南海北地聊。茶馆存在的意义。' } },
      { name: { en: '莫得 mò dé / 要得 yào dé', zh: '莫得 / 要得' }, note: { en: '“Nope” / “deal!”. Two words, 80% of transactions covered.', zh: '「没有」/「好的」。两个词覆盖八成日常交流。' } },
    ],
  },
];

/* ---------- 4-evening itinerary, grouped by available time ---------- */

interface Slot { tag: LocalizedText; title: LocalizedText; body: LocalizedText }
const ITINERARY: Slot[] = [
  {
    tag: { en: 'Arrival evening', zh: '到达晚' },
    title: { en: 'Radius: zero', zh: '半径:零' },
    body: { en: 'Taikoo Li + Daci Temple (a 1,000-year-old temple inside the mall), the IFS climbing panda, Fangsuo bookstore, Chunxi Road crowds. Dinner on Tangba Street.', zh: '太古里 + 大慈寺(商圈里的千年古刹)、IFS 爬墙熊猫、方所书店、春熙路人潮。晚饭去镋钯街。' },
  },
  {
    tag: { en: 'Work-day evenings', zh: '工作日晚上' },
    title: { en: 'One metro hop each', zh: '每晚一跳地铁' },
    body: { en: 'Pick per night: Jinli + Wuhou Shrine lanterns · a face-changing show · Jiuyanqiao riverside bars · Wangping Street for late-night eats.', zh: '每晚选一个:锦里 + 武侯祠灯笼 · 川剧变脸 · 九眼桥河边酒吧 · 望平街夜宵。' },
  },
  {
    tag: { en: 'One free morning', zh: '空出一个上午' },
    title: { en: 'Pandas, 7:30 sharp', zh: '熊猫,7:30 整' },
    body: { en: 'Line 3 to Panda Avenue + shuttle. Two to three hours among the nurseries, back in town by lunch. This is the slot the D-14 booking exists for.', zh: '3 号线到熊猫大道站转接驳。产房和幼年园逛两三个小时,午饭前回城。D-14 抢的票就是为了这个上午。' },
  },
  {
    tag: { en: 'One full free day', zh: '完整一天(可选)' },
    title: { en: 'Dujiangyan + Mt. Qingcheng', zh: '都江堰 + 青城山' },
    body: { en: '30 min by high-speed rail: the 2,200-year-old irrigation works that made the Chengdu plain, then the Taoist mountain — noticeably cooler than downtown in July. Fallback if no full day: Heming Teahouse + Kuanzhai Alleys, or the quieter Wenshu Monastery.', zh: '高铁 30 分钟:先看造就天府之国的两千二百年水利工程,再上道教青城山 —— 七月比市区凉快得多。没有整天就替补:鹤鸣茶社 + 宽窄巷子,或更清净的文殊院。' },
  },
];

interface Props { onHome: () => void }

const Chengdu: React.FC<Props> = ({ onHome }) => {
  const [lang, setLang] = useState<Lang>(detectInitialLang);
  const s2t = useS2T(lang === 'zhHant');
  const t = (txt: LocalizedText) => (lang === 'en' ? txt.en : lang === 'zhHant' ? (s2t ? s2t(txt.zh) : txt.zh) : txt.zh);
  useEffect(() => { if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, lang); }, [lang]);

  // checklist state persists across visits — tick things off as the trip nears
  const [done, setDone] = useState<Record<string, boolean>>(() => {
    if (typeof window === 'undefined') return {};
    try { return JSON.parse(window.localStorage.getItem(CHECK_KEY) ?? '{}'); } catch { return {}; }
  });
  const toggle = (id: string) => {
    setDone((d) => {
      const next = { ...d, [id]: !d[id] };
      try { window.localStorage.setItem(CHECK_KEY, JSON.stringify(next)); } catch { /* private mode */ }
      return next;
    });
  };
  const doneCount = PREP.filter((p) => done[p.id]).length;

  const LANGS: { code: Lang; label: string }[] = [{ code: 'en', label: 'EN' }, { code: 'zh', label: '简' }, { code: 'zhHant', label: '繁' }];

  return (
    <div className="min-h-screen bg-paper font-sans text-ink">
      <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <button onClick={onHome} className="font-mono text-xs text-ink/55 transition-colors hover:text-ink">← Da Lei · 大雷</button>
          <div className="flex items-center gap-3">
            <span className="hidden font-mono text-[11px] uppercase tracking-[0.2em] text-gold sm:inline">Chengdu Guide</span>
            <div className="flex overflow-hidden rounded-full border border-ink/15">
              {LANGS.map((l) => (
                <button key={l.code} onClick={() => setLang(l.code)}
                  className={`px-2.5 py-1 font-mono text-[11px] transition-colors ${lang === l.code ? 'bg-ink text-paper' : 'text-ink/55 hover:text-ink'}`}>{l.label}</button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-ink/45">{t({ en: 'Field guide · July business trip', zh: '实用指南 · 七月出差版' })}</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          {t({ en: 'Chengdu, anchored on Taikoo Li', zh: '成都,以太古里为原点' })}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink/65">
          {t({
            en: 'A business-trip guide for four days in July, built around one anchor: Chunxi Road station (Line 2/3), where Taikoo Li puts a 1,000-year-old temple, the city’s best bookstore and its coolest bar street within a ten-minute walk. Evenings and one stolen morning are enough — if you prepare ahead. Hence the checklist.',
            zh: '一份七月、四天、出差节奏的成都指南,只有一个原点:春熙路站(2/3 号线)。以太古里为圆心,十分钟步行圈里就有千年古刹、全城最美书店和最酷的酒吧街。晚上的时间 + 偷出来的一个上午就够用 —— 前提是提前准备。所以先看清单。',
          })}
        </p>

        {/* weather strip */}
        <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl border border-ink/10 bg-surface/50 px-5 py-4 font-mono text-[13px] text-ink/65">
          <span>☀️ {t({ en: 'July: 26–34°C, humid', zh: '七月:26–34°C,闷热' })}</span>
          <span>🌧️ {t({ en: 'afternoon downpours — carry an umbrella', zh: '午后雷阵雨 —— 带伞' })}</span>
          <span>🌙 {t({ en: 'plan for mornings & evenings', zh: '行程尽量放早晚' })}</span>
        </div>

        {/* prepare-ahead checklist */}
        <div className="mt-12 flex items-baseline justify-between gap-3">
          <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{t({ en: 'Prepare ahead', zh: '行前准备清单' })}</h2>
          <span className="font-mono text-[11px] tabular-nums text-ink/40">{doneCount}/{PREP.length} {t({ en: 'done', zh: '已完成' })}</span>
        </div>
        <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-ink/55">
          {t({ en: 'D = departure day. Ticks are saved in your browser — come back and check things off as the trip nears.', zh: 'D = 出发日。勾选状态存在浏览器里 —— 离出发越近,回来打的钩越多。' })}
        </p>
        <ol className="mt-5 flex flex-col gap-2.5">
          {PREP.map((p) => {
            const checked = !!done[p.id];
            return (
              <li key={p.id}>
                <button
                  onClick={() => toggle(p.id)}
                  aria-pressed={checked}
                  className={`grid w-full grid-cols-[auto_4.5rem_1fr] items-start gap-x-3 rounded-2xl border px-4 py-3.5 text-left transition-colors sm:gap-x-4 sm:px-5 ${
                    checked ? 'border-ink/10 bg-surface/30' : p.vital ? 'border-gold/40 bg-gold/[0.06]' : 'border-ink/10 bg-surface/50 hover:border-ink/25'
                  }`}
                >
                  <span aria-hidden="true" className={`mt-0.5 grid h-5 w-5 place-items-center rounded-md border text-[11px] font-bold ${checked ? 'border-gold bg-gold text-paper' : 'border-ink/25 text-transparent'}`}>✓</span>
                  <span className="flex flex-col">
                    <span className={`font-mono text-sm font-semibold tabular-nums ${p.vital && !checked ? 'text-gold' : 'text-ink/70'}`}>{p.when}</span>
                    <span className="mt-0.5 font-mono text-[10px] leading-tight text-ink/40">{t(p.whenNote)}</span>
                  </span>
                  <span className={`text-sm leading-relaxed ${checked ? 'text-ink/40 line-through decoration-ink/25' : 'text-ink/75'}`}>
                    {p.vital && !checked && <span className="mr-1.5 font-mono text-[10px] uppercase tracking-wider text-gold">{t({ en: 'don’t miss', zh: '别错过' })}</span>}
                    {t(p.text)}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        {/* the flavor cheat sheet */}
        <h2 className="mt-14 font-display text-2xl font-semibold tracking-tight sm:text-3xl">{t({ en: 'The Chengdu flavor', zh: '成都特色速查' })}</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {FLAVORS.map((g) => (
            <section key={g.icon} className="overflow-hidden rounded-2xl border border-ink/10 bg-surface/40">
              <div className="flex items-center gap-2.5 border-b border-ink/10 px-5 py-3.5">
                <span className="text-xl" aria-hidden="true">{g.icon}</span>
                <h3 className="font-display text-lg font-semibold tracking-tight">{t(g.title)}</h3>
              </div>
              <ul className="flex flex-col divide-y divide-ink/5 px-5 py-2">
                {g.items.map((it, i) => (
                  <li key={i} className="py-2.5 text-[13px] leading-relaxed">
                    <span className="font-medium text-ink/80">{t(it.name)}</span>
                    <span className="text-ink/55"> — {t(it.note)}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        {/* itinerary by available time */}
        <h2 className="mt-14 font-display text-2xl font-semibold tracking-tight sm:text-3xl">{t({ en: 'Four evenings, one stolen morning', zh: '四个晚上,偷一个上午' })}</h2>
        <ol className="mt-5 flex flex-col">
          {ITINERARY.map((s, i) => (
            <li key={i} className="relative flex gap-5 pb-7 last:pb-0">
              {i < ITINERARY.length - 1 && (
                <span className="absolute left-[6px] top-5 h-full w-px bg-gradient-to-b from-ink/15 to-ink/5" aria-hidden="true" />
              )}
              <span className="relative mt-1.5 grid h-3.5 w-3.5 shrink-0 place-items-center" aria-hidden="true">
                <span className={`h-3.5 w-3.5 rounded-full border ${i === 2 ? 'border-gold/50 bg-gold/15' : 'border-ink/20 bg-ink/5'}`} />
                {i === 2 && <span className="pulse-dot absolute h-1.5 w-1.5 rounded-full bg-gold" />}
              </span>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-gold">{t(s.tag)}</p>
                <h3 className="mt-1 font-display text-lg font-semibold tracking-tight">{t(s.title)}</h3>
                <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink/65">{t(s.body)}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-ink/10 pt-8 font-mono text-[13px]">
          <a className="text-gold hover:underline" href="https://www.panda.org.cn/cn/pandavalley/tickets/" target="_blank" rel="noreferrer">{t({ en: 'Panda Base official tickets ↗', zh: '熊猫基地官方票务 ↗' })}</a>
          <a className="text-gold hover:underline" href="https://cd.bendibao.com/tour/2019923/105037.shtm" target="_blank" rel="noreferrer">{t({ en: 'Bendibao guide ↗', zh: '本地宝攻略 ↗' })}</a>
        </div>
        <p className="mt-5 text-xs leading-relaxed text-ink/45">
          {t({
            en: 'A personal field guide, AI-assisted, written July 2026 — prices, hours and booking policies drift, so treat the official channels above as the source of truth. No personal itinerary details live on this page on purpose.',
            zh: '个人向指南,AI 辅助整理,写于 2026 年 7 月 —— 价格、开放时间与预约政策会变,一切以上方官方渠道为准。页面刻意不含个人具体行程信息。',
          })}
        </p>
      </main>
    </div>
  );
};

export default Chengdu;
