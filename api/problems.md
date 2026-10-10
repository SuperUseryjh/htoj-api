# 题目与提交

题库浏览、题目详情、代码 / 答案提交、评测轮询、自测运行与提交记录等接口，共 31 个（前端 `oj/problem.ts` 28 个、`oj/warehouse.ts` 3 个）。

> 全局约定（网关前缀、必带请求头、统一 `errCode` 信封、分页与枚举）见 [index.md](./index.md)。
> 下文示例统一使用下面定义的 `BASE` 与 `headers`，按需修改查询串与请求体即可直接运行。标 ✍️ 的写操作未在真实账号上复测，请求体依据前端源码签名与类型整理。

```js
const BASE = "https://api.htoj.com.cn";
const headers = {
  "Content-Type": "application/json",
  "Hetao-Oj-Zone": "cpp",     // 必需；缺失时报 errCode=400 域属性为空或无效
  HT_PLATFORM: "htojWeb",
  HT_SYSTEM: "web",
  HT_VERSION: "1.0.0",
  app_id: "com.hetao101.oj",
  Authorization: "<token>",   // 登录后接口需要；裸 JWT，无 Bearer 前缀
};
```

---

## 题目列表

`GET /api/code-community/api/get-problem-list` ✅ 已实测可用

按关键词、题库、难度、标签、答题状态筛选题目，返回分页题目列表（`data` 为 `Pagination<ProblemVO>`）。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `currentPage` | number | 否 | 页码，从 1 开始，默认 1 |
| `limit` | number | 否 | 每页条数，默认 20；服务端上限为 20，传更大值只返回 20 条 |
| `keyword` | string | 否 | 题目编号或名称关键词 |
| `wid` | number | 否 | 题库 id，见 [index.md](./index.md) 的「题库 `wid`」；空则查全部 |
| `difficulties` | string | 否 | 难度多选，逗号拼接，如 `1,2,3` |
| `tagId` | string | 否 | 标签多选，逗号拼接 |
| `answerStatus` | string | 否 | 答题状态多选，逗号拼接，如 `1,3` |

响应 `data.records[]` 实测字段：`pid`（内部数字 id）、`problemId`（展示编号，如 `P1000`）、`title`、`difficulty`（`{id,name,color}`）、`owner`、`type`（1 编程 / 2 选择 / 5 客观）、`tags[]`、`acStatus`（`{id,name,shortName,chineseName}`）、`total`、`ac`、`rn`；分页元数据为 `total` / `size` / `current` / `pages` / `orders` / `searchCount`。

> `pid` 与 `problemId` 不可混用：提交、详情接口都用内部的 `pid`。

```js
await fetch(
  `${BASE}/api/code-community/api/get-problem-list?currentPage=1&limit=20&keyword=P1000&wid=1&difficulties=1,2`,
  { headers },
).then((r) => r.json());
```

## 公开提交列表

`GET /api/code-community/api/get-submission-list` ✅ 已实测可用

查询全站（或按题目筛选）的公开提交记录（`Pagination<ProblemVO>`）。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `currentPage` | number | 否 | 页码 |
| `limit` | number | 否 | 每页条数 |
| `status` | number | 否 | 判题状态 `status.id` |
| `language` | string | 否 | 语言名，如 `C++17 With O2` |
| `problemID` | string | 否 | 题目展示编号或名称 |
| `username` | string | 否 | 提交者用户名 |
| `cid` | number | 否 | 比赛 id |
| `userId` | number | 否 | 提交者 userId |

响应 `data.records[]` 实测字段：`uid`、`submitId`、`username`、`pid`、`displayPid`、`title`、`displayId`、`submitTime`（毫秒时间戳）、`status`（`{id,name,shortName,chineseName}`）、`isMine`、`time`、`memory`、`length`、`language`、`score`、`cid`、`tid`、`gid`、`source`（1=HTOJ，2=核桃编程 APP）。

> 实测样本里 `records` 有 3 条但 `total=0`、`pages=0`，分页元数据不完全可信，不要用它做终止判断。

