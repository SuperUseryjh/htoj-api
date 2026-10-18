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

> 响应示例（依据实测抓包 `re/samples/problem-list.json`，已脱敏）

```json
{
  "records": [
    {
      "pid": 22169438826624,
      "problemId": "P1000",
      "title": "新手引导-OJ题",
      "difficulty": { "id": 1, "name": "入门", "color": "#FF5100" },
      "owner": null,
      "type": 1,
      "tags": [
        { "id": 557, "name": "模拟" },
        { "id": 618, "name": "顺序结构" }
      ],
      "acStatus": { "id": 3, "name": "未通过", "shortName": null, "chineseName": null },
      "total": 184718,
      "ac": 173021,
      "rn": null
    }
  ],
  "total": 38665,
  "size": 3,
  "current": 1,
  "orders": [],
  "searchCount": true,
  "pages": 12889
}
```

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

> 响应示例（依据实测抓包 `re/samples/submission-list.json`，已脱敏；数组仅列 2 条）

```json
{
  "records": [
    {
      "uid": "dfbb0f4b648a9c6abdbf0948799d66ca",
      "submitId": 51204677,
      "username": "用户8d31e4",
      "pid": 22243802306048,
      "displayPid": "LGP11576",
      "title": "[CCC 2020] Dog Treats",
      "displayId": null,
      "submitTime": 1789289786535,
      "status": { "id": 0, "name": "Accepted", "shortName": null, "chineseName": null },
      "isMine": null,
      "time": 4,
      "memory": 812,
      "length": null,
      "language": "C++17 With O2",
      "score": 100,
      "cid": 0,
      "tid": 22302141951872,
      "gid": 22169370776704,
      "source": 1
    },
    {
      "uid": "dfbb0f4b648a9c6abdbf0948799d66ca",
      "submitId": 51196180,
      "username": "用户8d31e4",
      "pid": 22069044965120,
      "displayPid": "LGP3373",
      "title": "【必做题】【模板】线段树 2",
      "displayId": null,
      "submitTime": 1789287332715,
      "status": { "id": 0, "name": "Accepted", "shortName": null, "chineseName": null },
      "isMine": null,
      "time": 276,
      "memory": 11076,
      "length": null,
      "language": "C++17 With O2",
      "score": 100,
      "cid": 0,
      "tid": 22302141951872,
      "gid": 22169370776704,
      "source": 1
    }
  ],
  "total": 0,
  "size": 3,
  "current": 1,
  "orders": [],
  "searchCount": true,
  "pages": 0
}
```

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

> 响应示例（依据实测抓包 `re/samples/my-submission-list.json`，已脱敏）

```json
{
  "records": [
    {
      "uid": "dfbb0f4b648a9c6abdbf0948799d66ca",
      "submitId": 51980181,
      "username": "用户8d31e4",
      "pid": 22169438826624,
      "displayPid": "P1000",
      "title": "新手引导-OJ题",
      "displayId": null,
      "submitTime": 1790854350847,
      "status": { "id": 0, "name": "Accepted", "shortName": null, "chineseName": null },
      "isMine": null,
      "time": 0,
      "memory": 3392,
      "length": null,
      "language": "C++17 With O2",
      "score": 100,
      "cid": 0,
      "tid": 0,
      "gid": 0,
      "source": 1
    },
    {
      "uid": "dfbb0f4b648a9c6abdbf0948799d66ca",
      "submitId": 45224983,
      "username": "用户8d31e4",
      "pid": 22169438826624,
      "displayPid": "P1000",
      "title": "新手引导-OJ题",
      "displayId": null,
      "submitTime": 1783416941739,
      "status": { "id": 4, "name": "Wrong Answer", "shortName": null, "chineseName": null },
      "isMine": null,
      "time": 0,
      "memory": 3312,
      "length": null,
      "language": "C++14 With O2",
      "score": 0,
      "cid": 0,
      "tid": 0,
      "gid": 0,
      "source": 1
    }
  ],
  "total": 2,
  "size": 2,
  "current": 1,
  "orders": [],
  "searchCount": true,
  "pages": 1
}
```

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

> 响应示例（依据文档既有示例，`data` 为数字 `submitId`，**未实测**）

```json
51980181
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

> 响应示例（依据实测抓包 `re/samples/test-judge-submit.json`，已脱敏；`data` 为字符串）

```json
"TEST_JUDGE_2d531063feaa6b6e2f3b522d5181c3a9"
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

> 响应示例（依据实测抓包 `re/samples/test-judge-result.json`，已脱敏；`userOutputFile` 路径已截断）

