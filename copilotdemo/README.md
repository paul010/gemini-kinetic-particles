# CN Print Copilot 随课实践页 V6 Spec

## 定位

`/copilot-demo` 是《让 Copilot 真正上岗》两小时线上分享的学员实践页，与 44 页 PPT 和三段讲师 Demo 配合使用。

页面只从学员角色出发：

- **跟练模式**：有对应账号与权限，下载虚构材料并复制提示词。
- **观察模式**：暂时没有入口，仍可以阅读输入、前后变化、来源、停止点和失败兜底。

两条路径都算完成课程。讲师不等待 100+ 人同步登录或上传。

## 单一内容源

页面、六个公开下载入口、提示词全集和 PDF 使用同一份数据：

`copilotdemo/course-data-v4.json`

生成命令（脚本名保持兼容，实际产出为 V6）：

```bash
/Users/panlei/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 scripts/render-copilot-learner-kit-v4.py
```

该命令生成：

- `public/copilot-demo/v6/` 的逐文件材料。
- 三段独立精简 ZIP 和一个完整精简 ZIP。
- 提示词全集和 8 页 PDF 学员速查卡。
- V6 Manifest 与 SHA-256 校验和。

## 三段主线

1. **Demo 1｜任务说清**：PPT 09，Copilot Chat。
2. **Demo 2｜事实查准**：PPT 16，Microsoft 365 Copilot。
3. **Demo 3｜方法复用**：PPT 28，Microsoft 365 Copilot Agent Builder。

所有 Demo 使用 Project Lighthouse 课程虚构案例。

### Demo 3 四区创建契约

Demo 3 的页面、提示词、`00-RUN-DEMO.txt` 和 PPT 37–42 统一按以下顺序：

1. **概述**：设置名称、创建描述和服务范围。
2. **源**：添加四份课程批准文件，核对版本和当前账号权限。
3. **行为**：写清来源、状态标签、停止条件和人工升级角色；第一版不配动作。
4. **代理预览**：测试已知、未知、冲突和越界四类问题。

Instructions 要求“优先依据当前已连接且用户有权访问的批准资料”，同时明确资料未覆盖、版本冲突、未批准或越界时的停止与升级路径，避免绝对化的来源限定。

### 数据口径

- Demo 1 第一轮固定为：`帮我写一个项目更新。`
- 8/16 是旧计划。
- 8/18 是内部试运行目标，不是外部发布日期。
- 外部推广日期未确认。
- 保修期 12 个月与 24 个月存在冲突。
- China Social 在批准前保持 Draft。
- 未知日期找 Jia，保修冲突找 Alex，繁中截图找 Min。
- `China Social`、`Taiwan Team`、`Cheetah` 是三个不同团队。

## Agent Builder 到 Copilot Studio

- Agent Builder 用于快速完成知识型 Agent 第一版。
- 当需要连接器、动作、多步流程或更完整的发布治理时，再复制到 Copilot Studio 继续完善。
- **复制到 Studio 是当时配置的快照，不是与 Agent Builder 持续同步。**
- 进入 Studio 后必须重新核对并配置知识、身份、连接器、动作、DLP、权限、测试与发布范围。

## 页面契约

- 标题与 PPT 一致：`让 Copilot 真正上岗`。
- 首屏先选择跟练或观察模式，并显示虚构数据、隐私与公司策略提醒。
- 每个 Demo 显示 PPT 页码、时间、产品、权限前提、全部提示词、输入文件、观察路径和失败兜底。
- 新能力卡只讲 Agent Builder 四区创建、复制到 Copilot Studio 的快照边界、Studio 的动作与治理。
- 单段 ZIP 和固定锚点保持可用。

## 六个公开下载入口

- 完整精简包：`/copilot-demo/CN-Print-Copilot-Demo-Kit-v6-Simple.zip`
- Demo 1：`/copilot-demo/CN-Print-Copilot-Demo1-v6-Simple.zip`
- Demo 2：`/copilot-demo/CN-Print-Copilot-Demo2-v6-Simple.zip`
- Demo 3：`/copilot-demo/CN-Print-Copilot-Demo3-Agent-Builder-v6-Simple.zip`
- PDF：`/copilot-demo/CN-Print-Copilot-学员速查与行动卡-v6.pdf`
- 提示词：`/copilot-demo/CN-Print-Copilot-All-Prompts-v6.txt`

## 下载包最小结构

完整 ZIP 只保留：

```text
00-START-HERE.html
01-ALL-PROMPTS.txt
Demo-1-Copilot-Chat/
  00-RUN-DEMO.txt
  01-项目背景.txt
Demo-2-M365-Copilot/
  00-RUN-DEMO.txt
  01-项目邮件线程.docx
  02-项目会议纪要.docx
  03-Teams聊天记录.txt
  04-项目状态表.xlsx
Demo-3-Agent-Builder/
  00-RUN-DEMO.txt
  01-项目概述-批准版.docx
  02-角色与升级路径-批准版.docx
  03-协作流程-批准版.docx
  04-常见问题-批准版.docx
```

观察卡、行动卡、Leader 卡、能力状态卡、Manifest 和校验文件不进入学员 ZIP。

## 验收

- JSON 可解析，且只保留当前三段 Demo 与 Agent 创建、升级内容。
- `npm run build` 成功，`dist/copilot-demo/index.html` 存在。
- 六个公开下载入口都对应 V6 实体文件。
- 四个 ZIP 通过 `unzip -t`，完整 ZIP 中没有冗余 PDF、Manifest、校验文件或备课卡。
- Demo 3 准确包含 `04-常见问题-批准版.docx`。
- `shasum -a 256 -c public/copilot-demo/SHA256SUMS-v6.txt` 通过。
- PDF 共 8 页，`pdftoppm` 渲染后无裁切、重叠或中文缺字。
