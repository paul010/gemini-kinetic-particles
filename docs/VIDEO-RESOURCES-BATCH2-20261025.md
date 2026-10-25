# 视频资料第二批核验（2026-10-25）

- 本批在上批 29 期之外核对 20 期较早节目，均公开、同一频道、非直播且时长超过 3 分钟。16 期对应上游源码、3 期只提供参考 SDK/示例/框架，CodeRabbit CLI 一期未核验到产品公开源码。
- 同步发现新公开节目 VCFSe0UCi5M《微软 Skill Recorder：录一遍，AI就会了吗？》，10:05。补核微软官方仓库及完整简介，区分上游工具、作者演示与原片本机 CSV 结果，不声称本轮重跑。
- 累计核对 50 期；当前六期之外 44 期可浏览，其中 30 期有项目/材料/参考入口，14 期尚未核验到本期源码。未把参考 SDK、模型权重、托管平台源码混为一谈。
- 重点修正旧地址与范围：Claude Flow -> 社区 Ruflo（非 Anthropic 官方）；NeMo -> NVIDIA-NeMo/Speech；Gemma Cookbook -> 新库的 EmbeddingGemma 示例。原简介的 anthropics/claude-flow-docs 明确是占位符，不用作来源。Gemini CLI 当前 README 提示迁移与模型差异；旧标题中的免费、2000 次和效率倍数不作为当前承诺。
- 逐条使用公开 metadata 与完整简介，GitHub 原仓库 README/官方示例核验；没有下载视频、读取 cookie、安装工具、下载权重、执行平台任务或录屏。公开链接匿名 HTTP 核验另存 output。
- dalei-youtube 的 resources/review-progress.json 记录 396 个历史归档：已核对 50 期、此前 1 期无法公开读取，345 期尚未核对。未核对条目不加入两站推荐。批次 02 清单保留本批状态、来源与功能范围，便于下一批跳过重复项；原人工笔记保留。
- 首页最新六期仍动态读取 latest.json；仅推送真实节目索引，不为快照刷新单独提交/部署。本站 data/video-snapshot.json 未改变。两站延续现有目录、主题、语言、触屏与减少动态效果行为；HeyDalei 仍 noindex。
- 两站 feed、源码/参考区分、50 条记录唯一性/倒序/过滤、实际 Home 6 对非嵌套链接、TypeScript 和全站生产构建通过。stage 全部前端测试、49 子路由/165 本地 HTTP 检查、dry-run 通过；production 原五课 5 项测试通过。节目同步脚本与 20 个 Python 单测通过，新增节目页仅 1。
- 代码推送前完成本地浏览器检查；只汇总推送各站 main 一次，production 等待已有 Git 部署，不重复 CLI 发布，Cloudflare 只更新既有阶段 Worker 一次。发布后检查精确提交、就绪状态、域名实际内容与阶段站 noindex。发布回读记录在 ignored output，不为报告重复部署。