```js
await fetch(
  `${BASE}/api/code-community/api/get-submission-list?currentPage=1&limit=20&language=C%2B%2B17%20With%20O2`,
  { headers },
).then((r) => r.json());
```

## 我的提交列表

`GET /api/code-community/api/get-my-submission-list` ✅ 已实测可用（需登录）

查询当前用户对某道题的提交记录（`Pagination<ProblemVO>`）。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `pid` | number | 是 | 题目内部 id |
| `cid` | number | 否 | 比赛 id |
| `tid` | number | 否 | 题单 id |
| `currentPage` | number | 否 | 页码 |
| `limit` | number | 否 | 每页条数，**上限 20**；传 30 会返回 `errCode=401 每页最多显示20条记录` |

响应字段与「公开提交列表」的 record 一致。

> 两个已知坑：
> 1. **`limit` 上限为 20**，超出直接报错。
> 2. **不要带 `gid`**。比赛题提交记录里的 `gid` 常为 `0`，按链接里的 `gid` 过滤会一条都查不到——实测 `pid+cid` 有记录，加上 `gid` 后 `total` 直接变 0。

```js
await fetch(
  `${BASE}/api/code-community/api/get-my-submission-list?pid=22169438826624&currentPage=1&limit=20`,
  { headers },
).then((r) => r.json());
```

## 提交评测

`POST /api/code-community/api/submit-problem-judge` ✍️ 写操作未实测

提交代码或答案，返回提交 id（`data` 为数字 `submitId`），再用「提交详情」轮询结果。请求体为 `SubmitProblemRequestVO`。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | number | 是 | **内部 pid**（字段名是 `id`，不是 `pid` / `problemId`） |
| `language` | string | 是 | 语言标识，取值见下 |
| `ioMode` | number | 编程题是 | `1`=标准 IO，`2`=文件 IO |
| `code` | string | 编程题 / 选择题是 | 编程题为源代码；选择题为选项 id 逗号拼接 |
| `answers` | object | 客观题是 | 「小题号 → 字符串」映射，如 `{ "1": "A", "2": "A,C", "3": "填空内容" }`，值必须是字符串 |
| `costTime` | number | 否 | 编码用时（毫秒） |
| `cid` | number | 否 | 比赛 id |
| `tid` | number | 否 | 题单 id |
| `gid` | number | 否 | 小组 id |
| `answerFileKey` | string | 否 | 提交答案题的文件 key（与 `code` 二选一） |

`language` 取值随题型不同：

- 编程题（`type=1`）：语言名，如 `"C++17 With O2"`（不是语言 id）。
- 客观题（`type=5`）：固定 `"objective"`，答案放 `answers`。
- 选择题（`type=2`）：`"choice"`（多选时 `"multipleChoice"`），答案放 `code` 字符串。

响应 `data` 为提交 id：

```json
{ "errCode": 0, "data": 51980181, "errMsg": "success" }
```

```js
const res = await fetch(`${BASE}/api/code-community/api/submit-problem-judge`, {
  method: "POST",
  headers,
  body: JSON.stringify({
    id: 22169438826624,          // 内部 pid
    ioMode: 1,                   // 1=标准 IO
    language: "C++17 With O2",   // 编程题传语言名
    costTime: 1000,
    code: "// source code",
  }),
}).then((r) => r.json());
const submitId = res.data;
```

## 自测运行

`POST /api/code-community/api/submit-problem-test-judge` ✍️ 写操作未实测

用自定义输入运行代码（**不产生提交记录**），返回字符串 `testJudgeKey`，再用「查询自测结果」取运行结果。请求体为 `TestProblemJudegeRequestVO`。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | number | 是 | 内部 pid |
| `ioMode` | number | 是 | `1`=标准 IO，`2`=文件 IO |
| `language` | string | 是 | 语言名，如 `C++17 With O2` |
| `code` | string | 是 | 源代码 |
| `userInput` | string | 否 | 自测输入 |
| `userInputFile` | string | 否 | 输入文件 key |
| `expectedOutputFile` | string | 否 | 期望输出文件 key |
| `cid` / `tid` / `gid` | number | 否 | 题目来源上下文 |

