# 大雷 AI 评测台 · 规范 (Da Lei AI Benchmark)

固定题目 + 统一规范,横向对照各家模型的真实输出。录视频时打开 `/bench` 即可逐题展示。

## 录入流程(录完视频后)

1. 模型在题目下的 Prompt（一字不改）跑一次,拿到结果。
2. 打开 `bench/data/bench.ts`,找到对应 `TESTS` 里的题目。
3. 把该模型那条 `result` 从 `{ kind: 'pending' }` 改成真实结果之一:

   - **SVG**:`{ modelId:'claude', date:'2026-06-28', kind:'svg', svg:'<svg …>…</svg>', verdict:'win' }`
   - **网页/落地页 HTML**:`{ modelId:'gemini', kind:'html', html:'<!doctype html>…' }`
   - **截图**:把图片放进 `public/bench/`,`{ modelId:'gpt', kind:'image', image:'/bench/xxx.png' }`
   - **外链**:`{ modelId:'grok', kind:'link', url:'https://…' }`

   可选:`note`(一句点评)、`verdict`('win' 最佳 / 'ok' 可用 / 'fail' 翻车)。

## 加新题目

往 `TESTS` 追加一个对象:`id / title / category / prompt / whatItTests / results`。
`category`: `svg | landing | webpage | design | logic`。

## 规范要点(保持横评公平 + 个人风格)

- 同一题对所有模型用**完全相同**的 Prompt,只输出要求的产物。
- 标注日期与模型版本(写进 `date` 或 `note`),因为模型会迭代。
- `大雷基准 (dalei-ref)` 是我手写的参考答案 / 审美锚点,不计入模型对比,只作基线。
- 经典硬核题(如鹈鹕骑自行车 SVG)长期保留,形成可追踪的时间线。
