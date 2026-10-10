# 成长体系

本页整理 HTOJ 的成长体系相关接口：等级声望、任务与激励、背包与徽章、农场与证书，以及活动红包。对应前端 `api/oj/incentive.ts`、`api/oj/farm.ts`、`api/oj/farm-share.ts`、`api/oj/activity.ts`，全部走 `code-community-actuator` 网关。

本文覆盖 31 个接口：✅13 / ⚠️6 / 🚫0 / ✍️9 / ❔3。

> 网关地址、请求头、统一响应格式（`{ errCode, data, errMsg }`）、分页结构、`Hetao-Oj-Zone` 缺失等全局约定见 [index.md](./index.md)，本页不再重复。类型名集中定义在 [htoj-api.d.ts](./htoj-api.d.ts)；本页多数响应类型来自前端 `@core/types/*`，**不在** d.ts 中，会一并说明字段来源。
>
> 相关域：星际对战（Battle Contest）见 [battle.md](./battle.md)，挑战与考试见 [challenges.md](./challenges.md)，本页不重复。

## 通用请求头

除特别说明外，本页所有请求都走网关并复用下面的 `HEADERS`；缺任意一个都可能被网关拒绝，最常见的是漏掉 `Hetao-Oj-Zone` 时报 `errCode=400 域属性为空或无效，无法获取数据`。本页探针均在登录态下执行，未单独验证各接口的真实鉴权要求。

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

写接口（PUT / POST）请求体为 JSON，需要 `"Content-Type": "application/json"`。所有响应都判断 `errCode === 0`，不要用 HTTP 状态码（恒为 200）。

## 接口清单