响应：

```json
{ "errCode": 0, "data": "TEST_JUDGE_eb87408112534d2ca912a04fd378910b", "errMsg": "success" }
```

```js
const res = await fetch(`${BASE}/api/code-community/api/submit-problem-test-judge`, {
  method: "POST",
  headers,
  body: JSON.stringify({
    id: 22169438826624,
    ioMode: 1,
    language: "C++17 With O2",
    code: "// source code",
    userInput: "5",
  }),
}).then((r) => r.json());
const testJudgeKey = res.data;
```

## 查询自测结果

`GET /api/code-community/api/get-test-judge-result` ✅ 已实测可用

按 `testJudgeKey` 查询自测运行结果（`GetTestJudgeResultResponseVO`）。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `testJudgeKey` | string | 是 | 自测运行返回的 key；缺失返回 `errCode=400 ... 'testJudgeKey' ...` |

响应 `data` 实测字段：`status`（`{id,name,shortName,chineseName}`，如 `id=0,name=Success,chineseName=运行通过`）、`resultCode`、`time`、`memory`、`userInput`、`userOutput`、`userOutputFile`、`expectedOutput`、`stderr`、`problemJudgeMode`。

```js
await fetch(
  `${BASE}/api/code-community/api/get-test-judge-result?testJudgeKey=TEST_JUDGE_eb87408112534d2ca912a04fd378910b`,
  { headers },
).then((r) => r.json());
```

## 下载测试点数据

`POST /api/code-community/gwpub/file/download-test-case` ✍️ 写操作未实测

下载单个测试点数据，返回文件地址（`FileUrlVO`）。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `file` | string | 是 | 文件名 / key |
| `pid` | number | 是 | 题目内部 id |

响应字段未验证（无样本，返回类型为 `FileUrlVO`，推测含文件 URL 字段）。

```js
await fetch(
  `${BASE}/api/code-community/gwpub/file/download-test-case?file=case1.in&pid=22169438826624`,
  { method: "POST", headers },
).then((r) => r.json());
```

## 提交详情（评测结果）

`GET /api/htoj-biz-gateway/api/get-submission-detail` ✅ 已实测可用

查询某次提交的评测结果（`GetSubmissionDetailResponseVO`），也是轮询评测状态与查看测试点明细的入口。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `submitId` | number | 否 | 提交 id |
| `codeId` | number | 否 | 与 `submitId` 二选一，用于查看他人分享的代码 |

响应 `data` 实测字段：`submitId`、`resultCode`、`canCreateProblemSolution`、`uid`、`pid`、`type`、`problemId`、`userCode`、`language`、`additionalCaseResults[]`、`caseResults`、`caseGroups[]`、`cid`、`gid`、`runResult`、`tid`、`objectiveScore`、`score`、`answers`、`firstAc`、`cheatTag`、`unfinishedProblemNum`、`budge`、`budgeName`、`showAiButton`、`afterContestSubmit`、`guideConfig`。

- `caseGroups[]` 每项为 `{ groupNum, calculateTypeCode, calculateTypeName, groupScore, caseResult[] }`；`caseResult[]` 每项为 `{ pid, submitId, time, memory, score, status{id,name,shortName,chineseName}, seq, message, groupNum }`。
- **测试点明细走这里**：`get-submission-case-list` 已被网关 403 屏蔽（见下文），明细请从 `caseGroups[].caseResult` 读取。
- 客观题（`type=5`）的逐题作答结果在 `answers[]`：`{ id（小题号，可能是 "1" 或区间 "1-3"）, myAnswer, answer, status（-1 未作答 / 1 正确 / 2 错误 / 3 已作答）, score, myScore }`。
- `resultCode`：`0`=评测中（继续轮询），非 0（`1` 成功 / `2` 失败 / `3` 不展示 / `4` 纯代码）表示结束。

