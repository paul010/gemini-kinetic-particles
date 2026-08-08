# CN Print Copilot 随课实践页 V4 Spec

## 定位

`/copilot-demo` 是《让 Copilot 真正上岗》两小时线上分享的学员实践页，与 42 页 PPT 和三段讲师 Demo 配合使用。

页面只从学员角色出发。学员从会议聊天区打开后，可以选择：

- **跟练模式**：有对应账号与权限，下载虚构材料并复制全部提示词。
- **观察模式**：暂时没有入口，阅读输入、前后变化、参考结构、停止点和失败兜底。

两条路径都算完成课程。讲师不等待 100+ 人同步登录或上传。

## 单一内容源

页面、下载包、提示词全集和 PDF 课件使用：

`copilotdemo/course-data-v4.json`

生成命令：

```bash
/Users/panlei/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 scripts/render-copilot-learner-kit-v4.py
```

该命令生成：

- `public/copilot-demo/v4/` 的逐文件材料。
- 三段独立 ZIP。
- Learner Kit V4 完整 ZIP。
- 提示词全集。
- `output/pdf/CN-Print-Copilot-学员速查与行动卡-v4.pdf`。
- Manifest 与 SHA-256 校验和。

## 三段主线

1. **Demo 1｜任务说清**：PPT 09，Copilot Chat。
2. **Demo 2｜事实查准**：PPT 15-17，Microsoft 365 Copilot。
3. **Demo 3｜方法复用**：PPT 24-26，SharePoint Agent。

所有 Demo 使用 Project Lighthouse 课程虚构案例。

### 数据口径

- Demo 1 第一轮固定为：`帮我写一个项目更新。`
- 8/16 是旧计划。
- 8/18 是内部试运行目标，不是外部发布日期。
- 外部推广日期未确认。
- 保修期 12 个月与 24 个月存在冲突。
- China Social 在批准前保持 Draft。
- 未知日期找 Jia，保修冲突找 Alex，繁中截图找 Min。
- `China Social`、`Taiwan Team`、`Cheetah` 是三个不同团队。

## 页面契约

### 首屏

- 标题与 PPT 完全一致：`让 Copilot 真正上岗`。
- 先选择跟练或观察模式。
- 在第一次上传动作前显示虚构数据、隐私与公司策略提醒。
- 提醒手机更适合观察，电脑更适合上传和创建 Agent。

### 每个 Demo

- 显示 PPT 页码、建议时间、产品、权限前提和状态。
- 输入文件逐个打开或下载。
- 全部提示词在一级页面逐条展示，每条独立复制。
- 复制成功只在真实写入或 fallback 成功后显示。
- 显示有权限路径、无权限观察路径和参考变化。
- 提供 4-5 项本地自检；只保存在浏览器，不上传。
- 提供看不到入口、无法多文件上传、引用不可点、知识未索引等兜底。
- 单段 ZIP 和固定锚点保持可用。

### 新能力状态

- Vision：官方已文档化，商业租户开放状态需课前实测；不操作屏幕。
- Excel `.Rules`：官方功能，当前英文完整支持；不是强制校验。
- Skill Recorder：微软开源 source release，非租户默认产品；Analyze 后材料会发送到 GitHub 云端。

## 下载契约

- 完整包：`/public/copilot-demo/CN-Print-Copilot-Learner-Kit-v4-20260811.zip`
- Demo 1：`/public/copilot-demo/CN-Print-Copilot-Demo1-Learner-Kit-v4.zip`
- Demo 2：`/public/copilot-demo/CN-Print-Copilot-Demo2-Learner-Kit-v4.zip`
- Demo 3：`/public/copilot-demo/CN-Print-Copilot-Demo3-Learner-Kit-v4.zip`
- PDF：`/public/copilot-demo/CN-Print-Copilot-学员速查与行动卡-v4.pdf`
- 提示词：`/public/copilot-demo/CN-Print-Copilot-提示词全集-v4.txt`

ZIP 内主文件名统一使用 ASCII，正文使用简体中文，降低 Windows 解压乱码风险。

## 公开页面不应出现

- Go / Pilot / No-Go、Ready score 或生产验收语言。
- 要求 100+ 人必须同步操作。
- 讲师备课动作、聊天区话术或私有故障清单。
- 真实内部数据、客户数据、租户信息或产品密钥。
- 把 Preview、静态参考输出或讲师演示说成生产可用。

## 验收

- `npm run build` 成功。
- `dist/copilot-demo/index.html` 存在，包含独立 title、canonical 和 OG metadata。
- 360x800、390x844、768x1024、1440x900 无横向滚动。
- 三个锚点不被固定导航遮挡。
- 13 条提示词按钮均可复制完全一致的文本。
- 自检状态写入本地存储且可重置。
- 四个 ZIP 通过 `unzip -t`。
- `shasum -a 256 -c public/copilot-demo/SHA256SUMS-v4.txt` 通过。
- PDF 共 8 页，`pdftoppm` 渲染后无裁切、重叠或中文缺字。
- 浏览器 console 无 error 或 warning。
