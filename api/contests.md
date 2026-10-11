# 比赛

本页整理 HTOJ 的比赛相关接口，对应前端 `api/oj/contest.ts` 与 `api/oj/monthlyContest.ts`，覆盖比赛列表、详情 / 剩余时间、报名、开始比赛、题目、榜单、公告、赛后代码以及月赛报告。

网关地址、请求头、统一响应格式（`{ errCode, data, errMsg }`）、分页结构、`status` / `type` 枚举等全局约定见 [index.md](./index.md)，本页不再重复。类型名（如 `ContestVO`）集中定义在 [htoj-api.d.ts](./htoj-api.d.ts)。

## 通用请求头

除特别说明外，本页所有请求都走网关并需要下列请求头；缺失任意一个都可能被网关拒绝，最常见的是漏掉 `Hetao-Oj-Zone` 时报 `errCode=400 域属性为空或无效，无法获取数据`。下面每个范例都复用这里的 `HEADERS`：

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

写接口统一用 `POST`，请求体为 JSON（`"Content-Type": "application/json"`）。所有范例都返回 `{ errCode, data, errMsg }`，判断 `errCode === 0` 而不是 HTTP 状态码（HTTP 恒为 200）。

## 接口一览

| 接口 | 方法 | 路径 | 验证 |
| --- | --- | --- | --- |
| [比赛列表](#比赛列表) | GET | `/api/code-community/api/get-contest-list` | ✅ |
| [比赛详情 / 剩余时间](#比赛详情--剩余时间) | GET | `/api/code-community/api/get-contest-info` | ✅ |
| [比赛详情（旧）](#比赛详情旧接口) | GET | `/api/code-community/api/get-contest-detail` | 🚫 |
| [赛制字典](#赛制字典) | GET | `/api/code-community/api/get-contest-type-list` | ✅ |
| [状态字典](#状态字典) | GET | `/api/code-community/api/get-contest-status-list` | ✅ |
| [比赛题目](#比赛题目) | GET | `/api/code-community/api/get-contest-problem` | ✅ |
| [比赛榜单](#比赛榜单) | GET | `/api/code-community/api/get-contest-scoreboard` | ✅ |
| [比赛公告](#比赛公告) | GET | `/api/code-community/api/get-contest-announcement` | ✅ |
| [公告点赞](#公告点赞) | GET | `/api/code-community/api/contest-announcement-like` | ✍️ |
| [比赛讨论](#比赛讨论) | GET | `/api/code-community/api/contest-discussion` | ✅ |
| [进入权限](#进入权限) | GET | `/api/code-community/api/get-contest-access` | 🚫 |
| [比赛报名](#比赛报名) | POST | `/api/code-community/api/register-contest` | ✍️ |
| [开始比赛](#开始比赛) | POST | `/api/code-community/api/start-contest` | ✍️ |
| [报名信息收集预检](#报名信息收集预检) | POST | `/api/code-community/api/pre-gather-info` | ✍️ |
| [提交报名信息](#提交报名信息) | POST | `/api/code-community/api/gather-info` | ✍️ |
| [设置代码互看](#设置代码互看) | POST | `/api/code-community/gwpub/contest-user-share-code` | ✍️ |
| [赛后查看代码](#赛后查看代码) | GET | `/api/code-community/gwpub/contest-code-detail` | ⚠️ |
| [月赛报告](#月赛报告) | GET | `/api/code-community/gwpub/monthly-contest/report` | ❔ |
| [月赛结算报告](#月赛结算报告) | GET | `/api/code-community/gwpub/monthly-contest/settlement-report` | ❔ |

---

## 比赛列表

`GET /api/code-community/api/get-contest-list` ✅

分页拉取比赛列表（站点首页比赛区、比赛视图都用它）。需要登录。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `currentPage` | number | 否 | 页码，从 1 开始，默认 1 |
| `limit` | number | 否 | 每页条数，**上限 10** |
| `keyword` | string | 否 | 比赛名称关键词 |
| `status` | string | 否 | 状态多选，逗号拼接，如 `0,1`（`-1` 未开始 / `0` 进行中 / `1` 已结束） |
| `type` | string | 否 | 赛制多选，逗号拼接，如 `1,3`（`1` OI / `2` ACM / `3` 乐多 / `4` IOI / `5` IOI(OFS) / `6` 严格 IOI） |
| `matchType` | string | 否 | 赛事类型多选，逗号拼接（如 `1` = 核桃周赛）；具体取值未单独验证 |

要点：

- **每页上限 10 条**，`limit` 传得更大也不会返回更多。
- **不支持按 `gid` 过滤**：带 `gid` 的小组赛不会出现在这个列表里，插件里只能通过比赛链接手动添加。
- 返回为分页对象（见 index.md 分页一节）。

响应类型 `Pagination<ContestVO>`，`data.records[]` 关键字段（样例确认）：

```json
{
  "id": 22921376372096,
  "author": "核桃编程官方",
  "title": "【HT-131-MLS】核桃国庆马拉松 & XRCOI Round 11",
  "type": 3,
  "typeDesc": { "id": 3, "name": "乐多" },
  "ioType": 1,
  "ioTypeName": "标准IO",
  "description": "...",
  "status": 0,
  "statusDesc": { "id": 0, "name": "进行中" },
  "now": null,
  "startTime": 1790744400000,
  "endTime": 1791280800000,
  "duration": 536400,
  "openRank": false,
  "oiRankScoreType": "Recent",
  "count": 0,
  "problemCount": 11,
  "registered": true,
  "started": null,
  "remainTime": null,
  "contestRemainTime": null,
  "avatarList": [],
  "needPassword": false,
  "gid": null,
  "monthlyContest": false,
  "matchType": null,
  "matchTypeDesc": null
}
```

> `typeDesc` / `statusDesc` / `matchTypeDesc` 是 `{ id, name }` 对象而不是字符串，取文案要读 `.name`；`type` / `status` 才是数字枚举。`remainTime` / `contestRemainTime` 单位为**秒**。

```js
const data = await fetch(
  `${BASE}/api/code-community/api/get-contest-list?currentPage=1&limit=10&status=0`,
  { headers: HEADERS },
).then((r) => r.json());
```

---

## 比赛详情 / 剩余时间

`GET /api/code-community/api/get-contest-info` ✅

拉单场比赛的完整信息，是拿**个人剩余时间**的地方。响应为单个 `ContestVO`。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `cid` | number | 是 | 比赛 id |
| `gid` | number | 否 | 小组赛所在小组 id（小组赛必带） |
| `userId` | string | 否 | 指定用户视角；前端会带上，具体行为未单独验证 |

要点：

- **灵活时间制比赛必须用这里的 `remainTime` 计时**：它返回的是「服务端此刻的剩余秒数」——已点「开始比赛」时是个人剩余时间，未点开始时是比赛窗口剩余时间。不能用比赛窗口的 `endTime` 硬减，否则会明显偏大（个人限时往往远短于比赛窗口）。
- **它有时不回 `gid`**（样例中 `gid` 为 `0`）。小组赛要自己把链接里带过来的 `gid` 补上，否则后续拉题目 / 提交会被拒。
- 探针在未带 `cid` 时返回 `errCode=400`：`The required request parameters are missing：Required request parameter 'cid' for method parameter type Long is not present`。

响应字段在列表 record 的基础上补充（样例确认）：`now`、`started`、`remainTime`、`contestRemainTime`、`registerState`、`sameUser`、`submitFlag`、`answerFlag`、`hideResult`、`hideScoreboard`、`showUserScore`、`shareCode`、`userShareCode`、`showMaxTime`、`reportId`、`rewardList`、`ownerVo`、`zone`、`languages`、`scene`、`cspImitationSwitch`、`homeBackgroundImage`、`homeBottomColor`、`userMobile` 等。

> 响应示例（依据实测抓包 `re/samples/contest-info.json`，已脱敏）

```json
{
  "id": 22921376372096,
  "author": "用户4f2f06",
  "title": "【HT-131-MLS】核桃国庆马拉松 & XRCOI Round 11",
  "type": 3,
  "ioType": 1,
  "typeDesc": { "id": 3, "name": "乐多" },
  "description": "…",
  "status": 0,
  "statusDesc": { "id": 0, "name": "进行中" },
  "now": 1790854171462,
  "startTime": 1790744400000,
  "endTime": 1791280800000,
  "duration": 536400,
  "sealRank": false,
  "openPrint": false,
  "sealRankTime": 1790744400000,
  "rankShowName": "用户16f78a",
  "openRank": false,
  "oiRankScoreType": "Recent",
  "count": 263,
  "submitCount": null,
  "problemCount": 11,
  "registered": null,
  "started": true,
  "remainTime": 426628,
  "contestRemainTime": 426628,
  "avatarList": [],
  "needPassword": false,
  "needPasswordAfterEnd": false,
  "allowSubmitAfterEnd": true,
  "matchType": 1,
  "matchTypeDesc": { "id": 1, "name": "核桃周赛" },
  "monthlyContest": false,
  "contestGroupId": null,
  "contestGroupName": null,
  "reportId": null,
  "rewardList": [],
  "zone": "cpp",
  "languages": null,
  "registerState": 3,
  "owner": null,
  "gid": 0,
  "hideResult": 0,
  "hideScoreboard": 0,
  "ownerVo": {
    "uid": "19af82490f250ba5e484307b49b6216b",
    "nickname": "用户855e0b",
    "avatar": "https://example.invalid/de6364223ad7.png",
    "ccfLevel": null,
    "authenticationIcon": null,
    "userId": null
  },
  "sameUser": false,
  "isMock": false,
  "top": null,
  "submitFlag": 0,
  "answerFlag": 1,
  "needGather": null,
  "showRegisterCount": null,
  "productLineIds": null,
  "scene": null,
  "cspImitationSwitch": 0,
  "showUserScore": 1,
  "shareCode": 1,
  "userShareCode": 1,
  "showMaxTime": 1,
  "homeBackgroundImage": "",
  "homeBottomColor": "",
  "userMobile": null,
  "ioTypeName": "标准IO"
}
```

```js
const data = await fetch(
  `${BASE}/api/code-community/api/get-contest-info?cid=22921376372096`,
  { headers: HEADERS },
).then((r) => r.json());

const remainSeconds = data.data.remainTime; // 个人剩余时间，单位秒
```

---

## 比赛详情（旧接口）

`GET /api/code-community/api/get-contest-detail` 🚫

路径 `/api/code-community/api/get-contest-detail?id=`，需登录。

**实测被网关拒绝**：`403 Gateway Error:Access Denied`。前端源码里仍保留调用，但页面实际已改用 [`get-contest-info`](#比赛详情--剩余时间)。当前不可用，不建议使用。

> 响应骨架（旧接口已被网关拒绝，无响应样例，结构未知，**未实测**）

```json
null
```

---

## 赛制字典

`GET /api/code-community/api/get-contest-type-list` ✅

比赛赛制枚举，无参数，返回 `IdNameOption[]`。

```json
[
  { "id": 1, "name": "OI" },
  { "id": 2, "name": "ACM" },
  { "id": 3, "name": "乐多" },
  { "id": 4, "name": "IOI" },
  { "id": 5, "name": "IOI(OFS)" },
  { "id": 6, "name": "严格IOI" }
]
```

```js
const data = await fetch(`${BASE}/api/code-community/api/get-contest-type-list`, {
  headers: HEADERS,
}).then((r) => r.json());
```

---

## 状态字典

`GET /api/code-community/api/get-contest-status-list` ✅

比赛状态枚举，无参数，返回 `IdNameOption[]`。

```json
[
  { "id": -1, "name": "未开始" },
  { "id": 0, "name": "进行中" },
  { "id": 1, "name": "已结束" }
]
```

```js
const data = await fetch(`${BASE}/api/code-community/api/get-contest-status-list`, {
  headers: HEADERS,
}).then((r) => r.json());
```

---

## 比赛题目

`GET /api/code-community/api/get-contest-problem` ✅

拉某场比赛的题目列表。需要登录。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `cid` | number | 是 | 比赛 id，**不带会 400 缺参** |
| `gid` | number | 否 | 小组赛必带 |
| `currentPage` | number | 否 | 页码，从 1 开始 |
| `limit` | number | 否 | 每页条数（插件用 100，样例 `size=100`） |

要点：

- **`cid` 必须带**：探针返回 `errCode=400 The required request parameters are missing：Required request parameter 'cid' for method parameter type Long is not present`。
- 已报名但**没点「开始比赛」**时，后端会拒发题目（提示「请先开始比赛」）；比赛题目在后续拿题面 / 提交时也必须把 `cid`（小组赛再加 `gid`）一路带上，否则返回「该题目不可见」。详见 index.md 与 [problems.md](./problems.md)。

响应类型 `Pagination<ContestDetailProblemVO>`，`data.records[]` 字段（样例确认）：

```json
{
  "id": 85387,
  "displayId": 3,
  "cid": 22921376372096,
  "pid": 22920859951104,
  "displayTitle": "环灯巡夜",
  "indexTitle": "A",
  "type": 1,
  "color": null,
  "ac": null,
  "total": null,
  "status": { "id": 1, "name": "Accepted", "score": 100 },
  "difficulty": null,
  "difficultyDesc": null,
  "tags": null,
  "problemId": "P13034",
  "rn": null
}
```

> 展示题号请用 `indexTitle`（`A` / `B`），`displayId` 是数字序号；`status` 是对象且比别处多一个 `score`；`ac` / `total` / `difficulty` 在比赛题目里常为 `null`，算通过率前要判空。

```js
const data = await fetch(
  `${BASE}/api/code-community/api/get-contest-problem?cid=22921376372096&limit=100`,
  { headers: HEADERS },
).then((r) => r.json());
```

---

## 比赛榜单

`GET /api/code-community/api/get-contest-scoreboard` ✅

拉某场比赛的成绩表。需要登录。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `cid` | number | 是 | 比赛 id |
| `gid` | number | 否 | 小组赛必带 |
| `keyword` | string | 否 | 搜索关键词，**传数字 `userId` 可以只搜到自己那一行** |
| `onlyGroup` | number | 否 | 仅小组；具体取值未单独验证 |
| `currentPage` | number | 否 | 页码，从 1 开始 |
| `limit` | number | 否 | 每页条数 |

要点：

- 榜单**没有「只查我」的专用参数**。做法是 `keyword=<userId>`（即 JWT 里的数字 `id`）搜一遍，再按 `uid` 匹配自己那一行，即可拿到当前得分（`totalScore`）与排名（`rank`）。
- **OI 赛制（`type=1`）在比赛期间不对外实时排名**，榜单里没有本人成绩行，此时拿不到排名。

响应类型 `Pagination<ContestDetailScoreResponseVo>`，`data.records[]` 字段（样例确认）：

```json
{
  "id": 22921376372096,
  "type": 3,
  "ownerVo": { "uid": "...", "nickname": "用户992771", "avatar": "https://...", "ccfLevel": 0, "authenticationIcon": "", "userId": null },
  "uid": "...",
  "nickname": "用户992771",
  "realName": null,
  "showRealName": false,
  "avatar": null,
  "specialMark": null,
  "rank": 1,
  "totalScore": 1100,
  "afterTotalScore": null,
  "totalTime": 0,
  "problemScoreList": [
    {
      "sort": null, "pid": 22920859951104, "cpid": 1, "title": "A",
      "score": 100, "afterScore": null, "afterSubmitId": 0, "afterPass": null,
      "pass": true, "time": 0, "penaltyTime": 0, "retry": 1,
      "firstSubmit": false, "submitId": 51960700, "maxTime": 19
    }
  ],
  "typeDesc": { "id": 3, "name": "乐多" },
  "cheatTag": null,
  "userShareCode": 1
}
```

```js
const me = 8871358; // JWT payload 里的数字 id
const data = await fetch(
  `${BASE}/api/code-community/api/get-contest-scoreboard?cid=22921376372096&keyword=${me}&currentPage=1&limit=20`,
  { headers: HEADERS },
).then((r) => r.json());

const myRow = data.data.records.find((row) => row.uid === myUid);
// myRow.totalScore / myRow.rank
```

---

## 比赛公告

`GET /api/code-community/api/get-contest-announcement` ✅

拉某场比赛的公告列表，需要登录。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `cid` | number | 是 | 比赛 id |
| `gid` | number | 否 | 小组赛必带 |
| `currentPage` | number | 否 | 页码，从 1 开始 |
| `limit` | number | 否 | 每页条数 |

响应类型 `Pagination<AnnouncementListVO>`。样例那一场没有公告，返回空分页：

```json
{ "records": [], "total": 0, "size": 5, "current": 1, "orders": [], "searchCount": true, "pages": 0 }
```

> 公告条目的具体字段未从样例确认（样例为空）；`cid` 为必填，探针未带时返回 `400` 缺参。

```js
const data = await fetch(
  `${BASE}/api/code-community/api/get-contest-announcement?cid=22921376372096&currentPage=1&limit=5`,
  { headers: HEADERS },
).then((r) => r.json());
```

---

## 公告点赞

`GET /api/code-community/api/contest-announcement-like` ✍️

给比赛公告点赞 / 取消点赞。

**这是带副作用的 GET 写操作**，未在真实账号上实测。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `aid` | number | 是 | 公告 id |
| `toLike` | boolean | 是 | `true` 点赞，`false` 取消 |

响应未提供样例，未验证。

> 响应骨架（写操作，源码未声明响应类型，**未实测**）

```json
null
```

```js
await fetch(
  `${BASE}/api/code-community/api/contest-announcement-like?aid=22339004754816&toLike=true`,
  { headers: HEADERS },
).then((r) => r.json());
```

---

## 比赛讨论

`GET /api/code-community/api/contest-discussion` ✅

拉比赛相关的讨论 / 公告文章，无参数，返回文章数组（样例 `Array(20)`）。字段与文章对象一致（样例确认）：

```json
[
  {
    "id": 22339004754816,
    "title": "...",
    "titlePic": "",
    "description": "...",
    "content": null,
    "topPriority": null,
    "category": null,
    "uid": null,
    "author": "用户ec2c77",
    "avatar": "https://...",
    "titleName": null,
    "likeNum": 22,
    "viewNum": 1866,
    "hasLike": false,
    "selected": null
  }
]
```

```js
const data = await fetch(`${BASE}/api/code-community/api/contest-discussion`, {
  headers: HEADERS,
}).then((r) => r.json());
```

---

## 进入权限

`GET /api/code-community/api/get-contest-access` 🚫

路径 `/api/code-community/api/get-contest-access?cid=`，源码签名返回 `{ access: boolean }`，需登录。

**实测被网关拒绝**：`403 Gateway Error:Access Denied`。当前不可用。

> 响应骨架（字段依据正文源码签名 `{ access: boolean }`，**未实测**）

```json
{ "access": false }
```

---

## 比赛报名

`POST /api/code-community/api/register-contest` ✍️

报名参加比赛。**写操作，未实测**。

请求体：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `cid` | number | 是 | 比赛 id |
| `password` | string | 否 | 比赛密码（`needPassword` 为 `true` 时需要） |
| `gid` | number | 否 | 小组赛必带 |

响应 `{ registerState: number }`，`registerState` 枚举：

| 值 | 含义 |
| --- | --- |
| `0` | 校验未通过 |
| `1` | 待收集信息（还需要补报名信息，**此时只能到网页端完成**） |
| `2` | 校验通过、无需报名直接解锁 |
| `3` | 已报名 |

> 响应骨架（字段依据正文，**未实测**）

```json
{ "registerState": 0 }
```

```js
const data = await fetch(`${BASE}/api/code-community/api/register-contest`, {
  method: "POST",
  headers: { ...HEADERS, "Content-Type": "application/json" },
  body: JSON.stringify({ cid: 22921376372096 }),
}).then((r) => r.json());

// data.data.registerState === 1 时，需前往网页端补充报名信息
```

---

## 开始比赛

`POST /api/code-community/api/start-contest` ✍️

开始比赛 / **开启个人计时**。灵活时间制比赛点它之后才开始个人倒计时。**写操作，未实测**。

请求体：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `cid` | number | 是 | 比赛 id |
| `gid` | number | 否 | 小组赛必带 |

响应无业务数据字段（源码未声明泛型），报名后未开始的话 `get-contest-problem` 会返回「请先开始比赛」。

> 响应骨架（源码未声明泛型，无业务数据字段，**未实测**）

```json
null
```

```js
await fetch(`${BASE}/api/code-community/api/start-contest`, {
  method: "POST",
  headers: { ...HEADERS, "Content-Type": "application/json" },
  body: JSON.stringify({ cid: 22921376372096 }),
}).then((r) => r.json());
```

---

## 报名信息收集预检

`POST /api/code-community/api/pre-gather-info` ✍️

报名前信息收集的预检（判断需要收集哪些字段）。**写操作，未实测**。

请求体：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `cid` | number | 否 | 比赛 id |
| `gid` | number | 否 | 小组 id |
| `gatherType` | number | 否 | 收集类型 |

响应类型 `PreGatherInfoVO`，具体字段未验证（无样例）。

> 响应骨架（依据类型 `PreGatherInfoVO` 推导，**未实测**；字段定义不在仓库内，结构未知）

```json
null
```

```js
const data = await fetch(`${BASE}/api/code-community/api/pre-gather-info`, {
  method: "POST",
  headers: { ...HEADERS, "Content-Type": "application/json" },
  body: JSON.stringify({ cid: 22921376372096 }),
}).then((r) => r.json());
```

---

## 提交报名信息

`POST /api/code-community/api/gather-info` ✍️

提交报名信息收集表单。**写操作，未实测**。

请求体类型 `GatherInfoVO`，字段未验证（无样例）。

响应 `{ registerState: number }`，枚举同[比赛报名](#比赛报名)。

> 响应骨架（字段依据正文，**未实测**）

```json
{ "registerState": 0 }
```

```js
const data = await fetch(`${BASE}/api/code-community/api/gather-info`, {
  method: "POST",
  headers: { ...HEADERS, "Content-Type": "application/json" },
  body: JSON.stringify({ /* GatherInfoVO，字段未验证 */ }),
}).then((r) => r.json());
```

---

## 设置代码互看

`POST /api/code-community/gwpub/contest-user-share-code` ✍️

选手自选模式下设置本场比赛是否开放代码互看。**写操作，未实测**。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `cid` | number | 是 | 比赛 id |
| `userShareCode` | number | 是 | `1` 开放，`0` 不开放 |

参数走 query。

> 响应骨架（写操作，源码未声明响应类型，**未实测**）

```json
null
```

```js
await fetch(
  `${BASE}/api/code-community/gwpub/contest-user-share-code?cid=22921376372096&userShareCode=1`,
  { method: "POST", headers: HEADERS },
).then((r) => r.json());
```

---

## 赛后查看代码

`GET /api/code-community/gwpub/contest-code-detail` ⚠️

赛后查看指定提交的代码及测试点详情。路由存在，但需完整参数。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `cid` | number | 是 | 比赛 id |
| `uid` | string | 是 | 提交者 uid |
| `pid` | number | 是 | 题目 pid |
| `submitId` | number | 是 | 提交 id |

探针未带 `cid` 时返回 `errCode=400 The required request parameters are missing：Required request parameter 'cid' for method parameter type Long is not present`，其余参数是否必填未逐一验证。

响应类型 `JudgeDetailVO`，未提供样例、字段未验证。

> 响应骨架（依据类型 `JudgeDetailVO` 推导，**未实测**；字段定义不在仓库内，结构未知）

```json
null
```

```js
const data = await fetch(
  `${BASE}/api/code-community/gwpub/contest-code-detail?cid=22921376372096&uid=xxx&pid=22920859951104&submitId=51960700`,
  { headers: HEADERS },
).then((r) => r.json());
```

---

## 月赛报告

`GET /api/code-community/gwpub/monthly-contest/report` ❔

获取月赛报告页的报告详情。**未实测**（路径由前端源码常量解析得到）。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `reportId` | string | 是 | 报告 id |

响应类型 `ContestReportDto`，字段未验证。

> 响应骨架（依据类型 `ContestReportDto` 推导，**未实测**；字段定义不在仓库内，结构未知）

```json
null
```

```js
const data = await fetch(
  `${BASE}/api/code-community/gwpub/monthly-contest/report?reportId=xxx`,
  { headers: HEADERS },
).then((r) => r.json());
```

---

## 月赛结算报告

`GET /api/code-community/gwpub/monthly-contest/settlement-report` ❔

获取月赛结算页的汇总报告。**未实测**（路径由前端源码常量解析得到）。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `cid` | number | 是 | 比赛 id |

响应类型 `ContestReportSummaryDto`，字段未验证。

> 响应骨架（依据类型 `ContestReportSummaryDto` 推导，**未实测**；字段定义不在仓库内，结构未知）

```json
null
```

```js
const data = await fetch(
  `${BASE}/api/code-community/gwpub/monthly-contest/settlement-report?cid=22921376372096`,
  { headers: HEADERS },
).then((r) => r.json());
```
