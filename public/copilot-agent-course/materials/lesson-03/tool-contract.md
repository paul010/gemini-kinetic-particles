# Requests 字段与工具契约

文本蓝图，非导入包、非已部署配置。字段名为建议内部名，真实清单中由讲师确认。每人使用培训记录或独立清单，避免互相改动。

## 字段

Title：单行文本，必填；Category：Software / Equipment / Training；Reason：多行文本，必填；NeededBy：日期；Status：Open / Pending / InProgress / Completed / Cancelled；OwnerKey：经后端验证的用户标识；RequestKey：稳定提交标识，单行文本并开启唯一值；NotificationStatus：NotRequested / Pending / AcceptedByService / Failed / ReceiverVerified；Created 与 ID 使用系统字段。录制示例编号来自系统 ID 转换，不能由语言模型猜造。

OwnerKey 的映射、获取和过滤要在实际身份通道验证。建议课程使用受控且明确授权的测试数据；若 Flow 使用 maker 连接，不能仅靠前端过滤来保护共享业务数据。后端核验身份与允许访问记录；若课堂尚不能落实，限制到学员自有数据并明确记录跨用户授权未验证。

## CreateRequest 输入

title、category、reason、neededBy、requestKey；authenticatedUserKey 只可来自已验证身份上下文。confirm 必须来自明确确认分支，后端再次检查必要条件。

## CreateRequest 输出

recordStatus：Created / AlreadyExists / NotCreated；requestId：仅创建或查得已有记录后返回；recordUrl：真实记录链接；notificationStatus：独立状态；errorCode：失败原因分类；userMessage：自然语言提示。工具输出是待配置的契约，不表示这些字段已在平台中存在。

## GetMyRequests

输入：后端已验证身份；经过允许的状态与日期范围。输出：asOf、items（requestId、title、status、neededBy、ownerKey、recordUrl）、errorCode。身份错误返回无数据，不以用户请求的姓名或邮箱直接放行。

## NotifyPending

仅发送已持久化且未成功通知的记录或分组；使用获准测试连接和收件人。输出保留 sender、runId、serviceResult 和 receiverVerified，不能用连接名称推断真实 From。服务接受与收件端验证分开。
