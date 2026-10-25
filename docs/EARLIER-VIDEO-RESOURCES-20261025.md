# 更早视频与项目资料核验（2026-10-25）

用户授权：补充更早视频的 GitHub 项目与说明，两站同步；HeyDalei 保持阶段测试。主页原工作目录未编辑。production 从最新远端 main 30bf11161a9f4306b6f05d67a8403474f3cbeef6 干净克隆；阶段站从 92b383015958151f8234af5b51b5f36f15b06f3d 干净基线继续。

## 内容

- 本批公开读取 29 期元数据（当前电视由同步脚本核验，其余 28 期逐条 yt-dlp --skip-download）。核对频道 ID、public 状态、发布时间和时长，排除 Shorts 与会员条目；Life Quest 另查为 1920x1080 长视频。
- 当前最新 6 期之外提供 23 期可展开资料：10 期有公开项目入口（9 期实操源码 + Microduck 为节目提到的项目），13 期未核验到本期公开源码。可筛选、逐批显示；默认折叠，不预加载全部列表与视频。
- 9 期新增项目对应 Life Quest、AI Passport 2026、OpenSpec、Open Lovable、Kestra、Spec Kit、DeerFlow、Codebuff、Bytebot。README 与关系已核对，明确当前源码和录制示例的版本差异，没有重新运行这些工具或刷写硬件。
- Codebuff 原链接跳转 Freebuff；DeerFlow 2025 教程指向官方 main-1.x 分支；Life Quest 当前独立公开源码快照与历史真机证据分开；公开工牌 100 题源码与历史 18 题照片分开。
- 功夫机器人节目只有 05:15 起 Microduck 对应所列项目，不声称全片机器人表演开源。DeepCode 原视频本次无法公开读取，原档案保留并加核验提示，不列入网站资料推荐。
- 生产 main 已公开五课材料，分别链接实际 lesson-01..05 目录；材料包含虚构输入、说明与搭建步骤，不是可直接导入的 Flow/Agent 解决方案。GitHub 节目笔记相应更新。
- dalei-youtube 新增 VIDEO-PROJECTS.md 精选资料目录，README 增加入口，人工笔记保留。同步脚本及 20 个单测通过，latest.json 无变化，最新仍为安卓电视 1K3fVbbBeQg，3:53。主页备用快照不为本次刷新。

## 验证

- 两站完整生产构建、TypeScript、feed、电视说明、新档案 29 期映射/过滤/来源区分测试、实际 Home SSR 6 对独立链接测试通过。production 五课测试 5 项通过；stage 全部 npm test 与 49 子路由/165 本地 HTTP 检查、stage dry-run 通过。
- 两站 320/390/430 浏览器宽度，简体/繁体/英文均测试完整 23 条、筛选与显示更多；无页面横向溢出、无嵌套链接，资料链接/展开控件/筛选高度至少 44px。主题和键盘焦点通过。
- production 阻断 raw feed 后保留明确备用提示，档案仍可展开与筛选；恢复网络后回到当前节目。网络阻断已取消。仅浏览器检查，不声称真机、读屏器或完整 WCAG 验收。
- GitHub 公开链接匿名检查另行回读。所有改动汇总后只向各自 main 推送一次。production 依现有 Git 集成构建，不追加 Vercel CLI 生产部署；Cloudflare 仅部署现有阶段 Worker 一次。不修改账户、域名、收费或历史部署设置。
- 发布就绪与域名内容回读，完成后记录到本地 output 报告，不为报告追加部署。