```json
{
  "status": { "id": 0, "name": "Success", "shortName": null, "chineseName": "运行通过" },
  "resultCode": 1,
  "time": 0,
  "memory": 3392,
  "userInput": "5",
  "userOutput": "5",
  "userOutputFile": "…",
  "expectedOutput": null,
  "stderr": "",
  "problemJudgeMode": null
}
```

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

> 响应骨架（依据类型 `FileUrlVO` 推导，字段未确认，**未实测**）

```json
{}
```

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

> 响应示例（依据实测抓包 `re/samples/submission-detail.json`，已脱敏；`userCode` 已截断）

```json
{
  "submitId": 51980181,
  "resultCode": 1,
  "canCreateProblemSolution": false,
  "uid": "dfbb0f4b648a9c6abdbf0948799d66ca",
  "pid": 22169438826624,
  "type": 1,
  "problemId": "P1000",
  "userCode": "…",
  "language": "C++17 With O2",
  "additionalCaseResults": [],
  "caseResults": null,
  "caseGroups": [
    {
      "groupNum": 1,
      "calculateTypeCode": 1,
      "calculateTypeName": "SUM",
      "groupScore": 100,
      "caseResult": [
        {
          "pid": 22169438826624,
          "submitId": 51980181,
          "uid": null,
          "caseId": null,
          "time": 0,
          "memory": 3392,
          "score": 100,
          "status": { "id": 0, "name": "Accepted", "shortName": "AC", "chineseName": null },
          "seq": 1,
          "message": "",
          "groupNum": 1,
          "calculateType": null
        }
      ]
    }
  ],
  "cid": null,
  "gid": null,
  "runResult": null,
  "tid": null,
  "objectiveScore": 0,
  "score": 100,
  "answers": null,
  "firstAc": true,
  "cheatTag": null,
  "unfinishedProblemNum": null,
  "budge": null,
  "budgeName": null,
  "showAiButton": null,
  "afterContestSubmit": null,
  "guideConfig": null
}
```

```js
await fetch(
  `${BASE}/api/htoj-biz-gateway/api/get-submission-detail?submitId=51980181`,
  { headers },
).then((r) => r.json());
```

## 题目语言与测试点

`GET /api/code-community/api/get-problem-language-and-case` 🚫 被网关 403 拒绝

返回题目可用语言与测试点信息（`GetProblemLanguageAndCaseResponseVO`），当前不可用：

> 响应（该接口被网关拦截，无成功样例；实测返回下述网关错误结构）

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

> 响应示例（依据实测抓包 `re/samples/problem-detail.json`，已脱敏；`content` / `modelAnswer` / `guideModelAnswer` 等长文本已截断）

```json
{
  "problemBaseVO": {
    "id": 22169438826624,
    "problemId": "P1000",
    "title": "新手引导-OJ题",
    "content": "…",
    "difficulty": { "id": 1, "name": "入门", "color": "#FF5100" },
    "source": { "id": 1, "name": "核桃编程官方" },
    "type": 1,
    "tags": [
      { "id": 557, "name": "模拟" },
      { "id": 618, "name": "顺序结构" }
    ],
    "showProblemSolution": true,
    "showJudgeRecord": true,
    "zone": "cpp",
    "historyResult": null,
    "total": 184718,
    "ac": 173021,
    "wid": 1
  },
  "problemChoiceDetailVO": null,
  "problemOjDetailVO": {
    "problemLanguage": [
      { "id": 7, "name": "C++17 With O2" },
      { "id": 10, "name": "Python3" }
    ],
    "ioMode": { "id": 1, "name": "标准IO" },
    "sampleCaseList": null,
    "timeLimit": 1000,
    "memoryLimit": 256,
    "stackLimit": 256,
    "timeLimitMax": 1000,
    "memoryLimitMax": 256,
    "stackLimitMax": 256,
    "judgeMode": { "value": "default", "name": "传统题" },
    "ioReadFileName": "case.in",
    "ioWriteFileName": "case.out"
  },
  "problemObjectiveDetailVO": null,
  "ownerVo": {
    "uid": "3adc3226deec9ef53503785de1cdead7",
    "nickname": "用户24debb",
    "avatar": "https://example.invalid/910af96b61ab.jpg",
    "ccfLevel": null,
    "authenticationIcon": null,
    "userId": null
  },
  "isGuide": true,
  "isGuideTraining": null,
  "modelAnswer": "…",
  "budge": "…",
  "budgeName": null,
  "likeCount": 584,
  "dislikeCount": 233,
  "gid": null,
  "noPrev": true,
  "noNext": false,
  "accepted": false,
  "hideResult": null,
  "additionalFiles": null,
  "like": false,
  "dislike": false,
  "guideConfigVo": {
    "guideProblemId": 22169438826624,
    "guideModelAnswer": "…",
    "guideBudge": "…",
    "guideTrainingId": 22448103338112,
    "guideBudgeId": null,
    "guideTrainingBudgeId": null
  }
}
```

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

