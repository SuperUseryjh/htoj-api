# 星际对战（Battle Contest）

星际对战（内部代号 `galaxy`，站内称「银河争霸赛」）是 OJ 的对战模式：按周分「战局」（`exerciseId`）连续答题、限时计分，完赛后抽「谷子」（收藏稀有度 SR / UR / XR）、触发「超车」动画并生成赛后「战报」。接口集中在 `oj/galaxy.ts`，绝大多数走 biz 网关 `/api/htoj-biz-gateway/gwpub/battle/v2`，两个角标接口走 `/api/htoj-biz-gateway/api/`。

本文覆盖 17 个接口：✅1 / ⚠️10 / 🚫1 / ✍️5 / ❔0。

> 采用与 [index.md](./index.md) 一致的验证标记：✅ 已实测通过 / ⚠️ 路由存在但参数或权限不足 / 🚫 实测被网关 403 / ✍️ 写操作未实测 / ❔ 无法验证。
>
> **本域有强权限门**：整组接口只对「履约学生」开放，普通账号（探针）请求几乎都会收到业务错误 `errCode=400 非履约学生用户不能参与！`。因此除 `isHotBadgeShow` 外，其余已探接口都只能验证到「路由存在」⚠️，响应字段均按前端页面（`pages/oj/galaxy/**`）的用法整理，**未经实测确认**。本页类型名来自前端源码 `@core/types/auto/biz`，未收录进 [htoj-api.d.ts](./htoj-api.d.ts)，故一律不引用 d.ts 类型名，改用字段表描述。
>
> 网关前缀、`Hetao-Oj-Zone` 等必带请求头、统一响应格式（`{ errCode, data, errMsg }`）、分页与通用枚举见 [index.md](./index.md)，本页不再重复。普通题目提交见 [problems.md](./problems.md)。

## 通用请求头

除特别说明外，本页所有请求都走网关并需要下列请求头；漏掉 `Hetao-Oj-Zone` 会报 `errCode=400 域属性为空或无效，无法获取数据`。下面每个范例都复用这里的 `HEADERS`：

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

对战接口均需登录。`exerciseId`（本场战局）与 `unitProductId`（产品线，用于战绩 / 错题筛选）由当前登录用户信息（`get-user-info`，见 [users.md](./users.md)）下发；进入答题页时允许从 URL `?exerciseId=` 覆盖，用于补做历史场次。

## 接口清单