```js
await fetch(
  `${BASE}/api/htoj-biz-gateway/api/get-submission-detail?submitId=51980181`,
  { headers },
).then((r) => r.json());
```

## 题目语言与测试点

`GET /api/code-community/api/get-problem-language-and-case` 🚫 被网关 403 拒绝

返回题目可用语言与测试点信息（`GetProblemLanguageAndCaseResponseVO`），当前不可用：

```json
{ "code": 403, "message": "Gateway Error:Access Denied" }
```

需要语言列表时改用 [`get-language`](./misc.md)（`/api/code-community/api/get-language`）；测试点信息改用「提交详情」的 `caseGroups[].caseResult`。

## 题目详情

`GET /api/htoj-biz-gateway/api/get-problem-detail` ✅ 已实测可用

题目详情的核心接口（`ProblemDetailVO`），返回题面、标签、限制与本题上下文。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `problemId` | number | 是 | 内部 pid；缺失返回 `errCode=400 ... 'problemId' ...` |
| `cid` | number | 否 | 比赛 id |
| `tid` | number | 否 | 题单 id |
| `gid` | number | 否 | 小组 id |

响应 `data` 实测字段：`problemBaseVO`、`problemChoiceDetailVO`、`problemOjDetailVO`、`problemObjectiveDetailVO`、`ownerVo`、`isGuide`、`isGuideTraining`、`modelAnswer`、`budge`、`budgeName`、`likeCount`、`dislikeCount`、`gid`、`noPrev`、`noNext`、`accepted`、`hideResult`、`like`、`dislike`、`additionalFiles`、`guideConfigVo` 等。

`problemBaseVO` 关键字段：`id`、`problemId`、`title`、`content`（Markdown 源文）、`difficulty`、`source`、`type`、`tags[]`、`showProblemSolution`、`showJudgeRecord`、`zone`、`total`、`ac`、`wid`、`historyResult`。

`problemOjDetailVO`（编程题）：`problemLanguage[]`、`ioMode`（`{id,name}`，`id` 为数字：1=标准 IO，2=文件 IO）、`timeLimit`（毫秒）、`memoryLimit` / `stackLimit`（MB）、`judgeMode`（`{value,name}`）、`ioReadFileName`、`ioWriteFileName`。

**题目类型三态（以 `problemBaseVO.type` 区分）**：

| type | 含义 | 对应详情字段 |
| --- | --- | --- |
| 1 | 编程题 | `problemOjDetailVO` |
| 2 | 选择题 | `problemChoiceDetailVO`（`{ choiceType, options[] }`） |
| 5 | 客观题 | `problemObjectiveDetailVO`（常为 `null`） |

> 客观题的题干与选项直接写在题面 `content` 里，用 `{{ select(n) }}` / `{{ input(n) }}` 一类占位符出题，此时 `problemChoiceDetailVO` 常为 `null`；不要依赖它拿选项。

> **可见性限制**：比赛题、题单题、小组题在 `get-problem-detail` 里受可见性限制，需要分别通过 `cid` / `tid` / `gid` 指明来源，否则可能返回 `errCode=400 该题目不可见`。比赛题不带 `cid` 已被实测确认直接报错。相应地，提交比赛题时 `submit-problem-judge` 也要带上 `cid`，否则提交不会归属到该场比赛。

```js
await fetch(
  `${BASE}/api/htoj-biz-gateway/api/get-problem-detail?problemId=22169438826624` +
    `&cid=22921376372096`,
  { headers },
).then((r) => r.json());
```

## 选择题选项

`GET /api/code-community/api/get-problem-choice-detail` 🚫 被网关 403 拒绝

返回选择题选项（`ProblemChoiceDetailVO`：`{ choiceType, options[] }`，`choiceType` 2=单选 4=多选）。当前不可用：

```json
{ "code": 403, "message": "Gateway Error:Access Denied" }
```

选择题选项在 `get-problem-detail` 的 `content`（`{{ select(n) }}` 占位）或 `problemChoiceDetailVO` 中获取。

## 提交测试点明细