> 响应（该接口被网关拦截，无成功样例；实测返回下述网关错误结构）

```json
{ "code": 403, "message": "Gateway Error:Access Denied" }
```

选择题选项在 `get-problem-detail` 的 `content`（`{{ select(n) }}` 占位）或 `problemChoiceDetailVO` 中获取。

## 提交测试点明细

`GET /api/code-community/api/get-submission-case-list` 🚫 被网关 403 拒绝

按 `submitId` 返回测试点分组明细（`TestCaseGroupItemVO[]`）。当前被网关屏蔽：

> 响应示例（依据实测抓包 `re/samples/submission-case-list.json`，已脱敏；当前被网关 403 拦截）

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

> 响应骨架（依据类型 `Pagination<ContestProblemIndexVO>` 推导，record 字段未验证，**未实测**）

```json
{
  "records": [],
  "total": 0,
  "size": 20,
  "current": 1,
  "pages": 0,
  "orders": [],
  "searchCount": true
}
```

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

> 响应示例（依据实测抓包 `re/samples/problem-reply-count.json`，已脱敏；`data` 为数字）

```json
120
```

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

> 响应骨架（依据前端签名 `httpService.post` 推导，`data` 为 `unknown`，**未实测**）

```json
null
```

```js
await fetch(`${BASE}/api/code-community/api/problem/like?pid=22169438826624`, {
  method: "POST",
  headers,
}).then((r) => r.json());
```

## 取消点赞题目

`POST /api/code-community/api/problem/unlike` ✍️ 写操作未实测

取消题目点赞，参数同上（query：`pid`）。响应结构未验证。

> 响应骨架（依据前端签名 `httpService.post` 推导，`data` 为 `unknown`，**未实测**）

```json
null
```

```js
await fetch(`${BASE}/api/code-community/api/problem/unlike?pid=22169438826624`, {
  method: "POST",
  headers,
}).then((r) => r.json());
```

## 点踩题目

`POST /api/code-community/api/problem/dislike` ✍️ 写操作未实测

为题目点踩，参数同上（query：`pid`）。响应结构未验证。

> 响应骨架（依据前端签名 `httpService.post` 推导，`data` 为 `unknown`，**未实测**）

```json
null
```

```js
await fetch(`${BASE}/api/code-community/api/problem/dislike?pid=22169438826624`, {
  method: "POST",
  headers,
}).then((r) => r.json());
```

## 取消点踩题目

`POST /api/code-community/api/problem/undislike` ✍️ 写操作未实测

取消题目点踩，参数同上（query：`pid`）。响应结构未验证。

> 响应骨架（依据前端签名 `httpService.post` 推导，`data` 为 `unknown`，**未实测**）

```json
null
```

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

> 响应骨架（依据类型 `ProblemRecommendVO[]` 推导，record 字段未验证，**未实测**）

```json
[]
```

```js
await fetch(
  `${BASE}/api/code-community/api/problem/ide-get-problem-recommend?currentPid=22169438826624`,
  { headers },
).then((r) => r.json());
```

## 题库内上一题 / 下一题

`GET /api/code-community/api/warehouse/warehouse-problem` ✅ 已实测可用

在某个题库内按顺序定位相邻题目。`data` 直接是相邻题目的 pid，**裸数字**（注意：另外三个同类接口返回的是 `{ pid }` 对象，形状不统一）；已经到边界时 `data` 为 `null`。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `currentPid` | number | 是 | 当前题目内部 id |
| `direct` | number | 是 | `1`=上一题，`2`=下一题 |
| `wid` | number | 是 | 题库 id；缺失返回 `errCode=400 ... 'wid' ...` |

> 实测（P1000，`wid=1`）：`direct=2` → 下一题 pid `22443705437952`；`direct=1` → `null`（P1000 已是第一题）

```json
22443705437952
```

```js
await fetch(
  `${BASE}/api/code-community/api/warehouse/warehouse-problem?currentPid=22169438826624&direct=2&wid=1`,
  { headers },
).then((r) => r.json());
```

## 小组内上一题 / 下一题

`GET /api/code-community/api/group/group-problem` ⚠️ 路由存在（非 null 样本未取到）

