# 真实 Kit 表单集成 · 2026-10-06

用户已明确允许发布免费订阅表单、开启确认并接入首页，以及用本人邮箱完成订阅、资源领取、一封本人测试邮件和退订。不重复请求同一许可；付费、DNS/MX、名单导入和向其他人群群发不在此范围。

## 已核实的公开配置

- Kit 负责人通过受支持的 ChatGPT Chrome 配置并发布唯一 Inline Form：ID `10008210`，UID `552003a794`。
- 官方 JS：`https://dalei-team.kit.com/552003a794/index.js`；备用 Share：`https://dalei-team.kit.com/552003a794`。
- 负责人报告 Send confirmation 开启、Auto-confirm 关闭；确认后跳转 `https://dailycosmos.net/newsletter/first-ai-card`。
- 保留 dailycosmos.net／Vercel，无 DNS/MX 修改。公开发信／联系地址为 `support@dailycosmos.net`。
- 开发任务独立只读获取官方脚本及 Share 页面，HTTP 200；核实实际 action 为 `https://app.kit.com/forms/10008210/subscriptions`，只有邮箱必填。
- 官方脚本引用 `https://f.convertkit.com/ckjs/ck.5.js`；隔离 Chrome 实际加载 SDK 返回 200。命令行 curl 对该 SDK 的连接失败不能代表浏览器结果。
- 当前官方 success_message 是“还差一步：请到邮箱点击确认按钮。确认后即可领取第一张 AI 实战卡。”。这是待确认提示，不是已订阅。

## 工程行为

首页和 `/newsletter` 挂载官方 JS，Kit 承担实际请求、名单、确认和退订；不复制名单，不创建本地收集 API。`/newsletter/demo` 单独保留安全演示，不触发真实表单。

界面、邮箱 label、按钮和已核实的 Kit 待确认文本跟随 EN／简／繁。实际确认邮件及每日内容仍为中文，页面明确说明；保留 Kit 平台品牌展示。

仅官方表单初始化后显示可操作输入。脚本/SDK 加载失败或超时提供 Share 链接及手动重新加载。有效提交的 capture guard 阻止 SDK await 前的重复提交；不提前禁用邮箱而造成官方 FormData 丢失。20 秒仍未知时提示先查邮箱，不自动重试或声称失败/成功。平台错误不回显地址或名单状态；页面离开时清空输入。

官方 SDK 会记录表单访问并维护不含输入邮箱的匿名浏览器状态。网站隐私说明明确 Kit 处理访问、发送、确认和退订；本地代码不记录邮箱、SDK 事件 detail、请求体或订阅者 token。平台必要联系信息不复制到代码。公开支持邮箱可用于联系订阅与资料处理。

Vercel 响应及工程没有限制嵌入的 CSP，脚本和 action 均为 HTTPS；不改主站全局响应头。公开标识集中于 `newsletter/kit-config.ts`；不硬拷贝动态官方 SDK 到仓库。

## 真实验收与模拟测试的区分

本地测试用真实官方脚本与 SDK 字节，但拦截所有服务写请求，仅输入保留域测试地址；模拟响应不能证明真实收到确认或退订。生产验收只读。本人订阅、确认邮件、点击确认及退订由父线程协调的 Kit Chrome 任务执行，不并行操作后台或重复发信。

2026-10-06 父线程回报：Kit 完整确认 → 资源领取 → 仅本人测试 → 退订 → 排除名单已通过，测试地址目前已退订。本工程不重新订阅或代发。该回报是平台负责人实测证据，不是本地 mock 的推断。另有一次内容测试为空正文，父线程已单独处理；确认模板存在中英混合文字。网站三语不代表平台邮件模板已三语化，正式内容发送仍需独立验收。

| 场景 | 工程验证 | 真实平台验证 |
|---|---|---|
| 实际 UID/action、脚本与 CSP | 来源已核；14 项实际 SDK / 模拟故障与提交检查通过 | 生产发布后只读加载再核 |
| 格式、重复点击、网络错误、未知结果 | 拦截 SDK 请求验证，不产生真实订阅 | Kit 负责人使用获准本人邮箱 |
| 待确认提示和三语 | 实际 SDK 响应驱动提示，严格译稿；不判断 confirmed | 状态仅以 Kit 为准 |
| 确认邮件、点击、redirect、退订 | 不作本地伪验证 | 父线程报告闭环通过；测试地址已退订并排除名单 |
| 未确认/重复/退订再订阅 | 通用反馈、无本地强制恢复 | Kit 实际行为需确认 |

具体本地/线上测试、发布提交及部署 ID 见本地交付报告，不以页面截图替代邮箱验证。

## 每日内容

7 封草稿须作者实际审核，再逐封排期；发送钟点和 confirmed 人群待确定。订阅入口上线不等于启用每日群发；不提供免费计划不存在的序列，不购买 RSS，不导入名单或向其他人发测试。

浏览器禁用存储时，官方 SDK 无法正常初始化；挂载前检测并降级到 Kit Share 链接。窄屏将表单提前到标题之后，介绍与作者信息继续显示；官方模板带来的默认 padding 和响应式样式由局部高优先级选择器覆盖，保留平台品牌与可访问提示。

## 官方资料

- [Form embedding basics](https://help.kit.com/en/articles/4009572-form-embedding-basics)
- [The Confirmation Email](https://help.kit.com/en/articles/2502655-the-confirmation-email)
- [Confirmation email troubleshooting](https://help.kit.com/en/articles/4327425-troubleshooting-confirmation-email-not-sending)
- [Kit Privacy Policy](https://kit.com/privacy)

旧 bb-browser 本地包、技能及进程已卸载，不再使用或重装。前端验证使用无登录的独立测试浏览器，与 Kit 负责人浏览器分开。
