# 挑战与考试

本页整理 HTOJ 的「挑战 / 考试」相关接口：CSP 刷题挑战赛（`api/oj/challenge.ts`）、入学测验 / 考试（`api/oj/entrance-exam.ts`）与 CSP 模拟排名（`api/activity/csp.ts`），涵盖赛事信息、报名与身份核验、答题与交卷、榜单以及考试试卷 / 判题流程。

本文覆盖 41 个接口：✅5 / ⚠️11 / 🚫3 / ✍️17 / ❔5。

> 网关地址、必带请求头、统一响应格式（`{ errCode, data, errMsg }`）、分页结构与各枚举见 [index.md](./index.md)，本页不再重复。类型名（如 `ChallengeInfoDTO`）集中定义在 [htoj-api.d.ts](./htoj-api.d.ts)。
> 普通比赛见 [contests.md](./contests.md)，题库题目提交 / 评测轮询 / 自测见 [problems.md](./problems.md)。
> **本页多数接口为「挑战赛 / 考试」专用，`re/samples/` 下没有对应的抓包样例**；下文带 ✅ 的接口字段依据 `re/api-probe.json` 的实测内联样本，其余标注「未实测」。标 ✍️ 的写操作未在真实账号上复测，请求体依据前端源码签名整理。

```js
const BASE = "https://api.htoj.com.cn";
const token = localStorage.getItem("KEY_USER_LOGIN_TOKEN"); // 登录后才有
const HEADERS = {
  "Hetao-Oj-Zone": "cpp",   // cpp | python
  HT_PLATFORM: "htojWeb",
  HT_SYSTEM: "web",
  HT_VERSION: "1.0.0",
  app_id: "com.hetao101.oj",
  Authorization: token,     // 原始 JWT，不加 Bearer 前缀
};
```

写接口统一用 `POST`，请求体为 JSON（`"Content-Type": "application/json"`）；请求参数若在源码里以 `{ query }` 传入，则走 URL 查询串，以 `{ body }` 传入则走请求体。所有接口返回 `{ errCode, data, errMsg }`，判断 `errCode === 0` 而不是 HTTP 状态码（HTTP 恒为 200）。

## 接口清单