`GET /api/code-community/api/get-submission-case-list` 🚫 被网关 403 拒绝

按 `submitId` 返回测试点分组明细（`TestCaseGroupItemVO[]`）。当前被网关屏蔽：

```json
{ "code": 403, "message": "Gateway Error:Access Denied" }
```

站内结果页因此也会显示「网络已经断开 / 暂无数据」。**测试点明细请改走 `get-submission-detail` 的 `caseGroups[].caseResult`。**

## 比赛题目序号列表

`GET /api/code-community/api/get-contest-problem-index` ⚠️ 路由存在但参数不足

返回比赛内题目的序号索引（`Pagination<ContestProblemIndexVO>`）。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `cid` | number | 是 | 比赛 id；缺失返回 `errCode=400 ... 'cid' ...` |
| `gid` | number | 否 | 小组 id |

未取到有效样本，`ContestProblemIndexVO` 具体字段未验证。

```js
await fetch(
  `${BASE}/api/code-community/api/get-contest-problem-index?cid=22921376372096`,
  { headers },
).then((r) => r.json());
```

## 题目讨论数

`GET /api/code-community-forum/internal/problem/getProblemReplyCount` ✅ 已实测可用

返回某道题的讨论 / 回复数量（`data` 为数字）。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | number | 是 | 题目内部 id；缺失返回 `errCode=400 ... 'id' ...` |

响应：`{ "errCode": 0, "data": 120, "errMsg": "success" }`。

```js
await fetch(
  `${BASE}/api/code-community-forum/internal/problem/getProblemReplyCount?id=22169438826624`,
  { headers },
).then((r) => r.json());
```

## 点赞题目

`POST /api/code-community/api/problem/like` ✍️ 写操作未实测

为题目点赞。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `pid` | number | 是 | 题目内部 id（query 参数） |

响应结构未验证。

```js
await fetch(`${BASE}/api/code-community/api/problem/like?pid=22169438826624`, {
  method: "POST",
  headers,
}).then((r) => r.json());
```

## 取消点赞题目

`POST /api/code-community/api/problem/unlike` ✍️ 写操作未实测

取消题目点赞，参数同上（query：`pid`）。响应结构未验证。

```js
await fetch(`${BASE}/api/code-community/api/problem/unlike?pid=22169438826624`, {
  method: "POST",
  headers,
}).then((r) => r.json());
```

## 点踩题目

`POST /api/code-community/api/problem/dislike` ✍️ 写操作未实测

为题目点踩，参数同上（query：`pid`）。响应结构未验证。

```js
await fetch(`${BASE}/api/code-community/api/problem/dislike?pid=22169438826624`, {
  method: "POST",
  headers,
}).then((r) => r.json());
```

## 取消点踩题目

`POST /api/code-community/api/problem/undislike` ✍️ 写操作未实测

取消题目点踩，参数同上（query：`pid`）。响应结构未验证。

```js
await fetch(`${BASE}/api/code-community/api/problem/undislike?pid=22169438826624`, {
  method: "POST",
  headers,
}).then((r) => r.json());
```

## IDE 相关题目推荐

`GET /api/code-community/api/problem/ide-get-problem-recommend` ⚠️ 路由存在但参数不足

按当前题目推荐相关题目（`ProblemRecommendVO[]`）。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `currentPid` | number | 是 | 当前题目内部 id；缺失返回 `errCode=400 ... 'currentPid' ...` |
| `gid` | number | 否 | 小组 id |

未取到有效样本，`ProblemRecommendVO` 具体字段未验证。

```js
await fetch(
  `${BASE}/api/code-community/api/problem/ide-get-problem-recommend?currentPid=22169438826624`,
  { headers },
).then((r) => r.json());
```

## 题库内上一题 / 下一题

`GET /api/code-community/api/warehouse/warehouse-problem` ⚠️ 路由存在但参数不足

在某个题库内按顺序定位相邻题目（`data` 为数字 pid）。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `currentPid` | number | 是 | 当前题目内部 id |
| `direct` | number | 是 | `1`=上一题，`2`=下一题 |
| `wid` | number | 是 | 题库 id；缺失返回 `errCode=400 ... 'wid' ...` |

