/* ---------------------------------------------------------------------------
 * CICI dataset — the Comparatively-Insignificant City Index applied to China's
 * prefecture-level cities. Produced by running the `cici-index` skill
 * (.claude/skills/cici-index/SKILL.md):
 *
 *     CICI = popScore(户籍人口) − famePenalty(halo factors)
 *
 * Household-population (户籍) figures are approximate and AI-assisted; the fame
 * penalties are subjective, national-awareness estimates — a for-fun ranking,
 * not objective fact. Method popularized by @pretentiouswhat on X. Every city
 * here has something worth a visit; "high CICI" only means "under-known
 * relative to its size."
 * ------------------------------------------------------------------------- */

export interface LocalizedText { en: string; zh: string }

/** Halo factor keys — each buys a city some national name-recognition we subtract. */
export type HaloFactor =
  | 'capital' | 'scenic' | 'brandHQ' | 'history' | 'cuisine' | 'meme' | 'disaster' | 'other';

export const HALO_META: Record<HaloFactor, { icon: string; label: LocalizedText }> = {
  capital:  { icon: '🏛️', label: { en: 'Capital status', zh: '省会/首府' } },
  scenic:   { icon: '⛰️', label: { en: 'Famous scenery', zh: '知名景点' } },
  brandHQ:  { icon: '🏢', label: { en: 'Brand HQ', zh: '品牌总部' } },
  history:  { icon: '📜', label: { en: 'History & culture', zh: '历史文化' } },
  cuisine:  { icon: '🍜', label: { en: 'Famous cuisine', zh: '知名美食' } },
  meme:     { icon: '💬', label: { en: 'Meme / viral moment', zh: '网络梗' } },
  disaster: { icon: '⚠️', label: { en: 'Disaster / scandal', zh: '灾难/丑闻' } },
  other:    { icon: '✨', label: { en: 'Other fame', zh: '其它名气' } },
};

export interface Halo { factor: HaloFactor; weight: number; note: LocalizedText }

export interface City {
  rank: number;
  name: LocalizedText;      // romanized + local
  region: LocalizedText;    // province
  huji: number;             // 户籍人口 (registered), 万 people — approximate
  changzhu: number;         // 常住人口 (resident), 万 people — for context
  popScore: number;         // standardized household population, 0–100
  famePenalty: number;      // Σ halo weights (== sum of halo[].weight)
  cici: number;             // popScore − famePenalty
  halo: Halo[];
  knownFor: LocalizedText;  // one honest line — what, if anything, it's known for
}

/**
 * popScore normalized so Nanyang (the most populous by 户籍) = 100.
 * Sorted by cici, descending. 15 leaders.
 */
