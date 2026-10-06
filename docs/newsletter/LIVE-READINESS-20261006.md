# 真实订阅接入进展 · 2026-10-06

用户已要求推进到上线级别，并明确使用 ChatGPT Chrome，不再使用旧 bb-browser。语言修复与真实订阅分别按实际证据验收，不能以 demo 通过替代真实确认。

## 已确认与当前阻塞

- 现有站点继续在 dailycosmos.net / Vercel；不迁站，不改现有 MX。
- 既有相关记录明确 Kit 官方已批准账号发送。审批不再作为阻塞；本轮尚不能读取当前后台作第二次确认。
- 当前执行会话的可调用工具没有 ChatGPT Chrome 控制入口。Kit 后台需在有此入口的同一 Mac 会话接续；不索取密码、Cookie 或 API key，也不重新安装旧浏览器插件。
- 旧 bb-browser 本地 npm 包、专属技能及后台进程已按用户要求移除。只读核查 Chrome 的 38 个扩展 manifest，没有发现名称或描述含 bb-browser／bb browser 的扩展；尚未通过浏览器扩展管理页核实，不能把本地包卸载称为浏览器扩展已删除。
- 当前公开页保持 demo，真实名单收集尚未启用。没有创建或猜测 Kit Form ID、公开提交 endpoint、确认 token。

## 可直接实施的最小接入

1. 在已登录 Kit 的 Grow → Landing Pages & Forms 只读检查现有资产，复用优先；取得实际 Form ID、名称、Share URL 与官方嵌入代码。使用 Inline Form；Landing Page 不能当 Form 嵌入。
2. 仅邮箱必填。订阅用途为每日免费的中文 AI 实战信，含适当相关公开视频推荐；English／简体／繁体为网页阅读语言，不承诺三个邮件版本。
3. Confirmation Email 中开启 Send confirmation email、关闭 Auto-confirm new subscribers。确认后跳转到已发布的 `https://dailycosmos.net/newsletter/first-ai-card`。公开资源页访问不作为邮箱确认凭据。
4. 确认邮件使用真实平台按钮和确认链接。保留平台实际退订与地址页脚；核实发件身份、回复渠道和当前联系披露。必要的私密信息只留在平台，不写入仓库。
5. 将实际官方 Form 嵌入与 demo 分离。真实入口配置和平台设置验收后才启用；未配置或服务不可用时提供清楚的恢复说明，不显示假订阅成功。
6. 仅使用此前批准的本人测试邮箱做完整确认和退订测试。先检查迟到邮件及同一稿的尝试账本；未确认结果不自动重试，不导入名单或测试他人邮箱。

## 真实验收记录必须包含

| 场景 | 必须观测的实际结果 | 本轮当前状态 |
|---|---|---|
| 无效地址与重复点击 | 客户端及平台反馈可理解，无多次意外请求 | 真实 Form 未接入 |
| 首次提交 | Kit 为唯一记录源；先为未确认状态 | 未验证 |
| 确认邮件 | 本人邮箱实际收到；正文、按钮、退订及地址完整 | 未验证 |
| 点击确认 | Kit 变为 confirmed，跳转原始资源页 | 未验证 |
| 重复提交 | 通用反馈，不公开邮箱是否已在名单 | 未验证 |
| 未确认订阅 | 不列入每日营销发送人群 | 未验证 |
| 退订 | 平台更新状态，不再营销发送 | 未验证 |
| 退订再订阅 | 按实际 Kit 行为重新取得同意；不前端篡改名单 | 未验证 |
| 故障／取消／刷新 | 不把未知结果显示为成功，恢复方式明确 | 真实流程未验证 |
| 三语言／手机／键盘 | 入口、状态、隐私与频率说明一致且可访问 | 本地 10 项语言检查通过，36 个布局状态无溢出，6 个新增页面可访问性状态无违规；真实 Form 尚未验证 |

Kit 确认邮件对同一订阅者通常每 12 小时最多发送一次；重复测试先查询实际状态，不能把未再次收信直接判为故障。必要时使用本人邮箱的受控 alias，不在公开报告保存地址。

## 每日内容与发送

7 封原始草稿仍须作者审核，之后逐封排期。具体北京时间发送钟点和 actual confirmed 人群需确定。接通订阅入口不等于已审核邮件或已启用群发；不购买 RSS／序列／高级自动化，不用无人审核内容冒充每日干货。

## 官方依据

- [Form embedding basics](https://help.kit.com/en/articles/4009572-form-embedding-basics)
- [The Confirmation Email](https://help.kit.com/en/articles/2502655-the-confirmation-email)
- [Unconfirmed subscribers](https://help.kit.com/en/articles/4008773-why-do-i-have-unconfirmed-subscribers)
- [Confirmation email troubleshooting](https://help.kit.com/en/articles/4327425-troubleshooting-confirmation-email-not-sending)

本轮读取日期：2026-10-06。具体公开 Form 配置以上线账户提供的真实代码为准。