```js
await fetch(
  `${BASE}/api/code-community/api/warehouse/warehouse-problem?currentPid=22169438826624&direct=2&wid=1`,
  { headers },
).then((r) => r.json());
```

## 小组内上一题 / 下一题

`GET /api/code-community/api/group/group-problem` ⚠️ 路由存在但参数不足

在某个小组内按顺序定位相邻题目（`data` 为数字 pid）。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `currentPid` | number | 是 | 当前题目内部 id |
| `direct` | number | 是 | `1`=上一题，`2`=下一题 |
| `gid` | number | 是 | 小组 id；缺失返回 `errCode=400 ... 'gid' ...` |

```js
await fetch(
  `${BASE}/api/code-community/api/group/group-problem?currentPid=22169438826624&direct=2&gid=22156385706112`,
  { headers },
).then((r) => r.json());
```

## 题单内上一题 / 下一题

`GET /api/code-community/api/training-problem-skip` ⚠️ 路由存在但参数不足

在某个题单内按顺序定位相邻题目（`data` 为数字 pid）。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `currentPid` | number | 是 | 当前题目内部 id |
| `direct` | number | 是 | `1`=上一题，`2`=下一题 |
| `tid` | number | 是 | 题单 id；缺失返回 `errCode=400 ... 'tid' ...` |
| `gid` | number | 否 | 小组 id |

```js
await fetch(
  `${BASE}/api/code-community/api/training-problem-skip?currentPid=22169438826624&direct=2&tid=22302141951872`,
  { headers },
).then((r) => r.json());
```

## 比赛内上一题 / 下一题

`GET /api/code-community/gwpub/contest-problem-skip` ⚠️ 路由存在但参数不足

在某场比赛内按顺序定位相邻题目（`data` 为数字 pid）。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `currentPid` | number | 是 | 当前题目内部 id |
| `direct` | number | 是 | `1`=上一题，`2`=下一题 |
| `cid` | number | 是 | 比赛 id；缺失返回 `errCode=400 ... 'cid' ...` |
| `gid` | number | 否 | 小组 id |

```js
await fetch(
  `${BASE}/api/code-community/gwpub/contest-problem-skip?currentPid=22920859951104&direct=2&cid=22921376372096`,
  { headers },
).then((r) => r.json());
```

## 题单通过后的下一题导航

`GET /api/htoj-biz-gateway/gwpub/get-training-problem-navigation` ✅ 已实测可用

AC 之后获取题单内的下一题导航信息（实测返回 `errCode=0`，示例参数下各字段均为 `null`）。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `submitId` | number | 是 | 提交 id |
| `pid` | number | 是 | 题目内部 id |
| `tid` | number | 是 | 题单 id |
| `gid` | number | 否 | 小组 id |

响应 `data` 实测字段：`currentChapterPid`、`nextChapterPid`、`prevChapterPid`、`prevChapterName`、`prevChapterUnfinished`、`goodsNum`、`rocketColorUrl`。

```js
await fetch(
  `${BASE}/api/htoj-biz-gateway/gwpub/get-training-problem-navigation?submitId=51980181&pid=22169438826624&tid=22302141951872`,
  { headers },
).then((r) => r.json());
```

## 题单抽屉目录

`GET /api/code-community/api/training-problem-drawer` ⚠️ 路由存在但参数不足

返回题单的章节抽屉目录（`DrawerTrainingChapterListVo[]`）。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `currentPid` | number | 是 | 当前题目内部 id |
| `tid` | number | 是 | 题单 id；缺失返回 `errCode=400 ... 'tid' ...` |

未取到有效样本，`DrawerTrainingChapterListVo` 具体字段未验证。

```js
await fetch(
  `${BASE}/api/code-community/api/training-problem-drawer?currentPid=22169438826624&tid=22302141951872`,
  { headers },
).then((r) => r.json());
```

## 题单章节题目