在某个小组内按顺序定位相邻题目。用样例里的 pid + gid 组合实测两个方向都返回 `data: null`（可能该题已不在这个小组内、或已是边界），所以**没有邻居时返回 `null` 是确定的，有邻居时的形状未验证** —— 参照题单 / 比赛推测是 `{ pid }`，实现时建议连同裸数字一起兜。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `currentPid` | number | 是 | 当前题目内部 id |
| `direct` | number | 是 | `1`=上一题，`2`=下一题 |
| `gid` | number | 是 | 小组 id；缺失返回 `errCode=400 ... 'gid' ...` |

> 实测：`currentPid=22243802306048&gid=22169370776704`，`direct` 取 `1` / `2` 均返回 `null`

```json
null
```

```js
await fetch(
  `${BASE}/api/code-community/api/group/group-problem?currentPid=22169438826624&direct=2&gid=22156385706112`,
  { headers },
).then((r) => r.json());
```

## 题单内上一题 / 下一题

`GET /api/code-community/api/training-problem-skip` ✅ 已实测可用

在某个题单内按顺序定位相邻题目。`data` 是对象 `{ pid, unfinishedProblemNum, changeChapter }`（不是裸数字，注意与题库接口的形状差异）；已经到边界时 `data` 为 `null`。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `currentPid` | number | 是 | 当前题目内部 id |
| `direct` | number | 是 | `1`=上一题，`2`=下一题 |
| `tid` | number | 是 | 题单 id；缺失返回 `errCode=400 ... 'tid' ...` |
| `gid` | number | 否 | 小组 id |

> 实测（`tid=22302141951872`）：`direct=2` → `{ pid: 22069045878656, unfinishedProblemNum: 0, changeChapter: false }`；`direct=1` → `null`（该题已是题单第一题）

```json
{
  "pid": 22069045878656,
  "unfinishedProblemNum": 0,
  "changeChapter": false
}
```

```js
await fetch(
  `${BASE}/api/code-community/api/training-problem-skip?currentPid=22169438826624&direct=2&tid=22302141951872`,
  { headers },
).then((r) => r.json());
```

## 比赛内上一题 / 下一题

`GET /api/code-community/gwpub/contest-problem-skip` ✅ 已实测可用

在某场比赛内按顺序定位相邻题目。`data` 是对象 `{ pid }`（不是裸数字）；没有邻居时返回 `null`。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `currentPid` | number | 是 | 当前题目内部 id |
| `direct` | number | 是 | `1`=上一题，`2`=下一题 |
| `cid` | number | 是 | 比赛 id；缺失返回 `errCode=400 ... 'cid' ...` |
| `gid` | number | 否 | 小组 id |

> 实测（`cid=22930273863808`，比赛进行中）：`currentPid=22929683167744`，`direct=2` → `{ "pid": 22929670253312 }`；`direct=1` → `{ "pid": 22929689728000 }`

```json
{
  "pid": 22929670253312
}
```

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

> 响应骨架（依据文档实测字段清单推导，示例参数下各字段均为 `null`，**未实测**）

```json
{
  "currentChapterPid": null,
  "nextChapterPid": null,
  "prevChapterPid": null,
  "prevChapterName": null,
  "prevChapterUnfinished": null,
  "goodsNum": null,
  "rocketColorUrl": null
}
```

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

> 响应骨架（依据类型 `DrawerTrainingChapterListVo[]` 推导，record 字段未验证，**未实测**）

```json
[]
```

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

> 响应骨架（依据类型 `DrawerProblemListVo[]` 推导，record 字段未验证，**未实测**）

```json
[]
```

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

> 响应骨架（依据类型 `string` 推导，`data` 为短链字符串，**未实测**）

```json
""
```

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

> 响应骨架（依据前端签名 `httpService.post` 推导，`data` 为 `unknown`，**未实测**）

```json
null
```

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

> 响应示例（依据实测抓包 `re/samples/warehouse-list.json`，已脱敏；数组仅列前 2 项）

```json
[
  { "value": 1, "label": "核桃题库" },
  { "value": 3, "label": "洛谷" }
]
```

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

> 响应示例（依据实测抓包 `re/samples/warehouse-problems.json`，已脱敏；样本 `data` 为空数组）

```json
[]
```

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

> 响应示例（依据实测抓包 `re/samples/warehouse-get.json`，已脱敏）

```json
{
  "id": 1,
  "title": "核桃题库",
  "author": null,
  "auth": null,
  "sort": null,
  "gmtModified": null,
  "zone": null,
  "createTime": null,
  "isCanUp": null,
  "isCanDown": null,
  "isCanDelete": null,
  "isCanModify": null,
  "type": null
}
```

```js
await fetch(`${BASE}/api/code-community/api/warehouse/get?wid=1`, { headers }).then((r) => r.json());
```