| 接口 | 方法 | 路径 | 验证 | 说明 |
| --- | --- | --- | --- | --- |
| [挑战赛信息](#挑战赛信息) | GET | `/api/code-community-growth/api/challenge/get-info` | ✅ | 首页挑战赛信息 |
| [报名信息字典](#报名信息字典) | GET | `/api/code-community-growth/api/challenge/user/get-base-info-dictionary` | ✅ | NOI 奖项 / 挑战目标字典 |
| [个人挑战详情](#个人挑战详情) | GET | `/api/code-community-growth/api/challenge/user/get-info` | ⚠️ | 需 `admissionId` |
| [学员基础信息](#学员基础信息) | GET | `/api/code-community-growth/api/challenge/user/get-base-info` | ⚠️ | 需 `admissionId` |
| [服务老师二维码](#服务老师二维码) | GET | `/api/code-community-growth/api/challenge/user/get-teacher-info` | ⚠️ | 未取到可读响应 |
| [订阅提醒](#订阅提醒) | POST | `/api/code-community-growth/api/challenge/user/subscribe-alert` | ✍️ | 写操作未实测 |
| [绑定 openId](#绑定-openid) | POST | `/api/code-community-growth/api/challenge/user/set-openId` | ✍️ | 写操作未实测 |
| [提交学员信息](#提交学员信息) | POST | `/api/code-community-growth/api/challenge/user/submit-base-info` | ✍️ | 写操作未实测 |
| [身份确认](#身份确认) | POST | `/api/code-community-growth/gwpub/challenge/user/confirm-identity` | ✍️ | 写操作未实测 |
| [年级字典](#年级字典) | GET | `/api/code-community-growth/api/common/get-grade-list` | ✅ | 13 条 |
| [省市字典](#省市字典) | GET | `/api/code-community-growth/api/common/get-region-list` | ✅ | 35 条 |
| [身份状态](#身份状态) | GET | `/api/code-community-growth/gwpub/challenge/user/identity-status` | ✅ | 学生类型 / 是否加老师 |
| [开始答题](#开始答题) | POST | `/api/code-community-growth/api/challenge/start-test` | ✍️ | 返回第一题 |
| [提交答案](#提交答案) | POST | `/api/code-community-growth/api/challenge/submit` | ✍️ | 写操作未实测 |
| [获取下一题](#获取下一题) | POST | `/api/code-community-growth/api/challenge/next-problem` | ✍️ | 写操作未实测 |
| [已用时间](#已用时间) | GET | `/api/code-community-growth/api/challenge/used-time` | ⚠️ | 需 `testId` |
| [上报累计用时](#上报累计用时) | POST | `/api/code-community-growth/api/challenge/cumulative-time` | ✍️ | 心跳上报 |
| [赛事结果](#赛事结果) | GET | `/api/code-community-growth/gwpub/challenge/session-result` | ⚠️ | 需 `testId` |
| [答题说明](#答题说明) | GET | `/api/code-community-growth/api/challenge/answer-summary` | ⚠️ | 需 `testId` |
| [团队榜](#团队榜) | GET | `/api/code-community-growth/api/challenge/leaderboard/team` | 🚫 | 网关 403 |
| [刷题榜](#刷题榜) | GET | `/api/code-community-growth/api/challenge/leaderboard/problem` | 🚫 | 网关 403 |
| [正确率榜](#正确率榜) | GET | `/api/code-community-growth/api/challenge/leaderboard/accuracy` | 🚫 | 网关 403 |
| [榜单点赞](#榜单点赞) | POST | `/api/code-community-growth/gwpub/challenge/leaderboard/thumb-up` | ✍️ | 写操作未实测 |
| [榜单取消点赞](#榜单取消点赞) | POST | `/api/code-community-growth/gwpub/challenge/leaderboard/cancel-thumb-up` | ✍️ | 写操作未实测 |
| [用户点赞](#用户点赞) | POST | `/api/code-community-growth/api/challenge/user-thumb` | ✍️ | 测试场景 |
| [用户取消点赞](#用户取消点赞) | POST | `/api/code-community-growth/api/challenge/user-unthumb` | ✍️ | 测试场景 |
| [考试信息](#考试信息) | GET | `/api/code-community-growth/api/exam/test-info` | ⚠️ | 需 `receiveId` |
| [考试题目详情](#考试题目详情) | GET | `/api/code-community-growth/api/exam/problem-detail` | ⚠️ | 需 `receiveId` |
| [创建试卷](#创建试卷) | POST | `/api/code-community-growth/api/exam/create-test` | ✍️ | 写操作未实测 |
| [交卷](#交卷) | POST | `/api/code-community-growth/api/exam/submit` | ✍️ | 写操作未实测 |
| [考试提交判题](#考试提交判题) | POST | `/api/code-community-growth/api/submitRecord/submit-problem-judge` | ✍️ | 写操作未实测 |
| [查询考试判题结果](#查询考试判题结果) | GET | `/api/code-community-growth/api/submitRecord/get-test-judge-result` | ⚠️ | 需 `testJudgeKey` |
| [考试自测提交](#考试自测提交) | POST | `/api/code-community-growth/api/submitRecord/submit-problem-test-judge` | ✍️ | 写操作未实测 |
| [提交记录详情](#提交记录详情) | GET | `/api/code-community-growth/api/submitRecord/submit-record-detail` | ❔ | 未实测（探针跳过） |
| [客观题列表](#客观题列表) | GET | `/api/code-community-growth/api/exam/objective-problem` | ⚠️ | 需 `problemId` |
| [切换试卷](#切换试卷) | POST | `/api/code-community-growth/api/exam/switch-test` | ✍️ | 写操作未实测 |
| [提交记录列表](#提交记录列表) | GET | `/api/code-community-growth/api/submitRecord/submit-record-list` | ❔ | 未实测（探针跳过） |
| [考试剩余时间](#考试剩余时间) | GET | `/api/code-community-growth/api/exam/get-time-remain` | ⚠️ | 需 `testId` |
| [模拟排名信息](#模拟排名信息) | GET | `/api/htoj-biz-gateway/api/csp/get-mock-rank-info` | ❔ | 路径由变量拼接 |
| [模拟排名列表](#模拟排名列表) | GET | `/api/htoj-biz-gateway/api/csp/get-mock-rank-list` | ❔ | 路径由变量拼接 |
| [模拟排名开关](#模拟排名开关) | GET | `/api/htoj-biz-gateway/api/csp/get-mock-show-rank` | ❔ | 路径由变量拼接 |

---

## 挑战（CSP 等）

CSP 刷题挑战赛（对应前端 `api/oj/challenge.ts`，服务 `code-community-growth`）。请求基址为 `/api/code-community-growth`。以下接口均需登录。

### 挑战赛信息

`GET /api/code-community-growth/api/challenge/get-info` ✅

首页获取当前挑战赛信息，无参数。响应类型 `ChallengeInfoDTO`。

字段（依据 `re/api-probe.json` 实测样本）：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `admissionId` | number | 赛事 id，后续个人 / 榜单接口都带它 |
| `name` | string | 赛事名称 |
| `status` | number | 状态，枚举未验证（样本为 `3`） |
| `startTime` | number | 开始时间（毫秒时间戳） |
| `finishTime` | number | 结束时间（毫秒时间戳） |
| `freezeTime` | number | 封榜时间（毫秒时间戳） |
| `cspExamTimestamp` | number | CSP 考试时间（毫秒时间戳） |
| `problemCountPerRound` | number | 每轮题数（样本 `25`） |
| `contestStatus` | number | 比赛状态，枚举未验证（样本 `4`） |
| `examConfig` | object | 考试配置，键为组别（`CSP-J` / `CSP-S`），值为数字（含义未验证） |
| `participantCount` | object | 参与人数，键为组别（样本 `{ "CSP-J": 2699 }`） |
| `pcDescription` | string | PC 端赛事规则（Markdown） |

> 响应示例（依据 `re/api-probe.json` 实测内联样本，已脱敏）

```json
{
  "admissionId": 14,
  "name": "2026 CSP-J/S初赛 刷题挑战赛",
  "status": 3,
  "startTime": 1788192000000,
  "finishTime": 1789315140000,
  "freezeTime": 1788710340000,
  "examConfig": { "CSP-J": 184, "CSP-S": 204 },
  "cspExamTimestamp": 1789747200000,
  "problemCountPerRound": 25,
  "contestStatus": 4,
  "participantCount": { "CSP-J": 2699 },
  "pcDescription": "# PC 端赛事规则\n..."
}
```

```js
const data = await fetch(`${BASE}/api/code-community-growth/api/challenge/get-info`, {
  headers: HEADERS,
}).then((r) => r.json());
```

---

### 报名信息字典

`GET /api/code-community-growth/api/challenge/user/get-base-info-dictionary` ✅

报名页的学员信息字典（NOI 奖项、挑战目标），无参数。响应类型 `ChallengeDictDTO`。

字段（依据 `re/api-probe.json` 实测样本）：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `noiAwardList` | `{ code, name }[]` | NOI / CSP 获奖情况选项，如 `{ "code": 1, "name": "CSP-J一等奖" }`，`code` 覆盖 `1`~`11`（含 `11`=未参加过CSP） |
| `challengeTargetList` | `{ code, name }[]` | 挑战目标选项，如 `{ "code": 0, "name": "第一次尝试，无明确目标" }` |

> 响应示例（依据 `re/api-probe.json` 实测内联样本，已脱敏）

```json
{
  "noiAwardList": [
    { "code": 1, "name": "CSP-J一等奖" },
    { "code": 2, "name": "CSP-J二等奖" },
    { "code": 11, "name": "未参加过CSP" }
  ],
  "challengeTargetList": [
    { "code": 0, "name": "第一次尝试，无明确目标" }
  ]
}
```

> 实测样本中 `challengeTargetList` 被截断，完整选项未取全。

```js
const data = await fetch(
  `${BASE}/api/code-community-growth/api/challenge/user/get-base-info-dictionary`,
  { headers: HEADERS },
).then((r) => r.json());
```

---

### 个人挑战详情

`GET /api/code-community-growth/api/challenge/user/get-info` ⚠️

首页获取当前用户在挑战赛中的个人详情。响应类型 `ChallengeUserHomeVO`。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `admissionId` | number | 是 | 赛事 id |

探针未带参数时返回 `errCode=-1`：`admissionId is required.`。未取到有效样本，`ChallengeUserHomeVO` 字段未验证。

> 响应骨架（依据类型 `ChallengeUserHomeVO` 推导，**未实测**；字段定义不在仓库内，结构未知）

```json
null
```

```js
const data = await fetch(
  `${BASE}/api/code-community-growth/api/challenge/user/get-info?admissionId=14`,
  { headers: HEADERS },
).then((r) => r.json());
```

---

### 学员基础信息

`GET /api/code-community-growth/api/challenge/user/get-base-info` ⚠️

报名页获取学员已填的基础信息。响应类型 `UserBaseInfoDTO`（与[提交学员信息](#提交学员信息)同族）。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `admissionId` | number | 是 | 赛事 id |

探针未带参数时返回 `errCode=-1`：`admissionId is required.`。未取到有效样本，字段未验证。

> 响应骨架（依据类型 `UserBaseInfoDTO` 推导，**未实测**；字段定义不在仓库内，结构未知）

```json
null
```

```js
const data = await fetch(
  `${BASE}/api/code-community-growth/api/challenge/user/get-base-info?admissionId=14`,
  { headers: HEADERS },
).then((r) => r.json());
```

---

### 服务老师二维码

`GET /api/code-community-growth/api/challenge/user/get-teacher-info` ⚠️

获取学员服务老师的企微二维码。响应类型 `string`。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `location` | number | 是 | 位置来源（源码签名，取值未验证） |
| `testId` | number | 否 | 试卷 id |
| `examGroup` | string | 否 | 考试组别 |

**实测说明**：探针返回 `errCode=0`（`errMsg=操作成功`），但探针在序列化响应体时报错（`undefined is not an object`），**未取到可读内容**，故无法确认返回的字符串是什么；`location` 是否被后端强校验亦未确认。

> 响应骨架（依据类型 `string` 推导，**未实测**；探针未取到可读内容）

```json
"…"
```

```js
const data = await fetch(
  `${BASE}/api/code-community-growth/api/challenge/user/get-teacher-info?location=1`,
  { headers: HEADERS },
).then((r) => r.json());
```

---

### 订阅提醒

`POST /api/code-community-growth/api/challenge/user/subscribe-alert` ✍️ 写操作未实测

订阅挑战赛提醒。请求体类型 `UserSubscribeDTO`，**字段未从样例或类型文件确认**（`@core/types/auto/growth.ts` 未随仓库提供）。响应类型 `boolean`。

> 响应骨架（依据类型 `boolean` 推导，**未实测**）

```json
false
```

```js
await fetch(`${BASE}/api/code-community-growth/api/challenge/user/subscribe-alert`, {
  method: "POST",
  headers: { ...HEADERS, "Content-Type": "application/json" },
  body: JSON.stringify({ /* UserSubscribeDTO，字段未验证 */ }),
}).then((r) => r.json());
```

---

### 绑定 openId

`POST /api/code-community-growth/api/challenge/user/set-openId` ✍️ 写操作未实测

绑定用户 openId。参数走 query，无请求体，响应未声明泛型（无业务数据字段）。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `openId` | string | 是 | 第三方 openId |

> 响应骨架（依据源码签名，**未实测**；响应未声明泛型，`data` 无业务数据字段）

```json
null
```

```js
await fetch(
  `${BASE}/api/code-community-growth/api/challenge/user/set-openId?openId=xxx`,
  { method: "POST", headers: HEADERS },
).then((r) => r.json());
```

---

### 提交学员信息

`POST /api/code-community-growth/api/challenge/user/submit-base-info` ✍️ 写操作未实测

报名页提交学员信息。请求体类型 `UserBaseInfoDTO`（字段未验证）。响应类型 `number`。

> 响应骨架（依据类型 `number` 推导，**未实测**）

```json
0
```

```js
const data = await fetch(
  `${BASE}/api/code-community-growth/api/challenge/user/submit-base-info`,
  {
    method: "POST",
    headers: { ...HEADERS, "Content-Type": "application/json" },
    body: JSON.stringify({ /* UserBaseInfoDTO，字段未验证 */ }),
  },
).then((r) => r.json());
```

---

### 身份确认

`POST /api/code-community-growth/gwpub/challenge/user/confirm-identity` ✍️ 写操作未实测

身份确认弹窗中提交「在读选择」。请求体类型 `ConfirmIdentityDTO`（字段未验证）。响应未声明泛型。

> 响应骨架（依据源码签名，**未实测**；响应未声明泛型，`data` 无业务数据字段）

```json
null
```

```js
await fetch(
  `${BASE}/api/code-community-growth/gwpub/challenge/user/confirm-identity`,
  {
    method: "POST",
    headers: { ...HEADERS, "Content-Type": "application/json" },
    body: JSON.stringify({ /* ConfirmIdentityDTO，字段未验证 */ }),
  },
).then((r) => r.json());
```

---

### 年级字典

`GET /api/code-community-growth/api/common/get-grade-list` ✅

年级下拉字典，无参数。响应类型 `GradeVO[]`。

字段（依据 `re/api-probe.json` 实测样本，共 13 条，从「一年级」起）：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `realGrade` | number | 年级编码（`3`=一年级 … `14`=高三等） |
| `gradeName` | string | 年级名 |

> 响应示例（依据 `re/api-probe.json` 实测内联样本，已脱敏）

```json
[
  { "realGrade": 3, "gradeName": "一年级" },
  { "realGrade": 4, "gradeName": "二年级" },
  { "realGrade": 9, "gradeName": "初一" },
  { "realGrade": 12, "gradeName": "高一" }
]
```

> 与 code-community 的 `get-grade-list`（15 条，含「幼儿中班 / 幼儿大班」）**不是同一份数据**，本接口从「一年级」开始、共 13 条（对照 [misc.md](./misc.md) 的字典页）。

```js
const data = await fetch(`${BASE}/api/code-community-growth/api/common/get-grade-list`, {
  headers: HEADERS,
}).then((r) => r.json());
```

---

### 省市字典

`GET /api/code-community-growth/api/common/get-region-list` ✅

省市二级联动字典，无参数。响应类型 `RegionDTO[]`。

字段（依据 `re/api-probe.json` 实测样本，直辖市 / 省共 35 条）：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | number | 地区 id |
| `tag` | string | 地区名 |
| `areaType` | number | 层级：`1`=省级，`3`=市 / 区级 |
| `parentId` | number | 父级 id（省级为 `0`） |
| `children` | `RegionDTO[] \| null` | 下级地区，可能为 `null` |

> 响应示例（依据 `re/api-probe.json` 实测内联样本，已脱敏）

```json
[
  {
    "id": 1,
    "tag": "北京市",
    "areaType": 1,
    "parentId": 0,
    "children": [
      { "id": 72, "tag": "朝阳区", "areaType": 3, "parentId": 35 },
      { "id": 2800, "tag": "海淀区", "areaType": 3, "parentId": 35 }
    ]
  }
]
```

```js
const data = await fetch(`${BASE}/api/code-community-growth/api/common/get-region-list`, {
  headers: HEADERS,
}).then((r) => r.json());
```

---

### 身份状态

`GET /api/code-community-growth/gwpub/challenge/user/identity-status` ✅

查询用户身份（学生类型）及是否已添加老师微信，无参数。响应类型 `UserIdentityVO`。

字段（依据 `re/api-probe.json` 实测样本）：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `studentType` | number | 学生类型（样本 `1`，取值枚举未验证） |
| `hasAddedTeacher` | boolean | 是否已添加老师微信 |

> 响应示例（依据 `re/api-probe.json` 实测内联样本，已脱敏）

```json
{ "studentType": 1, "hasAddedTeacher": false }
```

```js
const data = await fetch(
  `${BASE}/api/code-community-growth/gwpub/challenge/user/identity-status`,
  { headers: HEADERS },
).then((r) => r.json());
```

---

### 开始答题

`POST /api/code-community-growth/api/challenge/start-test` ✍️ 写操作未实测

进入答题，获取第一题。参数走 query，响应类型 `ChallengeTestProblemVo`。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `testId` | number | 是 | 试卷 / 答题会话 id |

> 响应骨架（依据类型 `ChallengeTestProblemVo` 推导，**未实测**；字段定义不在仓库内，结构未知）

```json
null
```

```js
await fetch(`${BASE}/api/code-community-growth/api/challenge/start-test?testId=123`, {
  method: "POST",
  headers: HEADERS,
}).then((r) => r.json());
```

---

### 提交答案

`POST /api/code-community-growth/api/challenge/submit` ✍️ 写操作未实测

提交当前题答案。`testId` 走 query，答案体类型 `ChallengeSubmitDto`（字段未验证）。响应类型 `ChallengeResultDto`。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `testId` | number | 是 | 试卷 / 答题会话 id（query） |

> 响应骨架（依据类型 `ChallengeResultDto` 推导，**未实测**；字段定义不在仓库内，结构未知）

```json
null
```

```js
await fetch(`${BASE}/api/code-community-growth/api/challenge/submit?testId=123`, {
  method: "POST",
  headers: { ...HEADERS, "Content-Type": "application/json" },
  body: JSON.stringify({ /* ChallengeSubmitDto，字段未验证 */ }),
}).then((r) => r.json());
```

---

### 获取下一题

`POST /api/code-community-growth/api/challenge/next-problem` ✍️ 写操作未实测

获取下一题。参数走 query，响应类型 `ChallengeTestProblemVo`。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `testId` | number | 是 | 试卷 / 答题会话 id |

> 响应骨架（依据类型 `ChallengeTestProblemVo` 推导，**未实测**；字段定义不在仓库内，结构未知）

```json
null
```

```js
await fetch(`${BASE}/api/code-community-growth/api/challenge/next-problem?testId=123`, {
  method: "POST",
  headers: HEADERS,
}).then((r) => r.json());
```

---

### 已用时间

`GET /api/code-community-growth/api/challenge/used-time` ⚠️

获取本次挑战已用时间。响应类型 `number`（单位：秒）。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `testId` | number | 是 | 试卷 / 答题会话 id |

探针未带参数时返回 `errCode=-1`：`testId is required.`。

> 响应骨架（依据类型 `number` 推导，**未实测**；单位：秒）

```json
0
```

```js
const data = await fetch(
  `${BASE}/api/code-community-growth/api/challenge/used-time?testId=123`,
  { headers: HEADERS },
).then((r) => r.json());
```

---

### 上报累计用时

`POST /api/code-community-growth/api/challenge/cumulative-time` ✍️ 写操作未实测

心跳上报当前用时。参数走 query，响应未声明泛型（无业务数据字段）。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `testId` | number | 是 | 试卷 / 答题会话 id |

> 响应骨架（依据源码签名，**未实测**；响应未声明泛型，`data` 无业务数据字段）

```json
null
```

```js
await fetch(
  `${BASE}/api/code-community-growth/api/challenge/cumulative-time?testId=123`,
  { method: "POST", headers: HEADERS },
).then((r) => r.json());
```

---

### 赛事结果

`GET /api/code-community-growth/gwpub/challenge/session-result` ⚠️

赛事结果页数据。响应类型 `ChallengeSessionResultVO`。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `testId` | number | 是 | 试卷 / 答题会话 id |

探针未带参数时返回 `errCode=-1`：`testId is required.`。未取到有效样本，字段未验证。

> 响应骨架（依据类型 `ChallengeSessionResultVO` 推导，**未实测**；字段定义不在仓库内，结构未知）

```json
null
```

```js
const data = await fetch(
  `${BASE}/api/code-community-growth/gwpub/challenge/session-result?testId=123`,
  { headers: HEADERS },
).then((r) => r.json());
```

---

### 答题说明

`GET /api/code-community-growth/api/challenge/answer-summary` ⚠️

获取答题说明。响应类型 `ChallengeAnswerSummaryVo`。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `testId` | number | 是 | 试卷 / 答题会话 id |

探针未带参数时返回 `errCode=-1`：`testId is required.`。未取到有效样本，字段未验证。

> 响应骨架（依据类型 `ChallengeAnswerSummaryVo` 推导，**未实测**；字段定义不在仓库内，结构未知）

```json
null
```

```js
const data = await fetch(
  `${BASE}/api/code-community-growth/api/challenge/answer-summary?testId=123`,
  { headers: HEADERS },
).then((r) => r.json());
```

---

## 排行榜

CSP 挑战赛的榜单及其点赞。**三个榜单接口实测被网关 403 拒绝，当前不可用**（与 [index.md](./index.md) 中「部分路径被网关直接拒绝」一节列出的 `challenge/leaderboard/{accuracy,team,problem}` 一致）。以下接口均需登录。

### 团队榜

`GET /api/code-community-growth/api/challenge/leaderboard/team` 🚫

团队榜。响应类型 `LeaderboardVO`，当前不可用。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `admissionId` | number | 是 | 赛事 id |
| `examGroup` | string | 否 | 考试组别（如 `CSP-J` / `CSP-S`） |

> 响应骨架（依据类型 `LeaderboardVO` 推导，**未实测**；字段定义不在仓库内，结构未知）

```json
null
```

**实测被网关拒绝**（`re/api-probe.json`）：

```json
{ "code": 403, "message": "Gateway Error:Access Denied" }
```

---

### 刷题榜

`GET /api/code-community-growth/api/challenge/leaderboard/problem` 🚫

刷题榜。响应类型 `LeaderboardVO`，当前不可用。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `admissionId` | number | 是 | 赛事 id |
| `examGroup` | string | 否 | 考试组别 |

> 响应骨架（依据类型 `LeaderboardVO` 推导，**未实测**；字段定义不在仓库内，结构未知）

```json
null
```

**实测被网关拒绝**：`403 Gateway Error:Access Denied`。

---

### 正确率榜

`GET /api/code-community-growth/api/challenge/leaderboard/accuracy` 🚫

正确率榜。响应类型 `LeaderboardVO`，当前不可用。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `admissionId` | number | 是 | 赛事 id |
| `examGroup` | string | 否 | 考试组别 |

> 响应骨架（依据类型 `LeaderboardVO` 推导，**未实测**；字段定义不在仓库内，结构未知）

```json
null
```

**实测被网关拒绝**：`403 Gateway Error:Access Denied`。未取到有效样本，`LeaderboardVO` 字段未验证。

---

### 榜单点赞

`POST /api/code-community-growth/gwpub/challenge/leaderboard/thumb-up` ✍️ 写操作未实测

给榜单某一行点赞。请求体类型 `ThumbDTO`（字段未验证）。响应未声明泛型。

> 响应骨架（依据源码签名，**未实测**；响应未声明泛型，`data` 无业务数据字段）

```json
null
```

```js
await fetch(
  `${BASE}/api/code-community-growth/gwpub/challenge/leaderboard/thumb-up`,
  {
    method: "POST",
    headers: { ...HEADERS, "Content-Type": "application/json" },
    body: JSON.stringify({ /* ThumbDTO，字段未验证 */ }),
  },
).then((r) => r.json());
```

---

### 榜单取消点赞

`POST /api/code-community-growth/gwpub/challenge/leaderboard/cancel-thumb-up` ✍️ 写操作未实测

取消榜单点赞。请求体类型 `ThumbDTO`（字段未验证）。响应未声明泛型。

> 响应骨架（依据源码签名，**未实测**；响应未声明泛型，`data` 无业务数据字段）

```json
null
```

```js
await fetch(
  `${BASE}/api/code-community-growth/gwpub/challenge/leaderboard/cancel-thumb-up`,
  {
    method: "POST",
    headers: { ...HEADERS, "Content-Type": "application/json" },
    body: JSON.stringify({ /* ThumbDTO，字段未验证 */ }),
  },
).then((r) => r.json());
```

---

### 用户点赞

`POST /api/code-community-growth/api/challenge/user-thumb` ✍️ 写操作未实测

用户点赞（源码注释标注为「测试场景」）。参数走 query，响应未声明泛型。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `testId` | number | 是 | 试卷 / 答题会话 id |
| `rankType` | number | 否 | 榜单类型（取值未验证） |

> 响应骨架（依据源码签名，**未实测**；响应未声明泛型，`data` 无业务数据字段）

```json
null
```

```js
await fetch(
  `${BASE}/api/code-community-growth/api/challenge/user-thumb?testId=123&rankType=1`,
  { method: "POST", headers: HEADERS },
).then((r) => r.json());
```

---

### 用户取消点赞

`POST /api/code-community-growth/api/challenge/user-unthumb` ✍️ 写操作未实测

取消用户点赞（源码注释标注为「测试场景」）。参数走 query，响应未声明泛型。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `testId` | number | 是 | 试卷 / 答题会话 id |
| `rankType` | number | 否 | 榜单类型（取值未验证） |

> 响应骨架（依据源码签名，**未实测**；响应未声明泛型，`data` 无业务数据字段）

```json
null
```

```js
await fetch(
  `${BASE}/api/code-community-growth/api/challenge/user-unthumb?testId=123&rankType=1`,
  { method: "POST", headers: HEADERS },
).then((r) => r.json());
```

---

## 入学测验 / 考试（entrance-exam）

入学测验 / 考试流程（对应前端 `api/oj/entrance-exam.ts`，服务同为 `code-community-growth`）。以下接口均需登录。

> **注意与 [problems.md](./problems.md) 的同名接口区分**：本组 `submit-problem-judge`、`get-test-judge-result`、`submit-problem-test-judge`、`submit-record-*` 挂在 `code-community-growth`，是另一套考试提交 / 判题记录，与题库的 `code-community` / `htoj-biz-gateway` 版本不是同一个接口。

### 考试信息

`GET /api/code-community-growth/api/exam/test-info` ⚠️

获取考试信息。响应类型 `TestInfoVo`。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `receiveId` | number | 是 | 考试领取 id |

探针未带参数时返回 `errCode=-1`：`receiveId is required.`。未取到有效样本，`TestInfoVo` 字段未验证。

> 响应骨架（依据类型 `TestInfoVo` 推导，**未实测**；字段定义不在仓库内，结构未知）

```json
null
```

```js
const data = await fetch(
  `${BASE}/api/code-community-growth/api/exam/test-info?receiveId=1`,
  { headers: HEADERS },
).then((r) => r.json());
```

---

### 考试题目详情

`GET /api/code-community-growth/api/exam/problem-detail` ⚠️

获取考试中的题目详情。响应类型 `CommonResultProblemDetailVo`。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `receiveId` | number | 是 | 考试领取 id |
| `problemId` | number | 是 | 题目 id |

探针未带参数时返回 `errCode=-1`：`receiveId is required.`（`problemId` 是否必填未逐一验证）。未取到有效样本，字段未验证。

> 响应骨架（依据类型 `CommonResultProblemDetailVo` 推导，**未实测**；字段定义不在仓库内，结构未知）

```json
null
```

```js
const data = await fetch(
  `${BASE}/api/code-community-growth/api/exam/problem-detail?receiveId=1&problemId=22169438826624`,
  { headers: HEADERS },
).then((r) => r.json());
```

---

### 创建试卷

`POST /api/code-community-growth/api/exam/create-test` ✍️ 写操作未实测

创建试卷。参数走 query，响应未声明泛型。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `testId` | number | 是 | 试卷 id |

> 响应骨架（依据源码签名，**未实测**；响应未声明泛型，`data` 无业务数据字段）

```json
null
```

```js
await fetch(`${BASE}/api/code-community-growth/api/exam/create-test?testId=123`, {
  method: "POST",
  headers: HEADERS,
}).then((r) => r.json());
```

---

### 交卷

`POST /api/code-community-growth/api/exam/submit` ✍️ 写操作未实测

交卷。`testId` 走 query，答案体类型 `SubmitJudgeDTO`（字段未验证）。响应未声明泛型。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `testId` | number | 是 | 试卷 id（query） |

> 响应骨架（依据源码签名，**未实测**；响应未声明泛型，`data` 无业务数据字段）

```json
null
```

```js
await fetch(`${BASE}/api/code-community-growth/api/exam/submit?testId=123`, {
  method: "POST",
  headers: { ...HEADERS, "Content-Type": "application/json" },
  body: JSON.stringify({ /* SubmitJudgeDTO，字段未验证 */ }),
}).then((r) => r.json());
```

---

### 考试提交判题

`POST /api/code-community-growth/api/submitRecord/submit-problem-judge` ✍️ 写操作未实测

考试内的题目提交判题。请求体类型 `SubmitJudgeDTO`（字段未验证）。响应未声明泛型。

> 响应骨架（依据源码签名，**未实测**；响应未声明泛型，`data` 无业务数据字段）

```json
null
```

```js
await fetch(
  `${BASE}/api/code-community-growth/api/submitRecord/submit-problem-judge`,
  {
    method: "POST",
    headers: { ...HEADERS, "Content-Type": "application/json" },
    body: JSON.stringify({ /* SubmitJudgeDTO，字段未验证 */ }),
  },
).then((r) => r.json());
```

---

### 查询考试判题结果

`GET /api/code-community-growth/api/submitRecord/get-test-judge-result` ⚠️

按 `testJudgeKey` 查询考试自测判题结果。响应类型 `TestJudgeVO`。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `testJudgeKey` | number | 是 | 源码签名类型为 `number`（与 [problems.md](./problems.md) 中同名接口的字符串 key 写法不同，实际取值未验证） |

探针未带参数时返回 `errCode=-1`：`testJudgeKey is required.`。未取到有效样本，`TestJudgeVO` 字段未验证（`re/samples/test-judge-result.json` 属于题库那套接口，不适用于本接口）。

> 响应骨架（依据类型 `TestJudgeVO` 推导，**未实测**；字段定义不在仓库内，结构未知）

```json
null
```

```js
const data = await fetch(
  `${BASE}/api/code-community-growth/api/submitRecord/get-test-judge-result?testJudgeKey=1`,
  { headers: HEADERS },
).then((r) => r.json());
```

---

### 考试自测提交

`POST /api/code-community-growth/api/submitRecord/submit-problem-test-judge` ✍️ 写操作未实测

考试内的自测运行提交。请求体类型 `TestJudgeDTO`（字段未验证）。响应类型 `string`。

> 响应骨架（依据类型 `string` 推导，**未实测**）

```json
"…"
```

```js
const data = await fetch(
  `${BASE}/api/code-community-growth/api/submitRecord/submit-problem-test-judge`,
  {
    method: "POST",
    headers: { ...HEADERS, "Content-Type": "application/json" },
    body: JSON.stringify({ /* TestJudgeDTO，字段未验证 */ }),
  },
).then((r) => r.json());
```

---

### 提交记录详情

`GET /api/code-community-growth/api/submitRecord/submit-record-detail` ❔ 未实测

按 `submitId` 查询考试提交记录详情。响应类型 `JudgeDetailVO`。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `submitId` | number | 是 | 提交 id |

**未实测**：探针将其判为「疑似写操作（GET）」而跳过探测（实际为只读查询），路由与响应字段均未验证。

> 响应骨架（依据类型 `JudgeDetailVO` 推导，**未实测**；字段定义不在仓库内，结构未知）

```json
null
```

```js
const data = await fetch(
  `${BASE}/api/code-community-growth/api/submitRecord/submit-record-detail?submitId=1`,
  { headers: HEADERS },
).then((r) => r.json());
```

---

### 客观题列表

`GET /api/code-community-growth/api/exam/objective-problem` ⚠️

获取某道客观题的小题索引。响应类型 `ObjectiveIndexVo[]`。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `problemId` | number | 是 | 题目 id |

探针未带参数时返回 `errCode=-1`：`problemId is required.`。未取到有效样本，`ObjectiveIndexVo` 字段未验证。

> 响应骨架（依据类型 `ObjectiveIndexVo[]` 推导，**未实测**；字段定义不在仓库内，结构未知）

```json
null
```

```js
const data = await fetch(
  `${BASE}/api/code-community-growth/api/exam/objective-problem?problemId=22169438826624`,
  { headers: HEADERS },
).then((r) => r.json());
```

---

### 切换试卷

`POST /api/code-community-growth/api/exam/switch-test` ✍️ 写操作未实测

切换试卷。参数走 query，响应未声明泛型。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `testId` | number | 是 | 试卷 id |

> 响应骨架（依据源码签名，**未实测**；响应未声明泛型，`data` 无业务数据字段）

```json
null
```

```js
await fetch(`${BASE}/api/code-community-growth/api/exam/switch-test?testId=123`, {
  method: "POST",
  headers: HEADERS,
}).then((r) => r.json());
```

---

### 提交记录列表

`GET /api/code-community-growth/api/submitRecord/submit-record-list` ❔ 未实测

获取某场考试的提交记录列表。响应类型 `PageJudgeListVO`。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `testId` | number | 是 | 试卷 id |

**未实测**：探针将其判为「疑似写操作（GET）」而跳过探测（实际为只读查询），路由与响应字段均未验证。

> 响应骨架（依据类型 `PageJudgeListVO` 推导，**未实测**；字段定义不在仓库内，结构未知）

```json
null
```

```js
const data = await fetch(
  `${BASE}/api/code-community-growth/api/submitRecord/submit-record-list?testId=123`,
  { headers: HEADERS },
).then((r) => r.json());
```

---

### 考试剩余时间

`GET /api/code-community-growth/api/exam/get-time-remain` ⚠️

获取考试剩余时间。响应类型 `number`。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `testId` | number | 是 | 试卷 id |

探针未带参数时返回 `errCode=-1`：`testId is required.`。

> 响应骨架（依据类型 `number` 推导，**未实测**）

```json
0
```

```js
const data = await fetch(
  `${BASE}/api/code-community-growth/api/exam/get-time-remain?testId=123`,
  { headers: HEADERS },
).then((r) => r.json());
```

---

## CSP 模拟排名（activity/csp）

CSP 模拟排名的三个接口（对应前端 `api/activity/csp.ts`）。服务前缀取自环境变量常量 `GATEWAY_PREFIX_COMMON`，源码里是变量拼接，无法静态解析，实测判定为「路径未解析」，因此**三个接口均标 ❔，未实测**。路径按常量取值 `GATEWAY_PREFIX_COMMON = "/api/htoj-biz-gateway"`（见 `re/api-inventory.json` 的 `consts`）补全，仅供参考。

参数均为 `query?: any`（前端未限定字段），响应类型见下。

### 模拟排名信息

`GET /api/htoj-biz-gateway/api/csp/get-mock-rank-info` ❔ 未实测

响应类型 `Record<string, any>`。

> 响应骨架（依据类型 `Record<string, any>` 推导，**未实测**；字段未定义，结构未知）

```json
null
```

```js
const data = await fetch(
  `${BASE}/api/htoj-biz-gateway/api/csp/get-mock-rank-info`,
  { headers: HEADERS },
).then((r) => r.json());
```

---

### 模拟排名列表

`GET /api/htoj-biz-gateway/api/csp/get-mock-rank-list` ❔ 未实测

响应类型 `Pagination<Record<string, any>>`（分页结构见 [index.md](./index.md)）。

> 响应骨架（依据类型 `Pagination<Record<string, any>>` 推导，**未实测**；`records` 元素类型为 `Record<string, any>`，结构未定义）

```json
{
  "records": [{}],
  "total": 0,
  "size": 20,
  "current": 1,
  "pages": 0,
  "orders": [],
  "searchCount": true
}
```

```js
const data = await fetch(
  `${BASE}/api/htoj-biz-gateway/api/csp/get-mock-rank-list?currentPage=1&limit=20`,
  { headers: HEADERS },
).then((r) => r.json());
```

---

### 模拟排名开关

`GET /api/htoj-biz-gateway/api/csp/get-mock-show-rank` ❔ 未实测

响应类型 `number`（推测为是否展示排名的开关值，未验证）。

> 响应骨架（依据类型 `number` 推导，**未实测**）

```json
0
```

```js
const data = await fetch(
  `${BASE}/api/htoj-biz-gateway/api/csp/get-mock-show-rank`,
  { headers: HEADERS },
).then((r) => r.json());
```
