# 字典与首页

本页整理 HTOJ 的「公共字典 / 标签分类 / 搜索 / 权限选项 / 首页与个人记录 / 轮播」相关接口，对应前端 `api/common.ts`（非上传类 19 个）、`api/oj/home.ts`（16 个）、`api/oj/banner.ts`（2 个）。

> 全局约定（网关前缀、必带请求头、统一 `errCode` 信封、分页结构、通用枚举）见 [index.md](./index.md)，本页不再重复。类型名集中定义在 [htoj-api.d.ts](./htoj-api.d.ts)。本页字典接口实测到的枚举值在正文中**完整列出**，是校对其它分页取值的依据。

本文覆盖 37 个接口：✅24 / ⚠️6 / 🚫6 / ❔1。

## 通用请求头

除特别说明外，本页所有请求都走网关并需要下列请求头；缺失任意一个都可能被网关拒绝，最常见的是漏掉 `Hetao-Oj-Zone` 时报 `errCode=400 域属性为空或无效，无法获取数据`。下面范例复用这里的 `HEADERS`：

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

## 接口清单

| 接口 | 方法 | 路径 | 验证 | 说明 |
| --- | --- | --- | --- | --- |
| [难度字典（zone-data-list）](#难度字典zone-data-list) | GET | `/api/code-community/api/zone-data-list` | ✅ | 难度 / 赛制等字典，`types=difficulty` 实测 |
| [语言字典](#语言字典) | GET | `/api/code-community/api/get-language` | ✅ | 可选语言列表 |
| [用户答题状态字典](#用户答题状态字典) | GET | `/api/code-community/api/get-problem-user-status` | ✅ | 题目筛选用的判题状态 |
| [题目标签字典（旧）](#题目标签字典旧) | GET | `/api/code-community/api/get-problem-tag` | 🚫 | 网关 403 |
| [题目标签字典（旧·复数）](#题目标签字典旧复数) | GET | `/api/code-community/api/get-problem-tags` | 🚫 | 网关 403 |
| [题目难度字典（旧）](#题目难度字典旧) | GET | `/api/code-community/api/get-problem-difficulty` | 🚫 | 网关 403 |
| [题目来源字典（旧）](#题目来源字典旧) | GET | `/api/code-community/api/get-problem-source` | 🚫 | 网关 403 |
| [标签分类树](#标签分类树) | GET | `/api/code-community/api/tag/get-classification-list` | ✅ | 语法 / 算法 / 比赛分类 / 冬令营 |
| [地区字典](#地区字典) | GET | `/api/htoj-biz-gateway/api/get-region-list` | ✅ | 省市树（含区县） |
| [OI 省份字典](#oi-省份字典) | GET | `/api/code-community/api/oi-school/provinces` | ✅ | 省级字符串数组 |
| [学校搜索](#学校搜索) | GET | `/api/htoj-biz-gateway/api/get-school-list` | ✅ | 按关键词搜学校 |
| [OI 学校搜索](#oi-学校搜索) | GET | `/api/code-community/api/oi-school/search` | ⚠️ | 需 `schoolName` |
| [年级字典](#年级字典) | GET | `/api/code-community/api/get-grade-list` | ✅ | 幼儿～高中 |
| [成长年级字典](#成长年级字典) | GET | `/api/code-community-growth/api/common/get-grade-list` | ✅ | 无幼儿两项 |
| [敏感词检查](#敏感词检查) | GET | `/api/code-community/api/get-sensitive-check-result` | ⚠️ | 需 `content` |
| [搜索题目](#搜索题目) | GET | `/api/code-community-forum/api/common/searchProblem` | ✅ | 论坛内按关键词搜题 |
| [题目题解权限选项](#题目题解权限选项) | GET | `/api/code-community/gwpub/admin/common/v2/problem-solution-permission` | ✅ | 权限下拉选项 |
| [题单题解权限选项](#题单题解权限选项) | GET | `/api/code-community/gwpub/admin/common/v2/training-solution-permission` | ✅ | 权限下拉选项 |
| [我的答题记录](#我的答题记录) | GET | `/api/code-community/api/my/problemRecord` | ✅ | 我做过的题目 |
| [我的比赛记录](#我的比赛记录) | GET | `/api/code-community/api/my/contestRecord` | ✅ | 我参加的比赛 |
| [已报名比赛列表](#已报名比赛列表) | GET | `/api/code-community/api/get-registered-contest-list` | 🚫 | 网关 403 |
| [未报名比赛列表](#未报名比赛列表) | GET | `/api/code-community/api/get-not-registered-contest-list` | ✅ | 我可报名的比赛 |
| [我的首页汇总（旧）](#我的首页汇总旧) | GET | `/api/code-community/api/my/homeData` | 🚫 | 网关 403 |
| [我的首页汇总（新）](#我的首页汇总新) | GET | `/api/htoj-biz-gateway/api/my/newUserData` | ✅ | 个人统计数据 |
| [我的小组申请列表](#我的小组申请列表) | GET | `/api/code-community/api/group/my-apply-list` | ❔ | 未实测 |
| [热门比赛](#热门比赛) | GET | `/api/htoj-biz-gateway/api/home-get-hot-contests` | ✅ | 首页热门比赛 |
| [推荐分区](#推荐分区) | GET | `/api/code-community/api/home-get-recommend-sections` | ✅ | 首页推荐 Tab |
| [推荐题目](#推荐题目) | GET | `/api/code-community/api/home-get-problem-recommend` | ⚠️ | 需 `configId` |
| [本周商品](#本周商品) | GET | `/api/code-community-actuator/api/user/mission/goods-by-week` | ✅ | 本周商品 / 抽奖池 |
| [抽取商品](#抽取商品) | GET | `/api/code-community-actuator/api/user/mission/draw-goods` | ⚠️ | 需 `missionId`（GET 写操作） |
| [装饰商品](#装饰商品) | GET | `/api/code-community-actuator/api/user/mission/decorate-goods` | ⚠️ | 需 `goodsId`（GET 写操作） |
| [卸下商品](#卸下商品) | GET | `/api/code-community-actuator/api/user/mission/offload-goods` | ⚠️ | 需 `goodsId`（GET 写操作） |
| [新手任务](#新手任务) | GET | `/api/htoj-biz-gateway/api/get-novice-task` | ✅ | 新手引导任务 |
| [首页帖子列表](#首页帖子列表) | GET | `/api/code-community-forum/api/poster/homePosterList` | ✅ | 首页帖子（与 community.md 不同） |
| [首页轮播（旧）](#首页轮播旧) | GET | `/api/code-community/api/home-carousel` | ✅ | 首页 banner |
| [首页轮播（新）](#首页轮播新) | GET | `/api/htoj-biz-gateway/api/home-slider` | ✅ | biz 网关版 banner |
| [鉴权奖励](#鉴权奖励) | GET | `/api/code-community-heart-beat/api/reward/v2/authReward` | ✅ | 实测为空数组 |

> 另：`common.ts` 还导出了 `getArticleDetail`（`/api/code-community/api/get-announcement-info`，参数 `aid`）与 `toggleArticleLike`（`/api/code-community/api/announcement-like`，参数 `aid` / `toLike`），它们是 [community.md](./community.md) 中 `oj/article.ts` 同名接口的「公告」版（后者为专栏 `did`），已在那里覆盖，本页不展开。

---

## 字典（难度 / 语言 / 地区 / 学校 / 年级）

### 难度字典（zone-data-list）

`GET /api/code-community/api/zone-data-list` ✅ 已实测可用

按 `types` 返回一个「字典名 → 选项数组」的映射（`data` 为 `Record<string, SelectOption[]>`），选项形如 `{ type, value, label, color? }`。难度选项与 [index.md](./index.md#通用枚举) 的「题目难度」表一致。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `types` | string \| string[] | 是 | 字典名；前端常量 `ZONE_KEY_MAP` 取值为 `difficulty`（难度）、`contestType`（赛事类型）、`selectionType`（选题类型）。**本仓库只实测了 `difficulty`**，其余键的取值未取全 |

实测 `types=difficulty` 返回 `data.difficulty`（8 项，依据 `re/samples/zone-difficulty.json`）：

| value | label | color |
| --- | --- | --- |
| 0 | 暂无评定 | #CCCCCC |
| 1 | 入门 | #FF5100 |
| 2 | 普及- | #FF8000 |
| 3 | 普及/提高- | #FFB700 |
| 4 | 普及+/提高 | #00B42A |
| 5 | 提高+/省选- | #1884FF |
| 6 | 省选/NOI- | #B12EF6 |
| 7 | NOI/NOI+/CTSC | #050547 |

> 注意返回项用 `value` / `label`（不是 `id` / `name`），比题目详情里的 `Difficulty`（`id` / `name` / `color`）多一个 `type` 字段。前端用 `res[types]` 取值。

```js
await fetch(`${BASE}/api/code-community/api/zone-data-list?types=difficulty`, {
  headers: HEADERS,
}).then((r) => r.json());
```

### 语言字典

`GET /api/code-community/api/get-language` ✅ 已实测可用

无参数，返回可选语言列表（`IdNameOption[]`）。实测（`cpp` zone，`re/samples/language-list.json`）返回 3 项：

| id | name |
| --- | --- |
| 6 | C++14 With O2 |
| 7 | C++17 With O2 |
| 10 | Python3 |

> **提交时不能用这里的 `id`**：`submit-problem-judge` 的 `language` 字段要的是语言名（如 `"C++17 With O2"`），见 [problems.md](./problems.md#提交评测)。列表内容随 `Hetao-Oj-Zone` 变化（`python` zone 未实测）。历史接口 `get-problem-language-and-case` 已被网关 403，需要语言列表时用本接口。

```js
await fetch(`${BASE}/api/code-community/api/get-language`, { headers: HEADERS }).then((r) => r.json());
```

### 用户答题状态字典

`GET /api/code-community/api/get-problem-user-status` ✅ 已实测可用

无参数，返回题目标筛用的判题状态列表（`IdNameOption[]`）。实测 11 项（`re/samples/problem-user-status.json`，`shortName` / `chineseName` 均为 `null`），与 [index.md](./index.md#通用枚举) 的「判题状态」表一致：

| id | name |
| --- | --- |
| 0 | Accepted |
| 1 | Presentation Error |
| 2 | Time Limit Exceeded |
| 3 | Memory Limit Exceeded |
| 4 | Wrong Answer |
| 5 | Runtime Error |
| 6 | Output Limit Exceeded |
| 7 | Compile Error |
| 8 | System Error |
| 49 | Cancelled |
| -10 | Judging |

```js
await fetch(`${BASE}/api/code-community/api/get-problem-user-status`, { headers: HEADERS }).then((r) => r.json());
```

### 题目标签字典（旧）

`GET /api/code-community/api/get-problem-tag` 🚫 被网关 403 拒绝

源码签名返回 `IdNameOption[]`。**实测被网关拒绝**：

```json
{ "code": 403, "message": "Gateway Error:Access Denied" }
```

前端仍保留调用，实际不可用。标签请改走「标签分类树」（`get-classification-list`）或题目详情里的 `tags[]`。

### 题目标签字典（旧·复数）

`GET /api/code-community/api/get-problem-tags` 🚫 被网关 403 拒绝

源码签名返回 `IdNameOption[]`。**实测被网关拒绝**：`403 Gateway Error:Access Denied`。与上一个接口同为旧接口，当前不可用。

### 题目难度字典（旧）

`GET /api/code-community/api/get-problem-difficulty` 🚫 被网关 403 拒绝

源码签名返回 `IdNameOption[]`。**实测被网关拒绝**：`403 Gateway Error:Access Denied`。难度请改走 `zone-data-list?types=difficulty`。

### 题目来源字典（旧）

`GET /api/code-community/api/get-problem-source` 🚫 被网关 403 拒绝

源码签名返回 `IdNameOption[]`。**实测被网关拒绝**：`403 Gateway Error:Access Denied`。题目来源现由题目详情 `problemBaseVO.source`（`IdName`）给出，见 [problems.md](./problems.md#题目详情)。

### 标签分类树

`GET /api/code-community/api/tag/get-classification-list` ✅ 已实测可用

无参数，返回标签分类树（`ClassificationTagVO[]`）。结构为两层分组 + 叶子标签：顶层 `{ id, name, list[] }`，第二层 `{ id, name, tagList[] }`，`tagList[]` 是叶子标签 `{ id, name }`。

实测顶层 4 个分类（依据 `re/samples/tag-classification.json`），第二层分组如下（叶子标签数量众多，未逐条列出，完整枚举见该样例文件）：

| 顶层 id | 顶层 name | 第二层（id: name） |
| --- | --- | --- |
| 44 | 语法 | 47:顺序结构、48:选择结构、49:循环结构、50:数组、51:字符数组/字符串、52:函数与递归、53:排序、54:结构体 |
| 45 | 算法 | 55:基础算法、56:搜索、57:动态规划（dp）、58:字符串、59:图论、60:树论、61:线性数据结构、62:树形数据结构、63:STL 模板、64:数学、65:初等数论、66:组合优化、67:离散与组合数学、68:线性代数、69:高等数学、70:概率论、71:博弈论、72:计算几何、82:微积分、73:其它技巧 |
| 35 | 比赛分类 | 37:核桃赛事 |
| 41 | 冬令营 | 42:题目类型 |

例如「比赛分类 / 核桃赛事」下的叶子标签为：`1:新手组`、`2:CSP-J组`、`4:CSP-S组`、`552:NOIP`、`1103:彩虹周赛`、`634:NOI`；「冬令营 / 题目类型」为：`1238:必做题`、`1207:基础题`、`1239:选做题`。

> 叶子标签总量很大（数百个，含「算法」下数百个知识点标签），`re/samples/tag-classification.json` 是完整快照。注意同 id 与不同 id 可能出现同名标签（如 `562:排序` 同时出现在「语法/排序」与「算法/基础算法」下），筛选时以叶子 `id` 为准。

```js
await fetch(`${BASE}/api/code-community/api/tag/get-classification-list`, { headers: HEADERS }).then((r) => r.json());
```

### 地区字典

`GET /api/htoj-biz-gateway/api/get-region-list` ✅ 已实测可用

无参数，返回省 / 市 / 区县树（`CityDataVO[]`）。实测顶层 35 项（依据探针样本），节点形如 `{ id, tag, areaType, parentId, children[] }`：

```json
[
  {
    "id": 1, "tag": "北京市", "areaType": 1, "parentId": 0,
    "children": [
      { "id": 72, "tag": "朝阳区", "areaType": 3, "parentId": 35, "children": null }
    ]
  }
]
```

- `areaType`：实测顶层为 `1`（省级 / 直辖市），区县为 `3`。
- `children`：末级为 `null`（不是空数组）。
- 顶层 35 项、具体三级明细未逐条取全（探针样本被截断），完整结构以调用为准。

> 与「OI 省份字典」的区别：本接口是完整行政树（含区县）；`oi-school/provinces` 只返回省级名称字符串。

```js
await fetch(`${BASE}/api/htoj-biz-gateway/api/get-region-list`, { headers: HEADERS }).then((r) => r.json());
```

### OI 省份字典

`GET /api/code-community/api/oi-school/provinces` ✅ 已实测可用

无参数，返回省份名称字符串数组（`string[]`），用于 OI 学校搜索的省份下拉。实测 32 项（按返回顺序，依据探针样本）：

```
上海, 云南, 内蒙古, 北京, 吉林, 四川, 天津, 宁夏, 安徽, 山东,
山西, 广东, 广西, 新疆, 江苏, 江西, 河北, 河南, 浙江, 海南,
湖北, 湖南, 澳门, 甘肃, 福建, 贵州, 辽宁, 重庆, 陕西, 青海,
香港, 黑龙江
```

```js
await fetch(`${BASE}/api/code-community/api/oi-school/provinces`, { headers: HEADERS }).then((r) => r.json());
```

### 学校搜索

`GET /api/htoj-biz-gateway/api/get-school-list` ✅ 已实测可用

按关键词搜索学校（`IdNameOption[]`）。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `keyword` | string | 是 | 学校名称关键词 |

实测 `keyword=A` 返回（依据探针样本）：

```json
[
  { "id": 997620, "name": "武汉蔡家田小学A区" },
  { "id": 1460537, "name": "邯郸创A教育集团" }
]
```

```js
await fetch(`${BASE}/api/htoj-biz-gateway/api/get-school-list?keyword=A`, { headers: HEADERS }).then((r) => r.json());
```

### OI 学校搜索

`GET /api/code-community/api/oi-school/search` ⚠️ 路由存在但参数不足

按学校名搜索 OI 学校（`OiSchoolVO[]`）。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `schoolName` | string | 是 | 学校名；缺失返回 `errCode=400 The required request parameters are missing：Required request parameter 'schoolName' for method parameter type String is not present` |

`OiSchoolVO` 未随仓库提供字段样本，具体结构未验证。

```js
await fetch(`${BASE}/api/code-community/api/oi-school/search?schoolName=某某中学`, { headers: HEADERS }).then((r) => r.json());
```

### 年级字典

`GET /api/code-community/api/get-grade-list` ✅ 已实测可用

无参数，返回真实年级列表（`RealGradeVO[]`，`{ realGrade, gradeName }`）。实测 15 项（探针样本在 `realGrade=12` 处被截断，故 `12`–`15` 名称未取全）：

| realGrade | gradeName |
| --- | --- |
| 1 | 幼儿中班 |
| 2 | 幼儿大班 |
| 3 | 一年级 |
| 4 | 二年级 |
| 5 | 三年级 |
| 6 | 四年级 |
| 7 | 五年级 |
| 8 | 六年级 |
| 9 | 初一 |
| 10 | 初二 |
| 11 | 初三 |
| 12–15 | 未取全（`realGrade=12` 起样本被截断；按「成长年级字典」推断 12=高一 / 13=高二 起，但未实测确认） |

```js
await fetch(`${BASE}/api/code-community/api/get-grade-list`, { headers: HEADERS }).then((r) => r.json());
```

### 成长年级字典

`GET /api/code-community-growth/api/common/get-grade-list` ✅ 已实测可用

无参数，返回成长体系用的年级列表（`RealGradeVO[]`）。与「年级字典」同构，**少了幼儿两项**（从 `realGrade=3` 起），实测 13 项：

| realGrade | gradeName |
| --- | --- |
| 3 | 一年级 |
| 4 | 二年级 |
| 5 | 三年级 |
| 6 | 四年级 |
| 7 | 五年级 |
| 8 | 六年级 |
| 9 | 初一 |
| 10 | 初二 |
| 11 | 初三 |
| 12 | 高一 |
| 13 | 高二 |
| 14–15 | 未取全（探针样本在 `realGrade=14` 处截断） |

> 走 `code-community-growth` 网关，成功时 `errMsg` 是「操作成功」（不是 `success`）。同一路径也被 `oj/challenge.ts` 的 `getCommonGradeList` 调用。

```js
await fetch(`${BASE}/api/code-community-growth/api/common/get-grade-list`, { headers: HEADERS }).then((r) => r.json());
```

### 敏感词检查

`GET /api/code-community/api/get-sensitive-check-result` ⚠️ 路由存在但参数不足

检查一段文本是否命中敏感词，源码返回 `boolean`。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `type` | string | 否 | 检查类型，源码默认 `nickName`（另有 `checkNickNameSensitive` 封装） |
| `content` | string | 是 | 待检查文本；缺失返回 `errCode=400 The required request parameters are missing：Required request parameter 'content' for method parameter type String is not present` |

响应 `data` 为 `boolean`，具体语义（`true` 表示命中敏感词还是校验通过）未验证。

```js
await fetch(
  `${BASE}/api/code-community/api/get-sensitive-check-result?type=nickName&content=测试`,
  { headers: HEADERS },
).then((r) => r.json());
```

---

## 标签与分类

标签 / 分类的字典入口只有「标签分类树」（`tag/get-classification-list`，见上一节），它同时提供「语法 / 算法 / 比赛分类 / 冬令营」四棵分类树；题目上也直接带 `tags[]`（见 [problems.md](./problems.md#题目列表)）。旧的 `get-problem-tag` / `get-problem-tags` 均被网关 403（见上一节），不可用。

---

## 搜索

### 搜索题目

`GET /api/code-community-forum/api/common/searchProblem` ✅ 已实测可用

论坛侧按关键词搜题目，返回精简题目数组（`SearchProblemItemVO[]`），用于发帖 / 题解时关联题目。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `keyword` | string | 是 | 关键词（题目编号或名称） |

实测 `keyword=A` 返回 5 项（依据探针样本），每项形如：

```json
[
  { "id": 22478163466112, "problemId": "P10527", "problemTitle": "A-B数对", "zone": null, "deleted": false },
  { "id": 22764860877568, "problemId": "P12113", "problemTitle": "ASCII 小助手", "zone": null, "deleted": false }
]
```

> 返回里的 `id` 是内部 pid，`problemId` 是展示编号，`zone` 实测为 `null`。这是论坛域的轻量搜索，与 [problems.md](./problems.md#题目列表) 的 `get-problem-list`（支持难度 / 标签 / 题库等多条件、返回 `Pagination`）不同。

```js
await fetch(`${BASE}/api/code-community-forum/api/common/searchProblem?keyword=A`, { headers: HEADERS }).then((r) => r.json());
```

---

## 权限选项

### 题目题解权限选项

`GET /api/code-community/gwpub/admin/common/v2/problem-solution-permission` ✅ 已实测可用

无参数，返回题目「题解权限 / 标程权限」的下拉选项（`SolutionPermissionOption[]`，`{ value, label }`）。实测 4 项（依据探针样本）：

| value | label |
| --- | --- |
| 1 | 所有人可查看 |
| 3 | AC可查看 |
| 6 | 一小时后可查看 |
| 5 | 通过测试点可查看 |

```js
await fetch(
  `${BASE}/api/code-community/gwpub/admin/common/v2/problem-solution-permission`,
  { headers: HEADERS },
).then((r) => r.json());
```

### 题单题解权限选项

`GET /api/code-community/gwpub/admin/common/v2/training-solution-permission` ✅ 已实测可用

无参数，返回题单「题解权限 / 标程权限」的下拉选项（`SolutionPermissionOption[]`）。实测 5 项（依据探针样本），比题目版多一个 `0`：

| value | label |
| --- | --- |
| 0 | 根据题目本身题解权限而定 |
| 1 | 所有人可查看 |
| 3 | AC可查看 |
| 5 | 通过测试点可查看 |
| 6 | 一小时后可查看 |

> 两个接口都在 `gwpub/admin` 路径下，但实测无需管理员身份即可返回数据。

```js
await fetch(
  `${BASE}/api/code-community/gwpub/admin/common/v2/training-solution-permission`,
  { headers: HEADERS },
).then((r) => r.json());
```

---

## 首页与个人记录

### 我的答题记录

`GET /api/code-community/api/my/problemRecord` ✅ 已实测可用（需登录）

分页查询当前用户做过的题目（`Pagination<ProblemVO>`）。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `pass` | boolean | 否 | 是否只按「已通过」筛选；前端签名如此，具体取值行为未单独验证 |

实测返回 `Page(20/1485)`。`records[]` 字段依据 `re/samples/my-problem-record.json`：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | number | 内部题目 id（pid） |
| `problemId` | string | 展示编号，如 `P12980` |
| `title` | string | 标题 |
| `type` | number \| null | 题目类型，实测为 `null` |
| `difficulty` | `Difficulty` | `{ id, name, color }` |
| `auth` / `answerAuth` | number | 查看题解 / 答案权限（枚举见 [index.md](./index.md#通用枚举) 的 `answerAuth`） |
| `codeShare` | boolean | 是否可看代码 |
| `tags` | `Tag[]` | 标签，实测每项含 `id` / `name` / `status` / `zone` / `gmtCreate` / `gmtModified` |
| `zone` | string | `cpp` |
| `gmtCreate` / `createTime` | number | 毫秒时间戳 |
| `modifiedUser` / `submitStatus` | — | 实测为 `null` |
| `acCount` / `tryCount` / `total` / `ac` | number | 我的通过次数 / 尝试次数 / 提交总数 / 通过总数 |

```js
await fetch(`${BASE}/api/code-community/api/my/problemRecord?currentPage=1&limit=20`, { headers: HEADERS }).then((r) => r.json());
```

### 我的比赛记录

`GET /api/code-community/api/my/contestRecord` ✅ 已实测可用（需登录）

分页查询当前用户参加过的比赛（`Pagination<ContestVO>`）。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| 其余 | — | 否 | 请求参数类型 `ContestListRequestVO` 未随仓库提供，通常含 `currentPage` / `limit` 等 |

实测返回 `Page(20/183)`。`records[]` 为 `ContestVO` 并补充了个人的成绩字段（依据 `re/samples/my-contest-record.json`）：除常规字段外，另有 `rank`（我的排名）、`score`（我的得分）、`scoreDesc`、`hideScoreboard`、`sealRank`、`rankShowName`、`oiRankScoreType`、`started` / `remainTime` / `contestRemainTime` 等。

```js
await fetch(`${BASE}/api/code-community/api/my/contestRecord?currentPage=1&limit=20`, { headers: HEADERS }).then((r) => r.json());
```

### 已报名比赛列表

`GET /api/code-community/api/get-registered-contest-list` 🚫 被网关 403 拒绝

源码签名返回 `Pagination<ContestVO>`。**实测被网关拒绝**：

```json
{ "code": 403, "message": "Gateway Error:Access Denied" }
```

需要「我报名的比赛」时可改用「我的比赛记录」（`my/contestRecord`）。

### 未报名比赛列表

`GET /api/code-community/api/get-not-registered-contest-list` ✅ 已实测可用（需登录）

分页返回当前用户尚未报名的比赛（`Pagination<ContestVO>`）。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| 其余 | — | 否 | 请求参数类型 `ContestListRequestVO` 未随仓库提供 |

实测返回 `Page(4/4)`，`records[]` 为标准 `ContestVO`（字段见 [contests.md](./contests.md)）。

```js
await fetch(`${BASE}/api/code-community/api/get-not-registered-contest-list?currentPage=1&limit=10`, { headers: HEADERS }).then((r) => r.json());
```

### 我的首页汇总（旧）

`GET /api/code-community/api/my/homeData` 🚫 被网关 403 拒绝

源码签名返回 `HomeInfoVO`。**实测被网关拒绝**：

```json
{ "code": 403, "message": "Gateway Error:Access Denied" }
```

首页个人数据请改用「我的首页汇总（新）」（`my/newUserData`）。

### 我的首页汇总（新）

`GET /api/htoj-biz-gateway/api/my/newUserData` ✅ 已实测可用（需登录）

返回当前用户的首页统计数据（`MyHomeDataVo`）。实测字段（依据探针样本）：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `userId` | number | 数字 userId |
| `userName` / `uid` | string | 用户名 / uid |
| `description` | string | 个人简介 |
| `avatar` | string | 头像 URL |
| `ccfLevel` | number \| null | CCF 等级，实测 `null` |
| `goldenTeacher` | boolean | 是否金牌教师 |
| `authenticationIcon` | string \| null | 认证图标，实测 `null` |
| `acCount` | number | 通过题目数 |
| `contestCount` | number | 参赛数 |
| `starCount` / `posterCount` / `problemSolutionCount` / `badgeCount` | number | 收藏 / 帖子 / 题解 / 徽章数（实测样本中还出现更多以 `badge` 开头的字段，被截断未取全） |

```js
await fetch(`${BASE}/api/htoj-biz-gateway/api/my/newUserData`, { headers: HEADERS }).then((r) => r.json());
```

### 我的小组申请列表

`GET /api/code-community/api/group/my-apply-list` ❔ 无法验证

源码签名返回 `Pagination<CMyGroupApplylistResVO>`。该接口**未纳入实测**（无实测样本），`CMyGroupApplylistResVO` 未随仓库提供，字段未确认。抽取器将其标记为「疑似写操作（GET）」，但从命名看应为只读列表。

```js
await fetch(`${BASE}/api/code-community/api/group/my-apply-list`, { headers: HEADERS }).then((r) => r.json());
```

### 热门比赛

`GET /api/htoj-biz-gateway/api/home-get-hot-contests` ✅ 已实测可用

无参数，返回首页热门比赛数组（`HotContestVO[]`）。实测 3 项（依据 `re/samples/hot-contests.json`），每项字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` / `cid` | number | 比赛 id（两者相同） |
| `contestTitle` | string | 比赛名 |
| `startTime` / `endTime` | number | 毫秒时间戳 |
| `type` / `typeDesc` | number / `IdName` | 赛制，如 `{ id: 1, name: "OI" }` |
| `status` / `statusDesc` | number / `IdName` | 状态，如 `{ id: 0, name: "进行中" }` |
| `now` | number | 服务端当前时间戳 |
| `registered` | boolean | 我是否已报名 |
| `avatarList` | string[] | 参赛者头像 |
| `matchType` / `matchTypeDesc` | number / `IdName` | 赛事类型，如 `{ id: 1, name: "核桃周赛" }` |
| `zone` | string | `cpp` |
| `owner` / `ownerVo` | string / `OwnerVo` | 出题人 |
| `gid` | number \| null | 所属小组 |
| `count` | number | 参赛人数 |
| `online` / `onlineTime` / `exerciseId` / `exerciseTag` | — | 实测为 `null` |

> 注意 `id` 与 `cid` 重复给出，`owner` 是 uid 字符串、`ownerVo` 才是对象。

```js
await fetch(`${BASE}/api/htoj-biz-gateway/api/home-get-hot-contests`, { headers: HEADERS }).then((r) => r.json());
```

### 推荐分区

`GET /api/code-community/api/home-get-recommend-sections` ✅ 已实测可用

无参数，返回首页「推荐题目」的分区 Tab（`ProblemRecommendSectionVO[]`）。实测 2 项（依据 `re/samples/recommend-sections.json`）：

```json
[
  { "id": 7, "description": "CSP真题" },
  { "id": 6, "description": "最近上新" }
]
```

> 这里的 `id` 即下方「推荐题目」接口的 `configId`：点击某个 Tab 后用 `configId=<id>` 拉该分区题目。

```js
await fetch(`${BASE}/api/code-community/api/home-get-recommend-sections`, { headers: HEADERS }).then((r) => r.json());
```

### 推荐题目

`GET /api/code-community/api/home-get-problem-recommend` ⚠️ 路由存在但参数不足

返回某个首页推荐分区下的题目（`ProblemRecommendVO[]`）。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `configId` | number | 是 | 推荐分区 id（取自「推荐分区」的 `id`）；缺失返回 `errCode=400 The required request parameters are missing：Required request parameter 'configId' for method parameter type Long is not present` |

`ProblemRecommendVO` 未提供有效样本，字段未验证。

```js
await fetch(`${BASE}/api/code-community/api/home-get-problem-recommend?configId=7`, { headers: HEADERS }).then((r) => r.json());
```

### 本周商品

`GET /api/code-community-actuator/api/user/mission/goods-by-week` ✅ 已实测可用

无参数，返回本周商品 / 抽奖池（`GoodsMissionVO`）。实测字段（依据探针样本）：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | number | 活动 id |
| `name` | string | 活动名，如「小柴·植物大战僵尸2」 |
| `startTime` / `endTime` | number | 毫秒时间戳 |
| `number` | number \| null | 实测 `null` |
| `totalCount` / `totalCountLimit` | number | 已抽 / 上限 |
| `goodsList` | array | 商品列表 |
| `newest` / `isSpecial` | — | 标记字段 |

`goodsList[]` 每项实测字段：`id`、`url`、`video`、`name`、`wear`、`rarityCode`、`rarityName`（如 `普通`）、`goodsAnimation`、`goodsNum`、`goodsLevel` 等（样本被截断，未取全）。

```js
await fetch(`${BASE}/api/code-community-actuator/api/user/mission/goods-by-week`, { headers: HEADERS }).then((r) => r.json());
```

### 抽取商品

`GET /api/code-community-actuator/api/user/mission/draw-goods` ⚠️ 路由存在但参数不足（GET 写操作）

抽取商品，源码返回 `DrawGoodsVo`。**虽为 GET，但会消耗抽奖次数、产生副作用**，未在真实账号实测。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `drawCount` | number | 否 | 抽取数量 |
| `missionId` | number | 是 | 任务 / 活动 id；缺失返回 `errCode=400 The required request parameters are missing：Required request parameter 'missionId' for method parameter type Long is not present` |

`DrawGoodsVo` 未提供样本，字段未验证。

```js
await fetch(
  `${BASE}/api/code-community-actuator/api/user/mission/draw-goods?drawCount=1&missionId=22458328248704`,
  { headers: HEADERS },
).then((r) => r.json());
```

### 装饰商品

`GET /api/code-community-actuator/api/user/mission/decorate-goods` ⚠️ 路由存在但参数不足（GET 写操作）

把某件商品装备 / 装饰到展示位。**GET 写操作**，未实测。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `goodsId` | number | 是 | 商品 id；缺失返回 `errCode=400 The required request parameters are missing：Required request parameter 'goodsId' for method parameter type Long is not present` |

响应未提供样本，结构未验证。

```js
await fetch(
  `${BASE}/api/code-community-actuator/api/user/mission/decorate-goods?goodsId=22921440706560`,
  { headers: HEADERS },
).then((r) => r.json());
```

### 卸下商品

`GET /api/code-community-actuator/api/user/mission/offload-goods` ⚠️ 路由存在但参数不足（GET 写操作）

把某件商品从展示位卸下。**GET 写操作**，未实测。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `goodsId` | number | 是 | 商品 id；缺失返回 `errCode=400 The required request parameters are missing：Required request parameter 'goodsId' for method parameter type Long is not present` |

响应未提供样本，结构未验证。

```js
await fetch(
  `${BASE}/api/code-community-actuator/api/user/mission/offload-goods?goodsId=22921440706560`,
  { headers: HEADERS },
).then((r) => r.json());
```

### 新手任务

`GET /api/htoj-biz-gateway/api/get-novice-task` ✅ 已实测可用（需登录）

返回新手引导任务（`NoviceTaskList`）。实测样本（依据探针样本）：

```json
{
  "noviceType": 2,
  "missionList": [
    {
      "missionId": 22458328248704,
      "missionName": "新手挑战任务",
      "missionRewardVo": [{ "img": "https://…png", "description": "挑战者徽章", "num": 1 }],
      "totalCount": 5,
      "completedCount": 0,
      "missionStatus": 1,
      "factorType": 9,
      "tid": 22448103338112,
      "pid": 22156387166336
    }
  ]
}
```

> `missionList[]` 里同时带 `tid`（关联题单）与 `pid`（关联题目）；`missionRewardVo[]` 是奖励项 `{ img, description, num }`。

```js
await fetch(`${BASE}/api/htoj-biz-gateway/api/get-novice-task`, { headers: HEADERS }).then((r) => r.json());
```

### 首页帖子列表

`GET /api/code-community-forum/api/poster/homePosterList` ✅ 已实测可用

无参数，返回首页帖子精选数组（`PosterListVo[]`）。实测 4 项（依据 `re/samples/home-poster-list.json`），字段与 `PosterVO` 一致（见 [community.md](./community.md#讨论列表)），但**首页接口的 `posterCategory` 实测是对象**（如 `{ id: 1, name: "学术交流" }`），且 `viewCount` / `thumbCount` / `isMine` / `publishTime` 等多为 `null`。

> **与 [community.md](./community.md#讨论列表) 的「讨论列表」不是同一个接口**：那里的 `getPosterList` 路径是 `/api/code-community-forum/api/poster/listPoster`，**必填 `posterCategoryId`**、返回分页对象 `Pagination`；本接口路径是 `/api/code-community-forum/api/poster/homePosterList`，**无参数**、直接返回数组。两者同名但语义不同，注意区分。

```js
await fetch(`${BASE}/api/code-community-forum/api/poster/homePosterList`, { headers: HEADERS }).then((r) => r.json());
```

### 鉴权奖励

`GET /api/code-community-heart-beat/api/reward/v2/authReward` ✅ 已实测可用

无参数，返回当前用户可领取 / 已领取的鉴权奖励（`RewardVo[]`）。实测样本返回空数组 `[]`（依据探针样本），非空时的字段结构未验证；`RewardVo` 未随仓库提供。

```js
await fetch(`${BASE}/api/code-community-heart-beat/api/reward/v2/authReward`, { headers: HEADERS }).then((r) => r.json());
```

---

## 轮播

### 首页轮播（旧）

`GET /api/code-community/api/home-carousel` ✅ 已实测可用

无参数，返回首页 banner 数组（`SliderVO[]`）。实测 5 项（依据探针样本），每项：

```json
[
  {
    "id": 29,
    "img": "https://public.hetaoimg.com/code-community/image/prod/…png",
    "url": "https://htoj.hetao101.com/cpp/discuss/post/detail?id=22341324358272&type=1",
    "target": true,
    "forceLogin": false,
    "scene": null
  }
]
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | number | banner id |
| `img` | string | 图片 URL |
| `url` | string | 跳转链接 |
| `target` | boolean | 是否新窗口打开 |
| `forceLogin` | boolean | 是否需登录才可点 |
| `scene` | number \| null | 场景，旧接口实测为 `null` |

```js
await fetch(`${BASE}/api/code-community/api/home-carousel`, { headers: HEADERS }).then((r) => r.json());
```

### 首页轮播（新）

`GET /api/htoj-biz-gateway/api/home-slider` ✅ 已实测可用

无参数，走 biz 网关的新版首页 banner（`SliderVOBiz[]`）。实测 3 项（依据探针样本），字段与旧接口基本相同（`id` / `img` / `url` / `target` / `forceLogin` / `scene`），差异：**新版 `scene` 实测为数字**（如 `0`），旧版为 `null`。

> 前端 `oj/banner.ts` 里函数名为 `getHomeCarouselNew`（导出名），返回类型 `SliderVOBiz`。新旧两个接口并存，首页实际使用新版。

```js
await fetch(`${BASE}/api/htoj-biz-gateway/api/home-slider`, { headers: HEADERS }).then((r) => r.json());
```
