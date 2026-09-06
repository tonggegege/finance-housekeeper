# 私人财务管家

基于 **CodeBuddy Agent SDK** 的 Web 应用。你只管报「类别＋金额」，它帮你算还能花多少、钱去哪了，顺便说点实话。

## 怎么用

```bash
cd finance-housekeeper
npm install
npm run dev          # 前端 5173，后端 3000
# 浏览器打开 http://localhost:5173
```

首次使用需要在设置里配置 CodeBuddy 凭据（`CODEBUDDY_API_KEY` 或已登录的 CodeBuddy CLI）。

## 界面

- **左边 · 花钱清单**
  - 顶部可改「本月预算」「必须先存」
  - 分类小标签点一下就加一笔（打车 / 交通 / 外卖 / 聚餐 / 奶茶 / 服饰 / 杂物，可自行加分类）
  - 每笔金额点一下就能改，鼠标移上去可删除
  - 底部输入框报账：`打车20`、`奶茶18 外卖35`、`预算8000`、`先存2000`
- **右边 · 看板**
  - 大数字「本月还能花」
  - 「平摊每天」= 还能花 ÷ 本月剩余天数（含今天）
  - 钱去哪了：堆叠占比条 + 分类明细
  - 「它跟你说的实话」：Agent 的实时回话（最多两行）
  - 「每周实话总结」按钮：点名最不该花的那笔，算出砍掉一年能省多少

## 规矩（写在 Agent 人格里）

1. 每次回复最多两行，说人话，不用标题序号
2. 必答两个数：本月还能花多少、平摊到每天多少
3. 可花额度 = 预算 − 必须先存的钱 − 已花
4. 冲动消费直接点名（奶茶/外卖/打车频次高、大额聚餐、非必要服饰）
5. 周总结要换算：砍掉一年能省多少
6. 用户改了数字就按新数字重算

## 技术结构

```
server/
  index.ts        Express + SSE，Agent SDK query，账本 API（/api/ledger）
  db.ts           SQLite：sessions / messages / ledger
src/
  finance/        账本模型、解析（打车20 → {打车, 20}）、计算、持久化 hook
  components/    ExpensePanel（左）、DashboardPanel（右）、ReportInput、EditableNumber
  pages/FinancePage.tsx
```

账本同时写入后端 SQLite 和 localStorage，后端挂了也不丢数据。

## 常用脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 前后端一起启动 |
| `npm run dev:server` | 只跑后端（3000） |
| `npm run dev:client` | 只跑前端（5173） |
| `npm run build` | 类型检查 + 打包 |
