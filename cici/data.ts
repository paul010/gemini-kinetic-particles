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

/**
 * The method, re-run on JAPAN. Same formula, different country — using each
 * municipality's registered/census population. Japan's cities are much closer
 * in size, so fame matters more than raw population. popScore normalized so
 * Saitama (the most populous here) = 100. Sorted by cici, descending.
 */
export const CICI_CITIES_JP: City[] = [
  {
    rank: 1, name: { en: 'Saitama', zh: '埼玉市 (さいたま)' }, region: { en: 'Saitama', zh: '埼玉县' },
    huji: 132, changzhu: 132, popScore: 100, famePenalty: 32, cici: 68,
    halo: [
      { factor: 'capital', weight: 16, note: { en: 'Prefectural capital, a designated city — but merged together only in 2001, with a thin distinct identity.', zh: '埼玉县首府、政令指定都市 —— 但 2001 年才合并而成,自身辨识度很薄。' } },
      { factor: 'meme', weight: 8, note: { en: 'Famous mainly through "Fly Me to the Saitama" — a hit comedy about the prefecture having nothing famous.', zh: '主要因电影《飞翔吧!埼玉》出名 —— 一部拿「埼玉啥也没有」自嘲的爆款喜剧。' } },
      { factor: 'other', weight: 6, note: { en: 'Urawa Reds football, Omiya bonsai village, the Omiya rail hub.', zh: '浦和红钻足球、大宫盆栽村、大宫铁路枢纽。' } },
      { factor: 'scenic', weight: 2, note: { en: 'Railway Museum; little else drawing visitors.', zh: '铁道博物馆,其余乏善可陈。' } },
    ],
    knownFor: { en: 'Famous, ironically, for a movie about how it has nothing famous.', zh: '讽刺的是,它最出名的是一部讲「它没什么出名的」的电影。' },
  },
  {
    rank: 2, name: { en: 'Sagamihara', zh: '相模原市' }, region: { en: 'Kanagawa', zh: '神奈川县' },
    huji: 72, changzhu: 72, popScore: 55, famePenalty: 9, cici: 46,
    halo: [
      { factor: 'other', weight: 6, note: { en: 'JAXA’s Sagamihara campus — home of the Hayabusa asteroid missions.', zh: 'JAXA 相模原园区 —— 隼鸟号小行星探测任务的大本营。' } },
      { factor: 'scenic', weight: 3, note: { en: 'Lake Sagami and its lakeside resort.', zh: '相模湖及湖畔度假区。' } },
    ],
    knownFor: { en: 'One of Japan’s 20 designated cities — and probably the one nobody can picture.', zh: '日本仅 20 座政令指定都市之一 —— 也大概是最没画面感的那座。' },
  },
  {
    rank: 3, name: { en: 'Kawaguchi', zh: '川口市' }, region: { en: 'Saitama', zh: '埼玉县' },
    huji: 60, changzhu: 60, popScore: 45, famePenalty: 8, cici: 37,
    halo: [
      { factor: 'history', weight: 4, note: { en: 'Old cast-iron foundry town; the classic 1962 film "Foundry Town".', zh: '老铸造之乡,经典电影《有炼炉的街》(1962)。' } },
      { factor: 'other', weight: 4, note: { en: 'A huge migrant community; the Nishi-Kawaguchi district.', zh: '庞大的外来人口社区、西川口一带。' } },
    ],
    knownFor: { en: 'A dense Tokyo-orbit city best known, if at all, for its old foundries.', zh: '一座紧邻东京的高密度城市,若说印象,也就剩老铸造厂。' },
  },
  {
    rank: 4, name: { en: 'Funabashi', zh: '船桥市' }, region: { en: 'Chiba', zh: '千叶县' },
    huji: 64, changzhu: 64, popScore: 48, famePenalty: 16, cici: 32,
    halo: [
      { factor: 'meme', weight: 10, note: { en: 'Funassyi — the wildly viral unofficial pear mascot — is from here.', zh: '船梨精(ふなっしー)—— 红遍全国的非官方梨子吉祥物 —— 就出自这里。' } },
      { factor: 'scenic', weight: 4, note: { en: 'Andersen Park; birthplace of the LaLaport mall chain.', zh: '安徒生公园、LaLaport 购物中心的发源地。' } },
      { factor: 'cuisine', weight: 2, note: { en: 'Nashi (Japanese pear) orchards.', zh: '日本梨产地。' } },
    ],
    knownFor: { en: 'A commuter city that a screaming pear mascot put on the map.', zh: '一座被尖叫梨子吉祥物带火的通勤城市。' },
  },
  {
    rank: 5, name: { en: 'Hachiōji', zh: '八王子市' }, region: { en: 'Tokyo', zh: '东京都' },
    huji: 58, changzhu: 58, popScore: 44, famePenalty: 13, cici: 31,
    halo: [
      { factor: 'scenic', weight: 6, note: { en: 'Mt. Takao — a Michelin-starred day hike — sits within the city.', zh: '高尾山(米其林三星级徒步地)就在市内。' } },
      { factor: 'history', weight: 4, note: { en: 'Hachioji Castle ruins; a Koshu-kaido post town; kuruma-ningyo puppetry.', zh: '八王子城遗址、甲州街道宿场、车人形。' } },
      { factor: 'other', weight: 3, note: { en: 'A student town — many universities relocated here.', zh: '大学城 —— 多所高校迁址于此。' } },
    ],
    knownFor: { en: 'Tokyo’s big western suburb — carried mostly by Mt. Takao.', zh: '东京西部的大郊区 —— 主要靠高尾山撑门面。' },
  },
  {
    rank: 6, name: { en: 'Ichikawa', zh: '市川市' }, region: { en: 'Chiba', zh: '千叶县' },
    huji: 49, changzhu: 49, popScore: 37, famePenalty: 8, cici: 29,
    halo: [
      { factor: 'history', weight: 3, note: { en: 'Nakayama Hokekyo-ji temple; a setting in the "Eight Dog Chronicles".', zh: '中山法华经寺、《南总里见八犬传》的舞台之一。' } },
      { factor: 'other', weight: 3, note: { en: 'A leafy "education city" bedroom suburb.', zh: '绿意盎然的「文教都市」睡城。' } },
      { factor: 'history', weight: 2, note: { en: 'Writer Nagai Kafu spent his last years here.', zh: '作家永井荷风在此度过晚年。' } },
    ],
    knownFor: { en: 'A quiet, bookish Tokyo-edge suburb most people just pass through.', zh: '一座安静、书卷气的东京边缘睡城,多数人只是路过。' },
  },
  {
    rank: 7, name: { en: 'Kashiwa', zh: '柏市' }, region: { en: 'Chiba', zh: '千叶县' },
    huji: 43, changzhu: 43, popScore: 33, famePenalty: 9, cici: 24,
    halo: [
      { factor: 'other', weight: 6, note: { en: 'A youth street-fashion scene ("Kashiwa" style); the Kashiwa-no-ha smart city.', zh: '青年街头潮流(「柏」系)、柏之叶智慧城市。' } },
      { factor: 'brandHQ', weight: 3, note: { en: 'Kashiwa Reysol, a J-League club.', zh: '柏太阳神(J 联赛球队)。' } },
    ],
    knownFor: { en: 'A commuter hub with a surprisingly big youth-fashion reputation — locally.', zh: '一个通勤枢纽,却有着(限于本地的)不小的青年潮流名声。' },
  },
  {
    rank: 8, name: { en: 'Higashiōsaka', zh: '东大阪市' }, region: { en: 'Osaka', zh: '大阪府' },
    huji: 49, changzhu: 49, popScore: 37, famePenalty: 14, cici: 23,
    halo: [
      { factor: 'other', weight: 6, note: { en: 'Japan’s densest cluster of small precision factories — "monozukuri" capital.', zh: '日本中小精密工厂最密集之地 ——「制造之城」。' } },
      { factor: 'scenic', weight: 5, note: { en: 'Hanazono Rugby Stadium — the home of high-school rugby.', zh: '花园橄榄球场 —— 高中橄榄球的圣地。' } },
      { factor: 'history', weight: 3, note: { en: 'Ishikiri Shrine.', zh: '石切神社。' } },
    ],
    knownFor: { en: 'The workshop of Osaka — thousands of tiny factories, one famous rugby pitch.', zh: '大阪的车间 —— 数千家小工厂,和一座著名的橄榄球场。' },
  },
  {
    rank: 9, name: { en: 'Amagasaki', zh: '尼崎市' }, region: { en: 'Hyogo', zh: '兵库县' },
    huji: 46, changzhu: 46, popScore: 35, famePenalty: 14, cici: 21,
    halo: [
      { factor: 'meme', weight: 8, note: { en: 'A gritty, working-class "rough town" image — a recurring pop-culture shorthand.', zh: '粗粝的工人阶级「硬核小城」形象 —— 流行文化里反复出现的符号。' } },
      { factor: 'history', weight: 3, note: { en: 'Amagasaki Castle (rebuilt).', zh: '尼崎城(复建)。' } },
      { factor: 'brandHQ', weight: 3, note: { en: 'A heavy-industry past on the Hanshin belt.', zh: '阪神工业带上的重工业老城。' } },
    ],
    knownFor: { en: 'Better known for an attitude than for anything you’d visit.', zh: '它出名的是一种「气质」,而不是什么值得一游的地方。' },
  },
  {
    rank: 10, name: { en: 'Toyonaka', zh: '丰中市' }, region: { en: 'Osaka', zh: '大阪府' },
    huji: 40, changzhu: 40, popScore: 30, famePenalty: 10, cici: 20,
    halo: [
      { factor: 'scenic', weight: 5, note: { en: 'Part of Osaka (Itami) Airport; Hattori Ryokuchi park.', zh: '大阪(伊丹)机场部分位于此、服部绿地公园。' } },
      { factor: 'other', weight: 3, note: { en: 'Home to Osaka University’s main campus.', zh: '大阪大学主校区所在地。' } },
      { factor: 'history', weight: 2, note: { en: 'Birthplace of Japan’s high-school baseball tournament.', zh: '日本高中棒球大会的发祥地。' } },
    ],
    knownFor: { en: 'A tidy Osaka suburb whose airport and university outshine the city itself.', zh: '一座规整的大阪郊区,机场和大学的名气都盖过了城市本身。' },
  },
  {
    rank: 11, name: { en: 'Kōriyama', zh: '郡山市' }, region: { en: 'Fukushima', zh: '福岛县' },
    huji: 32, changzhu: 32, popScore: 24, famePenalty: 8, cici: 16,
    halo: [
      { factor: 'other', weight: 4, note: { en: 'A commercial hub; a proud choral-music town ("the Vienna of Tohoku").', zh: '商业枢纽、以合唱闻名的城市(「东北的维也纳」)。' } },
      { factor: 'history', weight: 2, note: { en: 'The Meiji-era Asaka Canal reclamation.', zh: '明治年间的安积疏水开拓。' } },
      { factor: 'cuisine', weight: 2, note: { en: 'Koriyama-area rice.', zh: '郡山一带的稻米。' } },
    ],
    knownFor: { en: 'Fukushima’s commercial engine — busier than it is famous.', zh: '福岛的商业引擎 —— 忙碌程度远超它的名气。' },
  },
  {
    rank: 12, name: { en: 'Kasugai', zh: '春日井市' }, region: { en: 'Aichi', zh: '爱知县' },
    huji: 31, changzhu: 31, popScore: 23, famePenalty: 9, cici: 14,
    halo: [
      { factor: 'cuisine', weight: 4, note: { en: 'Japan’s cactus-cultivation capital — a genuinely odd claim to fame.', zh: '日本仙人掌栽培之都 —— 一个货真价实的冷门名号。' } },
      { factor: 'other', weight: 3, note: { en: 'A Nagoya bedroom city; paper and spoon industries.', zh: '名古屋的睡城、造纸与勺子产业。' } },
      { factor: 'history', weight: 2, note: { en: 'Tied to calligrapher-monk lore ("the three eccentrics of Kasugai").', zh: '与书道传说有关(「春日井三奇人」)。' } },
    ],
    knownFor: { en: 'A Nagoya suburb whose most distinctive export is… cactuses.', zh: '一座名古屋郊区,最有辨识度的特产是…仙人掌。' },
  },
];

