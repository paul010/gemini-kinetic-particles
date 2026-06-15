# 每日项目任务 Playbook

把 AI Coding Arsenal 里的项目，**每次推进一个**，逐个变成首页上的开源项目。
没有自动调度 —— 你想推进时，开一个 Claude Code 会话，粘贴下面的「开工指令」即可。
每次产出一个 **Draft PR**，由你 review 后合并上线。

## 运行机制

- 队列在 [`arsenal/roadmap.json`](./roadmap.json)，按 `order` 排序。
- 每次取第一个 `status: "pending"` 的条目来做。
- 看下一个该做谁：`npm run arsenal:next`
- 一次只做一个项目，做完开 Draft PR，把该条目改成 `in_review`。
- PR 合并后，把该条目改成 `featured`。

## 每个 `plan` 是什么

- `feature-on-home`：复现/定制后，作为新卡片加到首页 `data/site.ts` 的 `PROJECTS`。
- `lightweight-repro`：在仓库里做一个轻量可运行版本（可挂到 `/arsenal` 之外的新路由或独立页）。
- `deploy-and-brand`：基于官方模板部署成「大雷」品牌版，首页给出 live 链接。
- `demo-script`：暂不写代码，产出开工方案 + Demo 镜头 + 内容角度，供录视频用，并更新复现状态。

## 开工指令（粘贴给 Claude Code）

```
读取 arsenal/roadmap.json，取第一个 status=pending 的条目（用 npm run arsenal:next 也行）。
对应的项目数据在 arsenal/data/projects.json，内容角度在 arsenal/data/content_outputs.json。

按该条目的 plan 推进这一个项目：
1. 先做项目体检（阅读 README/依赖，判断可行性与卡点）。
2. 按 plan 执行：
   - feature-on-home / lightweight-repro / deploy-and-brand：做出最小可运行成果，
     并把它作为新项目加到 data/site.ts 的 PROJECTS（带 live 或内部链接）。
   - demo-script：产出开工方案 + Demo 镜头 + 中英标题，更新该项目 status。
3. 更新 arsenal/data/projects.json 里该项目的 status（复现状态）。
4. 把 roadmap.json 里该条目改为 in_review。
5. npm run build 与 tsc 必须通过。
6. 开一个 Draft PR，说明做了什么、卡在哪、下一步。

护栏：
- 诚实标注复现状态，未跑通就不要说已跑通。
- 尊重外部项目许可证；需要 API Key / Docker / GPU 时如实说明，不硬跑。
- 不承诺零基础暴富；LinkedIn 文案用英文。
- 改动控制在这一个项目范围内，方便 review。
```

## 验收（每个 PR）

- `npm run build` ✅、`npx tsc --noEmit` ✅
- 复现状态如实更新；roadmap 条目状态已更新
- 若加到首页：卡片链接可用、桌面/移动正常
- 外链新窗口打开