export const CICI_CITIES: City[] = [
  {
    rank: 1, name: { en: 'Zhoukou', zh: '周口' }, region: { en: 'Henan', zh: '河南' },
    huji: 1120, changzhu: 880, popScore: 94, famePenalty: 12, cici: 82,
    halo: [
      { factor: 'history', weight: 8, note: { en: 'Laozi’s birthplace (Luyi) & Fuxi’s Taihao Mausoleum — real weight, but few connect them to "Zhoukou".', zh: '老子故里(鹿邑)、太昊陵伏羲祭典 —— 分量不轻,但很少有人把它们和「周口」联系起来。' } },
      { factor: 'scenic', weight: 2, note: { en: 'Guan Yu temple; low national draw.', zh: '关帝庙,全国知名度低。' } },
      { factor: 'other', weight: 2, note: { en: 'A grain and agricultural hub.', zh: '农业与粮食大市。' } },
    ],
    knownFor: { en: 'Honestly — very little outside Henan, despite ~11M registered people.', zh: '说实话,户籍逾 1100 万,出了河南却几乎无人知晓。' },
  },
  {
    rank: 2, name: { en: 'Fuyang', zh: '阜阳' }, region: { en: 'Anhui', zh: '安徽' },
    huji: 1080, changzhu: 820, popScore: 91, famePenalty: 11, cici: 80,
    halo: [
      { factor: 'history', weight: 3, note: { en: 'Ancient Yingzhou — Guan Zhong, Ouyang Xiu passed through; faint today.', zh: '古颍州,管仲、欧阳修都与此有缘,如今印象已淡。' } },
      { factor: 'cuisine', weight: 3, note: { en: 'Gela-tiao noodles, pillow buns — local, not national.', zh: '格拉条、枕头馍 —— 地方小吃,非全国名菜。' } },
      { factor: 'meme', weight: 3, note: { en: 'Known mostly as a Spring-Festival migrant-labor origin ("Fuyang Station").', zh: '主要以「春运民工输出大市」「阜阳站」为人所知。' } },
      { factor: 'other', weight: 2, note: { en: 'One of China’s largest labor-export cities.', zh: '中国最大的劳务输出地之一。' } },
    ],
    knownFor: { en: 'One of the biggest labor-export cities in China — and not much else nationally.', zh: '全国数一数二的劳务输出大市 —— 除此之外全国印象寥寥。' },
  },
  {
    rank: 3, name: { en: 'Nanyang', zh: '南阳' }, region: { en: 'Henan', zh: '河南' },
    huji: 1190, changzhu: 960, popScore: 100, famePenalty: 28, cici: 72,
    halo: [
      { factor: 'history', weight: 16, note: { en: 'Claims Zhuge Liang’s farming years (disputed with Xiangyang); Zhang Zhongjing the "Medicine Sage", Zhang Heng.', zh: '诸葛亮躬耕地(与襄阳有争议)、医圣张仲景、科圣张衡。' } },
      { factor: 'scenic', weight: 6, note: { en: 'Xixia dinosaur-egg fossils, Laojieling 5A.', zh: '西峡恐龙遗迹园、老界岭 5A。' } },
      { factor: 'other', weight: 4, note: { en: 'Dushan jade and Nanyang roses.', zh: '独山玉、南阳月季。' } },
      { factor: 'cuisine', weight: 2, note: { en: 'Nanyang-style beef & mutton.', zh: '南阳黄牛肉、水煎包。' } },
    ],
    knownFor: { en: 'The single most populous city here — carried by Zhuge Liang, jade and roses.', zh: '本榜人口最多的城市 —— 靠诸葛亮、玉石与月季撑着名气。' },
  },
  {
    rank: 4, name: { en: 'Linyi', zh: '临沂' }, region: { en: 'Shandong', zh: '山东' },
    huji: 1180, changzhu: 1090, popScore: 99, famePenalty: 30, cici: 69,
    halo: [
      { factor: 'brandHQ', weight: 12, note: { en: 'China’s wholesale-logistics capital — the vast Linyi Commercial City.', zh: '中国商贸物流之都 —— 庞大的临沂商城。' } },
      { factor: 'history', weight: 8, note: { en: 'Yimeng revolutionary base; birthplace of calligrapher Wang Xizhi.', zh: '沂蒙革命老区、书圣王羲之故里。' } },
      { factor: 'cuisine', weight: 6, note: { en: 'Linyi jianbing (pancakes) and sa soup.', zh: '临沂煎饼、糁汤。' } },
      { factor: 'scenic', weight: 4, note: { en: 'Yimeng mountains.', zh: '沂蒙山景区。' } },
    ],
    knownFor: { en: 'Famous inside commerce circles as the wholesale-market giant — invisible outside them.', zh: '在商贸圈是批发市场巨头 —— 圈外几乎无感。' },
  },
  {
    rank: 5, name: { en: 'Bijie', zh: '毕节' }, region: { en: 'Guizhou', zh: '贵州' },
    huji: 950, changzhu: 690, popScore: 80, famePenalty: 12, cici: 68,
    halo: [
      { factor: 'scenic', weight: 5, note: { en: 'Zhijin Cave, Baili Dujuan azalea forest.', zh: '织金洞、百里杜鹃。' } },
      { factor: 'other', weight: 4, note: { en: 'A national poverty-alleviation pilot zone in the news.', zh: '毕节试验区、脱贫攻坚样板,偶见新闻。' } },
      { factor: 'history', weight: 3, note: { en: 'Lady Shexiang, a Ming-era Yi leader.', zh: '奢香夫人(明代彝族女政治家)。' } },
    ],
    knownFor: { en: 'A big mountain prefecture most people can’t place — caves and azaleas aside.', zh: '一个多数人定位不了的山区大市 —— 除了溶洞和杜鹃花。' },
  },
  {
    rank: 6, name: { en: 'Shangqiu', zh: '商丘' }, region: { en: 'Henan', zh: '河南' },
    huji: 1000, changzhu: 780, popScore: 84, famePenalty: 24, cici: 60,
    halo: [
      { factor: 'history', weight: 16, note: { en: 'Cradle of the Shang and of fire-making (Suirenshi); Zhuangzi’s hometown.', zh: '商朝之源、燧人氏钻木取火之地、庄子故里。' } },
      { factor: 'scenic', weight: 6, note: { en: 'Mangdang Mountain Han tombs 5A.', zh: '芒砀山汉墓群 5A。' } },
      { factor: 'meme', weight: 2, note: { en: 'Sometimes read literally as "business hill".', zh: '偶被戏解为「商」字之源。' } },
    ],
    knownFor: { en: 'Deep history (the "Shang" in Shang dynasty) that its modern profile can’t cash in.', zh: '历史极深(「商朝」的商就在这),但现代存在感兑现不了。' },
  },
  {
    rank: 7, name: { en: 'Zhumadian', zh: '驻马店' }, region: { en: 'Henan', zh: '河南' },
    huji: 910, changzhu: 700, popScore: 76, famePenalty: 22, cici: 54,
    halo: [
      { factor: 'meme', weight: 8, note: { en: 'The name itself is a long-running Chinese-internet joke.', zh: '「驻马店」这名字本身就是长年的网络梗。' } },
      { factor: 'disaster', weight: 8, note: { en: 'The 1975 Banqiao Dam collapse — negative fame is still fame.', zh: '1975 年「75·8」板桥水库溃坝 —— 负面声誉也是声誉。' } },
      { factor: 'scenic', weight: 4, note: { en: 'Cha-ya Mountain, a Journey-to-the-West filming site, 5A.', zh: '嵖岈山(《西游记》外景地)5A。' } },
      { factor: 'other', weight: 2, note: { en: 'Hosts the national agri-processing expo.', zh: '中国农产品加工业博览会举办地。' } },
    ],
    knownFor: { en: 'Best known for its funny-sounding name and a 1970s dam disaster.', zh: '最出名的是它「好笑的名字」和上世纪的溃坝事件。' },
  },
  {
    rank: 8, name: { en: 'Shaoyang', zh: '邵阳' }, region: { en: 'Hunan', zh: '湖南' },
    huji: 820, changzhu: 650, popScore: 69, famePenalty: 16, cici: 53,
    halo: [
      { factor: 'scenic', weight: 6, note: { en: 'Langshan Danxia landform — World Heritage, 5A.', zh: '崀山丹霞地貌 —— 世界遗产,5A。' } },
      { factor: 'history', weight: 5, note: { en: 'Reformer Wei Yuan and general Cai E hail from here.', zh: '思想家魏源、护国名将蔡锷出自此地。' } },
      { factor: 'other', weight: 3, note: { en: 'Shaodong’s small-commodity traders.', zh: '邵东小商品商人。' } },
      { factor: 'cuisine', weight: 2, note: { en: 'Blood-tofu balls.', zh: '猪血丸子。' } },
    ],
    knownFor: { en: 'A populous Hunan prefecture overshadowed by Changsha in every headline.', zh: '一个人口不少的湖南大市,新闻里永远被长沙盖过。' },
  },
  {
    rank: 9, name: { en: 'Heze', zh: '菏泽' }, region: { en: 'Shandong', zh: '山东' },
    huji: 1020, changzhu: 880, popScore: 86, famePenalty: 33, cici: 53,
    halo: [
      { factor: 'meme', weight: 16, note: { en: 'Cao County’s "I’d rather a bed in Caoxian" meme and net-celebrity Guo Youcai went viral.', zh: '曹县「宁要曹县一张床」的梗、网红郭有才,双双出圈。' } },
      { factor: 'scenic', weight: 8, note: { en: 'The "Peony Capital" — Caozhou peony gardens.', zh: '牡丹之都 —— 曹州牡丹园。' } },
      { factor: 'history', weight: 6, note: { en: 'Water-Margin outlaw country; rebel Huang Chao.', zh: '水浒好汉出没之地、黄巢起兵处。' } },
      { factor: 'cuisine', weight: 3, note: { en: 'Caozhou-style stewed dishes.', zh: '曹州烧饼、单县羊汤。' } },
    ],
    knownFor: { en: 'Would rank far higher — but the Cao County meme accidentally made it famous.', zh: '本可以排得更靠前 —— 但「曹县」的梗意外让它火了。' },
  },
  {
    rank: 10, name: { en: 'Maoming', zh: '茂名' }, region: { en: 'Guangdong', zh: '广东' },
    huji: 810, changzhu: 740, popScore: 68, famePenalty: 18, cici: 50,
    halo: [
      { factor: 'cuisine', weight: 8, note: { en: 'Gaozhou lychees and Huazhou red tangerine peel.', zh: '高州荔枝、化州橘红。' } },
      { factor: 'brandHQ', weight: 6, note: { en: 'Maoming Petrochemical, a major refining base.', zh: '茂名石化,重要炼化基地。' } },
      { factor: 'history', weight: 4, note: { en: 'Lady Xian, the 6th-century Lingnan stateswoman.', zh: '冼夫人(岭南圣母)。' } },
    ],
    knownFor: { en: 'Guangdong’s quiet giant — oil and lychees, rarely a national headline.', zh: '广东低调的大市 —— 石化和荔枝,鲜少上全国头条。' },
  },
  {
    rank: 11, name: { en: 'Dazhou', zh: '达州' }, region: { en: 'Sichuan', zh: '四川' },
    huji: 690, changzhu: 530, popScore: 58, famePenalty: 12, cici: 46,
    halo: [
      { factor: 'cuisine', weight: 5, note: { en: 'Dengying (shadow-play) sliced beef.', zh: '灯影牛肉。' } },
      { factor: 'history', weight: 4, note: { en: 'Ancient Ba-kingdom culture.', zh: '巴文化发祥地之一。' } },
      { factor: 'meme', weight: 3, note: { en: 'Its "Yuan-Nine climbing festival" trends locally.', zh: '「元九登高」节,本地热闹一时。' } },
    ],
    knownFor: { en: 'Eastern-Sichuan hub known mainly for a translucent beef snack.', zh: '川东枢纽,全国印象大概只剩一味灯影牛肉。' },
  },
  {
    rank: 12, name: { en: 'Jieyang', zh: '揭阳' }, region: { en: 'Guangdong', zh: '广东' },
    huji: 720, changzhu: 560, popScore: 61, famePenalty: 18, cici: 43,
    halo: [
      { factor: 'history', weight: 8, note: { en: 'Chaoshan culture — but shared with Chaozhou and Shantou.', zh: '潮汕文化 —— 但与潮州、汕头共享。' } },
      { factor: 'cuisine', weight: 6, note: { en: 'Chaoshan cuisine, also shared regionally.', zh: '潮汕菜,同样是区域共享的名气。' } },
      { factor: 'other', weight: 4, note: { en: 'Asia’s jade-trading hub at Yangmei.', zh: '亚洲玉都(阳美玉雕)。' } },
    ],
    knownFor: { en: 'Its fame is really "Chaoshan’s" — split three ways with its neighbours.', zh: '它的名气其实是「潮汕」的 —— 和两个邻市三分。' },
  },
  {
    rank: 13, name: { en: 'Zhaotong', zh: '昭通' }, region: { en: 'Yunnan', zh: '云南' },
    huji: 630, changzhu: 510, popScore: 53, famePenalty: 11, cici: 42,
    halo: [
      { factor: 'cuisine', weight: 5, note: { en: 'Zhaotong apples.', zh: '昭通苹果。' } },
      { factor: 'history', weight: 3, note: { en: 'General Luo Binghui, warlord Long Yun.', zh: '罗炳辉、龙云等名人。' } },
      { factor: 'scenic', weight: 3, note: { en: 'Dashanbao black-necked-crane reserve.', zh: '大山包黑颈鹤保护区。' } },
    ],
    knownFor: { en: 'Northeast Yunnan’s populous corner — apples, and a long bus ride.', zh: '滇东北的人口角落 —— 苹果,和很长的山路。' },
  },
  {
    rank: 14, name: { en: 'Suzhou (Anhui)', zh: '宿州' }, region: { en: 'Anhui', zh: '安徽' },
    huji: 650, changzhu: 530, popScore: 55, famePenalty: 14, cici: 41,
    halo: [
      { factor: 'history', weight: 6, note: { en: 'Dazexiang uprising (Chen Sheng & Wu Guang); the battle of Gaixia nearby.', zh: '大泽乡起义(陈胜吴广)、垓下之战故地。' } },
      { factor: 'other', weight: 4, note: { en: 'Yongqiao, "China’s circus hometown".', zh: '埇桥「中国马戏之乡」。' } },
      { factor: 'cuisine', weight: 4, note: { en: 'Fuli-ji roast chicken.', zh: '符离集烧鸡。' } },
    ],
    knownFor: { en: 'Constantly confused with Jiangsu’s Suzhou — which starves it of its own fame.', zh: '总被误当成江苏苏州 —— 反倒被抢走了自己的名气。' },
  },
  {
    rank: 15, name: { en: 'Qujing', zh: '曲靖' }, region: { en: 'Yunnan', zh: '云南' },
    huji: 650, changzhu: 580, popScore: 55, famePenalty: 20, cici: 35,
    halo: [
      { factor: 'cuisine', weight: 8, note: { en: 'Xuanwei ham — a genuinely national name.', zh: '宣威火腿 —— 真正的全国名号。' } },
      { factor: 'history', weight: 6, note: { en: 'Cuan culture; the ancient Cuan Baozi stele; source of the Pearl River.', zh: '爨文化、爨宝子碑、珠江源。' } },
      { factor: 'other', weight: 3, note: { en: 'Yunnan’s second-largest city.', zh: '云南第二大城市。' } },
      { factor: 'scenic', weight: 3, note: { en: 'Luoping rapeseed-flower seas.', zh: '罗平油菜花海。' } },
    ],
    knownFor: { en: 'Yunnan’s No.2 city — saved from a higher CICI mostly by Xuanwei ham.', zh: '云南第二大城 —— 多亏宣威火腿,才没排得更靠前。' },
  },
];

