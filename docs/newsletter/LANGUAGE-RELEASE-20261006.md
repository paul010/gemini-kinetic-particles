# 网页三语言修复 · 2026-10-06

首页 AI 实战信区域、订阅演示页和原创实战卡接入主站既有 EN／简／繁语言选择。原有默认英文不变；读者切换后，文案、标题、表单反馈、可访问标签、样例阅读译稿、提示词和复制内容同步更新。跨页、返回、刷新与跨标签保持选择，存储不可用时保留本标签内的选择。

实际每日邮件仍是中文。三个入口均清楚说明英文示例是阅读译稿；原始中文邮件及第一课保留 314／350 中文字。没有创建真实 Kit 表单，首页订阅按钮保持禁用，演示流程不发送请求、不持久化地址、不接受真实邮箱。

## 验证结果

| 验证 | 结果 |
|---|---|
| Vite production build | 通过；保留原有大 chunk 提示 |
| Newsletter + Home 定向 TypeScript | 通过 |
| 全工程 TypeScript | 失败：已有 `farmer/FarmerRiver.tsx:370` TS2339，无新增错误 |
| lint | 工程未配置 lint script |
| 三语言浏览器检查 | 10/10 记录通过 |
| 原首页／订阅演示／实战卡回归 | 7/7、14/14、9/9 记录通过 |
| 布局 | 三页 × 三语言 × 320/390/768/1440 宽，共 36 状态无横向溢出 |
| 新增页面 axe | 六个语言状态无自动检测违规；需人工判定项保留在报告 |
| Letter SSR／原有 Life Quest／视频源测试 | 通过 |
| 生产只读脚本本地预检 | 7/7 通过；同源 GET/HEAD，屏蔽外部请求，没有表单提交 |
| 真实订阅、收到确认邮件、退订 | 未运行：指定 ChatGPT Chrome 控制工具当前不可调用 |

上线后运行 `scripts/verify-newsletter-production.mjs` 记录真实 HTTPS 三语、刷新、原路由与资源检查。发布提交、部署 ID、线上结果和截图保存在本地交付目录，不以本地结果代替真实服务验收。

## 实施和复现

- `newsletter/site-language.ts` 复用 `dalei-lang-v2`，同标签事件与跨标签 storage 同步，繁体转换继续使用项目既有 OpenCC。
- `newsletter/translations.ts` 保存英文阅读译稿，原始中文内容模块不变。未引入依赖、数据库或后台。
- `scripts/verify-newsletter-language.mjs` 覆盖语言、复制、演示反馈、存储、键盘、布局与无收集检查。
- 旧中文内容断言明确选择中文；生产脚本另用无预设语言的独立 context 检查默认英文及三语同步。

`npm run build`、`node scripts/test-newsletter-letter.mjs`、`node scripts/test-life-quest.mjs` 和 `node scripts/test-video-feed.mjs` 可复跑。浏览器脚本通过 `NEWSLETTER_BASE_URL` 指定本地预览，并通过 `NEWSLETTER_PLAYWRIGHT_MODULE`、`NEWSLETTER_AXE_PATH` 指定隔离测试工具位置；不使用用户浏览器配置。