/** A "run" of the method over one country — selectable on the page. */
export interface Dataset {
  key: string;
  flag: string;
  country: LocalizedText;
  blurb: LocalizedText;      // one line framing this run
  regLabel: LocalizedText;   // long label for the primary population figure
  residentLabel: LocalizedText; // long label for the secondary figure
  regTag: LocalizedText;     // short inline tag on each row
  showResident: boolean;     // Japan has ~one number; China has two distinct ones
  cities: City[];
}

export const CICI_DATASETS: Dataset[] = [
  {
    key: 'cn', flag: '🇨🇳', country: { en: 'China', zh: '中国' },
    blurb: {
      en: 'Prefecture-level cities, scored on registered household population minus every source of fame.',
      zh: '地级市,按户籍人口减去一切名气来源打分。',
    },
    regLabel: { en: 'household', zh: '户籍' }, residentLabel: { en: 'resident', zh: '常住' },
    regTag: { en: 'reg.', zh: '户籍' }, showResident: true, cities: CICI_CITIES,
  },
  {
    key: 'jp', flag: '🇯🇵', country: { en: 'Japan', zh: '日本' },
    blurb: {
      en: 'Municipalities, scored the same way. Japanese cities cluster in size, so fame — not population — decides it.',
      zh: '市町村,用同样的方式打分。日本城市体量接近,所以决定名次的是名气,而非人口。',
    },
    regLabel: { en: 'registered', zh: '住民登记' }, residentLabel: { en: 'census', zh: '国势调查' },
    regTag: { en: 'pop.', zh: '人口' }, showResident: false, cities: CICI_CITIES_JP,
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
