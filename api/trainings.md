# 题单（训练）

本文档收录前端 `api/oj/training.ts` 中的题单相关接口：题单列表、题单详情、题单题目列表、章节定位、题单内下一题，以及「开始练习」（参与题单）。

## 通用约定

所有接口都走网关，完整地址为 `https://api.htoj.com.cn` + 下表路径。请求需带全局头（详见 [index.md](./index.md#请求头)），并注意：

- **`Hetao-Oj-Zone` 缺省会报 `errCode=400 域属性为空或无效，无法获取数据`。**
- 响应统一为 `{ "errCode": 0, "data": ..., "errMsg": "success" }`，`errCode !== 0` 时 `data` 为 `null`。业务错误文案是后端原样透出（例如 `The required request parameters are missing：Required request parameter 'tid' ...`）。

下文 fetch 范例共用一个前置定义：

```js
const BASE = "https://api.htoj.com.cn";
const HEADERS = {
  "Hetao-Oj-Zone": "cpp",        // 必需：cpp | python
  "HT_PLATFORM": "htojWeb",
  "HT_SYSTEM": "web",
  "HT_VERSION": "1.0.0",
  "app_id": "com.hetao101.oj",
  "Authorization": "<token>",    // 登录后填写；原始 JWT，不加 Bearer 前缀
};
const get = (path, query = {}) =>
  fetch(`${BASE}${path}?${new URLSearchParams(query)}`, { headers: HEADERS }).then((r) => r.json());
const post = (path, body) =>
  fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { ...HEADERS, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then((r) => r.json());
```

### 题单与「参与」状态

- 题单存在**已参与 / 未参与**两种状态。列表中由 `isAttend`（布尔）或 `status`（`{id,name}`，实测未参与为 `{ id: 2, name: "未参加" }`）体现；未参与的题单**必须先「开始练习」**（`register-training`）才能看题。
- 未参与时直接调 `get-training-problem-list` 会返回 `errCode=400，errMsg=请先点击开始练习！`。

### 题单题的题目上下文（重要）

题单里的题目，在调用 `GET /api/htoj-biz-gateway/api/get-problem-detail` 时**必须带上 `tid`**；如果是小组题单，还要带上 `gid`，否则后端返回**「该题目不可见」**。比赛题（`cid`）、小组题（`gid`）同理：缺了归属参数都会「该题目不可见」。

> 该约束来自插件 `src/extension.ts` 与 `src/views/trainingTree.ts`：从题单打开题目时会一路把 `{ tid, gid? }` 带到题目详情与提交请求。

---

## 题单列表

`GET /api/code-community/api/get-training-list` ✅

分页返回题单列表，支持按题单编号或名称搜索。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `currentPage` | number | 否 | 页码，从 1 开始；前端默认 1 |
| `limit` | number | 否 | 每页条数；前端默认 50 |
| `keyword` | string | 否 | 搜索关键字（题单编号或名称） |

响应：`Pagination<TrainingVO>`，`data` 为 `{ records, total, size, current, orders, searchCount, pages }`。`records[]` 中每条实测存在的字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | number | 题单 id（即后续要用的 `tid`） |
| `trainingNo` | string | 题单编号，如 `"01464"` |
| `title` | string | 题单标题 |
| `subtitle` / `description` | string \| null | 副标题 / 简介（Markdown） |
| `author` | string \| null | 作者 uid |
| `ownerVo` | object \| null | 作者信息：`{ uid, nickname, avatar, ccfLevel, authenticationIcon, userId }` |
| `auth` | number | 权限标记（实测 `2`） |
| `problemCount` | number | 题目总数 |
| `acCount` / `completeCount` | number \| null | 已通过数 / 完成数 |
| `totalCount` | number \| null | 参与人数 |
| `gmtModified` | number \| null | 修改时间（毫秒） |
| `nextPid` | number \| null | 下一题 pid |
| `zone` | string \| null | 站点，`cpp` / `python` |
| `languages` | string[] \| null | 语言 |
| `status` | object \| null | 参与状态对象 `{ id, name, shortName, chineseName }`，实测未参与为 `{ id: 2, name: "未参加" }` |
| `isAttend` | boolean \| null | 是否已参与 |
| `imMark` / `productLineIds` | — | 实测 `0` / `[]` |

> 前端 `src/api/types.ts` 把 `status` 声明为 `number`，但真实响应里是对象；以样例结构为准。

```js
const res = await get("/api/code-community/api/get-training-list", { currentPage: 1, limit: 20 });
console.log(res.data.records.map((t) => ({ tid: t.id, title: t.title, isAttend: t.isAttend })));
```

---

## 题单详情

`GET /api/code-community/api/get-training-detail` ✅

按 `tid` 获取单个题单详情，字段与列表 record 基本一致。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `tid` | number | 是 | 题单 id |
| `gid` | number | 否 | 小组 id，**小组题单必须带** |

响应：`TrainingInfoVO`，字段见上一节 record（实测详见 `re/samples/training-detail.json` 与 `training-detail-gid.json`）。成功样例中 `isAttend` 分别为 `false`（普通题单）与 `true`（已参与，`gid` 变体），`status` 为 `null`。

> 缺 `tid` 时返回 `errCode=400，errMsg=The required request parameters are missing：...'tid'...`；带无效 `tid` 的行为未验证。

```js
const res = await get("/api/code-community/api/get-training-detail", { tid: 22338793157760 });
console.log(res.data.title, res.data.isAttend);
// 小组题单：{ tid: 22302141951872, gid: 22169370776704 }
```

---

## 题单题目列表

`GET /api/code-community/api/get-training-problem-list` ✅

按章节分页返回题单下的题目，是题单页「按章节展示题目」的数据来源。响应天然是**章节 → 题目**的层级结构。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `tid` | number | 是 | 题单 id |
| `gid` | number | 否 | 小组 id，小组题单必须带 |
| `tcid` | number | 否 | 章节 id（注意键名是 `tcid`，不是 `chapterId`） |
| `currentPage` | number | 否 | 章节页码，前端默认 1 |
| `limit` | number | 否 | 每页章节数，前端默认 20；插件实际取 200 |

响应：`Pagination<TrainingChapterProblemVO>`。`records[]` 每项 = 一个章节 + 该章节题目：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `trainingChapterVO` | object \| null | 章节：`{ id, tid, name, sort }`。**实测字段名是 `name`**（插件 `src/api/types.ts` 写作 `title`，以样例为准） |
| `problemVOList` | array \| null | 该章节题目数组，见下 |
| `nextPid` | number \| null | 下一题 pid |
| `isAttend` | boolean \| null | 该题单是否已参与 |

`problemVOList[]` 内每道题实测字段：`pid`、`problemId`（展示编号，如 `"LGP8772"`）、`title`、`difficulty`（`{ id, name, color }`）、`owner`、`type`（`1`=OJ 编程题）、`tags`（`{ id, name }[]`，可为 `null`）、`acStatus`（`{ id, name, shortName, chineseName }`，如 `{ id: 4, name: "已通过" }`、`{ id: 2, name: "未提交" }`）、`total`、`ac`、`rn`。

> **前置条件**：题单必须已参与，否则返回 `errCode=400，errMsg=请先点击开始练习！`，需先调 `register-training`。页面中当前题单未参与时，插件会替换成「开始练习」入口而非直接报错。

```js
const res = await get("/api/code-community/api/get-training-problem-list", {
  tid: 22302141951872, currentPage: 1, limit: 200,
});
for (const chapter of res.data.records) {
  console.log(chapter.trainingChapterVO?.name, chapter.problemVOList?.length);
}
```

---

## 章节定位

`GET /api/code-community/gwpub/api/get-training-chapter-page` ⚠️

按 `tid` + `tcid` 定位到题单中的某个章节（用于「跳到指定章节」）。**未获得成功响应**：实测缺 `tid` 返回 `errCode=400`（提示缺 `tid`），带参数但章节不匹配时返回 `errCode=400，errMsg=该章节不存在！`（见 `re/samples/training-chapter-page.json`）。成功时的 `data` 结构未验证。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `tid` | number | 是 | 题单 id |
| `tcid` | number | 是 | 章节 id |
| `gid` | number | 否 | 小组 id，小组题单需要 |

响应：前端声明为 `QueryPageVO`，**具体字段未验证**。

```js
const res = await get("/api/code-community/gwpub/api/get-training-chapter-page", {
  tid: 22302141951872, tcid: 1468,
});
console.log(res); // 章节无效时：{ errCode: 400, data: null, errMsg: "该章节不存在！" }
```

---

## 题单内下一题

`GET /api/code-community/gwpub/api/user-next-problem` ⚠️

返回用户在题单里的「下一题」（引导用）。**未获得成功响应**，响应含义未验证。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `tid` | number | 是 | 题单 id |
| `gid` | number | 是 | 小组 id；实测缺省时后端报缺 `gid`（`Required request parameter 'gid' ...`） |

响应：前端声明为 `number`（推测为下一题的 pid），**未验证**。

```js
const res = await get("/api/code-community/gwpub/api/user-next-problem", {
  tid: 22302141951872, gid: 22169370776704,
});
console.log(res);
```

---

## 开始练习（参与题单）

`POST /api/code-community/api/register-training` ✍️

参与（报名）一个题单，相当于页面上的「开始练习」。写操作，**未实测**（避免在真实账号上产生副作用）；签名来自前端源码。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `tid` | number | 是 | 要参与的题单 id（放在 JSON body 里） |

请求体为 `{ "tid": <number> }`。前端未声明返回类型；成功以 `errCode === 0` 判断。参与成功后可重新调用 `get-training-problem-list`，其 `isAttend` 会变为 `true`。

```js
const res = await post("/api/code-community/api/register-training", { tid: 22338793157760 });
console.log(res.errCode); // 0 表示参与成功
```

---

## 与本页相关的其它接口

以下接口在清单中不属于 `oj/training.ts`，但属于题单场景，详情见 [problems.md](./problems.md)：

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/code-community/api/training-problem-skip?currentPid=&direct=&tid=&gid?` | 题单内上/下一题 |
| GET | `/api/code-community/api/training-problem-drawer?currentPid=&tid=` | 题单抽屉目录 |
| GET | `/api/htoj-biz-gateway/api/get-problem-detail?problemId=&tid=&gid=` | 题单题详情，必须带 `tid`（小组题单还要 `gid`） |
