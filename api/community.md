# 讨论区与题解

本页整理 HTOJ 讨论区（帖子 / 回复）、题解、AI 题解与共创版本、AI 题解划线评论（行内评论）以及专栏文章相关接口，对应前端 `api/oj/community.ts`、`oj/solution.ts`、`oj/aiSolution.ts`、`oj/aiSolutionComment.ts`、`oj/article.ts`。

> 全局约定（网关前缀、必带请求头、统一 `errCode` 信封、分页与枚举）见 [index.md](./index.md)，本页不再重复。类型名集中定义在 [htoj-api.d.ts](./htoj-api.d.ts)。题目讨论数接口在 [problems.md](./problems.md#题目讨论数)。

本文覆盖 43 个接口：✅6 / ⚠️13 / ✍️23 / ❔1。

## 接口清单

| 接口 | 方法 | 路径 | 验证 | 说明 |
| --- | --- | --- | --- | --- |
| [讨论分类](#讨论分类) | GET | `/api/code-community-forum/api/common/posterCategory` | ✅ | 讨论分类字典 |
| [帖子状态字典](#帖子状态字典) | GET | `/api/code-community-forum/api/common/posterStatus` | ✅ | 帖子审核/展示状态字典 |
| [讨论列表](#讨论列表) | GET | `/api/code-community-forum/api/poster/listPoster` | ⚠️ | 按分类分页拉帖子 |
| [我的帖子](#我的帖子) | GET | `/api/code-community-forum/api/poster/myPoster` | ✅ | 我发布 / 我回复的帖子 |
| [发布帖子](#发布帖子) | POST | `/api/code-community-forum/api/poster/post` | ✍️ | 发讨论 / 题解 |
| [编辑帖子](#编辑帖子) | POST | `/api/code-community-forum/api/poster/update` | ✍️ | 修改帖子 |
| [帖子详情](#帖子详情) | GET | `/api/code-community-forum/api/poster/detail` | ⚠️ | 帖子正文与元信息 |
| [回复帖子](#回复帖子) | POST | `/api/code-community-forum/api/poster/reply` | ✍️ | 发回复 / 楼中楼 |
| [点赞](#点赞) | POST | `/api/code-community-forum/api/poster/thumb` | ✍️ | 给帖子或回复点赞 |
| [取消点赞](#取消点赞) | POST | `/api/code-community-forum/api/poster/unThumb` | ✍️ | 取消点赞 |
| [置顶回复](#置顶回复) | POST | `/api/code-community-forum/api/poster/topReply` | ✍️ | 置顶某条回复 |
| [取消置顶回复](#取消置顶回复) | POST | `/api/code-community-forum/api/poster/unTopReply` | ✍️ | 取消置顶 |
| [删除帖子](#删除帖子) | POST | `/api/code-community-forum/api/poster/deletePoster` | ✍️ | 删除帖子 |
| [删除回复](#删除回复) | POST | `/api/code-community-forum/api/poster/deleteReply` | ✍️ | 删除回复 |
| [隐藏 / 显示回复](#隐藏--显示回复) | GET | `/api/code-community-forum/api/poster/hiddenReply` | ✍️ | 切换回复可见性（GET 写操作） |
| [回复列表](#回复列表) | GET | `/api/code-community-forum/api/poster/replyList` | ✅ | 帖子的分页回复 |
| [帖子精简信息](#帖子精简信息) | GET | `/api/code-community-forum/api/poster/simplePoster` | ⚠️ | 按分类取精简帖子 |
| [浏览帖子](#浏览帖子) | GET | `/api/code-community-forum/api/poster/view` | ⚠️ | 浏览计数入口，返回帖子详情 |
| [帖子商品信息](#帖子商品信息) | GET | `/api/code-community-forum/api/poster/goodsInfo` | ❔ | 返回类型 `PosterSimpleInfoVo`，未实测 |
| [题解列表](#题解列表) | GET | `/api/code-community-forum/gwpub/problemSolution/get-problem-solution-list` | ⚠️ | 某题的分页题解 |
| [题解详情](#题解详情) | GET | `/api/code-community-forum/gwpub/problemSolution/get-problem-solution-detail` | ⚠️ | 题解正文 |
| [题解申诉](#题解申诉) | POST | `/api/code-community-forum/gwpub/problemSolution/appeal` | ✍️ | 用户题解申诉 |
| [点赞 / 取消点赞题解](#点赞--取消点赞题解) | GET | `/api/code-community/api/problem-solution-like` | ✍️ | 切换题解点赞（GET 写操作） |
| [删除题解](#删除题解) | DELETE | `/api/code-community/api/delete-problem-solution` | ✍️ | 删除题解 |
| [能否发布题解](#能否发布题解) | GET | `/api/code-community/api/solution/can-create` | ✍️ | 返回 `boolean`，未实测 |
| [题解创建信息](#题解创建信息) | GET | `/api/code-community/api/solution/create-info` | ✍️ | 发题解前置信息，未实测 |
| [标程解锁](#标程解锁) | POST | `/api/code-community/gwpub/solution/problem-solution-unlock` | ✍️ | 主动解锁标程 |
| [停留时长心跳](#停留时长心跳) | POST | `/api/code-community-websocket/gwpub/duration/heartbeat` | ✍️ | 题解停留时长上报 |
| [题解邀请结果](#题解邀请结果) | GET | `/api/code-community/gwpub/solution-invite/result` | ⚠️ | 按 `submitId` 取邀请结果 |
| [AI 题解入口](#ai-题解入口) | GET | `/api/code-community-forum/gwpub/aiSolutionVersion/entry` | ⚠️ | 题目详情页 AI 题解入口 |
| [AI 题解落地页](#ai-题解落地页) | GET | `/api/code-community-forum/gwpub/aiSolutionVersion/landing` | ⚠️ | AI 题解正文与共创版本 |
| [AI 题解版本详情](#ai-题解版本详情) | GET | `/api/code-community-forum/gwpub/aiSolutionVersion/detail` | ⚠️ | 单个共创版本详情 |
| [AI 题解版本申诉](#ai-题解版本申诉) | POST | `/api/code-community-forum/gwpub/aiSolutionVersion/appeal` | ✍️ | 共创版本申诉 |
| [AI 题解版本信息（diff）](#ai-题解版本信息diff) | GET | `/api/code-community-forum/gwpub/aiSolutionVersion/get-info` | ⚠️ | 编辑共创版本的 diff 信息 |
| [提交 AI 题解版本](#提交-ai-题解版本) | POST | `/api/code-community-forum/gwpub/aiSolutionVersion/submit` | ✍️ | 提交共创版本 |
| [我的 AI 题解改进](#我的-ai-题解改进) | GET | `/api/code-community-forum/gwpub/user/aiSolution/enhance/my` | ✅ | 个人主页「AI 题解改进」列表 |
| [划线评论列表](#划线评论列表) | GET | `/api/code-community-forum/gwpub/solutionInlineComment/list` | ⚠️ | 按锚点分组的行内评论 |
| [发起划线评论](#发起划线评论) | POST | `/api/code-community-forum/gwpub/solutionInlineComment/create` | ✍️ | 顶层行内评论 |
| [回复划线评论](#回复划线评论) | POST | `/api/code-community-forum/gwpub/solutionInlineComment/reply` | ✍️ | 楼中楼回复 |
| [在锚点上盖楼](#在锚点上盖楼) | POST | `/api/code-community-forum/gwpub/solutionInlineComment/createOnAnchor` | ✍️ | 复用锚点追加根评论 |
| [专栏列表（首页精选）](#专栏列表首页精选) | GET | `/api/code-community/api/home-discussion` | ✅ | 首页「核桃精选」专栏列表 |
| [专栏详情](#专栏详情) | GET | `/api/code-community/api/get-discussion-detail` | ⚠️ | 单篇专栏正文 |
| [专栏点赞](#专栏点赞) | GET | `/api/code-community/api/discussion-like` | ✍️ | 切换专栏点赞（GET 写操作） |

## 通用请求头

除特别说明外，本页所有请求都走网关并需要下列请求头；缺失任意一个都可能被网关拒绝，最常见的是漏掉 `Hetao-Oj-Zone` 时报 `errCode=400 域属性为空或无效，无法获取数据`。下面范例复用这里的 `HEADERS`：

```js
const BASE = "https://api.htoj.com.cn";
const token = localStorage.getItem("KEY_USER_LOGIN_TOKEN"); // 登录后才有
const HEADERS = {
  "Content-Type": "application/json",
  "Hetao-Oj-Zone": "cpp",   // cpp | python
  HT_PLATFORM: "htojWeb",
  HT_SYSTEM: "web",
  HT_VERSION: "1.0.0",
  app_id: "com.hetao101.oj",
  Authorization: token,     // 原始 JWT，不加 Bearer 前缀
};
```

讨论区 / 题解接口分属两个网关：帖子与回复走 `code-community-forum`，题解 / AI 题解的只读部分走 `code-community-forum` 与 `code-community`，AI 划线与题解心跳分别走 `code-community-forum`、`code-community-websocket`（路径已含 service 前缀）。

`posterType` 与 `categoryId` 枚举见 [index.md](./index.md#通用枚举)：`posterType` 1=讨论 2=题解 3=题目 4=奖项；`categoryId` 1=学术交流 2=日常灌水。源码里另有 5=点赞、6=AI 题解改进版本、7=AI 题解划线评论。

---

## 讨论区（帖子与回复）

### 讨论分类

`GET /api/code-community-forum/api/common/posterCategory` ✅ 已实测可用

无参数，返回分类字典数组（`{ id, name }[]`，等价 [htoj-api.d.ts](./htoj-api.d.ts) 的 `IdName`）。

响应（依据 `re/samples/poster-category.json`）：

```json
{ "errCode": 0, "data": [{ "id": 1, "name": "学术交流" }, { "id": 2, "name": "日常灌水" }], "errMsg": "success" }
```

```js
await fetch(`${BASE}/api/code-community-forum/api/common/posterCategory`, { headers: HEADERS }).then((r) => r.json());
```

### 帖子状态字典

`GET /api/code-community-forum/api/common/posterStatus` ✅ 已实测可用

无参数，返回帖子状态数组（`{ id, name }[]`）。实测枚举：

| id | name | 含义 |
| --- | --- | --- |
| 1 | 审核中 | 待审核 |
| 2 | 机审不通过 | 机器审核拒绝 |
| 3 | 人审不通过 | 人工审核拒绝 |
| 4 | 用户主动删除 | 作者删除 |
| 5 | 管理删除 | 管理员删除 |
| 6 | 公开 | 正常展示 |

`PosterVO.status` / `PosterVO.statusName` 取这里的值（实测帖子 `status=6 statusName="公开"`）。

### 讨论列表

`GET /api/code-community-forum/api/poster/listPoster` ⚠️ 路由存在但参数不足

按分类分页拉取帖子（`Pagination<PosterVO>`）。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `posterCategoryId` | number | 是 | 分类 id（1 学术交流 / 2 日常灌水）；**缺失返回 `errCode=400 分类信息不能为空`** |
| `currentPage` | number | 否 | 页码，从 1 开始 |
| `limit` | number | 否 | 每页条数 |

响应 `data` 为 `Pagination<PosterVO>`（分页元数据 `total` / `size` / `current` / `pages` / `orders` / `searchCount`）。`records[]` 字段依据 `re/samples/poster-list.json`（另有 `home-poster-list.json` 佐证同一 `PosterVO` 结构）：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | number | 帖子 id |
| `posterName` / `posterContent` | string | 标题 / 正文（Markdown） |
| `uid` / `nickname` / `avatar` | string | 作者 |
| `goldenTeacher` | boolean | 是否金牌教师 |
| `problemId` | number | 关联题目内部 id，无则 0 |
| `viewCount` | number \| null | 浏览数，实测常为 null |
| `thumbCount` / `replyCount` | number | 点赞 / 回复数 |
| `isMine` | boolean | 是否本人发布 |
| `posterCategory` | `{ id, name }` \| null | 分类；列表接口实测为 null，首页接口实测为对象 |
| `top` | boolean | 是否置顶 |
| `zone` | string | 如 `cpp` |
| `thumbed` | boolean \| null | 是否已点赞 |
| `publishTime` / `updateTime` | number \| null | 毫秒时间戳 |
| `publishArea` | string | 发布地区 |
| `authenticationIcon` / `ccfLevel` / `remarkName` | — | 认证图标 / CCF 等级 / 备注名 |
| `posterType` | number | 1 讨论 2 题解 3 题目 4 奖项 |
| `status` / `statusName` | number / string | 状态，见「帖子状态字典」 |
| `label` / `refuseReason` | — | 标签 / 拒因 |
| `aiAuditSuggestion` / `appealStatus` / `appealReason` / `appealTime` / `appealRejectReason` / `rejectType` / `rejectReason` / `appealCount` | — | 审核 / 申诉相关，实测帖子均 null |

```js
await fetch(
  `${BASE}/api/code-community-forum/api/poster/listPoster?posterCategoryId=1&currentPage=1&limit=20`,
  { headers: HEADERS },
).then((r) => r.json());
```

### 我的帖子

`GET /api/code-community-forum/api/poster/myPoster` ✅ 已实测可用（需登录）

分页查询当前用户发布或回复过的帖子（`Pagination<PosterVO>`）。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `posterType` | number | 是 | 1 讨论 2 题解 |
| `posterSearchType` | number | 是 | 1 我发布的 2 我回复的 |
| `zone` | string | 否 | `cpp` / `python` |
| `currentPage` | number | 否 | 页码 |
| `limit` | number | 否 | 每页条数 |

响应 `records[]` 与「讨论列表」同构（`PosterVO`）。

### 发布帖子

`POST /api/code-community-forum/api/poster/post` ✍️ 写操作未实测（需登录）

发讨论或题解。query 传 `posterType`，请求体为帖子内容（依据源码签名）：

| 位置 | 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| query | `posterType` | number | 是 | 1 讨论 2 题解 |
| body | `posterCategoryId` | number | 是 | 分类 id |
| body | `posterName` | string | 是 | 标题 |
| body | `posterContent` | string | 是 | 正文（Markdown） |
| body | `problemId` | number | 否 | 关联题目内部 id |
| body | `syncPoster` | number | 否 | 是否同步发帖 |
| body | `allowComment` | number | 否 | 是否允许评论 |

响应结构未验证。

```js
await fetch(`${BASE}/api/code-community-forum/api/poster/post?posterType=1`, {
  method: "POST",
  headers: HEADERS,
  body: JSON.stringify({ posterCategoryId: 1, posterName: "标题", posterContent: "正文" }),
}).then((r) => r.json());
```

### 编辑帖子

`POST /api/code-community-forum/api/poster/update` ✍️ 写操作未实测（需登录）

修改已有帖子。query 传 `posterId` / `posterType`，请求体字段与「发布帖子」相同：

| 位置 | 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| query | `posterId` | number | 是 | 帖子 id |
| query | `posterType` | number | 是 | 1 讨论 2 题解 |
| body | `posterCategoryId` / `posterName` / `posterContent` | — | 是 | 同「发布帖子」 |
| body | `problemId` / `syncPoster` / `allowComment` | — | 否 | 同「发布帖子」 |

响应结构未验证。

### 帖子详情

`GET /api/code-community-forum/api/poster/detail` ⚠️ 路由存在但参数不足

取帖子正文与元信息（`PosterVO`）。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `posterId` | number | 是 | 帖子 id；**缺失返回 `errCode=400 ... 'posterId' ...`** |
| `posterType` | number | 否 | 1 讨论 2 题解 |

响应 `data` 为 `PosterVO`，依据 `re/samples/poster-detail.json`。字段集合与「讨论列表」大体一致，另有详情专属字段：`parentSolutionId`、`problem`、`syncPoster`、`allowComment`、`source`、`updated`。

> 实测坑：`poster-detail.json` 里还出现了 [htoj-api.d.ts](./htoj-api.d.ts) 的 `PosterVO` 未收录的字段 `category`、`stdStatus`、`unlockRemainCount`、`aiFlag`、`improveReason`、`extraNote`；且该响应 `posterType` 实测为 `null`（列表接口则为数字）。以实测为准，勿依赖类型里的字段全集。

```js
await fetch(
  `${BASE}/api/code-community-forum/api/poster/detail?posterId=22752755174784&posterType=1`,
  { headers: HEADERS },
).then((r) => r.json());
```

### 回复帖子

`POST /api/code-community-forum/api/poster/reply` ✍️ 写操作未实测（需登录）

发回复或楼中楼。query 传帖子上下文，请求体传 `replyId` / `replyContent`：

| 位置 | 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| query | `posterId` | number | 是 | 帖子 id |
| query | `posterType` | number | 是 | 1 讨论 2 题解 |
| body | `replyId` | number | 是 | 被回复的回复 id（顶层回复传 0） |
| body | `replyContent` | string | 是 | 回复内容 |

源码声明返回类型为 `PosterReplyVO`（`PosterReplyListVo`），未实测。

### 点赞

`POST /api/code-community-forum/api/poster/thumb` ✍️ 写操作未实测（需登录）

给帖子或某条回复点赞。参数走 query：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `posterId` | number | 是 | 帖子 id |
| `posterReplyId` | number | 是 | 回复 id；**给帖子本身点赞时传 0**（AI 题解 / 版本的点赞复用了本接口，`posterReplyId` 传 0） |
| `posterType` | number | 是 | 目标类型；帖子 1/2，AI 改进版本 6，AI 题解划线评论 7 |

响应结构未验证。

### 取消点赞

`POST /api/code-community-forum/api/poster/unThumb` ✍️ 写操作未实测（需登录）

参数与「点赞」完全相同（query：`posterId` / `posterReplyId` / `posterType`）。响应结构未验证。

### 置顶回复

`POST /api/code-community-forum/api/poster/topReply` ✍️ 写操作未实测（需登录）

置顶某条回复（query：`posterId` / `posterReplyId` / `posterType`）。响应结构未验证。

### 取消置顶回复

`POST /api/code-community-forum/api/poster/unTopReply` ✍️ 写操作未实测（需登录）

参数同「置顶回复」。响应结构未验证。

### 删除帖子

`POST /api/code-community-forum/api/poster/deletePoster` ✍️ 写操作未实测（需登录）

删除帖子（query：`posterId` / `posterType`）。响应结构未验证。

### 删除回复

`POST /api/code-community-forum/api/poster/deleteReply` ✍️ 写操作未实测（需登录）

删除回复（query：`posterId` / `posterReplyId` / `posterType`）。响应结构未验证。

### 隐藏 / 显示回复

`GET /api/code-community-forum/api/poster/hiddenReply` ✍️ 未实测（GET 写操作）

切换某条回复的可见性。**虽为 GET，但会改变状态**，源码抽取器标记为「疑似写操作（GET）」，未在真实账号上实测。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `posterReplyId` | number | 是 | 回复 id |
| `posterStatus` | number | 是 | 目标可见状态（对应帖子 / 回复状态枚举） |

响应结构未验证。

### 回复列表

`GET /api/code-community-forum/api/poster/replyList` ✅ 已实测可用

按帖子分页取回复（`Pagination<PosterReplyVO>`）。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `posterId` | number | 是 | 帖子 id |
| `currentPage` | number | 否 | 页码 |
| `limit` | number | 否 | 每页条数 |
| `posterType` | number | 否 | 1 讨论 2 题解 |

`records[]` 字段依据 `re/samples/poster-reply-list.json`（类型 `PosterReplyVO`）：`replyId`、`replyContent`、`uid`、`nickname`、`avatar`、`ccfLevel`、`goldenTeacher`、`authenticationIcon`、`remarkName`、`thumbCount`、`replyCount`、`area`、`thumbed`、`createTime`、`to`、`toUid`、`toReplyId`、`isMine`、`deleted`、`hidden`、`posterUid`、`replyVoList[]`（子回复，同构递归）、`posterStatus`、`top`、`rootFlag`。

```js
await fetch(
  `${BASE}/api/code-community-forum/api/poster/replyList?posterId=22752755174784&posterType=1&currentPage=1&limit=20`,
  { headers: HEADERS },
).then((r) => r.json());
```

### 帖子精简信息

`GET /api/code-community-forum/api/poster/simplePoster` ⚠️ 路由存在但参数不足

按分类取精简帖子信息（源码返回类型 `PosterSimpleInfoVo`）。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `categoryId` | number | 是 | 分类 id；**缺失返回 `errCode=400 ... 'categoryId' ...`** |

> 注意参数名是 `categoryId`，与「讨论列表」的 `posterCategoryId` **不同**，勿混用。

`PosterSimpleInfoVo` 未收录在 [htoj-api.d.ts](./htoj-api.d.ts)，字段未确认。

### 浏览帖子

`GET /api/code-community-forum/api/poster/view` ⚠️ 路由存在但参数不足

帖子浏览入口（用于累加浏览数），返回帖子详情（`PosterVO`）。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `posterId` | number | 是 | 帖子 id；**缺失返回 `errCode=400 ... 'posterId' ...`** |
| `posterType` | number | 否 | 1 讨论 2 题解 |

### 帖子商品信息

`GET /api/code-community-forum/api/poster/goodsInfo` ❔ 未实测

无参数，源码返回类型 `PosterSimpleInfoVo`。该接口在源码里把 URL 赋给了局部变量，抽取器未能解析路径（标记「路径未解析」），上表路径读自源码字面量，**未经实测**，响应字段未确认。

---

## 题解

### 题解列表

`GET /api/code-community-forum/gwpub/problemSolution/get-problem-solution-list` ⚠️ 路由存在但参数不足

分页取某道题的题解（`Pagination<SolutionVO>`）。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `pid` | number | 是 | 题目内部 id；**缺失返回 `errCode=400 ... 'pid' ...`** |
| 其余 | — | 否 | 请求参数类型 `SolutionListRequestVO` 未随仓库提供，字段未确认（通常含 `currentPage` / `limit`） |

`SolutionVO` 的类型文件未随仓库提供（`@core/types/solution`），仅从其使用处（`solutionList.service.ts`）可推断含 `id`、`likeNum`、`hasLike` 等字段，**未验证**。

### 题解详情

`GET /api/code-community-forum/gwpub/problemSolution/get-problem-solution-detail` ⚠️ 路由存在但参数不足

取单篇题解正文（源码返回 `PosterVO & SolutionDetailExtension`，即 `PosterVO` 基础上附加题解扩展字段）。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `posterId` | number | 是 | 题解帖子 id；**缺失返回 `errCode=400 ... 'posterId' ...`** |
| `posterType` | number | 否 | 应为 2（题解） |
| `tid` | number | 否 | 题单 id，通过题单入口访问时传 |

`SolutionDetailExtension` 未收录在 [htoj-api.d.ts](./htoj-api.d.ts)，扩展字段未确认。

### 题解申诉

`POST /api/code-community-forum/gwpub/problemSolution/appeal` ✍️ 写操作未实测（需登录）

用户对自己发布的题解发起申诉（C 端，`posterType=2`）。请求体为 `ProblemSolutionAppealVo`：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `solutionId` | number | 是 | 题解 id |
| `appealReason` | string | 是 | 申诉理由，**源码注释要求 ≥10 字** |

> 与 AI 改进版本申诉（`aiSolutionVersion/appeal`）互相独立，勿混用。响应结构未验证。

### 点赞 / 取消点赞题解

`GET /api/code-community/api/problem-solution-like` ✍️ 未实测（GET 写操作）

切换题解点赞。**GET 但会改变状态**，未实测。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `sid` | number | 是 | 题解 id |
| `toLike` | boolean | 是 | `true` 点赞，`false` 取消 |

响应结构未验证。

### 删除题解

`DELETE /api/code-community/api/delete-problem-solution` ✍️ 写操作未实测（需登录）

删除题解，参数走 query：`sid`（number，题解 id）。响应结构未验证。

### 能否发布题解

`GET /api/code-community/api/solution/can-create` ✍️ 未实测

判断当前用户能否为该题发布题解，返回 `boolean`。参数走 query：`pid`（number，题目内部 id）。抽取器将其标记为「疑似写操作（GET）」，未实测（只读语义但未验证）。

### 题解创建信息

`GET /api/code-community/api/solution/create-info` ✍️ 未实测（需登录）

发布题解的前置信息（源码返回类型 `ProblemAndCodeVo`）。参数走 query：`pid`（number，题目内部 id）。抽取器标记为「疑似写操作（GET）」，未实测；`ProblemAndCodeVo` 未收录在 [htoj-api.d.ts](./htoj-api.d.ts)，字段未确认。

### 标程解锁

`POST /api/code-community/gwpub/solution/problem-solution-unlock` ✍️ 写操作未实测（需登录）

主动解锁标程，源码返回类型为 `number`。参数走 query：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `pid` | number | 是 | 题目内部 id |
| `sid` | number | 是 | 题解 id（即 posterId） |
| `tid` | number | 否 | 题单 id，通过题单入口访问时传 |
| `gid` | number | 否 | 小组 id，通过小组入口访问时传 |

响应结构未验证。

### 停留时长心跳

`POST /api/code-community-websocket/gwpub/duration/heartbeat` ✍️ 写操作未实测（需登录）

题解停留时长心跳上报（源码注释：仅当 `stdStatus` 为 `HOUR_TIMING` 或 `HOUR_EXHAUSTED` 时调用，每 30 秒上报一次）。走 `code-community-websocket` 网关，请求体为 `DurationHeartbeatRequest`，返回 `DurationHeartbeatVO`；两个类型均未随仓库提供，字段未确认。响应结构未验证。

### 题解邀请结果

`GET /api/code-community/gwpub/solution-invite/result` ⚠️ 路由存在但参数不足

按 `submitId` 获取题解邀请结果（源码返回类型 `SolutionInviteResultVO`）。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `submitId` | number | 是 | 提交 id；**缺失返回 `errCode=400 ... 'submitId' ...`** |

`SolutionInviteResultVO` 未收录在 [htoj-api.d.ts](./htoj-api.d.ts)，字段未确认。

---

## AI 题解

“AI 题解”分两部分：题目配套的 AI 题解（`aiSolutionVersion/entry|landing|detail|get-info`）与用户基于 AI 题解发布的「共创版本」。点赞 / 取消点赞 AI 题解与共创版本直接复用讨论区的 `poster/thumb` / `poster/unThumb`（`posterType` 传 6 表示共创版本）。

### AI 题解入口

`GET /api/code-community-forum/gwpub/aiSolutionVersion/entry` ⚠️ 路由存在但参数不足

题目详情页判断该题是否有 AI 题解（源码返回类型 `AiSolutionEntryVo`）。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `pid` | number | 是 | 题目内部 id；**缺失返回 `errCode=400 ... 'pid' ...`** |

源码注释提示：后端对「无数据」可能返回 `null` 或 `undefined`，需统一归一化为 `null`。`AiSolutionEntryVo` 类型文件未随仓库提供，字段未确认。

### AI 题解落地页

`GET /api/code-community-forum/gwpub/aiSolutionVersion/landing` ⚠️ 路由存在但参数不足

取 AI 题解正文与共创版本列表（源码返回类型 `AiSolutionLandingVo`）。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `pid` | number | 是 | 题目内部 id；**缺失返回 `errCode=400 ... 'pid' ...`** |

从其使用处（`aiSolutionDetail.service.ts`）可推断 `AiSolutionLandingVo` 含 `parentSolutionId`、`aiThumbed`、`aiThumbCount`、`pinnedVersion`、`moreVersions[]` 等字段，**未验证**。

### AI 题解版本详情

`GET /api/code-community-forum/gwpub/aiSolutionVersion/detail` ⚠️ 路由存在但参数不足

取单个共创版本详情（源码返回类型 `AiSolutionVersionItemVo`）。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | number | 是 | 版本 id（源码参数名 `versionId`，实际查询键为 `id`）；**缺失返回 `errCode=400 ... 'id' ...`** |

从使用处可推断 `AiSolutionVersionItemVo` 含 `id`、`thumbed`、`thumbCount` 等字段，**未验证**。

### AI 题解版本申诉

`POST /api/code-community-forum/gwpub/aiSolutionVersion/appeal` ✍️ 写操作未实测（需登录）

对共创版本发起申诉。请求体：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `versionId` | number | 是 | 共创版本 id |
| `appealReason` | string | 是 | 申诉理由 |

> 与用户题解申诉（`problemSolution/appeal`）互相独立。响应结构未验证。

### AI 题解版本信息（diff）

`GET /api/code-community-forum/gwpub/aiSolutionVersion/get-info` ⚠️ 路由存在但参数不足

取编辑共创版本所需的 diff / 对照信息（源码返回类型 `AiSolutionVersionDiffVo`）。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `pid` | number | 是 | 题目内部 id；**缺失返回 `errCode=400 ... 'pid' ...`** |

`AiSolutionVersionDiffVo` 类型文件未随仓库提供，字段未确认。

### 提交 AI 题解版本

`POST /api/code-community-forum/gwpub/aiSolutionVersion/submit` ✍️ 写操作未实测（需登录）

提交 / 编辑共创版本，请求体为 `AiSolutionVersionSubmitVo`（类型文件未随仓库提供，字段未确认）。响应结构未验证。

### 我的 AI 题解改进

`GET /api/code-community-forum/gwpub/user/aiSolution/enhance/my` ✅ 已实测可用（需登录）

个人主页「AI 题解改进」列表（`Pagination<UserMyEnhanceListVo>`）。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `uid` | string | 否 | 为空时查自己（需登录）；传他人 uid 为客态，**仅返回已通过上线的版本** |
| `pageNum` | number | 否 | 页码，从 1 开始 |
| `pageSize` | number | 否 | 每页条数 |

实测返回空分页（`{ records: [], total: 0, size: 20, current: 1, orders: [], searchCount: true, pages: 0 }`）。`records[]` 字段从其使用处（`home/solution/ai-improve/index.vue`）可推断含 `id`、`status`（审核状态，见 `IMPROVE_VERSION_AUDIT_STATE`）、`statusName`、`thumbTopFlag`、`posterName`、`posterContent`、`rejectReason`、`publishTime`、`commentCount`、`thumbCount`，**未逐一实测**。

```js
await fetch(
  `${BASE}/api/code-community-forum/gwpub/user/aiSolution/enhance/my?pageNum=1&pageSize=20`,
  { headers: HEADERS },
).then((r) => r.json());
```

---

## AI 题解批注（行内评论）

对 AI 题解正文（含 AI 初始版本与用户共创版本）划词后发起锚点评论。`targetType`：`2` = AI 初始版本，`6` = 改进版本（源码 `POSTER_TYPE`：6 也用于共创版本）。

### 划线评论列表

`GET /api/code-community-forum/gwpub/solutionInlineComment/list` ⚠️ 路由存在但参数不足

按锚点分组返回某正文的划线评论（源码返回 `SolutionInlineCommentGroupVo[]`）。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `targetId` | number | 是 | 正文 id（AI 初始版本题解 id 或共创版本 id）；**缺失返回 `errCode=400 ... 'targetId' ...`** |
| `targetType` | number | 是 | `2` = AI 初始版本，`6` = 改进版本 |

`SolutionInlineCommentGroupVo` 字段从其使用处（`inlineComment.service.ts`）可推断含 `anchorText`、`rootComments[]`（每条根评论含 `id`、`replies[]`），**未验证**。

### 发起划线评论

`POST /api/code-community-forum/gwpub/solutionInlineComment/create` ✍️ 写操作未实测（需登录）

发起顶层划线评论，**提交后进入审核**。请求体 `SolutionInlineCommentCreateVo`：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `targetId` | number | 是 | 正文 id |
| `targetType` | number | 是 | 2 AI 初始版 / 6 改进版 |
| `content` | string | 是 | 评论内容 |
| `anchorText` | string | 是 | 被划词的原文 |
| `anchorMeta` | string | 是 | **JSON 字符串**，形如 `{"prefix":"","suffix":"","start":0,"end":10}` |

响应结构未验证。

### 回复划线评论

`POST /api/code-community-forum/gwpub/solutionInlineComment/reply` ✍️ 写操作未实测（需登录）

楼中楼回复顶层评论，**提交后进入审核**。请求体 `SolutionInlineCommentReplyVo`：`content`（string，回复内容）、`parentId`（number，被回复的顶层评论 id）。响应结构未验证。

### 在锚点上盖楼

`POST /api/code-community-forum/gwpub/solutionInlineComment/createOnAnchor` ✍️ 写操作未实测（需登录）

对已有划线锚点追加根评论（复用锚点信息生成新根评论，不指定回复对象），**提交后进入审核**。请求体 `SolutionInlineAnchorCommentVo`：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `targetId` | number | 是 | 正文 id |
| `targetType` | number | 是 | 2 AI 初始版 / 6 改进版 |
| `anchorRootCommentId` | number | 是 | 目标锚点的根评论 id |
| `content` | string | 是 | 评论内容 |

响应结构未验证。

---

## 专栏文章

### 专栏列表（首页精选）

`GET /api/code-community/api/home-discussion` ✅ 已实测可用

首页「核桃精选」专栏分页列表（`Pagination<ArticleVO>`）。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `currentPage` | number | 否 | 页码 |
| `limit` | number | 否 | 每页条数 |

请求参数类型 `ArticleListRequestVO` 未随仓库提供，字段未确认（探针实测未传参返回 `Page(10/10)`）。`records[]` 字段依据探针样本：`id`、`title`、`titlePic`、`description`、`content`、`topPriority`、`category`、`uid`、`author`、`avatar`、`titleName`、`likeNum`、`viewNum`、`hasLike`、`selected`、`createTime`。

```js
await fetch(`${BASE}/api/code-community/api/home-discussion?currentPage=1&limit=10`, {
  headers: HEADERS,
}).then((r) => r.json());
```

### 专栏详情

`GET /api/code-community/api/get-discussion-detail` ⚠️ 路由存在但参数不足

取单篇专栏正文（`ArticleVO`）。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `did` | number | 是 | 专栏 id；**缺失返回 `errCode=400 ... 'did' ...`** |

### 专栏点赞

`GET /api/code-community/api/discussion-like` ✍️ 未实测（GET 写操作）

切换专栏点赞。**GET 但会改变状态**，未实测。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `did` | number | 是 | 专栏 id |
| `toLike` | boolean | 是 | `true` 点赞，`false` 取消 |

响应结构未验证。