| 接口 | 方法 | 路径 | 验证 | 说明 |
| --- | --- | --- | --- | --- |
| [当前等级信息](#当前等级信息) | GET | `/api/code-community-actuator/api/user/level/getCurLevelInfo` | ⚠️ | 当前声望、等级、升级所需声望 |
| [全部等级奖励](#全部等级奖励) | GET | `/api/code-community-actuator/api/level/reward` | ✅ | 各等级对应奖励，一次性返回不分页 |
| [可领取任务奖励探测](#可领取任务奖励探测) | GET | `/api/code-community-actuator/api/user/mission/can-receive` | ✅ | 是否有待领取的任务奖励 |
| [任务列表](#任务列表) | GET | `/api/code-community-actuator/api/user/mission/list` | ✅ | C 端任务列表 |
| [领取任务奖励](#领取任务奖励) | PUT | `/api/code-community-actuator/api/user/mission/get-reward` | ✍️ | 领取任务 / 阶梯任务奖励 |
| [抽取随机任务](#抽取随机任务) | POST | `/api/code-community-actuator/api/user/mission/draw-mission` | ✍️ | 抽取一条随机任务 |
| [随机任务池](#随机任务池) | GET | `/api/code-community-actuator/api/user/mission/random-list` | ✅ | 随机任务池中的任务列表 |
| [我的背包](#我的背包) | GET | `/api/code-community-actuator/api/user/backpack/my-backpack` | ✅ | 已获取的装扮 / 奖励 |
| [装备与卸下](#装备与卸下) | PUT | `/api/code-community-actuator/api/user/backpack/onoff-outfit` | ✍️ | 使用 / 卸下装扮 |
| [用户徽章列表](#用户徽章列表) | GET | `/api/code-community-actuator/api/user/backpack/user-badge-list` | ⚠️ | 用户的徽章分类概览 |
| [徽章墙分类明细](#徽章墙分类明细) | GET | `/api/code-community-actuator/api/user/backpack/user-tab-badge` | ⚠️ | 按分类拉取徽章明细 |
| [农场规则](#农场规则) | GET | `/api/code-community-actuator/gwpub/user/farm/farmRule` | ✅ | 农场相关说明链接 |
| [荣誉墙（格子墙）](#荣誉墙格子墙) | GET | `/api/code-community-actuator/gwpub/user/farm/getUserMosaicWall` | ✅ | 主页格子墙进度与点赞 |
| [农场召回判断](#农场召回判断) | GET | `/api/code-community-actuator/gwpub/user/farm/recall-check` | ✅ | 是否展示召回弹窗 |
| [奖项认证（单条）](#奖项认证单条) | POST | `/api/code-community-actuator/gwpub/api/user/award/apply/addAndQueryRemain` | ✍️ | 提交一条奖项认证申请 |
| [奖项认证（批量）](#奖项认证批量) | POST | `/api/code-community-actuator/gwpub/api/user/award/apply/addBatch` | ✍️ | 批量补充奖项材料 |
| [已领取证书](#已领取证书) | GET | `/api/code-community-actuator/gwpub/api/user/award/apply/receivedCertificates` | ❔ | 已认证通过的证书 |
| [我的奖项申请](#我的奖项申请) | GET | `/api/code-community-actuator/gwpub/api/user/award/apply/my/awards` | ❔ | 我的奖项认证记录 |
| [待领取奖项](#待领取奖项) | GET | `/api/code-community-actuator/gwpub/api/user/award/apply/my/unreceived-awards` | ❔ | 未领取的奖项 |
| [领取奖项](#领取奖项) | POST | `/api/code-community-actuator/gwpub/api/user/award/apply/my/awards/receive` | ✍️ | 按 id 批量领取奖项 |
| [证书类型字典](#证书类型字典) | GET | `/api/code-community-actuator/gwpub/api/user/award/apply/certificateTypes` | ✅ | 证书类型下拉项 |
| [证书级别字典](#证书级别字典) | GET | `/api/code-community-actuator/gwpub/api/user/award/apply/certificateLevels` | ⚠️ | 按证书类型取级别下拉项 |
| [证书年份字典](#证书年份字典) | GET | `/api/code-community-actuator/gwpub/api/user/award/apply/certificateYears` | ✅ | 可选年份列表 |
| [分享奖励状态](#分享奖励状态) | GET | `/api/code-community-actuator/gwpub/user/farm/share/shareRewardStatus` | ✅ | 首次下载 / 首次扫码奖励状态 |
| [通知下载完成](#通知下载完成) | POST | `/api/code-community-actuator/gwpub/user/farm/share/downloadSuccess` | ✍️ | 上报下载完成以领奖励 |
| [查询二维码缓存](#查询二维码缓存) | POST | `/api/code-community-actuator/gwpub/user/farm/share/queryQrCodeCache` | ✍️ | 按图片 MD5 查缓存二维码 |
| [生成分享二维码](#生成分享二维码) | POST | `/api/code-community-actuator/gwpub/user/farm/share/generateShareQrCode` | ✍️ | 为分享图生成二维码 |
| [活动详情](#活动详情) | GET | `/api/code-community-actuator/api/battle/activity` | ⚠️ | 指定活动的详细数据 |
| [我的活动奖励](#我的活动奖励) | GET | `/api/code-community-actuator/api/battle/myReward` | ⚠️ | 我在活动中获得的奖励 |
| [提交后检查奖励](#提交后检查奖励) | GET | `/api/code-community-actuator/api/battle/reward` | ✅ | AC 后检查是否掉落奖励 |
| [端午活动详情](#端午活动详情) | GET | `/api/code-community-actuator/api/battle/duanwuActivity` | ✅ | 端午阵营战活动详情 |

---

## 等级与积分

### 当前等级信息

`GET /api/code-community-actuator/api/user/level/getCurLevelInfo` ⚠️ 路由存在但返回服务端错误

获取当前声望值、等级，以及当前等级的声望上下限与下一等级奖励。前端 `LevelService` 会缓存该结果并在升级 / 领奖后重新拉取（`services/level.service.ts`）。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| — | — | — | 无参数 |

响应类型 `CurrentLevelInfoVO`（前端 `@core/types/incentive`，未包含在 [htoj-api.d.ts](./htoj-api.d.ts)）。C 端组件用到的字段：`curLevel`（当前等级）、`curReputation`（当前声望）、`maxReputation`（当前等级声望上限）。

> **坑**：探针在登录态下返回 `errCode=500 Server Error!`（HTTP 200），路由存在但未取到有效数据。字段以源码用法为准，未实测确认完整结构。

```js
const data = await fetch(
  `${BASE}/api/code-community-actuator/api/user/level/getCurLevelInfo`,
  { headers: HEADERS },
).then((r) => r.json());
// data.data.curLevel / data.data.curReputation / data.data.maxReputation
```

### 全部等级奖励

`GET /api/code-community-actuator/api/level/reward` ✅

查询各等级对应的奖励，一次性返回不分页。前端 `LevelRewardModal` 用它渲染等级奖励弹窗。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| — | — | — | 无参数 |

响应类型 `LevelRewardVO[]`。实测样例返回空数组（`[]`），具体字段未验证：

```json
{ "errCode": 0, "data": [], "errMsg": "success" }
```

> 未取到有效样本，`LevelRewardVO` 具体字段未验证。

```js
const data = await fetch(`${BASE}/api/code-community-actuator/api/level/reward`, {
  headers: HEADERS,
}).then((r) => r.json());
```

---

## 任务与激励

> 前端 `utils/constant.ts` 定义了任务相关的常量，疑似用于本节字段，但源码中未见绑定，仅供参考：
>
> - `MISSION_TASK_TYPES`：`1`=NORMAL，`2`=RANDOM。
> - `MISSION_TASK_STATUS`：`0`=LOTTERY，`1`=UNFINISHED，`2`=FINISHED，`3`=RECEIVED。

### 可领取任务奖励探测

`GET /api/code-community-actuator/api/user/mission/can-receive` ✅

轮询是否有待领取的任务奖励（返回布尔值），前端用它在有可领奖励时给入口加红点。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| — | — | — | 无参数 |

响应 `data` 为布尔值，实测样例返回 `false`：

```json
{ "errCode": 0, "data": false, "errMsg": "success" }
```

```js
const data = await fetch(
  `${BASE}/api/code-community-actuator/api/user/mission/can-receive`,
  { headers: HEADERS },
).then((r) => r.json());
const canReceive = data.data; // boolean
```

### 任务列表

`GET /api/code-community-actuator/api/user/mission/list` ✅

C 端任务列表，返回当前用户的任务（含对战类、新手引导类等）。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| — | — | — | 无参数 |

响应类型 `MissionVO[]`（前端 `@core/types/incentive`）。实测样例（`Array(31)`）中单条记录字段：

```json
[
  {
    "id": 22266965003776,
    "missionId": 22234831962435,
    "name": "元宵对战",
    "type": 3,
    "status": 3,
    "remainTime": -51850462734,
    "isLadder": 0,
    "missionInfo": []
  },
  {
    "id": 22269263554324,
    "missionId": 22338869310976,
    "name": "新手引导任务",
    "type": 1,
    "status": 2,
    "remainTime": 268470337266,
    "isLadder": 0,
    "missionInfo": [
      {
        "id": 22321373819395,
        "name": null,
        "isComplete": 1,
        "finishFactorCount": 1,
        "totalFactorCount": 1,
        "status": 2,
        "rewardScore": 1
      }
    ]
  }
]
```

- `id` 是「用户任务」记录 id，`missionId` 是任务定义 id；两者不同，领取奖励时用 `userMissionId`（见下）。
- `type` 实测出现 `1` / `3`，与 `MISSION_TASK_TYPES`（仅 1 / 2）对不上，**具体语义未验证**。
- `status` 实测出现 `2` / `3`，疑似对应 `MISSION_TASK_STATUS` 的 FINISHED / RECEIVED，**未验证**。
- `remainTime` 为毫秒级剩余时间，可为负数（已过期）。
- `isLadder` `0` / `1` 表示是否「阶梯任务」；阶梯任务的子任务在 `missionInfo[]` 中，字段：`id`、`name`、`isComplete`、`finishFactorCount`、`totalFactorCount`、`status`、`rewardScore` 等（样本被截断，完整字段未验证）。

```js
const data = await fetch(
  `${BASE}/api/code-community-actuator/api/user/mission/list`,
  { headers: HEADERS },
).then((r) => r.json());
```

### 领取任务奖励

`PUT /api/code-community-actuator/api/user/mission/get-reward` ✍️ 写操作未实测

领取任务奖励。**写操作，未在真实账号上复测**。

请求体：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `userMissionId` | number | 是 | 「用户任务」记录 id（取自任务列表的 `id`；也可能取 `missionId`，未验证） |
| `ladderId` | number | 否 | 阶梯任务（`isLadder=1`）时指定具体阶梯项 id |

响应结构未验证（源码未声明泛型）。

```js
await fetch(`${BASE}/api/code-community-actuator/api/user/mission/get-reward`, {
  method: "PUT",
  headers: { ...HEADERS, "Content-Type": "application/json" },
  body: JSON.stringify({ userMissionId: 22269263554324 }),
}).then((r) => r.json());
```

### 抽取随机任务

`POST /api/code-community-actuator/api/user/mission/draw-mission` ✍️ 写操作未实测

抽取一条随机任务。**写操作，未复测**。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| — | — | — | 无请求体 |

响应类型 `MissionVO`（单个任务，字段同任务列表记录）。未实测。

```js
await fetch(`${BASE}/api/code-community-actuator/api/user/mission/draw-mission`, {
  method: "POST",
  headers: HEADERS,
}).then((r) => r.json());
```

### 随机任务池

`GET /api/code-community-actuator/api/user/mission/random-list` ✅

查询随机任务池中的任务列表（下拉选项）。无参数，实测返回空数组：

```json
{ "errCode": 0, "data": [], "errMsg": "success" }
```

响应类型 `IdNameOption[]`（`{ id, name }`，参见 [htoj-api.d.ts](./htoj-api.d.ts) 的 `IdName`）。

```js
const data = await fetch(
  `${BASE}/api/code-community-actuator/api/user/mission/random-list`,
  { headers: HEADERS },
).then((r) => r.json());
```

---

## 背包与徽章

> 前端 `utils/constant.ts` 的 `EQUIP_TYPES`：`1`=光标拖尾(CURSOR_TRAILS)、`2`=头像框(AVATAR_FRAME)、`3`=等级装饰(GRADE_DECORATION)、`4`=主页背景(HOME_BACKGROUND)；疑似对应背包奖励的 `type` 字段（未在源码中确认绑定）。徽章分类 `BADGE_CATEGORY`：`1`=谷子(GOODS)、`2`=挑战(CHALLENGE)、`3`=活动(ACTIVITY)、`4`=银河(GALAXY)。

### 我的背包

`GET /api/code-community-actuator/api/user/backpack/my-backpack` ✅

获取当前用户已领取的奖励 / 装扮。无参数。

响应类型 `RewardVO[]`（前端 `@core/types/incentive`）。实测样例（`Array(68)`）单条记录字段：

```json
[
  {
    "id": 22302326785155,
    "rewardId": 22302325480832,
    "type": 5,
    "name": "题解拓荒者",
    "image": "https://public.hetaoimg.com//code-community/reward/prod/....png",
    "isEquip": true,
    "equipTime": 1742369280000
  }
]
```

- `id` 用于「装备与卸下」（`toggleEquip` 的 `id`）。
- `rewardId` 是奖励定义 id；`type` 为奖励类型；`isEquip` 是否已装备；`equipTime` 装备时间（毫秒时间戳）。
- 实测出现 `type=5`，不在 `EQUIP_TYPES`（1–4）内，**type 语义未验证**。

```js
const data = await fetch(
  `${BASE}/api/code-community-actuator/api/user/backpack/my-backpack`,
  { headers: HEADERS },
).then((r) => r.json());
```

### 装备与卸下

`PUT /api/code-community-actuator/api/user/backpack/onoff-outfit` ✍️ 写操作未实测

使用装备和卸下装备。**写操作，未复测**。

请求体：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | number | 是 | 背包奖励 id（`RewardVO.id`） |
| `isEquip` | boolean | 是 | `true` 装备，`false` 卸下 |

响应结构未验证（源码未声明泛型）。

```js
await fetch(`${BASE}/api/code-community-actuator/api/user/backpack/onoff-outfit`, {
  method: "PUT",
  headers: { ...HEADERS, "Content-Type": "application/json" },
  body: JSON.stringify({ id: 22302326785155, isEquip: true }),
}).then((r) => r.json());
```

### 用户徽章列表

`GET /api/code-community-actuator/api/user/backpack/user-badge-list` ⚠️ 路由存在但参数不足

查询某用户的徽章概览。徽章墙组件 `BadgeWall` 用它初始化 `userBadgeList`。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `uid` | string | 是 | 目标用户 uid；缺失时报错见下 |

响应类型 `UserBudgeList`（前端 `@core/types/auto/actuator`）。源码中初始化为对象 `{}`，具体键结构未验证。

> **坑**：探针未带 `uid` 时返回 `errCode=400`：
> `The required request parameters are missing：Required request parameter 'uid' for method parameter type String is not present`

```js
const data = await fetch(
  `${BASE}/api/code-community-actuator/api/user/backpack/user-badge-list?uid=<uid>`,
  { headers: HEADERS },
).then((r) => r.json());
```

### 徽章墙分类明细

`GET /api/code-community-actuator/api/user/backpack/user-tab-badge` ⚠️ 路由存在但参数不足

按分类拉取徽章明细，用于徽章墙的分 tab 展示。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `tabId` | number | 是 | 分类，取值 `BADGE_CATEGORY`：`1`=谷子 / `2`=挑战 / `3`=活动 / `4`=银河 |
| `uid` | string | 是 | 目标用户 uid |
| `missionTime` | number | 否 | 谷子分类翻页用（`BADGE_CATEGORY.GOODS`） |

响应类型 `UserBudgeDetailList`。源码按 `tabId` 取用其中的分字段：`challengeBudges`（挑战）、`activityBudges`（活动）、`yinheBudges`（银河，元素为 `{ missionName, userBudgeDetailDTOList[] }`）、`goodsBudges`（谷子，元素为 `UserGoodsBudgeDetailDTO`）。徽章项 `UserBudgeDetailDTO` 含 `category`、`missionTime` 等字段。

> **坑**：探针未带 `uid` 时返回 `errCode=400`：
> `The required request parameters are missing：Required request parameter 'uid' for method parameter type String is not present`
>
> 未取到有效样本，`UserBudgeDetailList` / `UserBudgeDetailDTO` 完整结构与字段类型未验证。

```js
const data = await fetch(
  `${BASE}/api/code-community-actuator/api/user/backpack/user-tab-badge?tabId=2&uid=<uid>`,
  { headers: HEADERS },
).then((r) => r.json());
```

---

## 农场与证书

> 「农场」是成长体系里的荣誉 / 奖项中心：用户在**荣誉墙（格子墙）**上点亮格子，提交**竞赛奖项**做认证，认证通过后可领取**证书**并展示到主页。本节的 `certificate*` 字典接口提供奖项申请表单的选项，`my/awards*` 是「我的奖项」相关接口。

### 农场规则

`GET /api/code-community-actuator/gwpub/user/farm/farmRule` ✅

返回农场（荣誉墙）相关的说明链接，均为站内页面 URL。无参数。

实测响应 `data`：

```json
{
  "certRule": "https://htoj.com.cn/cpp/discuss/post/detail?id=22782262769408&type=1",
  "appealPost": "https://htoj.com.cn/cpp/discuss/post/detail?id=22782313767040&type=1",
  "farmRule": "https://htoj.com.cn/cpp/discuss/post/detail?id=22780248073600&type=1",
  "problem": "https://htoj.com.cn/cpp/oj/problem/detail?pid=22749207547648"
}
```

字段含义：`certRule`=证书规则帖、`appealPost`=申诉帖、`farmRule`=农场规则帖、`problem`=农场入口题目链接。响应类型 `FarmRuleVo`。

```js
const data = await fetch(
  `${BASE}/api/code-community-actuator/gwpub/user/farm/farmRule`,
  { headers: HEADERS },
).then((r) => r.json());
```

### 荣誉墙（格子墙）

`GET /api/code-community-actuator/gwpub/user/farm/getUserMosaicWall` ✅

获取用户主页格子墙（荣誉墙）数据，含点赞数与已点亮格子进度。不传 `uid` 时查询当前登录用户。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `uid` | string | 否 | 目标用户 uid；不传则查当前登录用户 |

响应类型 `UserMosaicWallVo`。实测 `data` 形状 `object{thumbCount,thumbed,userMosaicProgressDTO,userLargeMosaicDTO}`，样例片段：

```json
{
  "thumbCount": 5,
  "thumbed": false,
  "userMosaicProgressDTO": [
    { "index": 20221113, "color": 1 },
    { "index": 20221126, "color": 1 }
  ]
}
```

- `thumbCount` 点赞数，`thumbed` 当前用户是否已点赞。
- `userMosaicProgressDTO` 为一组 `{ index, color }`，`index` 形如 `20221113`（疑似「年月日」编码的格子位置），`color` 为点亮色号；`userLargeMosaicDTO` 为整墙大图数据（样本截断，结构未验证）。

```js
const data = await fetch(
  `${BASE}/api/code-community-actuator/gwpub/user/farm/getUserMosaicWall`,
  { headers: HEADERS },
).then((r) => r.json());
```

### 农场召回判断

`GET /api/code-community-actuator/gwpub/user/farm/recall-check` ✅

农场开启时的召回判断，返回是否需要展示召回弹窗。无参数。

实测响应：`data` 为 `{ "needShow": false }`（类型 `FarmRecallVO`）。

```js
const data = await fetch(
  `${BASE}/api/code-community-actuator/gwpub/user/farm/recall-check`,
  { headers: HEADERS },
).then((r) => r.json());
```

### 奖项认证（单条）

`POST /api/code-community-actuator/gwpub/api/user/award/apply/addAndQueryRemain` ✍️ 写操作未实测

提交一条竞赛奖项认证申请，返回剩余可认证名额等信息。**写操作，未复测**。

请求体类型 `UserAwardApplyDTO`（前端 `@core/types/auto/actuator`），表单字段（见 `AwardVerificationModal.service.ts`）：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `userName` | string | 是 | 证书上的姓名 |
| `schoolName` | string | 否 | 学校名（不带学校时前端会连同 `schoolId` 一起删除） |
| `certificateType` | number | 是 | 证书类型 id，取自「证书类型字典」 |
| `certificateAwardLevel` | number | 是 | 奖项级别：`1`=一等奖 / `2`=二等奖 / `3`=三等奖 |
| `awardYear` | number | 是 | 获奖年份，取自「证书年份字典」 |
| `awardFileUrl` | string | 是 | 证书图片 URL（先经上传接口上传） |
| `schoolId` | number | 否 | 学校 id |
| `forceSubmit` | boolean | 否 | 冲突时强制提交（由前端在冲突确认后附加，不在表单默认字段内） |

响应类型 `AwardApplyResultVo`，字段未验证。

```js
await fetch(
  `${BASE}/api/code-community-actuator/gwpub/api/user/award/apply/addAndQueryRemain`,
  {
    method: "POST",
    headers: { ...HEADERS, "Content-Type": "application/json" },
    body: JSON.stringify({
      userName: "张三",
      certificateType: 1,
      certificateAwardLevel: 1,
      awardYear: 2025,
      awardFileUrl: "https://...",
    }),
  },
).then((r) => r.json());
```

### 奖项认证（批量）

`POST /api/code-community-actuator/gwpub/api/user/award/apply/addBatch` ✍️ 写操作未实测

批量补充奖项材料（针对已存在但缺图片的奖项）。**写操作，未复测**。

请求体：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `awardList` | `UserAwardApplyDTO[]` | 是 | 待提交的奖项列表 |

前端实际只提交每项的 `awardFileUrl` 与 `userAwardId` 两个字段（`submitBatch`），其余字段可缺省。

响应结构未验证（源码未声明泛型）。

```js
await fetch(
  `${BASE}/api/code-community-actuator/gwpub/api/user/award/apply/addBatch`,
  {
    method: "POST",
    headers: { ...HEADERS, "Content-Type": "application/json" },
    body: JSON.stringify({ awardList: [{ userAwardId: 123, awardFileUrl: "https://..." }] }),
  },
).then((r) => r.json());
```

### 已领取证书

`GET /api/code-community-actuator/gwpub/api/user/award/apply/receivedCertificates` ❔ 未实测

查询已认证通过的证书。前端 `home.service.ts` 用它填充主页的 `verifiedAwardList`。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `uid` | string | 否 | 目标用户 uid；不传则为当前用户 |

- **未实测，依据源码签名**。接口清单把它标为「疑似写操作（GET）」，但按源码语义应是只读。
- 响应类型 `UserCertificateVO[]`，字段未验证（无样本）。

```js
const data = await fetch(
  `${BASE}/api/code-community-actuator/gwpub/api/user/award/apply/receivedCertificates?uid=<uid>`,
  { headers: HEADERS },
).then((r) => r.json());
```

### 我的奖项申请

`GET /api/code-community-actuator/gwpub/api/user/award/apply/my/awards` ❔ 未实测

查询当前用户提交的奖项认证记录。无参数。

> **未实测，依据源码签名**（在 `MyVerifiedAward` / `AwardVerifiedOkModal` 等处使用）。响应类型 `AwardCertificateAuditRecordVO[]`，字段未验证（无样本）。

```js
const data = await fetch(
  `${BASE}/api/code-community-actuator/gwpub/api/user/award/apply/my/awards`,
  { headers: HEADERS },
).then((r) => r.json());
```

### 待领取奖项

`GET /api/code-community-actuator/gwpub/api/user/award/apply/my/unreceived-awards` ❔ 未实测

查询当前用户未领取的奖项。无参数。

> **未实测，依据源码签名**。响应类型 `AwardCertificateAuditRecordVO[]`，字段未验证（无样本）。

```js
const data = await fetch(
  `${BASE}/api/code-community-actuator/gwpub/api/user/award/apply/my/unreceived-awards`,
  { headers: HEADERS },
).then((r) => r.json());
```

### 领取奖项

`POST /api/code-community-actuator/gwpub/api/user/award/apply/my/awards/receive` ✍️ 写操作未实测

按奖项 id 批量领取。**写操作，未复测**。

请求体为 `number[]`（奖项 id 数组）：

```json
[12345, 67890]
```

响应结构未验证（源码未声明泛型）。

```js
await fetch(
  `${BASE}/api/code-community-actuator/gwpub/api/user/award/apply/my/awards/receive`,
  {
    method: "POST",
    headers: { ...HEADERS, "Content-Type": "application/json" },
    body: JSON.stringify([12345]),
  },
).then((r) => r.json());
```

### 证书类型字典

`GET /api/code-community-actuator/gwpub/api/user/award/apply/certificateTypes` ✅

奖项认证表单的「证书类型」下拉项。无参数。

实测响应 `data`（`Array(10)`）：

```json
[
  { "name": "CSP-J", "id": 1 },
  { "name": "CSP-S", "id": 2 },
  { "name": "NOIP", "id": 3 },
  { "name": "APIO", "id": 4 },
  { "name": "NOI D类", "id": 51 },
  { "name": "NOI", "id": 5 },
  { "name": "WC", "id": 6 },
  { "name": "IOI", "id": 8 },
  { "name": "GESP（python）", "id": 9 },
  { "name": "GESP（C++）", "id": 10 }
]
```

响应类型 `{ id: number; name: string }[]`（等价于 [htoj-api.d.ts](./htoj-api.d.ts) 的 `IdName[]`）。注意 `NOI D类` 的 id 是 `51`，与 `NOI`（`5`）不同。

```js
const data = await fetch(
  `${BASE}/api/code-community-actuator/gwpub/api/user/award/apply/certificateTypes`,
  { headers: HEADERS },
).then((r) => r.json());
```

### 证书级别字典

`GET /api/code-community-actuator/gwpub/api/user/award/apply/certificateLevels` ⚠️ 路由存在但参数不足

按证书类型取该类型的级别下拉项。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `certificateType` | number | 是 | 证书类型 id（取自「证书类型字典」） |

> **坑**：探针未带 `certificateType` 时返回 `errCode=400`：
> `The required request parameters are missing：Required request parameter 'certificateType' for method parameter type Integer is not present`
>
> 注意：Java 侧要求的参数名是 `certificateType`；前端源码的 query 字段写在 `certType` 形参上、但发出去的键是 `certificateType`（见 `farm.ts`）。

响应类型 `{ id: number; name: string }[]`，未取到有效样本，具体条目未验证。

```js
const data = await fetch(
  `${BASE}/api/code-community-actuator/gwpub/api/user/award/apply/certificateLevels?certificateType=1`,
  { headers: HEADERS },
).then((r) => r.json());
```

### 证书年份字典

`GET /api/code-community-actuator/gwpub/api/user/award/apply/certificateYears` ✅

奖项认证表单的「获奖年份」下拉项。无参数。

实测响应 `data`（`Array(6)`）为数字数组：

```json
[2026, 2025, 2024, 2023, 2022, 2021]
```

响应类型 `number[]`。

```js
const data = await fetch(
  `${BASE}/api/code-community-actuator/gwpub/api/user/award/apply/certificateYears`,
  { headers: HEADERS },
).then((r) => r.json());
```

### 分享奖励状态

`GET /api/code-community-actuator/gwpub/user/farm/share/shareRewardStatus` ✅

查询农场分享的首次奖励状态（首次下载 / 首次扫码）。无参数。

实测响应：`data` 为 `{ "isFirstDownload": true, "isFirstScan": true }`（类型 `ShareRewardStatusVo`）。`true` 表示尚未领取该奖励。

```js
const data = await fetch(
  `${BASE}/api/code-community-actuator/gwpub/user/farm/share/shareRewardStatus`,
  { headers: HEADERS },
).then((r) => r.json());
```

### 通知下载完成

`POST /api/code-community-actuator/gwpub/user/farm/share/downloadSuccess` ✍️ 写操作未实测

上报「分享图已下载」，用于发放首次下载奖励。仅在 `isFirstDownload` 为 `true` 时调用。**写操作，未复测**。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| — | — | — | 无请求体 |

响应类型 `DownloadRewardVo`，源码取用其 `isReward`（布尔）字段。未实测。

```js
const data = await fetch(
  `${BASE}/api/code-community-actuator/gwpub/user/farm/share/downloadSuccess`,
  { method: "POST", headers: HEADERS },
).then((r) => r.json());
// data.data.isReward
```

### 查询二维码缓存

`POST /api/code-community-actuator/gwpub/user/farm/share/queryQrCodeCache` ✍️ 写操作未实测

按图片内容的 MD5 查询是否已有缓存二维码。**写操作（POST），未复测**。

请求体：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `md5` | string | 是 | 分享图内容的 MD5 |

响应类型 `QrCodeCacheVo`，源码取用 `hasCache`（布尔）与 `qrCodeUrl` 字段。未实测。

```js
await fetch(
  `${BASE}/api/code-community-actuator/gwpub/user/farm/share/queryQrCodeCache`,
  {
    method: "POST",
    headers: { ...HEADERS, "Content-Type": "application/json" },
    body: JSON.stringify({ md5: "<md5>" }),
  },
).then((r) => r.json());
```

### 生成分享二维码

`POST /api/code-community-actuator/gwpub/user/farm/share/generateShareQrCode` ✍️ 写操作未实测

为已上传的分享图生成二维码。**写操作，未复测**。

请求体：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `imageUrl` | string | 是 | 分享图上传到 OSS 后的 URL |
| `md5` | string | 是 | 分享图内容的 MD5 |

响应类型 `QrCodeVo`，源码取用 `qrCodeUrl` 字段。未实测。

```js
const data = await fetch(
  `${BASE}/api/code-community-actuator/gwpub/user/farm/share/generateShareQrCode`,
  {
    method: "POST",
    headers: { ...HEADERS, "Content-Type": "application/json" },
    body: JSON.stringify({ imageUrl: "https://...", md5: "<md5>" }),
  },
).then((r) => r.json());
// data.data.qrCodeUrl
```

---

## 活动

> 活动类接口是节庆 / 阵营战之类的限时玩法（如元宵「灯笼」红包封面、端午「粽子」阵营战）。接口以 `battle/` 为前缀，但业务上是活动而非星际对战（星际对战见 [battle.md](./battle.md)）。

### 活动详情

`GET /api/code-community-actuator/api/battle/activity` ⚠️ 路由存在但参数不足

获取指定活动的详细数据。首次访问会**自动加入活动**并发放奖励（红包封面），因此前端先拉详情、再拉我的奖励。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `missionId` | number | 是 | 活动 id |

响应类型 `ActivityDetailVO`（前端 `@core/types/activity`）。源码用到的字段含 `userBattleInfo`（个人参战信息，其中 `img` 为红包封面图地址）。

> **坑**：探针未带 `missionId` 时返回 `errCode=400`：
> `The required request parameters are missing：Required request parameter 'missionId' for method parameter type Long is not present`
>
> 未取到有效样本，`ActivityDetailVO` 完整字段未验证。

```js
const data = await fetch(
  `${BASE}/api/code-community-actuator/api/battle/activity?missionId=<missionId>`,
  { headers: HEADERS },
).then((r) => r.json());
```

### 我的活动奖励

`GET /api/code-community-actuator/api/battle/myReward` ⚠️ 路由存在但参数不足

获取我在指定活动中获得的奖励（如红包封面列表）。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `missionId` | number | 是 | 活动 id |

响应类型 `MyRewardDetaillVO[]`（注意前端类型名拼写为 `MyRewardDetaillVO`，多一个 `l`）。

> **坑**：探针未带 `missionId` 时返回 `errCode=400`：
> `The required request parameters are missing：Required request parameter 'missionId' for method parameter type Long is not present`
>
> 未取到有效样本，字段未验证。

```js
const data = await fetch(
  `${BASE}/api/code-community-actuator/api/battle/myReward?missionId=<missionId>`,
  { headers: HEADERS },
).then((r) => r.json());
```

### 提交后检查奖励

`GET /api/code-community-actuator/api/battle/reward` ✅

AC 题目之后检查是否有活动奖励掉落。无参数。

实测响应 `data` 为 `null`：

```json
{ "errCode": 0, "data": null, "errMsg": "success" }
```

响应类型 `CheckRewardBySubmissionVO`。本次实测无奖励掉落（`data=null`），有奖励时的字段结构未验证。

```js
const data = await fetch(
  `${BASE}/api/code-community-actuator/api/battle/reward`,
  { headers: HEADERS },
).then((r) => r.json());
```

### 端午活动详情

`GET /api/code-community-actuator/api/battle/duanwuActivity` ✅

端午阵营战活动详情（队伍积分、个人排名、圈子等）。无参数。

实测响应 `data` 形状 `object{teamBattleInfo,userBattleInfo,circleList,missionRewards,startTime,endTime,status,winnerTeamName}`，样例片段：

```json
{
  "teamBattleInfo": [
    { "teamName": "赤焰咸粽队", "teamScore": 567787, "teamColor": "" },
    { "teamName": "冰晶甜粽队", "teamScore": 525393, "teamColor": "" }
  ],
  "userBattleInfo": {
    "nickName": "用户8d31e4",
    "cardCount": 0,
    "score": 0,
    "userRank": 24799,
    "userTeam": "赤焰咸粽队",
    "teamColor": "",
    "img": null,
    "teamImg": ""
  },
  "circleList": [
    {
      "uid": "2e18aafb2e71754e7c3ba9ab37b58eb4",
      "nickName": "用户664b6f",
      "teamName": "冰晶甜粽队",
      "teamColor": "",
      "avatar": "https://..."
    }
  ]
}
```

响应类型 `DuanwuActivityMissionVo`（前端 `@core/types/auto/actuator`）。其余字段 `missionRewards`、`startTime`、`endTime`、`status`、`winnerTeamName` 在样本中存在但被截断，结构未逐一验证。

```js
const data = await fetch(
  `${BASE}/api/code-community-actuator/api/battle/duanwuActivity`,
  { headers: HEADERS },
).then((r) => r.json());
```
