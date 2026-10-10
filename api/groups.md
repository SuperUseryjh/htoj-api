# 小组

本页整理 HTOJ 的小组相关接口，对应前端 `api/oj/group.ts` 与 `api/groupCommon.ts`，覆盖小组首页、小组内的题单 / 比赛 / 题目 / 公告 / 成员列表，加组（链接加入 / 申请加入）、组内题目抽屉，以及小组维度的 Markdown 上传、COS 上传凭证与上传产物查询。

本文覆盖 15 个接口：✅1 / ⚠️11 / ✍️3。

网关地址、请求头、统一响应格式（`{ errCode, data, errMsg }`）、分页结构、各类枚举等全局约定见 [index.md](./index.md)，本页不再重复。类型名（如 `GroupVO`、`TrainingItem`、`ContestVO`、`ProblemListItem`）集中定义在 [htoj-api.d.ts](./htoj-api.d.ts)。

> 小组相关接口**大多要求 `gid`**（[index.md](./index.md) 提到 `gid` 是 10 个接口的必填参数，本页占其中 8 个读取接口）。缺失时后端会原样透出 Java 校验信息，例如 `The required request parameters are missing：Required request parameter 'gid' for method parameter type Long is not present`。
>
> 本页接口均属登录后的小组页面，探针均在**带 token** 的情况下实测；未登录时能否访问未单独验证。下文的「需要 token」默认为「是」。

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

列表接口的分页参数固定为 `currentPage`（从 1 开始）与 `limit`（见 [index.md](./index.md) 分页一节）。写接口统一用 `POST` / `PUT`，请求体为 JSON 时需带 `"Content-Type": "application/json"`；Markdown 上传是 `multipart/form-data`。所有响应都判断 `errCode === 0` 而不是 HTTP 状态码（HTTP 恒为 200）。

## 接口清单