| 接口 | 方法 | 路径 | 验证 | 说明 |
| --- | --- | --- | --- | --- |
| [开始 / 继续战局](#开始--继续战局) | GET | `/api/htoj-biz-gateway/gwpub/battle/v2/start-battle-contest` | ✍️ | 返回题目列表 + 已用时 |
| [取单题详情](#取单题详情) | GET | `/api/htoj-biz-gateway/gwpub/battle/v2/get-battle-contest-problem` | ⚠️ | 懒加载 / 预加载题目 |
| [对战提交评测](#对战提交评测) | POST | `/api/htoj-biz-gateway/gwpub/judge/submit-problem-judge` | ✍️ | 对战专用，`exerciseId` 走 query |
| [检查是否已评测](#检查是否已评测) | GET | `/api/htoj-biz-gateway/gwpub/battle/v2/submit-battle-contest-check` | ✍️ | 返回 1=已评测 / 0=未评测 |
| [交卷](#交卷) | POST | `/api/htoj-biz-gateway/gwpub/battle/v2/submit-battle-contest` | ✍️ | 返回奖励 / 抽谷次数 |
| [赛事详情](#赛事详情) | GET | `/api/htoj-biz-gateway/gwpub/battle/v2/get-battle-contest-detail` | ⚠️ | 首页数据（含旅程、规则） |
| [战绩统计](#战绩统计) | GET | `/api/htoj-biz-gateway/gwpub/battle/v2/battle-contest-count` | ⚠️ | 已完赛场数、谷子数 |
| [超车](#超车) | GET | `/api/htoj-biz-gateway/gwpub/battle/v2/battle-contest-overtake` | ⚠️ | 超越名单 + 百分位 |
| [参赛记录](#参赛记录) | GET | `/api/htoj-biz-gateway/gwpub/battle/v2/battle-contest-record` | ⚠️ | 按 `unitProductId` |
| [错题记录](#错题记录) | GET | `/api/htoj-biz-gateway/gwpub/battle/v2/battle-contest-wrong` | ⚠️ | 按 `exercise` 分组 |
| [产品线列表](#产品线列表) | GET | `/api/htoj-biz-gateway/gwpub/battle/v2/battle-unit-product` | ⚠️ | 下拉选项 |
| [单场错题详情](#单场错题详情) | GET | `/api/htoj-biz-gateway/gwpub/battle/v2/battle-exercise-wrong` | ⚠️ | 懒加载展开 |
| [赛后报告（按场次）](#赛后报告按场次) | GET | `/api/htoj-biz-gateway/gwpub/battle/v2/battle-contest-report` | ⚠️ | 按 `exerciseId` |
| [赛后报告（按记录）](#赛后报告按记录) | GET | `/api/htoj-biz-gateway/api/battle-contest-report-by-record` | 🚫 | 老师查看学生报告 |
| [抽谷子](#抽谷子) | GET | `/api/htoj-biz-gateway/gwpub/battle/v2/guess-goods` | ⚠️ | 抽奖 + 保底提示 |
| [银河角标查询](#银河角标查询) | GET | `/api/htoj-biz-gateway/api/hot-badge/show` | ✅ | 热门 / 新角标是否显示 |
| [标记新角标已查看](#标记新角标已查看) | POST | `/api/htoj-biz-gateway/api/new-badge/view` | ✍️ | 清「新」角标 |

---

## 对战流程（开始 / 取题 / 提交 / 交卷）

### 开始 / 继续战局

`GET /api/htoj-biz-gateway/gwpub/battle/v2/start-battle-contest` ✍️

进入答题页即调用，返回本场题目列表与**已用时**（用于续答计时恢复）。需要登录。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `exerciseId` | number | 是 | 指定场次；当前战局与补做历史场次统一传它 |

响应类型 `BattleContestProblemVo`（字段依据 `galaxy-answer.service.ts` 用法）：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `usedTime` | number | 本场已用时（**秒**；前端 `elapsedSeconds` 直接取它） |
| `battleContestProblemDetailVoList` | `BattleContestProblemDetailVo[]` | 题目列表（含 BOSS 关，最后一题为 BOSS 关） |

> 响应骨架（字段依据正文 `galaxy-answer.service.ts`，**未实测**）：

```json
{
  "usedTime": 0,
  "battleContestProblemDetailVoList": []
}
```

> 未实测：`oj/galaxy.ts` 里它是 `GET` 但在 [api-inventory.json](../../re/api-inventory.json) 中被标为「疑似写操作（GET）」，故按 ✍️ 处理。前端 `init()` 用 `exerciseId` 优先取 URL query，其次取用户信息里的 `exerciseId`；拿到列表后停在**第一道未通过（`passed=false`）的题**，其余题面按需经「取单题详情」懒加载。

```js
const data = await fetch(
  `${BASE}/api/htoj-biz-gateway/gwpub/battle/v2/start-battle-contest?exerciseId=22921376372096`,
  { headers: HEADERS },
).then((r) => r.json());
```

---

### 取单题详情

`GET /api/htoj-biz-gateway/gwpub/battle/v2/get-battle-contest-problem` ⚠️

取单题完整详情，用于切到下一题时懒加载、以及 BOSS 动画期间预加载。需要登录。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `pid` | number | 是 | 题目内部 id（注意参数名是 `pid`，源码函数形参名为 `problemId`） |
| `exerciseId` | number | 是 | 本场场次 id |

**实测缺参证据**（探针未带 `pid`）：

```
errCode=400
The required request parameters are missing：Required request parameter 'pid' for method parameter type Long is not present
```

响应类型 `BattleContestProblemDetailVo`（字段依据 `galaxy-answer.service.ts`）：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `pid` | number | 题目内部 id |
| `title` | string | 标题 |
| `type` | number | 1=OJ 编程题，5=客观题（前端 `EXAM_TYPE`，见下） |
| `content` | string | 题面 Markdown |
| `ioMode` | object | IO 模式（`{ id, name }`，同 [problems.md](./problems.md#题目详情) 的 `ioMode`） |
| `languages` | `IdName[]` | 可用语言；**OJ 题有它才算完整数据**，缺省时前端会再拉一次 |
| `passed` | boolean | 本场是否已通过（用于定位起始题） |

> 响应骨架（字段依据正文 `galaxy-answer.service.ts`，**未实测**）：

```json
{
  "pid": 0,
  "title": "",
  "type": 0,
  "content": "",
  "ioMode": { "id": 0, "name": "" },
  "languages": [],
  "passed": false
}
```

> 前端题型判定 `EXAM_TYPE`：`OJ = 1`、`OBJECTIVE = 5`（客观选择题）。两者在页面上分别渲染代码编辑器与选项卡。

```js
const data = await fetch(
  `${BASE}/api/htoj-biz-gateway/gwpub/battle/v2/get-battle-contest-problem?pid=22920859951104&exerciseId=22921376372096`,
  { headers: HEADERS },
).then((r) => r.json());
```

---

### 对战提交评测

`POST /api/htoj-biz-gateway/gwpub/judge/submit-problem-judge` ✍️

对战场景下的提交评测。**写操作，未实测。**

**与 [problems.md 的「提交评测」](./problems.md#提交评测) 的区别**：普通提交走 `POST /api/code-community/api/submit-problem-judge`，而对战提交走 **biz 网关** `POST /api/htoj-biz-gateway/gwpub/judge/submit-problem-judge`，并把 `exerciseId` 作为 **query** 参数单独传。请求体复用同一套 `SubmitProblemRequestVO`：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | number | 是 | **内部 pid**（字段名是 `id`） |
| `language` | string | 是 | 选择题固定 `"objective"`；编程题为语言名（如 `C++17 With O2`） |
| `answers` | object | 选择题是 | 「小题号 → 字符串」映射，值必须是字符串（多选用逗号拼接） |
| `code` | string | 编程题是 | 源代码 |
| `ioMode` | number | 编程题是 | `1`=标准 IO，`2`=文件 IO |

query 参数：`exerciseId`（number，是）。

响应类型在源码中为 `unknown`（未声明泛型）；前端提交选择题时 `await` 后仅判断是否成功，不读返回值。字段未验证。

> 响应骨架（依据类型 `unknown` 推导，**未实测**；字段定义不在仓库内，结构未知）：

```json
null
```

```js
await fetch(
  `${BASE}/api/htoj-biz-gateway/gwpub/judge/submit-problem-judge?exerciseId=22921376372096`,
  {
    method: "POST",
    headers: { ...HEADERS, "Content-Type": "application/json" },
    body: JSON.stringify({
      id: 22920859951104,        // 内部 pid
      answers: { "1": "A" },      // 选择题答案
      language: "objective",
    }),
  },
).then((r) => r.json());
```

---

### 检查是否已评测

`GET /api/htoj-biz-gateway/gwpub/battle/v2/submit-battle-contest-check` ✍️

交卷前 / OJ 题切下一题前，检查当前题是否已评测。**未实测**（inventory 标为「疑似写操作（GET）」）。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `pid` | number | 是 | 题目内部 id |
| `exerciseId` | number | 是 | 本场场次 id |

响应类型 `number`（源码注释）：**`1` = 已评测，`0` = 未评测**。批量提交前置判断依赖它，避免重复评测。

> 响应骨架（依据正文：`1` = 已评测 / `0` = 未评测，**未实测**）：

```json
0
```

```js
const evaluated = await fetch(
  `${BASE}/api/htoj-biz-gateway/gwpub/battle/v2/submit-battle-contest-check?pid=22920859951104&exerciseId=22921376372096`,
  { headers: HEADERS },
).then((r) => r.json());
// evaluated.data === 1 ? 已评测 : 未评测
```

---

### 交卷

`POST /api/htoj-biz-gateway/gwpub/battle/v2/submit-battle-contest` ✍️

提交整场答卷（交卷），返回累计参赛奖励、完赛奖励、抽奖次数等。**写操作，未实测。**

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `exerciseId` | number | 是 | 本场场次 id（query） |

无请求体。响应类型 `SubmitBattleContestVo`（字段依据 `pages/oj/galaxy/problem/index.vue` 传给 `SettlementModal` 的 props）：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `totalFinishCount` | number | 累计完赛场数 |
| `continueText` | number | 累计参赛奖励进度（`>0` 表示再累计 X 周可多获 1 次抽谷机会） |
| `consecutiveReward` | number | 连续参赛奖励 |
| `guessCount` | number | 获得的抽谷次数 |
| `submitReward` | number | 交卷奖励 |

> 响应骨架（字段依据正文 `pages/oj/galaxy/problem/index.vue`，**未实测**）：

```json
{
  "totalFinishCount": 0,
  "continueText": 0,
  "consecutiveReward": 0,
  "guessCount": 0,
  "submitReward": 0
}
```

> 交卷成功后前端进入结算链路：结算弹窗 → 抽谷（[抽谷子](#抽谷子)）→ 超车动画（[超车](#超车)）→ 跳转[赛后报告](#赛后报告按场次)。

```js
const res = await fetch(
  `${BASE}/api/htoj-biz-gateway/gwpub/battle/v2/submit-battle-contest?exerciseId=22921376372096`,
  { method: "POST", headers: HEADERS },
).then((r) => r.json());
```

---

## 对战数据（详情 / 记录 / 错题 / 超车）

### 赛事详情

`GET /api/htoj-biz-gateway/gwpub/battle/v2/get-battle-contest-detail` ⚠️

拉银河争霸赛首页所需信息（赛事往返时间、三大金刚位、规则、赛事旅程、当前用户状态与持有谷子）。无参数，需要登录。

**实测证据**（探针为普通账号）：

```
errCode=400
非履约学生用户不能参与！
```

响应类型 `BattleContestDetailVo`（字段依据 `galaxy-home.helpers.ts` 的 `mapToContestInfo` / `mapToUserInfo`）：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | number | 当前场次 id（即本周 `exerciseId`） |
| `image` | string | 赛事主视觉图 |
| `startTime` / `endTime` | number | 起止时间，**秒级**时间戳（页面按 `*1000` 格式化） |
| `hasNext` | number | 是否还有下一课表（`1` 有 / `0` 无） |
| `icons` | object[] | 三大金刚位，`{ iconUrl, text }` |
| `description` | string | 规则说明 Markdown（前端兜底「规则详情待更新」） |
| `journeyList` | `YinHeExerciseInfoVO[]` | 赛事旅程节点 |
| `userStatus` | number | 当前用户本场状态；`3` = 已交卷 |
| `contestCount` | number | 已完成场数 |
| `totalCount` | number | 抽谷机会数（可抽次数） |
| `continueText` | number | 累计参赛奖励进度（同[交卷](#交卷)） |
| `goodsList` | `GoodsVO[]` | 已解锁谷子列表（见 [抽谷子](#抽谷子) 的 `GoodsVO`） |

`journeyList[]`（`YinHeExerciseInfoVO`）字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `exerciseId` | number | 场次 id |
| `name` | string | 场次名 |
| `status` | number | 作答状态：`-1`=未作答，`1`=答题中，`2`=已完成 |

> 响应骨架（字段依据正文 `galaxy-home.helpers.ts`，**未实测**）：

```json
{
  "id": 0,
  "image": "",
  "startTime": 0,
  "endTime": 0,
  "hasNext": 0,
  "icons": [{ "iconUrl": "", "text": "" }],
  "description": "",
  "journeyList": [{ "exerciseId": 0, "name": "", "status": 0 }],
  "userStatus": 0,
  "contestCount": 0,
  "totalCount": 0,
  "continueText": 0,
  "goodsList": []
}
```

> 前端从旅程列表 + 当前 `id` 派生「本周 / 可补做 / 已完成 / 锁定」四态，且「锁定」由位置（本周之后）而非 `status` 决定（本周之后的场次后端同样下发 `-1`）。派生文案与 `endTime`、`hasNext` 共同决定是否隐藏「去补做」入口。

```js
const data = await fetch(
  `${BASE}/api/htoj-biz-gateway/gwpub/battle/v2/get-battle-contest-detail`,
  { headers: HEADERS },
).then((r) => r.json());
```

---

### 战绩统计

`GET /api/htoj-biz-gateway/gwpub/battle/v2/battle-contest-count` ⚠️

「我的战绩」页顶部统计。无参数。实测（探针）同详情：`非履约学生用户不能参与！`。

响应类型源码写作 `BattleContestRecordVo`，但页面实际读取的字段是：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `exerciseCount` | number | 已完赛场数（展示单位「场」） |
| `goodsCount` | number | 获得谷子数（展示单位「枚」） |

> 响应骨架（字段依据正文 `milestone/index.vue`，**未实测**）：

```json
{
  "exerciseCount": 0,
  "goodsCount": 0
}
```

> 类型名与使用字段不一致，且无实测响应，仅按 `milestone/index.vue` 的读取整理。

```js
const data = await fetch(
  `${BASE}/api/htoj-biz-gateway/gwpub/battle/v2/battle-contest-count`,
  { headers: HEADERS },
).then((r) => r.json());
```

---

### 超车

`GET /api/htoj-biz-gateway/gwpub/battle/v2/battle-contest-overtake` ⚠️

交卷结算后展示「超越了百分之多少的选手」。实测（探针）`非履约学生用户不能参与！`。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `exerciseId` | number | 是 | 本场场次 id |

响应类型 `OvertakeBattleContestVo`（字段依据 `settlementFlow.service.ts`）：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `anyoneList` | `AnyoneVo[]` | 被超越的选手名单（用于超车动画头像） |
| `ratio` | number | 超越比例，`0~1`（前端 `Number(ratio.toFixed(2))` 后按百分位展示） |
| `redirect` | number | `1` = 播放超车转场动画；否则直接跳[赛后报告](#赛后报告按场次) |

> 响应骨架（字段依据正文 `settlementFlow.service.ts`，**未实测**；`anyoneList` 元素类型 `AnyoneVo` 未定义，故留空）：

```json
{
  "anyoneList": [],
  "ratio": 0,
  "redirect": 0
}
```

```js
const data = await fetch(
  `${BASE}/api/htoj-biz-gateway/gwpub/battle/v2/battle-contest-overtake?exerciseId=22921376372096`,
  { headers: HEADERS },
).then((r) => r.json());
```

---

### 参赛记录

`GET /api/htoj-biz-gateway/gwpub/battle/v2/battle-contest-record` ⚠️

「我的战绩」-「参赛记录」Tab 的列表，按产品线筛选。需要登录。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `unitProductId` | number | 是 | 产品线 id（来自[产品线列表](#产品线列表)） |

**实测缺参证据**（探针未带 `unitProductId`）：

```
errCode=400
The required request parameters are missing：Required request parameter 'unitProductId' for method parameter type Long is not present
```

响应类型 `BattleContestRecordItemVo[]`（字段依据 `MilestoneRecord.vue`）：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `exerciseId` | number | 场次 id（「查看报告」跳转用它，作为报告页 `?id=`） |
| `name` | string | 场次名 |
| `userScore` | number | 分数 |
| `usedTime` | number | 用时（**秒**；前端按 `分:秒` 格式化，未按毫秒处理） |

> 响应骨架（字段依据正文 `MilestoneRecord.vue`，**未实测**）：

```json
[
  {
    "exerciseId": 0,
    "name": "",
    "userScore": 0,
    "usedTime": 0
  }
]
```

```js
const data = await fetch(
  `${BASE}/api/htoj-biz-gateway/gwpub/battle/v2/battle-contest-record?unitProductId=22156385706112`,
  { headers: HEADERS },
).then((r) => r.json());
```

---

### 错题记录

`GET /api/htoj-biz-gateway/gwpub/battle/v2/battle-contest-wrong` ⚠️

「我的战绩」-「错题记录」Tab 的列表，按 `exercise` 分组；首项展开时才会补全该场错题明细。需要登录。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `unitProductId` | number | 是 | 产品线 id |

**实测缺参证据**（探针未带 `unitProductId`）：

```
errCode=400
The required request parameters are missing：Required request parameter 'unitProductId' for method parameter type Long is not present
```

响应类型 `BattleContestWrongVo[]`（字段依据 `MilestoneWrong.vue`）：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `exerciseId` | number | 场次 id（用作展开分组 key） |
| `exerciseName` | string | 场次名 |
| `wrongCount` | number | 该场错题数 |
| `wrongProblemList` | `UserBattleContestProblemDetailVo[]` \| undefined | 该场错题明细；**列表接口一般不返回**，展开时经[单场错题详情](#单场错题详情)懒加载后填充 |

> 响应骨架（字段依据正文 `MilestoneWrong.vue`，**未实测**）：

```json
[
  {
    "exerciseId": 0,
    "exerciseName": "",
    "wrongCount": 0,
    "wrongProblemList": null
  }
]
```

```js
const data = await fetch(
  `${BASE}/api/htoj-biz-gateway/gwpub/battle/v2/battle-contest-wrong?unitProductId=22156385706112`,
  { headers: HEADERS },
).then((r) => r.json());
```

---

### 产品线列表

`GET /api/htoj-biz-gateway/gwpub/battle/v2/battle-unit-product` ⚠️

「我的战绩」页顶部的产品线下拉选项。无参数。实测（探针）`非履约学生用户不能参与！`。

响应类型 `UnitProductVo[]`：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | number | 产品线 id（作为 `unitProductId` 传给记录 / 错题接口） |
| `name` | string | 展示名 |
| `current` | boolean | 是否为当前产品线；前端默认选中 `current === true` 那项，找不到则取第一项 |

> 响应骨架（字段依据正文，**未实测**）：

```json
[
  {
    "id": 0,
    "name": "",
    "current": false
  }
]
```

```js
const data = await fetch(
  `${BASE}/api/htoj-biz-gateway/gwpub/battle/v2/battle-unit-product`,
  { headers: HEADERS },
).then((r) => r.json());
```

---

### 单场错题详情

`GET /api/htoj-biz-gateway/gwpub/battle/v2/battle-exercise-wrong` ⚠️

按 `exerciseId` 拉单场错题明细（「错题记录」展开分组时懒加载）。需要登录。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `exerciseId` | number | 是 | 场次 id |

**实测缺参证据**（探针未带 `exerciseId`）：

```
errCode=400
The required request parameters are missing：Required request parameter 'exerciseId' for method parameter type Long is not present
```

响应类型 `UserBattleContestProblemDetailVo[]`（字段依据 `MilestoneWrong.vue` 与 `report/index.vue` 展开区的读取）：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `pid` | number | 题目内部 id |
| `type` | number | 1=OJ 编程题，5=客观题 |
| `content` | string | 题面 Markdown |
| `status` | number | OJ 题判题状态（`0` = 通过，见 [index.md](./index.md) 判题状态枚举） |
| `userAnswer` | object | 客观题我的答案，「小题号 → 字符串」映射 |
| `answer` | object | 客观题正确答案，同上结构 |
| `explanation` | string | 解析 |
| `userCode` | string | OJ 题我的代码 |
| `language` | string | OJ 题语言 |
| `userScore` | number | 本题得分 |

> 响应骨架（字段依据正文 `MilestoneWrong.vue` / `report/index.vue`，**未实测**）：

```json
[
  {
    "pid": 0,
    "type": 0,
    "content": "",
    "status": 0,
    "userAnswer": {},
    "answer": {},
    "explanation": "",
    "userCode": "",
    "language": "",
    "userScore": 0
  }
]
```

> 客观题前端用「`userAnswer` 与 `answer` 逐键相等」判对错；OJ 题用 `status === 0` 判对错。

```js
const data = await fetch(
  `${BASE}/api/htoj-biz-gateway/gwpub/battle/v2/battle-exercise-wrong?exerciseId=22921376372096`,
  { headers: HEADERS },
).then((r) => r.json());
```

---

## 战报

### 赛后报告（按场次）

`GET /api/htoj-biz-gateway/gwpub/battle/v2/battle-contest-report` ⚠️

赛后报告页（学生自看）数据。实测（探针）`非履约学生用户不能参与！`。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `exerciseId` | number | 否 | 场次 id；源码 `exerciseId ? { query } : {}`，不传时后端按当前用户最近一场返回 |

响应类型 `BattleContestReportVo`（字段依据 `report/index.vue`）：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `name` | string | 场次 / 赛事名（页面顶部标题） |
| `reportText` | string[] | 报告标题文案，**按行**渲染为多个大标题（单行时居中） |
| `usedTime` | number | 我的用时（**秒**；前端 `HH:mm:ss` 格式化） |
| `userScore` | number | 我的分数 |
| `correctRate` | number | 正确率（页面展示为 `xx%`） |
| `userBattleContestProblemDetailVoList` | `UserBattleContestProblemDetailVo[]` | 逐题详解（字段同[单场错题详情](#单场错题详情)）；**为空时页面提示「赛后报告生成中」** |

> 响应骨架（字段依据正文 `report/index.vue`，**未实测**）：

```json
{
  "name": "",
  "reportText": [],
  "usedTime": 0,
  "userScore": 0,
  "correctRate": 0,
  "userBattleContestProblemDetailVoList": []
}
```

> 报告页用 `?id=`（学生自看）或 `?rid=`（老师查看，走[按记录](#赛后报告按记录)）区分两个接口。

```js
const data = await fetch(
  `${BASE}/api/htoj-biz-gateway/gwpub/battle/v2/battle-contest-report?exerciseId=22921376372096`,
  { headers: HEADERS },
).then((r) => r.json());
```

---

### 赛后报告（按记录）

`GET /api/htoj-biz-gateway/api/battle-contest-report-by-record` 🚫

按参赛记录 ID 获取报告，用于老师查看学生报告（报告页 `?rid=`）。路径为 biz 网关 `common-controller` 固定地址，**不走** `battle/v2`。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `recordId` | number | 是 | 参赛记录 id（非场次 `exerciseId`） |

**实测被网关拒绝**：

```json
{ "code": 403, "message": "Gateway Error:Access Denied" }
```

响应类型同为 `BattleContestReportVo`（结构见[赛后报告（按场次）](#赛后报告按场次)），但**当前不可用**，`index.md` 的 403 名单里也列出了该路径。

> 响应骨架（字段依据正文，结构同[赛后报告（按场次）](#赛后报告按场次)，**未实测**；当前 🚫 不可用）：

```json
{
  "name": "",
  "reportText": [],
  "usedTime": 0,
  "userScore": 0,
  "correctRate": 0,
  "userBattleContestProblemDetailVoList": []
}
```

> 与[赛后报告（按场次）](#赛后报告按场次)的区别：本接口按**参赛记录 id**、走 `/api/htoj-biz-gateway/api/`；后者按**场次 exerciseId**、走 `/api/htoj-biz-gateway/gwpub/battle/v2/`。

---

## 商品与徽章

### 抽谷子

`GET /api/htoj-biz-gateway/gwpub/battle/v2/guess-goods` ⚠️

抽一次「谷子」（收藏品），返回本次结果与剩余次数。**带副作用的抽奖 GET**，实测（探针）`非履约学生用户不能参与！`。

无参数。响应类型 `UnitGoodsVo`（字段依据 `Goods.vue` 的 `performDraw`）：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `goodsVO` | `GoodsVO` | 本次抽到的谷子（见下） |
| `totalCount` | number | 剩余抽谷次数 |
| `predictText` | number \| null | 保底提示：还差几次必出稀缺谷子（`0` / `null` 不提示；`>=4` 时文案变为「再抽 4~7 次，必获得 1 个 UR 或 XR」） |
| `haveReward` | number | 已解锁的专属谷子数（展示 `haveReward / totalReward`） |
| `totalReward` | number | 专属谷子总数 |

`GoodsVO` 字段（依据 `Goods.vue` 与 `galaxy-home.helpers.ts` 的 `mapGoodsVO`）：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | number | 谷子 id |
| `name` | string | 名称 |
| `url` | string | 图片 URL |
| `rarityCode` | number | 稀有度：`1`=SR，`2`=UR，`3`=XR |
| `goodsAnimation` | number | 动画等级 |
| `goodsNum` | number | 已拥有数量 |
| `goodsLevel` | number | 谷子等级 |
| `levelNum` | number \| null | 等级编号 |

> 响应骨架（字段依据正文 `Goods.vue` / `galaxy-home.helpers.ts`，**未实测**）：

```json
{
  "goodsVO": {
    "id": 0,
    "name": "",
    "url": "",
    "rarityCode": 0,
    "goodsAnimation": 0,
    "goodsNum": 0,
    "goodsLevel": 0,
    "levelNum": null
  },
  "totalCount": 0,
  "predictText": null,
  "haveReward": 0,
  "totalReward": 0
}
```

```js
const data = await fetch(
  `${BASE}/api/htoj-biz-gateway/gwpub/battle/v2/guess-goods`,
  { headers: HEADERS },
).then((r) => r.json());
```

---

### 银河角标查询

`GET /api/htoj-biz-gateway/api/hot-badge/show` ✅

导航「比赛 / 银河」入口的角标状态。无参数，需登录。**本页唯一实测通过的接口**。

响应类型 `YinheBadgeShowVo`，实测返回 `errCode=0`：

> 实测响应 `data`（字段依据 `api-probe.json` 实测样本，**已实测**）：

```json
{ "showHot": false, "showNew": false }
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `showHot` | boolean | 是否显示「热门」角标 |
| `showNew` | boolean | 是否显示「新」角标 |

```js
const data = await fetch(
  `${BASE}/api/htoj-biz-gateway/api/hot-badge/show`,
  { headers: HEADERS },
).then((r) => r.json());
```

---

### 标记新角标已查看

`POST /api/htoj-biz-gateway/api/new-badge/view` ✍️

清掉「新」角标。**写操作，未实测。**

无参数、无请求体。响应类型 `boolean`，字段未验证。

> 响应骨架（依据类型 `boolean` 推导，**未实测**）：

```json
false
```

> 前端调用时机：点击银河入口且 `showNew` 为 `true` 时先置本地状态为 `false`，再发本请求；2xx 之外仅 `console.error`，不阻断跳转。

```js
await fetch(`${BASE}/api/htoj-biz-gateway/api/new-badge/view`, {
  method: "POST",
  headers: HEADERS,
}).then((r) => r.json());
```
