# 一句话申请 Topic：逐节点搭建

先确认使用支持 Topics 与 Agent flow 的标准体验。若当前主页显示另一套体验，不把两套界面混讲。

1. Topics 新建“培训申请登记”。触发语句：我要申请软件、登记一项培训申请。明确调用该 Topic，不依赖模型自行决定写入。
2. Question 收集 Title，类型文本。Category 使用3个明确选项；Reason 文本；NeededBy 日期，先确认绝对日期。
3. 设置变量 Topic.RequestKey：只在新提交进入时设为 Text(GUID())（Power Fx）。同次确认失败或重试沿用；开始另一项申请才生成新值。
4. Message 展示4项摘要。Question 给出“确认提交 / 修改 / 取消”选项，保存到 Topic.Decision。
5. Condition：取消→Message“已取消，未登记”→结束；修改→回到收集字段；确认→Call an action / Tool 调用 CreateRequest。
6. 映射字段为 Topic 变量；confirm 是确认分支里的布尔常量 true。不能只写“用户应该确认”而省掉分支。
7. Created / AlreadyExists→展示工具真实ID与链接；NotCreated→展示错误，保留RequestKey供重试。
8. 新建申请流程不能顺带承担人工审批等待。登记后状态查询另做。

本机没有替你发布这个 Topic。实际界面配置完成后，分别跑正常、缺日期、取消、重试。
