# 培训设备借用：从模板迁移到新业务

本案例沿用原课设备借用，新增开始与归还日期的规则，不能只改Agent名称。

输入：EquipmentName（设备名称）、StartDate、ReturnDate、Purpose（用途）。全部必填，归还日期≥开始日期。先摘要确认，取消不写入，同次RequestKey重试不重复。

本地样例使用2026-11-02到2026-11-03，均为虚构练习日期；原课10月20至21日样例另存作回放参考。

后端可新建EquipmentRequests_Training，字段：Title、EquipmentName（文本）、StartDate/ReturnDate（仅日期）、Purpose（多行）、Status、OwnerKey、RequestKey（唯一）。需要保留Requests汇总时也可增加相应列，但先解释选择。

复用第3课工具结构，输入输出增加上述字段；在必填检查通过以后，用单独Condition比较日期，再进入唯一键查询和创建。Power Automate可在已成功解析日期之后比较：greaterOrEquals(ticks(outputs('In_ReturnDate')),ticks(outputs('In_StartDate')))；变量和动作名按实际创建映射。

结果只表示“借用申请已登记，库存与批准待确认”。不实现库存扣减、冲突检测和审批，不承诺预留成功。

测试：正常日期、归还早于开始、缺用途、确认前取消、同键重试、同键内容变化。真实系统证据仍需回读，不用本地DEMO记录替代。
