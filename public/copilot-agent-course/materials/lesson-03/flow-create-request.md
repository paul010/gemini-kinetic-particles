# CreateRequest：逐动作搭建

这是手工搭建手册，不是Solution或可导入Flow定义。沿用本课字段表与工具契约。

## 先准备一条本人专用训练路径

在获准培训站点创建独立 Requests_Training 清单，使用英文字段名再调整显示名，避免内部名不一致。RequestKey 开启强制唯一值。只保存虚构记录。

录制基线可以仅由讲师本人使用：Flow使用已获准连接、后端固定OwnerKey为配置中的 TRAINER_ONLY，清单只含本人获准训练数据，不分享为多人应用。这里固定键是隔离演示范围，不是实现了真实用户认证。多人版必须改用受信身份、后端授权，并用第二账号另验；不能让模型传入OwnerKey来授权。

## 动作与命名

1. Copilot Studio → Flows → New flow → Agent flow。保留 When an agent calls the flow 和 Respond to the agent。添加输入 title、category、reason、neededBy、requestKey（文本）、confirm（是/否）。
2. 分别添加 Compose，命名 In_Title / In_Category / In_Reason / In_NeededBy / In_RequestKey / In_Confirm；每个选择触发器中同名动态内容。后续表达式引用这些名称，不猜触发器内部的text、text_1等键。
3. Condition 校验确认、必填与允许类别；neededBy 先做非空检查，再在单独Try Scope中用formatDateTime解析日期，失败走Catch并返回NotCreated。不要把可能失败的日期解析塞进依赖短路的and表达式。
4. SharePoint Get items，命名 Find_By_Key：选择实际站点和清单。Filter Query先输入 RequestKey eq '，插入 In_RequestKey 动态输出，再闭合单引号；RequestKey由GUID或受控字母数字横线组成，不能拿任意用户文本拼OData。Top Count=1。
5. Condition length(body('Find_By_Key')?['value']) 大于0：读取 first(...)。先核对记录属于当前后端获准范围，再逐项比较规范化后的 Title、Category、Reason、NeededBy 与本次输入；内容相同返回 AlreadyExists 与原 ID，不再次 Create item；内容不同返回 NotCreated / RequestKeyConflict，提示用户重新发起，不能静默返回旧成功。
6. 否分支 Create item，映射Title/Category/Reason/NeededBy；Status=Open；OwnerKey=后端固定训练键或正式验证身份；RequestKey=In_RequestKey；NotificationStatus=NotRequested。
7. 保存系统返回ID和动态内容 Link to item（若连接器没有提供，使用清单实际URL与ID构建、再点击验证）。Respond返回recordStatus=Created、requestId、recordUrl、notificationStatus=NotRequested、errorCode空。
8. 添加Try/Catch Scope，Catch配置Run after为failed/timed out。创建失败先查同一RequestKey：若唯一约束冲突且已有项，仍先核对授权范围与同键内容；相同才返回 AlreadyExists，内容不同返回 RequestKeyConflict；否则 NotCreated。不要把所有失败一概说成重复。
9. 对短同步动作关闭异步响应；在当前标准体验要求的时间内返回，不等待人工审批。发布Flow后把工具添加到Agent，并映射响应字段。

## 关键表达式（Expression页签通常不填开头的@）

```text
and(equals(outputs('In_Confirm'),true),not(empty(trim(string(outputs('In_Title'))))),not(empty(trim(string(outputs('In_Reason'))))),not(empty(outputs('In_NeededBy'))),not(empty(outputs('In_RequestKey'))),contains(createArray('Software','Equipment','Training'),outputs('In_Category')))
```

```text
formatDateTime(outputs('In_NeededBy'),'yyyy-MM-dd')
```

```text
length(body('Find_By_Key')?['value'])
```

```text
first(body('Find_By_Key')?['value'])?['ID']
```

RequestKey唯一值与先查再建结合使用，仍需实测并发冲突路径；不能把“先查询”讲成天然防并发。

## 当场怎么证明

正常：实际Flow运行详情→Create item输出→清单同ID记录。取消：同一窗口先后计数不增加。缺日期：先追问。重试：同RequestKey重复调用，ID和记录总数不变。通知另行测试，不把服务接收称为实际送达。