| 接口 | 方法 | 路径 | 验证 | 说明 |
| --- | --- | --- | --- | --- |
| [小组首页](#小组首页) | GET | `/api/code-community/api/get-group-home` | ⚠️ | 小组基本信息 |
| [小组题单列表](#小组题单列表) | GET | `/api/code-community/api/group/get-training-list` | ⚠️ | 组内题单分页 |
| [小组比赛列表](#小组比赛列表) | GET | `/api/code-community/api/group/get-contest-list` | ⚠️ | 组内比赛分页 |
| [小组题目列表](#小组题目列表) | GET | `/api/code-community/api/group/get-problem-list` | ⚠️ | 组内题目分页 |
| [小组公告列表](#小组公告列表) | GET | `/api/code-community/api/group/get-announcement-list` | ⚠️ | 组内公告分页 |
| [我的小组列表](#我的小组列表) | GET | `/api/code-community/api/my-group-list` | ✅ | 我加入的小组分页 |
| [链接加入小组](#链接加入小组) | POST | `/api/code-community/api/access-group` | ✍️ | 凭邀请 code 加组 |
| [申请加入小组](#申请加入小组) | PUT | `/api/code-community/api/group/apply-join` | ✍️ | 提交加组申请 |
| [小组成员列表](#小组成员列表) | GET | `/api/code-community/api/group/get-member-list` | ⚠️ | 成员分页 |
| [组内题目抽屉](#组内题目抽屉) | GET | `/api/code-community/api/group/group-problems` | ⚠️ | 按当前题定位相邻题目 |
| [小组详情（抽屉用）](#小组详情抽屉用) | GET | `/api/code-community/api/group/get` | ⚠️ | 返回 `GroupVO` |
| [上传 Markdown 图片](#上传-markdown-图片) | POST | `/api/code-community-forum/api/upload/group/upload-image?gid=` | ✍️ | 富文本编辑器插图 |
| [获取小组上传凭证](#获取小组上传凭证) | GET | `/api/code-community/api/file/upload-group-token?gid=` | ⚠️ | COS 临时密钥 |
| [查询上传样例包](#查询上传样例包) | GET | `/api/code-community/api/file/get-group-case-list?gid=` | ⚠️ | 压缩包解压后的样例 |
| [查询上传题目包](#查询上传题目包) | GET | `/api/code-community/gwpub/file/get-group-problem?gid=` | ⚠️ | 压缩包解压后的题目 |

---

## 小组首页

`GET /api/code-community/api/get-group-home` ⚠️ 路由存在但参数不足

拉某小组的基本信息，是小组各页面顶部的数据源（页面用它显示组名 `name`）。响应类型源码标注为 `GroupInfoVO`。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `gid` | number | 是 | 小组 id |

要点：

- **`gid` 必填**：探针未带时返回 `errCode=400`：
  `The required request parameters are missing：Required request parameter 'gid' for method parameter type Long is not present`。
- `GroupInfoVO` 在 [htoj-api.d.ts](./htoj-api.d.ts) 中未定名，且无抓包样例，**字段未验证**；已知页面至少会读取 `name`。

```js
const data = await fetch(
  `${BASE}/api/code-community/api/get-group-home?gid=22156385706112`,
  { headers: HEADERS },
).then((r) => r.json());
```

---

## 小组题单列表

`GET /api/code-community/api/group/get-training-list` ⚠️ 路由存在但参数不足

小组页「题单」标签的分页列表。响应类型 `Pagination<TrainingItem>`（记录与题单域的 record 同构，见 [trainings.md](./trainings.md)；字段来源样例 `re/samples/training-list.json`、`re/samples/training-detail-gid.json`）。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `gid` | number | 是 | 小组 id |
| `keyword` | string | 否 | 题单名称关键词（前端仅在该字段非空时下发） |
| `currentPage` | number | 否 | 页码，从 1 开始 |
| `limit` | number | 否 | 每页条数，默认 20 |

要点：

- **`gid` 必填**，缺失报 Java 校验原文（同上）：`... Required request parameter 'gid' for method parameter type Long is not present`。
- 记录字段与 [trainings.md](./trainings.md) 的题单列表一致（`id` / `trainingNo` / `title` / `ownerVo` / `problemCount` / `acCount` / `isAttend` 等），此处不再重复。
- 探针未带 `gid`，未取到有效样本，故标 ⚠️。

```js
const data = await fetch(
  `${BASE}/api/code-community/api/group/get-training-list?gid=22156385706112&currentPage=1&limit=20`,
  { headers: HEADERS },
).then((r) => r.json());
```

---

## 小组比赛列表

`GET /api/code-community/api/group/get-contest-list` ⚠️ 路由存在但参数不足

小组页「比赛」标签的分页列表。响应类型 `Pagination<ContestVO>`（字段见 [contest.md 比赛列表](./contests.md#比赛列表) 与 [htoj-api.d.ts](./htoj-api.d.ts)，样例 `re/samples/contest-list.json`）。注意本接口的组内比赛**会带 `gid`**，与站点公共比赛列表 [get-contest-list](./contests.md#比赛列表)（不支持按 `gid` 过滤）不同。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `gid` | number | 是 | 小组 id |
| `status` | string | 否 | 状态多选，逗号拼接（`-1` 未开始 / `0` 进行中 / `1` 已结束） |
| `type` | string | 否 | 赛制多选，逗号拼接（`1` OI / `2` ACM / `3` 乐多 / `4` IOI / `5` IOI(OFS) / `6` 严格 IOI） |
| `matchType` | string | 否 | 赛事类型多选，逗号拼接 |
| `keyword` | string | 否 | 比赛名称关键词 |
| `currentPage` | number | 否 | 页码，从 1 开始 |
| `limit` | number | 否 | 每页条数，默认 20 |

要点：

- 多选字段（`status` / `type` / `matchType`）前端用逗号拼接为单个字符串后下发（空数组则不下发）。
- **`gid` 必填**，缺失报 Java 校验原文（同上）。
- 探针未带 `gid`，未取到有效样本，故标 ⚠️；`limit` 是否有上限未单独验证。

```js
const data = await fetch(
  `${BASE}/api/code-community/api/group/get-contest-list?gid=22156385706112&currentPage=1&limit=20&type=1`,
  { headers: HEADERS },
).then((r) => r.json());
```

---

## 小组题目列表

`GET /api/code-community/api/group/get-problem-list` ⚠️ 路由存在但参数不足

小组页「题目」标签的分页列表。响应类型 `Pagination<ProblemListItem>`（字段见 [problems.md 题目列表](./problems.md#题目列表) 与 [htoj-api.d.ts](./htoj-api.d.ts)，样例 `re/samples/problem-list.json`）。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `gid` | number | 是 | 小组 id |
| `difficulty` | string | 否 | 难度多选，逗号拼接，如 `1,2`（注意字段名是 `difficulty`，与题目域的 `difficulties` 不同） |
| `tagId` | string | 否 | 标签多选，逗号拼接 |
| `keyword` | string | 否 | 题目编号或名称关键词 |
| `currentPage` | number | 否 | 页码，从 1 开始 |
| `limit` | number | 否 | 每页条数，默认 20 |

要点：

- **`gid` 必填**，缺失报 Java 校验原文（同上）。
- 多选字段逗号拼接，空数组不下发。
- 探针未带 `gid`，未取到有效样本，故标 ⚠️。

```js
const data = await fetch(
  `${BASE}/api/code-community/api/group/get-problem-list?gid=22156385706112&currentPage=1&limit=20&difficulty=1,2`,
  { headers: HEADERS },
).then((r) => r.json());
```

---

## 小组公告列表

`GET /api/code-community/api/group/get-announcement-list` ⚠️ 路由存在但参数不足

小组页「公告」标签的分页列表。响应类型 `Pagination<Announcement>`。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `gid` | number | 是 | 小组 id |
| `currentPage` | number | 否 | 页码，从 1 开始 |
| `limit` | number | 否 | 每页条数，默认 20 |

要点：

- **`gid` 必填**，缺失报 Java 校验原文（同上）。
- 公告条目类型 `Announcement` 在 [htoj-api.d.ts](./htoj-api.d.ts) 中为开放对象（`Record<string, unknown>`），**字段未验证**（无抓包样例）。
- 探针未带 `gid`，未取到有效样本，故标 ⚠️。

```js
const data = await fetch(
  `${BASE}/api/code-community/api/group/get-announcement-list?gid=22156385706112&currentPage=1&limit=20`,
  { headers: HEADERS },
).then((r) => r.json());
```

---

## 我的小组列表

`GET /api/code-community/api/my-group-list` ✅ 已实测可用

返回当前登录用户加入的小组列表，用于「我的小组 / 小组搜索」视图。响应为分页对象。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `zone` | string | 否 | 区服过滤（`cpp` / `python`），前端表单字段 |
| `currentPage` | number | 否 | 页码，从 1 开始 |
| `limit` | number | 否 | 每页条数，默认 20 |

要点：

- 无需 `gid`；**需要登录**（返回的是当前用户自己的小组）。
- 探针实测 `errCode=0`，`data` 为分页对象（源码泛型标注为 `Pagination<GroupListRequestVO>`，探针 `shape` 记为 `Page(10/15)`）。

`data.records[]` 实测字段（来源 `re/api-probe.json` 的 `getMyGroupList` 样例，该样例字符串在探针文件中被截断）：

```json
{
  "id": 22824216940672,
  "name": "2026-CSP备赛练习",
  "description": "csp备赛练习",
  "problemCount": 0,
  "trainingCount": 3,
  "contestCount": 4,
  "zone": "cpp"
}
```

> 注意本接口的记录形状与 [小组详情（抽屉用）](#小组详情抽屉用) 的 `GroupVO` **不同**：这里用 `id`，并带回统计数 `problemCount` / `trainingCount` / `contestCount`，没有 `uid` / `isOwner` / `roles` 等成员视角字段。

```js
const data = await fetch(
  `${BASE}/api/code-community/api/my-group-list?currentPage=1&limit=20`,
  { headers: HEADERS },
).then((r) => r.json());
```

---

## 链接加入小组

`POST /api/code-community/api/access-group` ✍️ 写操作未实测

通过邀请 code 加入小组（前端「邀请链接跳转加组」流程）。参数走 query。**写操作，未在真实账号上实测**。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `code` | string | 是 | 小组邀请 code |

响应类型 `JoinGroupResponseVO`。该类型在仓库中无独立定义文件，字段可依据源码默认值（`re/src/packages/core/pages/callback/group/services/group.service.ts` 的初始化对象）：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `groupId` | number | 小组 id |
| `groupZone` | string | 小组 zone |
| `existed` | boolean | 是否已是成员（判断用） |
| `groupAuth` | number | 入组方式，见下 `GROUP_JOIN_OPTIONS` |
| `groupDesc` | string | 小组简介 |
| `groupName` | string | 小组名 |
| `memberAuth` | number | 当前用户的成员状态，见下 `MEMBER_STATUS_OPTIONS` |
| `owner` | string | 组长展示名 |
| `ownerAvatar` | string | 组长头像 |
| `reason` | string | 申请理由（回显） |

`groupAuth` 枚举（源码 `re/src/packages/core/utils/constant.ts` `GROUP_JOIN_OPTIONS`）：

| 值 | 含义 |
| --- | --- |
| `1` | 仅通过管理员加入 |
| `2` | 直接通过链接加入 |
| `3` | 需要管理员审核 |

`memberAuth` 枚举（同文件的 `MEMBER_STATUS_OPTIONS`）：

| 值 | 含义 |
| --- | --- |
| `0` | 不是成员 |
| `1` | 已申请 |
| `2` | 被拒绝 |
| `3` | 已是成员 |

> 页面逻辑：`groupAuth === 2`（直接通过）时直接跳转；`groupAuth === 3`（需审核）时若 `memberAuth === 3` 则跳转，否则弹出申请面板。

```js
const data = await fetch(
  `${BASE}/api/code-community/api/access-group?code=<inviteCode>`,
  { method: "POST", headers: HEADERS },
).then((r) => r.json());
```

---

## 申请加入小组

`PUT /api/code-community/api/group/apply-join` ✍️ 写操作未实测

提交加入小组的申请。参数走 query。**写操作，未在真实账号上实测**。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `gid` | number | 是 | 小组 id |
| `reason` | string | 是 | 申请理由 |

要点：

- 源码未声明响应泛型，**响应结构未验证**（无样例）。
- 申请成功后前端仅把本地 `memberAuth` 置为 `1`（已申请），不依赖响应体。

```js
await fetch(
  `${BASE}/api/code-community/api/group/apply-join?gid=22156385706112&reason=${encodeURIComponent("申请理由")}`,
  { method: "PUT", headers: HEADERS },
).then((r) => r.json());
```

---

## 小组成员列表

`GET /api/code-community/api/group/get-member-list` ⚠️ 路由存在但参数不足

小组「成员」页的分页列表。响应类型 `Pagination<CGroupMemberListResVO>`。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `gid` | number | 是 | 小组 id |
| `currentPage` | number | 否 | 页码，从 1 开始 |
| `limit` | number | 否 | 每页条数，前端成员页默认 **30** |

要点：

- **`gid` 必填**，缺失报 Java 校验原文（同上）。
- `CGroupMemberListResVO` 无独立定义、无抓包样例，**record 字段未验证**。
- 探针未带 `gid`，未取到有效样本，故标 ⚠️。

```js
const data = await fetch(
  `${BASE}/api/code-community/api/group/get-member-list?gid=22156385706112&currentPage=1&limit=30`,
  { headers: HEADERS },
).then((r) => r.json());
```

---

## 组内题目抽屉

`GET /api/code-community/api/group/group-problems` ⚠️ 路由存在但参数不足

在小组题目抽屉里，按当前题目为中心批量取题目（用于「上一批 / 下一批」加载）。响应类型 `DrawerProblemListVo[]`。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `currentPid` | number | 是 | 当前题目内部 pid |
| `direct` | number | 是 | 方向：`0`=当前一批，`1`=上一批，`2`=下一批 |
| `gid` | number | 是 | 小组 id |

要点：

- **`gid` 必填**，缺失报 Java 校验原文（同上）。
- 响应是数组（非分页），`DrawerProblemListVo` 字段**未验证**（无样例）；题目列表页同类型接口 [warehouse/warehouse-problems](./problems.md#题库题目列表) 的样本为空数组。
- 与 [problems.md 的「小组内上一题 / 下一题」](./problems.md#小组内上一题--下一题)（路径 `/api/code-community/api/group/group-problem`，**单数**）**不是同一接口**，本接口是复数 `group-problems`。

```js
const data = await fetch(
  `${BASE}/api/code-community/api/group/group-problems?currentPid=22169438826624&direct=2&gid=22156385706112`,
  { headers: HEADERS },
).then((r) => r.json());
```

---

## 小组详情（抽屉用）

`GET /api/code-community/api/group/get` ⚠️ 路由存在但参数不足

题目抽屉里展示所属小组的信息。响应类型 `GroupVO`（见 [htoj-api.d.ts](./htoj-api.d.ts)）。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `gid` | number | 是 | 小组 id |

要点：

- **`gid` 必填**，缺失报 Java 校验原文（同上）。
- `GroupVO` 字段：`gid` / `name` / `description` / `zone` / `uid`（组长 uid）/ `isOwner` / `roles` / `permissions`。

`GroupVO` 族实测样例（来源 `re/samples/user-info.json` 的 `myGroup[]`，`GroupVO` 同族结构）：

```json
{
  "gid": 22096840235264,
  "name": "CSP初赛",
  "description": "初赛训练，复习",
  "zone": "cpp",
  "uid": "3adc3226deec9ef53503785de1cdead7",
  "isOwner": false,
  "roles": null,
  "permissions": null
}
```

```js
const data = await fetch(
  `${BASE}/api/code-community/api/group/get?gid=22156385706112`,
  { headers: HEADERS },
).then((r) => r.json());
```

---

## 上传 Markdown 图片

`POST /api/code-community-forum/api/upload/group/upload-image?gid=` ✍️ 写操作未实测

小组富文本编辑器（HTMdEditor）插图接口，走论坛服务。**写操作，未在真实账号上实测**。

请求为 `multipart/form-data`，文件字段名为 `image`；`gid` 走 query（源码拼进路径串）。参数结构：

| 参数 | 传入方式 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| `gid` | query | string | 是 | 小组 id |
| `image` | form-data | File | 是 | 图片文件（表单字段名固定为 `image`） |

响应类型 `{ url: string }`（源码声明），**未验证**。

```js
const form = new FormData();
form.append("image", file); // file 为浏览器 File 对象
const data = await fetch(
  `${BASE}/api/code-community-forum/api/upload/group/upload-image?gid=22156385706112`,
  { method: "POST", headers: HEADERS, body: form }, // 不要手动设置 Content-Type
).then((r) => r.json());
```

---

## 获取小组上传凭证

`GET /api/code-community/api/file/upload-group-token?gid=` ⚠️ 路由存在但参数不足

获取 COS 临时密钥，供小组维度的文件上传使用。`gid` 走 path 串、`dirType` 走 query。

| 参数 | 传入方式 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| `gid` | query（路径串内） | string | 是 | 小组 id |
| `dirType` | query | string | 是 | 上传目录类型，源码默认 `zipFile` |

要点：

- **`dirType` 必填**：探针未带时返回 `errCode=400`：
  `The required request parameters are missing：Required request parameter 'dirType' for method parameter type String is not present`。
- 探针 URL 中 `gid` 仍是未替换的占位符 `gid=${gid}`，故 `gid` 的必填性以源码签名为准（源码形参必传）。
- 响应为 COS 临时密钥（结构**未验证**，无样例）。

```js
const data = await fetch(
  `${BASE}/api/code-community/api/file/upload-group-token?gid=22156385706112&dirType=zipFile`,
  { headers: HEADERS },
).then((r) => r.json());
```

---

## 查询上传样例包

`GET /api/code-community/api/file/get-group-case-list?gid=` ⚠️ 路由存在但参数不足

获取上传的 case 压缩包解压后的文件数据。`gid` 走 path 串、`uploadKey` 走 query。响应类型 `UploadCaseListVO`。

| 参数 | 传入方式 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| `gid` | query（路径串内） | string | 是 | 小组 id |
| `uploadKey` | query | string | 是 | 上传产物 key，源码默认空串 |

要点：

- **`uploadKey` 必填**：探针未带时返回 `errCode=400`：
  `The required request parameters are missing：Required request parameter 'uploadKey' for method parameter type String is not present`。
- `gid` 在探针 URL 中为未替换的占位符，必填性以源码签名为准。
- `UploadCaseListVO` 无独立定义、无样例，**字段未验证**。

```js
const data = await fetch(
  `${BASE}/api/code-community/api/file/get-group-case-list?gid=22156385706112&uploadKey=<key>`,
  { headers: HEADERS },
).then((r) => r.json());
```

---

## 查询上传题目包

`GET /api/code-community/gwpub/file/get-group-problem?gid=` ⚠️ 路由存在但参数不足

获取上传的题目压缩包解压后的题目信息。走 `gwpub` 前缀，`gid` 走 path 串、`uploadKey` 走 query。响应类型 `UploadProblemVO`。

| 参数 | 传入方式 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| `gid` | query（路径串内） | string | 是 | 小组 id |
| `uploadKey` | query | string | 是 | 上传产物 key，源码默认空串 |

要点：

- **`uploadKey` 必填**：探针未带时返回 `errCode=400`：
  `The required request parameters are missing：Required request parameter 'uploadKey' for method parameter type String is not present`。
- `gid` 在探针 URL 中为未替换的占位符，必填性以源码签名为准。
- `UploadProblemVO` 无独立定义、无样例，**字段未验证**。

```js
const data = await fetch(
  `${BASE}/api/code-community/gwpub/file/get-group-problem?gid=22156385706112&uploadKey=<key>`,
  { headers: HEADERS },
).then((r) => r.json());
```