/** How the CICI method was applied — shown as the "method" block on the page. */
export const CICI_METHOD: { step: string; title: LocalizedText; body: LocalizedText }[] = [
  {
    step: '01',
    title: { en: 'Start from household population', zh: '从户籍人口出发' },
    body: {
      en: 'Standardize each city’s registered household population (户籍人口) — the whole prefecture, not just the metro core — not its resident population. Anyone, anywhere in the prefecture, can add to a city’s reputation.',
      zh: '标准化每座城市的户籍人口 —— 是整个地级市,而不只是市区,也不是常住人口。地级市里任何人、任何角落,都能为这座城的声誉做贡献。',
    },
  },
  {
    step: '02',
    title: { en: 'Subtract every source of fame', zh: '减去一切名气来源' },
    body: {
      en: 'Take away anything that gives the city a halo: being a provincial capital, a 5A scenic spot, a national brand HQ, historical or cultural weight, a famous dish, a meme, or being the site of a disaster or scandal (negative fame is still fame).',
      zh: '减去一切给城市光环的东西:省会身份、5A 景点、国家品牌总部、历史文化分量、著名菜肴、网络梗,或是重大灾难/丑闻的发生地(负面声誉也是声誉)。',
    },
  },
  {
    step: '03',
    title: { en: 'The highest score wins', zh: '得分最高者胜出' },
    body: {
      en: 'The city with the highest score after subtraction is the CICI leader — big by population, yet far less famous than that size would suggest. It’s subjective, AI-assisted, and for fun; disagree freely (and kindly).',
      zh: '减完之后得分最高的,就是 CICI 领导者 —— 人口很大,却远不如这个体量本应带来的名气。方法主观、AI 辅助、纯为好玩;欢迎友好地反对。',
    },
  },
];
