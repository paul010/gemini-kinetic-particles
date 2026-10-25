# 待办提醒：从手动回放到定时

这是一份手工搭建手册，没有创建或启用任何真实发信、定时任务。仅使用获准收件人与训练数据。

## 先手动回放，保证录制可重复

1. Power Automate → 即时云端流 → Manually trigger a flow。添加Compose命名AsOf，文本输入2026-10-23。日期是固定回放口径，不是今天。
2. 在培训清单导入本课8条CSV，或手动录入；导入后核对Choice与Date列类型。CSV里的DemoRequestId是样例标识，不替代系统ID。
3. Get items读取获准训练数据。Filter array命名Due_Items，From选value；先单独排除空或非法 NeededBy，再按状态与日期筛选；不要依赖 and 短路来阻止日期解析错误。以下表达式仅适用于已规范化的合法日期与文本状态。仅训练8条可直读，业务数据须后端授权、查询缩小范围并处理分页。
4. Filter array的高级表达式见下。若使用UI Expression框，按该框要求移除开头@。
5. Select保留编号、标题、截止日期、状态、实际Link to item；Create HTML table生成表。加入“回放基准2026-10-23，虚构培训数据”的标题。
6. Send an email (V2) 的To手工选择获准测试收件人。先将自己作为唯一测试目标，核对真实From。不要把CSV的学员A/B直接当邮箱。
7. Flow返回服务接受后，打开收件箱检查标题、4项内容与可打开的实际链接。只有实际核对才在测试记录标ReceiverVerified。

```text
@and(contains(createArray('Open','Pending','InProgress'),item()?['Status']),lessOrEquals(ticks(concat(formatDateTime(item()?['NeededBy'],'yyyy-MM-dd'),'T00:00:00Z')),ticks(concat(outputs('AsOf'),'T00:00:00Z'))))
```

日期比较按同一“日历日期”归一，Z仅作为计算标尺，不把业务日期解释成UTC到期时刻。若SharePoint列输出结构或内部名不同，先在实际运行输出核对，不能原样照抄未知字段。

待办数量：
```text
length(body('Due_Items'))
```

## 再做定时版本

手动回放通过后，在单独定时流设置Recurrence和实际业务时区；示例北京时间09:00仅作配置示范，不代表本机已经安排提醒。把AsOf替换为：

```text
convertTimeZone(utcNow(),'UTC','China Standard Time','yyyy-MM-dd')
```

先保持定时版本关闭，录前受控启用并等待一次真实触发；记录实际触发时间和收件端，才能验收定时。不用手动Run冒充定时触发。

## 通知去重与失败重试

建议建立独立ReminderRuns训练日志，RunKey=基准日期+获准收件人键+规则版本，并开启唯一值。Pending/AcceptedByService/Failed/ReceiverVerified分开。重试前检查成功记录；发送服务结果不明确时人工核对收件端，避免盲目重发。这个日志与申请RequestKey是两件事；不因提醒失败重建申请。

最小测试：4项到期/过期、完成取消与未来项排除、只看今日到期2项、手动邮件收件核对、定时触发另验。分组发送要先配置受控分组→获准收件人的映射，课堂可只向自己发送总览。