`GET /api/code-community/api/get-training-problems` ⚠️ 路由存在但参数不足

按章节返回题单内的题目（`DrawerProblemListVo[]`）。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `chapterId` | number | 是 | 章节 id |
| `tid` | number | 是 | 题单 id；缺失返回 `errCode=400 ... 'tid' ...` |

> 注意与本域「题单（训练）」页的 `get-training-problem-list`（路径 `/api/code-community/api/get-training-problem-list`）不是同一个接口：本接口路径为 `get-training-problems`（复数、无 `list`）。

未取到有效样本，`DrawerProblemListVo` 具体字段未验证。

```js
await fetch(
  `${BASE}/api/code-community/api/get-training-problems?chapterId=1&tid=22302141951872`,
  { headers },
).then((r) => r.json());
```

## 生成短链

`POST /api/htoj-biz-gateway/api/get-short-link` ✍️ 写操作未实测

把长链接转换为短链（`data` 为字符串）。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `url` | string | 是 | 原始链接 |

响应为短链字符串，未验证。

```js
await fetch(`${BASE}/api/htoj-biz-gateway/api/get-short-link`, {
  method: "POST",
  headers,
  body: JSON.stringify({ url: "https://htoj.com.cn/cpp/oj/problem/detail?pid=22169438826624" }),
}).then((r) => r.json());
```

## 保存比赛答案

`POST /api/code-community/api/contest-store-answer` ✍️ 写操作未实测

比赛中暂存答卷（客观题 / 选择题答案），用于断线续答。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `cid` | number | 是 | 比赛 id |
| `pid` | number | 是 | 题目内部 id |
| `answer` | object | 是 | 「小题号 → 字符串」映射，如 `{ "1": "A" }` |
| `version` | number | 是 | 答卷版本号 |
| `gid` | number | 否 | 小组 id |

响应结构未验证。

```js
await fetch(`${BASE}/api/code-community/api/contest-store-answer`, {
  method: "POST",
  headers,
  body: JSON.stringify({
    cid: 22921376372096,
    pid: 22920859951104,
    answer: { "1": "A" },
    version: 1,
  }),
}).then((r) => r.json());
```

---

## 题库列表

`GET /api/code-community/api/warehouse/list` ✅ 已实测可用

返回题库下拉选项（`SelectOption[]`，`{ value, label }`），无参数。

| value | label |
| --- | --- |
| 1 | 核桃题库 |
| 3 | 洛谷 |
| 4 | 核桃比赛 |
| 100 | Becoder |
| 22 | 历年真题 |

```js
await fetch(`${BASE}/api/code-community/api/warehouse/list`, { headers }).then((r) => r.json());
```

## 题库题目列表

`GET /api/code-community/api/warehouse/warehouse-problems` ✅ 已实测可用

返回某个题库内的题目列表（`DrawerProblemListVo[]`）。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `currentPid` | number | 是 | 当前题目内部 id |
| `direct` | number | 是 | `0` / `1` / `2`（相邻方向；`1`=上，`2`=下） |
| `wid` | number | 是 | 题库 id；缺失返回 `errCode=400 ... 'wid' ...` |

实测样本返回 `errCode=0` 且 `data` 为空数组（`[]`），具体 record 字段未验证。

```js
await fetch(
  `${BASE}/api/code-community/api/warehouse/warehouse-problems?currentPid=22169438826624&direct=2&wid=1`,
  { headers },
).then((r) => r.json());
```

## 题库详情

`GET /api/code-community/api/warehouse/get` ✅ 已实测可用

返回题库信息（`WarehouseVO`）。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `wid` | number | 是 | 题库 id，如 `1` |

响应 `data` 实测字段（`wid=1`）：`id`、`title`、`author`、`auth`、`sort`、`gmtModified`、`zone`、`createTime`、`isCanUp`、`isCanDown`、`isCanDelete`、`isCanModify`、`type`（多数为 `null`）。

```js
await fetch(`${BASE}/api/code-community/api/warehouse/get?wid=1`, { headers }).then((r) => r.json());
```
