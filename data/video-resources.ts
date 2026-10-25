import archiveEpisodes from './video-archive.json';
import batchTwoResources from './video-resources-batch2.json';
import type {LocalizedText} from './site';

export const EPISODE_INDEX = 'https://github.com/paul010/dalei-youtube';
export const COPILOT_REFERENCE = 'https://github.com/microsoft/CopilotStudioSamples';
export const checkedOn = '2026-10-25';
export type EpisodeResource = {id:string;summary:LocalizedText;scope:LocalizedText;reference:boolean;project?:{name:string;url:string;kind:'source'|'materials'|'reference'}};
// Public episode descriptions checked on 2026-10-25. Reference samples are not episode source packages.
export const lessonResources: readonly EpisodeResource[] = [
  {
    "id": "0di83rTyEow",
    "summary": {
      "zh": "设备借用登记：收集需求、确认摘要、返回真实编号，并测试日期、缺项、取消与重试。",
      "en": "Register equipment requests: collect details, confirm the summary, return the record ID and test invalid dates, missing fields, cancellation and retries."
    },
    "scope": {
      "zh": "演示使用虚构培训需求和制作者账号。登记不等于库存预留或批准；第二账号、并发和正式运行额度仍需验收。",
      "en": "The demo uses fictional training requests and the creator’s account. Registration does not reserve stock or approve a loan; a second account, concurrency and production quotas still need testing."
    },
    "reference": true
  },
  {
    "id": "aHIMOJ8ZCMA",
    "summary": {
      "zh": "待办查询与邮件提醒：先核对到期规则，再用流程运行记录和实际收件检查结果。",
      "en": "Query due tasks and send reminders, checking the due-date rule against the flow run and the received email."
    },
    "scope": {
      "zh": "8 条虚构记录按 2026-10-23 北京时间回放。本人邮箱已做手动与定时收件核对，演示后提醒关闭；跨账号、读取失败、重试和防重复发送仍需测试。",
      "en": "Eight fictional records use a fixed Beijing-time replay date of 2026-10-23. Manual and scheduled messages were checked in the creator’s mailbox, then the reminder was disabled. Cross-account access, read failures, retries and duplicate prevention still need testing."
    },
    "reference": true
  },
  {
    "id": "T-KbmUbzCOM",
    "summary": {
      "zh": "办公申请登记：追问缺失日期、确认后写入 SharePoint 清单，再核对真实编号及同键重试。",
      "en": "Register office requests: clarify missing dates, confirm before writing to a SharePoint list, and verify the record ID and same-key retries."
    },
    "scope": {
      "zh": "使用虚构培训记录。演示登记与查重，不执行采购审批或通知；并发异常恢复、第二账号和正式多用户权限尚未验收。",
      "en": "Fictional training records demonstrate registration and duplicate checks. This lesson does not approve purchases or send notifications; concurrent recovery, a second account and production multi-user permissions remain unverified."
    },
    "reference": true
  },
  {
    "id": "JPLZ_PTLLxY",
    "summary": {
      "zh": "会议行动清单助理：区分明确决定、已确认行动和待确认问题，逐项核对负责人、日期与原文。",
      "en": "Build a meeting action-list agent that separates decisions, confirmed actions and open questions, then checks owners, dates and source text."
    },
    "scope": {
      "zh": "在 Microsoft 365 Copilot Agent Builder 中整理虚构会议文字。仅输出清单，不创建 Planner 任务或发送通知；缺少日期或负责人时保留待确认。",
      "en": "This Microsoft 365 Copilot Agent Builder lesson organizes fictional meeting text. It produces a list, without creating Planner tasks or sending notifications; missing dates and owners remain open questions."
    },
    "reference": false
  },
  {
    "id": "6_5213cvu3s",
    "summary": {
      "zh": "办公指南助理：配置用途与资料，测试常见问法、换一种问法及未知问题，再打开原文核对依据。",
      "en": "Build an office-guide agent: set its purpose and sources, test common questions, paraphrases and unknowns, then check the original document."
    },
    "scope": {
      "zh": "使用 Microsoft 365 Copilot Agent Builder 和 LAB-1 虚构办公指南，不代表真实公司制度。Agent 分享权限与资料访问权限需要分别验证。",
      "en": "This uses Microsoft 365 Copilot Agent Builder and a fictional LAB-1 office guide, not an actual company policy. Agent sharing and document access need separate checks."
    },
    "reference": false
  }
];
const commentaryResources: readonly EpisodeResource[] = [
  {
    "id": "jb9WKcArVKM",
    "summary": {
      "zh": "游戏、网页和 3D 演示能否继续使用、修改，并追到数字来源。",
      "en": "Check whether game, web and 3D demos remain usable and editable, with traceable figures."
    },
    "scope": {
      "zh": "GitHub 页保存本期标题、发布时间和频道简介。未核验到本期演示作品的公开配套源码；节目中的产品或模型不等于已开源项目。",
      "en": "The GitHub page records the title, publication date and channel excerpt. Public source for the demonstrated work has not been verified; a product or model mentioned in the episode is not necessarily open source."
    },
    "reference": false
  },
  {
    "id": "wzrxdi5dHV8",
    "summary": {
      "zh": "核对公开 Agent 案例交回的结果，以及仍需人检查的步骤。",
      "en": "Review what public agent cases actually deliver and which steps still need human checks."
    },
    "scope": {
      "zh": "GitHub 页保存本期标题、发布时间和频道简介。未核验到本期演示作品的公开配套源码；节目中的产品或模型不等于已开源项目。",
      "en": "The GitHub page records the title, publication date and channel excerpt. Public source for the demonstrated work has not been verified; a product or model mentioned in the episode is not necessarily open source."
    },
    "reference": false
  },
  {
    "id": "sAGY6P7EQmQ",
    "summary": {
      "zh": "沿公开演示检查建模、实体打印和修错过程。",
      "en": "Follow public demonstrations of 3D modeling, physical printing and error correction."
    },
    "scope": {
      "zh": "GitHub 页保存本期标题、发布时间和频道简介。未核验到本期演示作品的公开配套源码；节目中的产品或模型不等于已开源项目。",
      "en": "The GitHub page records the title, publication date and channel excerpt. Public source for the demonstrated work has not been verified; a product or model mentioned in the episode is not necessarily open source."
    },
    "reference": false
  },
  {
    "id": "iU3gxyCBZcw",
    "summary": {
      "zh": "发票与采购单不一致时，检查 Agent 的调查和人工交接边界。",
      "en": "Examine investigation and human handoff when an invoice and purchase order disagree."
    },
    "scope": {
      "zh": "GitHub 页保存本期标题、发布时间和频道简介。未核验到本期演示作品的公开配套源码；节目中的产品或模型不等于已开源项目。",
      "en": "The GitHub page records the title, publication date and channel excerpt. Public source for the demonstrated work has not been verified; a product or model mentioned in the episode is not necessarily open source."
    },
    "reference": false
  },
  {
    "id": "ONa77ZySrmA",
    "summary": {
      "zh": "从微软公开演示检查找照片、修图、保存与重新打开的过程。",
      "en": "Review finding, editing, saving and reopening photos in Microsoft’s public demos."
    },
    "scope": {
      "zh": "GitHub 页保存本期标题、发布时间和频道简介。未核验到本期演示作品的公开配套源码；节目中的产品或模型不等于已开源项目。",
      "en": "The GitHub page records the title, publication date and channel excerpt. Public source for the demonstrated work has not been verified; a product or model mentioned in the episode is not necessarily open source."
    },
    "reference": false
  },
  {
    "id": "3xb76uPejy0",
    "summary": {
      "zh": "从火车、直升机和方块场景演示检查 AI 作品的实际交互。",
      "en": "Examine interaction in AI-built train, helicopter and voxel-scene demos."
    },
    "scope": {
      "zh": "GitHub 页保存本期标题、发布时间和频道简介。未核验到本期演示作品的公开配套源码；节目中的产品或模型不等于已开源项目。",
      "en": "The GitHub page records the title, publication date and channel excerpt. Public source for the demonstrated work has not been verified; a product or model mentioned in the episode is not necessarily open source."
    },
    "reference": false
  },
  {
    "id": "1lxW8jx4jcw",
    "summary": {
      "zh": "沿官方预告检查作品生成之后能否继续修改和操作。",
      "en": "Examine whether generated work can be edited and operated beyond the official teaser."
    },
    "scope": {
      "zh": "GitHub 页保存本期标题、发布时间和频道简介。未核验到本期演示作品的公开配套源码；节目中的产品或模型不等于已开源项目。",
      "en": "The GitHub page records the title, publication date and channel excerpt. Public source for the demonstrated work has not been verified; a product or model mentioned in the episode is not necessarily open source."
    },
    "reference": false
  },
  {
    "id": "LjgabqH1yMM",
    "summary": {
      "zh": "检查 ChatGPT dots 如何根据新反馈继续改任务，以及人工再次触发的步骤。",
      "en": "Review how ChatGPT dots changes a task after feedback and where a person prompts it again."
    },
    "scope": {
      "zh": "GitHub 页保存本期标题、发布时间和频道简介。未核验到本期演示作品的公开配套源码；节目中的产品或模型不等于已开源项目。",
      "en": "The GitHub page records the title, publication date and channel excerpt. Public source for the demonstrated work has not been verified; a product or model mentioned in the episode is not necessarily open source."
    },
    "reference": false
  },
  {
    "id": "gyU5d4yuSQQ",
    "summary": {
      "zh": "沿微软公开演示检查 SharePoint HTML 页面创建、编辑、发布与迁移。",
      "en": "Review creating, editing, publishing and migrating SharePoint HTML pages in Microsoft’s public demo."
    },
    "scope": {
      "zh": "GitHub 页保存本期标题、发布时间和频道简介。未核验到本期演示作品的公开配套源码；节目中的产品或模型不等于已开源项目。",
      "en": "The GitHub page records the title, publication date and channel excerpt. Public source for the demonstrated work has not been verified; a product or model mentioned in the episode is not necessarily open source."
    },
    "reference": false
  }
];
const savedEpisodeResources: readonly EpisodeResource[] = [
  {
    "id": "yMvpVgCXYYU",
    "summary": {
      "zh": "购物 Agent 选好商品后，检查价格、配送地址和最终订单。",
      "en": "Review prices, delivery addresses and the final order after a shopping agent selects products."
    },
    "scope": {
      "zh": "GitHub 页保存本期标题、发布时间和频道简介。未核验到本期演示作品的公开配套源码；节目中的产品或模型不等于已开源项目。",
      "en": "The GitHub page records the title, publication date and channel excerpt. Public source for the demonstrated work has not been verified; a product or model mentioned in the episode is not necessarily open source."
    },
    "reference": false
  },
  {
    "id": "d91TJ6ge6ks",
    "summary": {
      "zh": "从起跳、落地和后续动作回看五段机器人功夫演示。",
      "en": "Review five robot kung fu demonstrations through takeoff, landing and the moves that follow."
    },
    "scope": {
      "zh": "GitHub 页保存本期标题、发布时间和频道简介。未核验到本期演示作品的公开配套源码；节目中的产品或模型不等于已开源项目。",
      "en": "The GitHub page records the title, publication date and channel excerpt. Public source for the demonstrated work has not been verified; a product or model mentioned in the episode is not necessarily open source."
    },
    "reference": false
  },
  {
    "id": "ns1H0s3HQms",
    "summary": {
      "zh": "从柑橘、庭园、方块和 SVG 演示检查作品能否继续修改。",
      "en": "Examine whether citrus, garden, voxel and SVG demos can be edited further."
    },
    "scope": {
      "zh": "GitHub 页保存本期标题、发布时间和频道简介。未核验到本期演示作品的公开配套源码；节目中的产品或模型不等于已开源项目。",
      "en": "The GitHub page records the title, publication date and channel excerpt. Public source for the demonstrated work has not been verified; a product or model mentioned in the episode is not necessarily open source."
    },
    "reference": false
  },
  {
    "id": "Iwlyw6DOCKo",
    "summary": {
      "zh": "报告生成之后，检查修改其中一句、协作和分享的过程。",
      "en": "Review editing a sentence, collaborating and sharing after a report is generated."
    },
    "scope": {
      "zh": "GitHub 页保存本期标题、发布时间和频道简介。未核验到本期演示作品的公开配套源码；节目中的产品或模型不等于已开源项目。",
      "en": "The GitHub page records the title, publication date and channel excerpt. Public source for the demonstrated work has not been verified; a product or model mentioned in the episode is not necessarily open source."
    },
    "reference": false
  },
  {
    "id": "KRxkcrDIUM4",
    "summary": {
      "zh": "检查企业 AI 回答之前，如何先找出相关工作证据。",
      "en": "Examine how enterprise AI finds relevant work evidence before answering."
    },
    "scope": {
      "zh": "GitHub 页保存本期标题、发布时间和频道简介。未核验到本期演示作品的公开配套源码；节目中的产品或模型不等于已开源项目。",
      "en": "The GitHub page records the title, publication date and channel excerpt. Public source for the demonstrated work has not been verified; a product or model mentioned in the episode is not necessarily open source."
    },
    "reference": false
  }
];
const earlierResources: readonly EpisodeResource[] = [
  {
    "id": "zclnRmatV78",
    "summary": {
      "zh": "AI Passport 固件：人生时间看板、每日任务、XP 与像素伙伴。",
      "en": "AI Passport firmware with a time dashboard, daily quests, XP and pixel companions."
    },
    "scope": {
      "zh": "视频录制时仓库私有，现有独立公开源码快照。公开版使用虚构默认资料，历史真机照片不证明这次公开修订已刷机；仅面向指定硬件，其他设备与休眠唤醒仍需验证。",
      "en": "The video predates the independent public source snapshot. Fictional defaults protect personal data; historical device photos do not verify this public revision was flashed. Other hardware and sleep/wake still need validation."
    },
    "reference": false,
    "project": {
      "name": "Life Quest",
      "url": "https://github.com/paul010/ai-passport-life-countdown-open-source",
      "kind": "source"
    }
  },
  {
    "id": "EXxxbuiZpOU",
    "summary": {
      "zh": "工牌个人首页与离线 AB-731 练习应用，支持按键答题、解析和错题记录。",
      "en": "A badge home screen and offline AB-731 practice app with button navigation, explanations and saved mistakes."
    },
    "scope": {
      "zh": "当前源码含 100 道原创练习题；历史照片是早期 18 题版本，不能当作现行版本真机验收。刷写需匹配硬件并保留设备身份分区；本轮未运行或刷写固件。",
      "en": "Current source includes 100 original study questions; historical photos show an earlier 18-question build. Match the hardware and preserve identity partitions. No firmware was run or flashed in this review."
    },
    "reference": false,
    "project": {
      "name": "AI Passport 2026",
      "url": "https://github.com/paul010/aipassword2026",
      "kind": "source"
    }
  },
  {
    "id": "NexwdkKrcUU",
    "summary": {
      "zh": "用需求场景、设计和任务说明组织 AI 编程的变更与验收。",
      "en": "Organize AI coding changes around requirements, scenarios, designs and tasks."
    },
    "scope": {
      "zh": "链接为现行上游源码，命令与视频录制版本可能不同。规范仍需人工审阅，产物需测试；本轮只核对文档与对应关系，未重新运行。",
      "en": "This is current upstream source; commands may differ from the recorded version. Review specifications and test outputs. This review checked documentation and mapping, without rerunning the tool."
    },
    "reference": false,
    "project": {
      "name": "OpenSpec",
      "url": "https://github.com/Fission-AI/OpenSpec",
      "kind": "source"
    }
  },
  {
    "id": "8Mtmmg7RdMs",
    "summary": {
      "zh": "结合网页采集和 AI 生成、修改 React 应用的开源示例。",
      "en": "An open-source example combining web collection with AI generation and editing of React apps."
    },
    "scope": {
      "zh": "当前 README 需要配置 Firecrawl、模型服务及沙箱。源码公开不代表模型与部署免费，也不授权复制他人网站素材；视频中的生成站点未核验到独立公开源码。",
      "en": "The current README requires Firecrawl, a model provider and a sandbox. Open source does not make those services free or grant rights to copied website assets. A separate repository for the generated demo site was not verified."
    },
    "reference": false,
    "project": {
      "name": "Open Lovable",
      "url": "https://github.com/firecrawl/open-lovable",
      "kind": "source"
    }
  },
  {
    "id": "5wRNqwJxTQw",
    "summary": {
      "zh": "以 YAML 和界面组织定时或事件触发的自动化流程。",
      "en": "Build scheduled or event-driven workflows through YAML and a visual interface."
    },
    "scope": {
      "zh": "这是编排平台的上游源码；视频中的特定流程未核验到独立代码仓库。部署、插件、连接权限及企业功能范围应按现行文档确认；本轮未部署。",
      "en": "This is upstream platform source; a separate repository for the video’s specific workflow was not verified. Check deployment, plugins, connection permissions and edition limits. No deployment was performed."
    },
    "reference": false,
    "project": {
      "name": "Kestra",
      "url": "https://github.com/kestra-io/kestra",
      "kind": "source"
    }
  },
  {
    "id": "qbUOMTPZ-iU",
    "summary": {
      "zh": "给 AI 编程加入规范、计划、任务和验证产物的模板与流程。",
      "en": "Templates and processes that carry specifications through planning, tasks and verification for AI coding."
    },
    "scope": {
      "zh": "现行上游工具与录制时流程可能不同；生成结果仍需审查和测试，不代表 AI 能保证需求正确或替代负责人验收。本轮未重新执行。",
      "en": "Current upstream workflows may differ from the recording. Generated results still need review and tests; the tool does not guarantee requirements or replace acceptance by the owner. Not rerun here."
    },
    "reference": false,
    "project": {
      "name": "Spec Kit",
      "url": "https://github.com/github/spec-kit",
      "kind": "source"
    }
  },
  {
    "id": "DoIe_HhIs1c",
    "summary": {
      "zh": "多步骤研究工作流，收集资料、组织分析并生成研究报告。",
      "en": "A multi-step research workflow for gathering sources, organizing analysis and producing reports."
    },
    "scope": {
      "zh": "视频为 2025 年的研究流程，链接指向官方保留的 1.x 分支；当前 2.0 已重写，不能混用安装步骤。模型、搜索服务和凭据需自行配置，报告需核对来源；本轮未运行。",
      "en": "The 2025 video concerns the research workflow, so this links to the official retained 1.x branch. The rewritten 2.0 uses different setup steps. Configure models and search services and verify report sources. Not run here."
    },
    "reference": false,
    "project": {
      "name": "DeerFlow 1.x",
      "url": "https://github.com/bytedance/deer-flow/tree/main-1.x",
      "kind": "source"
    }
  },
  {
    "id": "V3gFalsA-Bc",
    "summary": {
      "zh": "终端 AI 编程工具，用智能体分工读取上下文、实现改动与检查结果。",
      "en": "A terminal AI coding tool that delegates context gathering, implementation and checks."
    },
    "scope": {
      "zh": "原 Codebuff 地址现已跳转到 Freebuff。现行项目、命令、服务条件与视频中的 Codebuff 演示可能不同；本期 ScriptCraft 示例未核验到独立公开仓库。本轮未安装运行。",
      "en": "The original Codebuff URL now redirects to Freebuff. Current commands, services and terms may differ from the recorded Codebuff demo. A separate public ScriptCraft demo repository was not verified. Not installed or run here."
    },
    "reference": false,
    "project": {
      "name": "Codebuff / Freebuff",
      "url": "https://github.com/CodebuffAI/freebuff",
      "kind": "source"
    }
  },
  {
    "id": "tj305q4kiUA",
    "summary": {
      "zh": "带虚拟桌面的 AI Agent，可操作应用、整理文件和处理文档。",
      "en": "An AI agent with a virtual desktop for using applications, organizing files and working with documents."
    },
    "scope": {
      "zh": "公开源码是上游桌面 Agent，不代表本期下载与报告流程已被重新验收。需配置运行环境、模型、网络与访问权限；本轮未登录第三方服务或执行桌面任务。",
      "en": "This is upstream desktop-agent source, not a new acceptance test of the video’s download/report workflow. Configure the environment, models, network and access permissions. No third-party login or desktop task was executed here."
    },
    "reference": false,
    "project": {
      "name": "Bytebot",
      "url": "https://github.com/bytebot-ai/bytebot",
      "kind": "source"
    }
  }
];
const publishedLessons = lessonResources.map((item,index)=>({...item,project:{name:'Copilot Agent · '+String(5-index).padStart(2,'0'),url:'https://github.com/paul010/gemini-kinetic-particles/tree/main/public/copilot-agent-course/materials/lesson-'+String(5-index).padStart(2,'0'),kind:'materials' as const}}));
export const episodeResources: readonly EpisodeResource[] = [...publishedLessons,...commentaryResources,...savedEpisodeResources.map(item=>item.id==='d91TJ6ge6ks'?{...item,project:{name:'Microduck',url:'https://github.com/pollen-robotics/microduck',kind:'reference' as const},scope:{zh:'本期 05:15 起提到 Microduck，链接为该机器人的公开项目。其余功夫表演、Atlas 及巡检演示未核验到本期对应源码，不能把 Microduck 项目当作全部演示的代码；本轮未做机器人实测。',en:'Microduck appears from 05:15; the link is its public project. Source for the other kung fu, Atlas and inspection demonstrations was not verified. This is not code for every demo; no robot was tested here.'}}:item),...earlierResources];
export const allEpisodeResources: readonly EpisodeResource[] = [...episodeResources,...batchTwoResources as readonly EpisodeResource[]];
export const episodeResource = (id:string) => allEpisodeResources.find(item=>item.id===id);
export const episodeNotes = (id:string) => archiveEpisodes.find(item=>item.id===id)?.notes ?? EPISODE_INDEX;
