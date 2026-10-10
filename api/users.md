# 用户与消息

本页整理 HTOJ 的用户资料、个人中心、站内消息中心与私信（IM）相关接口，对应前端 `api/user.ts`、`api/oj/my.ts`、`api/message.ts`、`api/im.ts`，共 **31 个**接口。

网关地址、请求头、统一响应格式（`{ errCode, data, errMsg }`）、分页结构、鉴权与 token 等全局约定见 [index.md](./index.md)；登录、验证码与 token 续期见 [auth.md](./auth.md)，本页不重复。类型名（如 `UserInfo`、`Pagination`）集中定义在 [htoj-api.d.ts](./htoj-api.d.ts)。

> 验证计数：✅ 7 · ⚠️ 3 · ✍️ 17 · 🚫 0 · ❔ 4（口径见 [index.md](./index.md#覆盖率与验证状态)）。标 ✍️ 的写操作未在真实账号上复测，请求体依据前端源码签名与类型整理，不保证响应字段。

## 通用请求头

除特别说明外，本页所有网关请求都走 `https://api.htoj.com.cn` 并需要下列请求头（IM 接口走独立域名 `https://im.hetao101.com`，见「私信（IM）」一节）。缺失任意一个都可能被网关拒绝，最常见的是漏掉 `Hetao-Oj-Zone` 时报 `errCode=400 域属性为空或无效，无法获取数据`。下面每个范例都复用这里的 `HEADERS`：

```js
const BASE = "https://api.htoj.com.cn";
const IM_BASE = "https://im.hetao101.com";
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

所有响应都判断 `errCode === 0` 而不是 HTTP 状态码（HTTP 恒为 200）。

## 接口清单

| 接口 | 方法 | 路径 | 验证 | 说明 |
| --- | --- | --- | --- | --- |
| [获取当前用户信息](#获取当前用户信息) | GET | `/api/htoj-biz-gateway/api/get-user-info` | ✅ | 核心用户信息接口，返回 `UserInfo` |
| [完善用户资料](#完善用户资料) | POST | `/api/htoj-biz-gateway/api/fill-user-info` | ✍️ | 新用户补齐资料 |
| [绑定手机号](#绑定手机号) | POST | `/api/htoj-biz-gateway/api/bind-user-phone` | ✍️ | 手机号 + 验证码绑定 |
| [判断是否在课用户](#判断是否在课用户) | GET | `/api/htoj-biz-gateway/api/common/get-ys-in-class` | ❔ | 返回布尔 |
| [获取个人资料](#获取个人资料) | GET | `/api/code-community/api/get-personal-info` | ✅ | 个人主页资料 |
| [保存个人资料](#保存个人资料) | POST | `/api/code-community/api/personal-info-set` | ✍️ | 提交整份资料 |
| [保存偏好设置](#保存偏好设置) | POST | `/api/code-community/api/preference-info-set` | ✍️ | 语言偏好等 |
| [更新头像](#更新头像) | POST | `/api/code-community/gwpub/api/update-avatar` | ✍️ | 仅头像 |
| [重置为默认资料](#重置为默认资料) | POST | `/api/code-community/api/set-user-default` | ✍️ | 无参 |
| [设置昵称与头像](#设置昵称与头像) | POST | `/api/code-community/api/set-user-nickname` | ✍️ | 昵称 + 头像 + uid |
| [生成新用户资料](#生成新用户资料) | POST | `/api/code-community/api/generate-user-info` | ✍️ | 随机昵称 / 头像 |
| [收集编程水平](#收集编程水平) | POST | `/api/code-community/api/gather-code-level` | ✍️ | `codeLevel` 1–4 |
| [我的刷题记录](#我的刷题记录) | GET | `/api/code-community/api/my/lastIncomplete` | ✅ | 最近一题 / 题单 / 比赛 |
| [重大比赛倒计时](#重大比赛倒计时) | GET | `/api/code-community/api/countdown/get-countdown-list` | ✅ | 列表，实测为空 |
| [百题斩](#百题斩) | GET | `/api/htoj-biz-gateway/api/get-hundred-problem` | ⚠️ | 探针异常，未见有效数据 |
| [码力进阶概要](#码力进阶概要) | GET | `/api/htoj-biz-gateway/api/get-mali-jiejin-summary` | ❔ | tab 页数组 |
| [码力进阶内容](#码力进阶内容) | GET | `/api/htoj-biz-gateway/api/get-mali-jiejin-content` | ❔ | 单个 tab 数据 |
| [领取任务奖品](#领取任务奖品) | GET | `/api/code-community-actuator/api/user/mission/get-goods` | ⚠️ | 带副作用的 GET |
| [新手引导题目 ID](#新手引导题目-id) | GET | `/api/htoj-biz-gateway/api/get-guide-problem` | ✅ | 返回数字 pid |
| [消息中心列表](#消息中心列表) | GET | `/api/code-community-forum/gwpub/user/message/center` | ✅ | 站内信分页列表 |
| [单条消息已读](#单条消息已读) | POST | `/api/code-community-forum/gwpub/user/message/read` | ✍️ | query 传 `messageId` |
| [全部消息已读](#全部消息已读) | POST | `/api/code-community-forum/gwpub/user/message/readAll` | ✍️ | 无参 |
| [未读计数](#未读计数) | GET | `/api/code-community-forum/gwpub/user/message/unreadCount` | ✅ | 总数 + 三分类 |
| [发送私信](#发送私信) | POST | `https://im.hetao101.com/im-business/v1/msgSend` | ✍️ | 文本走 `sensitive/msgSend` |
| [标记私信已读](#标记私信已读) | POST | `https://im.hetao101.com/im-business/v1/msgReadStatus` | ✍️ | 批量置读 |
| [查询在线状态](#查询在线状态) | POST | `https://im.hetao101.com/im-business/v1/getBusiOnlineStatus` | ✍️ | 语义为查询 |
| [未读私信数](#未读私信数) | GET | `https://im.hetao101.com/im-business/v1/unreadMsgCounts` | ⚠️ | 必带 `user` |
| [私信历史](#私信历史) | POST | `https://im.hetao101.com/im-business/v1/msgHistory` | ✍️ | 语义为查询 |
| [上传 IM 文件](#上传-im-文件) | POST | `/api/code-community-forum/api/upload/upload-im-file` | ✍️ | multipart |
| [代码摘要](#代码摘要) | POST | `/api/code-community/api/im-business/get-code-summary` | ✍️ | 走 code-community |
| [获取课导老师](#获取课导老师) | GET | `/api/htoj-biz-gateway/api/im-business/getClassTutor` | ❔ | 按 gid + tid |

---

## 用户资料

当前登录用户的资料读取、完善、手机号绑定与在课状态判断，对应 `api/user.ts`。

### 获取当前用户信息

`GET /api/htoj-biz-gateway/api/get-user-info` ✅ 已实测可用

登录后拉取当前用户信息，是个人资料、小组、权限的唯一入口。鉴权：**需 token**。对应前端 `getSignInUserInfo`。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `loginSource` | string | 否 | 登录来源标记；前端正常调用时通常不带 |
| `adtag` | string | 否 | 渠道投放标记 |
| `distinguish` | number | 否 | 前端固定传 `1` |

响应 `data` 为 [htoj-api.d.ts](./htoj-api.d.ts) 里的 `UserInfo`。依据样例 [`re/samples/user-info.json`](../../re/samples/user-info.json) 实测字段：`uid`、`userId`、`countryCode`、`countryShort`、`phoneNumber`、`setPassword`、`username`、`signature`、`nickname`、`avatar`、`isAdmin`、`token`、`accountId`、`hasAccount`、`myGroup[]`、`myZone`、`permissions[]`、`language`、`province`、`city`、`cursorTrails`、`avatarFrame`、`homeBackground`、`gradeDecoration`、`block`、`ccfLevel`、`authenticationIcon`、`windowFlag`、`posterPermission`、`replyPermission`、`unitProductId`、`exerciseId`。

```json
{
  "errCode": 0,
  "data": {
    "uid": "dfbb0f4b648a9c6abdbf0948799d66ca",
    "userId": 8871358,
    "countryCode": "86",
    "countryShort": "CN",
    "phoneNumber": "13800000000",
    "setPassword": true,
    "username": "用户a03e16",
    "signature": "（签名已脱敏）",
    "nickname": "用户8d31e4",
    "avatar": "https://example.invalid/ffe25f2d948f.jpg",
    "isAdmin": false,
    "token": null,
    "accountId": null,
    "hasAccount": false,
    "myGroup": [
      { "gid": 22156385706112, "name": "课程配套题库", "description": "...", "zone": "cpp", "uid": "3adc3226deec9ef53503785de1cdead7", "isOwner": false, "roles": null, "permissions": null }
    ],
    "myZone": [],
    "permissions": [],
    "language": 7,
    "province": "某省",
    "city": "某市",
    "ccfLevel": 0,
    "windowFlag": true,
    "posterPermission": 0,
    "replyPermission": 0
  },
  "errMsg": "success"
}
```

> 已知坑：
> 1. **`token` 常为 `null`**（实测样本即如此），需要 token 时回退到 `localStorage` 的 `KEY_USER_LOGIN_TOKEN`。
> 2. `myZone` 实测为**数组** `[]`、`language` 实测为**数字** `7`，与官方文档里「字符串」的写法不一致（[htoj-api.d.ts](./htoj-api.d.ts) 已按实测标注，未验证两者是否并存）。
> 3. `phoneNumber` 实测值不是纯数字（疑似服务端已做变形），不要当作可直接拨打的号码。
> 4. `myGroup[]` 的每一项即 [htoj-api.d.ts](./htoj-api.d.ts) 里的 `GroupVO`（`gid` / `name` / `description` / `zone` / `uid` / `isOwner` / `roles` / `permissions`）；`roles` 实测为字符串（如 `"[308]"` / `"[]"`）或 `null`，`permissions` 为字符串数组或 `null`。

```js
const data = await fetch(
  `${BASE}/api/htoj-biz-gateway/api/get-user-info?distinguish=1`,
  { headers: HEADERS },
).then((r) => r.json());
```

### 完善用户资料

`POST /api/htoj-biz-gateway/api/fill-user-info` ✍️ 未实测，依据源码签名

新用户登录后补齐资料。请求体类型为 `UpdateUserRequestVO`（未抽出，字段未验证），响应 `data` 为 `UserVO`（与 `UserInfo` 同族）。**写操作，未实测**。

```js
await fetch(`${BASE}/api/htoj-biz-gateway/api/fill-user-info`, {
  method: "POST",
  headers: HEADERS,
  body: JSON.stringify({ /* UpdateUserRequestVO，字段未验证 */ }),
}).then((r) => r.json());
```

### 绑定手机号

`POST /api/htoj-biz-gateway/api/bind-user-phone` ✍️ 未实测，依据源码签名

绑定 / 更换手机号，响应 `data` 为 `UserVO`（新用户信息，含更新后的 token）。**写操作，未实测**。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `countryCode` | string | 是 | 国家区号，默认 `86` |
| `short` | string | 是 | 国家简写，默认 `CN` |
| `phoneNumber` | string | 是 | 手机号，**需按登录规则做 XOR 混淆**（见 [auth.md](./auth.md#手机号与密码的混淆)） |
| `verifyCode` | string | 是 | 6 位短信验证码 |

> 前端会先用 `sendVerifyCode`（见 [auth.md](./auth.md#发送短信验证码)）下发验证码再调用本接口；`phoneNumber` 与登录接口一样是混淆后的值，不是明文。

```js
await fetch(`${BASE}/api/htoj-biz-gateway/api/bind-user-phone`, {
  method: "POST",
  headers: HEADERS,
  body: JSON.stringify({
    countryCode: "86",
    short: "CN",
    phoneNumber: "<encoded-phone>", // XOR + base64 混淆
    verifyCode: "123456",
  }),
}).then((r) => r.json());
```

### 判断是否在课用户

`GET /api/htoj-biz-gateway/api/common/get-ys-in-class` ❔ 未实测

判断当前用户是否为在课用户，响应 `data` 为布尔值。对应前端 `getYsInClass`。

> **未实测，依据源码签名**：路径由源码常量 `GATEWAY_PREFIX_COMMON`（即 `/api/htoj-biz-gateway`）拼接得到，探针未解析出该变量，未取得实测结果。

```js
const data = await fetch(
  `${BASE}/api/htoj-biz-gateway/api/common/get-ys-in-class`,
  { headers: HEADERS },
).then((r) => r.json());
```

### 获取个人资料

`GET /api/code-community/api/get-personal-info` ✅ 已实测可用

读取「个人中心 - 个人主页」资料。无参数，鉴权：需 token。对应前端 `getPersonalInfo`。

响应 `data`（类型 `PersonalInfoVO`）实测字段（依据 [`re/samples/personal-info.json`](../../re/samples/personal-info.json)）：`uid`、`username`、`school`、`signature`、`nickname`、`realGrade`、`gender`、`qq`、`avatar`、`phoneNumber`、`userId`、`province`、`city`、`schoolId`。

```json
{
  "errCode": 0,
  "data": {
    "uid": null,
    "username": "",
    "school": "某某中学",
    "signature": "（签名已脱敏）",
    "nickname": "用户8d31e4",
    "realGrade": 12,
    "gender": "girl",
    "qq": "100000000",
    "avatar": "https://example.invalid/ffe25f2d948f.jpg",
    "phoneNumber": null,
    "userId": 8871358,
    "province": "某省",
    "city": "某市",
    "schoolId": 9256331
  },
  "errMsg": "success"
}
```

> 实测样本里 `uid` / `phoneNumber` 为 `null`、`username` 为空串，判空处理；`gender` 实测为字符串 `girl`（未验证是否另有 `boy` 等取值）。

```js
const data = await fetch(`${BASE}/api/code-community/api/get-personal-info`, {
  headers: HEADERS,
}).then((r) => r.json());
```

### 保存个人资料

`POST /api/code-community/api/personal-info-set` ✍️ 未实测，依据源码签名

保存整份个人资料，请求体类型 `PersonalInfoVO`（字段同「获取个人资料」的响应，前端直接把读取到的对象整体回传）。**写操作，未实测**，响应未验证。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `nickname` | string | 是 | 昵称（前端限制 ≤20 字符） |
| `gender` | string | 否 | 性别 |
| `province` | string | 否 | 省 |
| `city` | string | 否 | 市 |
| `signature` | string | 否 | 个性签名 |
| `qq` | string | 否 | QQ |
| `school` | string | 否 | 学校名 |
| `schoolId` | number | 否 | 学校 id |
| `realGrade` | number | 否 | 真实年级 |

```js
await fetch(`${BASE}/api/code-community/api/personal-info-set`, {
  method: "POST",
  headers: HEADERS,
  body: JSON.stringify({ nickname: "用户8d31e4", gender: "girl", province: "某省", city: "某市" }),
}).then((r) => r.json());
```

### 保存偏好设置

`POST /api/code-community/api/preference-info-set` ✍️ 未实测，依据源码签名

保存偏好设置，请求体类型 `PreferenceInfo`。**写操作，未实测**，响应未验证。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `language` | number | 否 | 默认语言（前端取自当前用户 `language`，取值可参考语言字典接口 `get-language`） |

> 前端只提交 `{ language }`；`PreferenceInfo` 是否还有其它字段未确认。

```js
await fetch(`${BASE}/api/code-community/api/preference-info-set`, {
  method: "POST",
  headers: HEADERS,
  body: JSON.stringify({ language: 7 }),
}).then((r) => r.json());
```

### 更新头像

`POST /api/code-community/gwpub/api/update-avatar` ✍️ 未实测，依据源码签名

只更新头像。请求体仅一个字段 `avatar`（string，头像 URL，通常先经上传接口得到）。**写操作，未实测**，响应未验证。

```js
await fetch(`${BASE}/api/code-community/gwpub/api/update-avatar`, {
  method: "POST",
  headers: HEADERS,
  body: JSON.stringify({ avatar: "https://..." }),
}).then((r) => r.json());
```

### 重置为默认资料

`POST /api/code-community/api/set-user-default` ✍️ 未实测，依据源码签名

新用户跳过资料填写时，一键重置为默认昵称 / 头像。无参数。**写操作，未实测**，响应未验证。

```js
await fetch(`${BASE}/api/code-community/api/set-user-default`, {
  method: "POST",
  headers: HEADERS,
}).then((r) => r.json());
```

### 设置昵称与头像

`POST /api/code-community/api/set-user-nickname` ✍️ 未实测，依据源码签名

新用户首次确认昵称 / 头像。**写操作，未实测**，响应未验证。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `avatar` | string | 是 | 头像 URL |
| `nickname` | string | 是 | 昵称（前端限制 ≤20 字符、需过敏感词校验） |
| `uid` | string | 是 | 当前用户 uid（前端从 `UserInfo.uid` 取） |

```js
await fetch(`${BASE}/api/code-community/api/set-user-nickname`, {
  method: "POST",
  headers: HEADERS,
  body: JSON.stringify({ avatar: "https://...", nickname: "用户8d31e4", uid: "<uid>" }),
}).then((r) => r.json());
```

### 生成新用户资料

`POST /api/code-community/api/generate-user-info` ✍️ 未实测，依据源码签名

生成一套随机的昵称 / 头像供新用户挑选。无参数，响应 `data` 为 `UserInfoGenerateVO`：前端只取用 `nickname`、`avatar` 两个字段。**写操作，未实测**，其余字段未验证。

```js
const { data } = await fetch(`${BASE}/api/code-community/api/generate-user-info`, {
  method: "POST",
  headers: HEADERS,
}).then((r) => r.json());
// data.nickname / data.avatar
```

### 收集编程水平

`POST /api/code-community/api/gather-code-level` ✍️ 未实测，依据源码签名

新用户弹窗收集编程水平。**写操作，未实测**，响应未验证。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `codeLevel` | number | 是 | 编程水平，`1`–`4`；文案随 zone 不同（见下） |

`codeLevel` 取值（依据源码常量）：

| value | C++ 文案 | Python 文案 |
| --- | --- | --- |
| 1 | 基础语法入门 | 初学者 |
| 2 | 在学 CSP-J | 基础语法熟练 |
| 3 | 在学 CSP-S | 算法入门 |
| 4 | CSP-S 以上 | 算法熟练 |

```js
await fetch(`${BASE}/api/code-community/api/gather-code-level`, {
  method: "POST",
  headers: HEADERS,
  body: JSON.stringify({ codeLevel: 2 }),
}).then((r) => r.json());
```

---

## 个人中心

「我的」页相关数据：刷题记录、比赛倒计时、百题斩、码力进阶、任务奖品与新手引导，对应 `api/oj/my.ts`。

### 我的刷题记录

`GET /api/code-community/api/my/lastIncomplete` ✅ 已实测可用

返回最近未完成的题目 / 题单 / 比赛。无参数。鉴权：需 token。对应前端 `getMyLastIncomplete`。

响应 `data`（类型 `MyLastIncompleteVO`）实测字段（依据 [`re/samples/my-last-incomplete.json`](../../re/samples/my-last-incomplete.json)）：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `problem` | object \| null | 最近一题：`pid`、`problemId`、`title`、`tid`、`gid`、`isAc` |
| `training` | object \| null | 最近题单：`tid`、`title`、`gid`、`problemCount`、`acCount` |
| `contest` | object \| null | 近期比赛：`cid`、`title`、`startTime`、`endTime`、`gid` |

```json
{
  "errCode": 0,
  "data": {
    "problem": { "pid": 22243802306048, "problemId": "LGP11576", "title": "[CCC 2020] Dog Treats", "tid": 22302141951872, "gid": 22169370776704, "isAc": true },
    "training": { "tid": 22302141951872, "title": "A5课程配套训练", "gid": 22169370776704, "problemCount": 99, "acCount": 54 },
    "contest": { "cid": 22921376372096, "title": "【HT-131-MLS】核桃国庆马拉松 & XRCOI Round 11", "startTime": 1790744400000, "endTime": 1791280800000, "gid": null }
  },
  "errMsg": "success"
}
```

> 三个子对象都可能为 `null`（用户没有最近的题目 / 题单 / 比赛时），使用前要判空。

```js
const data = await fetch(`${BASE}/api/code-community/api/my/lastIncomplete`, {
  headers: HEADERS,
}).then((r) => r.json());
```

### 重大比赛倒计时

`GET /api/code-community/api/countdown/get-countdown-list` ✅ 已实测可用

返回首页重大比赛倒计时列表。无参数。对应前端 `getMyCountdownList`。

响应 `data` 为 `ContestCountdownDTO[]`。实测样例返回**空数组** `[]`：

```json
{ "errCode": 0, "data": [], "errMsg": "success" }
```

> 未取到非空样本，`ContestCountdownDTO` 具体字段未验证。

```js
const data = await fetch(
  `${BASE}/api/code-community/api/countdown/get-countdown-list`,
  { headers: HEADERS },
).then((r) => r.json());
```

### 百题斩

`GET /api/htoj-biz-gateway/api/get-hundred-problem` ⚠️ 路由存在，未取到有效数据

返回百题斩模块数据。无参数。对应前端 `getHundredProblem`，响应 `data` 为 `HundredProblemList[]`。

> 探针在无参数下返回 **HTTP 404**（非标准 `errCode` 信封），verdict 记为「路由存在（业务错误）」。既非 `errCode=0` 的成功响应，也没有明确的参数缺失提示，**未能确认可用性，响应字段未验证**。

```js
const data = await fetch(`${BASE}/api/htoj-biz-gateway/api/get-hundred-problem`, {
  headers: HEADERS,
}).then((r) => r.json());
```

### 码力进阶概要

`GET /api/htoj-biz-gateway/api/get-mali-jiejin-summary` ❔ 未实测

返回「码力进阶」页顶部 tab 数组。无参数。对应前端 `getMaliJiejinSummary`，响应 `data` 为 `HundredProblemVo[]`。

> **未实测，依据源码签名**：路径由源码常量 `GATEWAY_PREFIX_COMMON`（`/api/htoj-biz-gateway`）拼接得到，探针未解析出该变量；响应字段未验证。

```js
const data = await fetch(
  `${BASE}/api/htoj-biz-gateway/api/get-mali-jiejin-summary`,
  { headers: HEADERS },
).then((r) => r.json());
```

### 码力进阶内容

`GET /api/htoj-biz-gateway/api/get-mali-jiejin-content` ❔ 未实测

返回「码力进阶」单个 tab 的题目数据。对应前端 `getMaliJiejinContent`，响应 `data` 为 `HundredProblemList`。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `index` | number | 否 | tab 序号（前端按当前选中 tab 传入） |

> **未实测，依据源码签名**：路径由源码常量拼接得到，探针未解析；响应字段未验证。

```js
const data = await fetch(
  `${BASE}/api/htoj-biz-gateway/api/get-mali-jiejin-content?index=0`,
  { headers: HEADERS },
).then((r) => r.json());
```

### 领取任务奖品

`GET /api/code-community-actuator/api/user/mission/get-goods` ⚠️ 路由存在但参数不足

领取已完成任务对应的奖品，响应 `data` 为 `GoodsVO`。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `goodsId` | number | 是 | 奖品 id |
| `missionId` | number | 是 | 任务 id |

> **这是带副作用的 GET 写操作**（领取奖品），未在真实账号上实测领取结果。探针补参数时缺 `missionId`，返回 `errCode=400 The required request parameters are missing：Required request parameter 'missionId' for method parameter type Long is not present`，可见 `missionId` 为必填 `Long`；`GoodsVO` 字段未验证。

```js
const data = await fetch(
  `${BASE}/api/code-community-actuator/api/user/mission/get-goods?goodsId=1&missionId=1`,
  { headers: HEADERS },
).then((r) => r.json());
```

### 新手引导题目 ID

`GET /api/htoj-biz-gateway/api/get-guide-problem` ✅ 已实测可用

返回后端配置的新手引导题目 id。无参数。对应前端 `getUserGuideProblem`，响应 `data` 为数字 pid。

```json
{ "errCode": 0, "data": 22169438826624, "errMsg": "success" }
```

```js
const data = await fetch(`${BASE}/api/htoj-biz-gateway/api/get-guide-problem`, {
  headers: HEADERS,
}).then((r) => r.json());
```

---

## 消息中心

站内通知（不是私信）：点赞、评论、系统通知三大类，对应 `api/message.ts`。与「私信（IM）」是两套独立体系——消息中心是**单向通知**，私信是**双向聊天**。

### 消息中心列表

`GET /api/code-community-forum/gwpub/user/message/center` ✅ 已实测可用

分页拉取站内消息。鉴权：需 token。对应前端 `getMessageCenter`。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `category` | number | 否 | 分类：`0`=全部（缺省）；`1`=点赞；`2`=评论；`3`=系统通知 |
| `onlyUnread` | boolean | 否 | 仅看未读 |
| `pageNum` | number | 否 | 页码，从 1 开始 |
| `pageSize` | number | 否 | 每页条数（前端默认 10，可选 10/20/50） |

响应 `data`（类型 `MessageCenterVo`）为分页对象：`total`、`pages`、`current`、`records[]`。`records[]` 每条（类型 `UserMessageVo`）实测字段：`id`、`messageType`、`messageContent`、`posterName`、`posterId`、`zone`、`messageTime`（毫秒时间戳）、`posterType`、`category`、`isRead`、`version`、`title`（模板文案，含 `{paramKey}` 占位）、`subtitle`、`params`（占位符取值）、`jump`（跳转配置）。

```json
{
  "total": 23,
  "pages": 2,
  "current": 1,
  "records": [
    {
      "id": 641534,
      "messageType": 18,
      "messageContent": null,
      "posterName": null,
      "posterId": null,
      "zone": null,
      "messageTime": 1790990431000,
      "posterType": null,
      "category": 1,
      "isRead": true,
      "version": 2,
      "title": "{likerName}给你的农场荣誉墙点赞了",
      "subtitle": null,
      "params": { "likerName": "『사과씨🍏』" },
      "jump": { "kind": "route", "name": "oj_home_post", "query": { "id": "b3fee6f2956943b49ee2429ea79fc6..." } }
    }
  ]
}
```

要点：

- `title` 是**模板文案**，`{paramKey}` 需用 `params` 里的值填充（前端 `renderTemplate`）。
- 两条消息格式由 `version` 区分：`version === 2` 为新格式，带 `jump` / `params` 等结构化字段；`version` 为 1 的旧格式跳转在**前端本地映射**（不再由服务端下发）。`messageType` 枚举（前端 `MessageType`）：`2`=用户回复、`4`=题解审核通过、`5`=审核不通过、`6`=精华题解、`7`=通过并加精、`13`=评论审核不通过、`15`=奖项认证中、`16`=通过未领取、`17`=驳回；另源码注释提到 `1`=管理删除、`11`=开通发帖权限、`12`=移除发帖权限、`14`=超时未审核（`3`/`8` 不出现在消息列表）。
- `category` 与「未读计数」的字段一一对应：`1`=点赞、`2`=评论、`3`=系统通知。
- 实测样本 `records` 有数据但 `pages=2`、`total=23`，分页元数据可用；`jump.query` 在样例中被截断，完整结构未确认。

```js
const data = await fetch(
  `${BASE}/api/code-community-forum/gwpub/user/message/center?category=1&onlyUnread=false&pageNum=1&pageSize=10`,
  { headers: HEADERS },
).then((r) => r.json());
```

### 单条消息已读

`POST /api/code-community-forum/gwpub/user/message/read` ✍️ 未实测，依据源码签名

把单条消息置为已读，响应 `data` 为数字。**写操作，未实测**。`messageId` 走 query。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `messageId` | number | 是 | 消息 id（即列表 record 的 `id`） |

> 前端在点击消息时调用，且**仅当 `isRead` 为 `false`** 时才发请求。

```js
await fetch(
  `${BASE}/api/code-community-forum/gwpub/user/message/read?messageId=641534`,
  { method: "POST", headers: HEADERS },
).then((r) => r.json());
```

### 全部消息已读

`POST /api/code-community-forum/gwpub/user/message/readAll` ✍️ 未实测，依据源码签名

把全部未读消息置为已读，无参数，响应 `data` 为数字。**写操作，未实测**。

```js
await fetch(
  `${BASE}/api/code-community-forum/gwpub/user/message/readAll`,
  { method: "POST", headers: HEADERS },
).then((r) => r.json());
```

### 未读计数

`GET /api/code-community-forum/gwpub/user/message/unreadCount` ✅ 已实测可用

返回站内消息未读计数，铃铛角标与消息中心分类气泡共用此数据源。无参数，鉴权：需 token。对应前端 `getUnreadCount`。

响应 `data`（类型 `UnreadCountVo`）实测字段：`total`（总数）、`likeCount`、`commentCount`、`noticeCount`。

```json
{ "errCode": 0, "data": { "total": 0, "likeCount": 0, "commentCount": 0, "noticeCount": 0 }, "errMsg": "success" }
```

```js
const data = await fetch(
  `${BASE}/api/code-community-forum/gwpub/user/message/unreadCount`,
  { headers: HEADERS },
).then((r) => r.json());
```

---

## 私信（IM）

学生与老师的一对一聊天，走独立域名 `https://im.hetao101.com`，路径前缀 `/im-business/v1/**`（**不走**网关，也不需要 `Hetao-Oj-Zone`），对应 `api/im.ts`。会话双方 id 带前缀：学生 `ms:<userId>`、老师 `teacher:<userId>`。

> 除 `unreadMsgCounts`、`uploadImFile`、`getCodeSummary`、`getClassTutor` 外，IM 接口均为 **POST** 且前端未做实测（写/查询混杂）；下面标 ✍️ 的均**未实测，依据源码签名与调用点**整理。

### 发送私信

`POST https://im.hetao101.com/im-business/v1/msgSend` ✍️ 未实测，依据源码签名

发送一条 IM 消息。**文本消息走敏感词专用路径** `${IM_BASE}/im-business/v1/sensitive/msgSend`，其余类型（图片 / 音频 / 视频 / 代码 / 命令）走 `/im-business/v1/msgSend`（前端 `isTxtMsg` 判定，即 `msgBody.contentType === 'TXT'`）。

请求体为 `MsgVO`：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `msgId` | string | 是 | 客户端生成的 uuid |
| `uuid` | string | 是 | 通常等于 `msgId` |
| `sender` | string | 是 | 发送者（带前缀 id，如 `ms:30205135`） |
| `receivers` | string[] | 是 | 接收者数组，如 `["teacher:<id>"]`；系统命令消息为 `["system"]` |
| `business` | string | 是 | 固定 `online_class` |
| `appId` | string | 是 | 固定 `im-business` |
| `msgTime` | number | 是 | 秒级时间戳 |
| `readStatus` | number | 是 | 初始 `0` |
| `sensitive` | boolean | 是 | 初始 `false` |
| `senderState` | number | 是 | 初始 `0` |
| `bizCode` | string | 文本消息是 | 文本消息固定 `OnlineClass-IM-U3D` |
| `msgBody` | object | 是 | 见下 |

`msgBody`（类型 `MsgBodyVO`）：`contentType`（`TXT` | `IMG` | `AUDIO` | `VIDEO` | `CODE` | `PHONE` | `CUSTOM` | `CMD`）、`messageId`（数字，`Date.now()`）、`entranceType`（`Normal`）、`extra`（对象，前端置 `{ htoj: 1 }`，音频另带 `audioLen`），以及按类型二选一的载荷之一：`txtMsg` `{ txt }`、`imgMsg` `{ url, width?, height? }`、`audioMsg` `{ url }`、`videoMsg` `{ url, backgroundImage }`、`codeMsg` `{ logo, title, url, needLogin }`、`cmdMsg`（`{ type, status?, msgId?, replyMessageId?, statusCode? }`，`type` 取 `recall` / `session_info` / `view_communicate` / `view_communicate_lose`）。

响应 `data` 为 `MsgSendResponseVO`，前端只判断 `SendResult.sensitive`：为真表示命中敏感词、发送失败且不允许重发。

```js
// 文本消息走 sensitive 路径
await fetch(`${IM_BASE}/im-business/v1/sensitive/msgSend`, {
  method: "POST",
  headers: HEADERS, // 注意：此处的 Hetao-Oj-Zone 等头不被 IM 域使用
  body: JSON.stringify({ /* MsgVO，见上表 */ }),
}).then((r) => r.json());
```

### 标记私信已读

`POST https://im.hetao101.com/im-business/v1/msgReadStatus` ✍️ 未实测，依据源码签名

批量标记消息已读。请求体为 `MsgReadStatusRequestVO`：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `user` | string | 是 | 当前用户（带前缀 id） |
| `targetUser` | string \| null | 否 | 置为「对方」时会标记与该用户的所有消息已读；仅标记指定消息时传 `null` |
| `msgIds` | string[] | 是 | 要置读的消息 id 列表；配合 `targetUser` 全部置读时传 `[]` |
| `readStatus` | number | 是 | 实测调用固定为 `1`（看到消息）；另有 `11`=看到并播放（用于音频 / 视频） |

响应 `data` 为 `MsgReadStatusResponseVO`（字段未验证）。

```js
await fetch(`${IM_BASE}/im-business/v1/msgReadStatus`, {
  method: "POST",
  headers: HEADERS,
  body: JSON.stringify({ user: "ms:30205135", targetUser: "teacher:1", msgIds: [], readStatus: 1 }),
}).then((r) => r.json());
```

### 查询在线状态

`POST https://im.hetao101.com/im-business/v1/getBusiOnlineStatus` ✍️ 未实测，依据源码签名

查询对方（老师）是否在线。**虽为 POST，但语义是查询、无副作用**。请求体为 `BusiOnlineStatusRequestVO`：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `business` | string | 是 | 固定 `online_class` |
| `user` | string | 是 | 自己（带前缀 id） |
| `users` | string[] | 是 | 要查询的对象列表（带前缀 id） |

响应 `data` 为 `BusiOnlineStatusResponseVO`：`statusInfo[]`，每项含 `user` 与 `imStatus.status`（`1` 表示在线）。

```js
await fetch(`${IM_BASE}/im-business/v1/getBusiOnlineStatus`, {
  method: "POST",
  headers: HEADERS,
  body: JSON.stringify({ business: "online_class", user: "ms:30205135", users: ["teacher:1"] }),
}).then((r) => r.json());
```

### 未读私信数

`GET https://im.hetao101.com/im-business/v1/unreadMsgCounts` ⚠️ 路由存在但参数不足

查询与各对象的未读数。`user` 走 query。响应 `data` 为 `UnreadMsgCountsResponseVO`，形如 `{ userCounts: { "<带前缀 id>": number } }`。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `user` | string | 是 | 当前用户（带前缀 id） |

> 探针未带 `user` 时返回 **HTTP 400** 且响应体为纯文本 `Parse query param: user failed.`（非 JSON），可见 `user` 为必填 query。补上正确 id 后即可拿到 `userCounts`，`UnreadMsgCountsResponseVO` 其余字段未验证。

```js
const data = await fetch(
  `${IM_BASE}/im-business/v1/unreadMsgCounts?user=ms:30205135`,
  { headers: HEADERS },
).then((r) => r.json());
```

### 私信历史

`POST https://im.hetao101.com/im-business/v1/msgHistory` ✍️ 未实测，依据源码签名

拉取历史消息。**POST 但语义为查询、无副作用**。请求体为 `MsgHistoryRequestVO`：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `current` | number | 是 | 页码，从 1 开始，前端每次加载成功后 +1 |
| `pageSize` | number | 是 | 每页条数，前端默认 `20` |
| `user` | string | 是 | 当前用户（带前缀 id） |
| `targetUsers` | string[] | 是 | 会话对象列表（带前缀 id） |
| `recall` | number | 是 | 前端固定传 `1` |

响应 `data` 为 `MsgHistoryResponseVO`：`hasNext`（是否还有下一页）、`msgList`（`MsgVO[]`，字段同「发送私信」的请求体，另含 `readStatus` 等）。

```js
await fetch(`${IM_BASE}/im-business/v1/msgHistory`, {
  method: "POST",
  headers: HEADERS,
  body: JSON.stringify({ current: 1, pageSize: 20, user: "ms:30205135", targetUsers: ["teacher:1"], recall: 1 }),
}).then((r) => r.json());
```

### 上传 IM 文件

`POST /api/code-community-forum/api/upload/upload-im-file` ✍️ 未实测，依据源码签名

上传图片 / 音频等 IM 附件，返回可发送的 URL。**写操作，未实测**。这是本页少数走**网关**的 IM 相关接口（域名 `api.htoj.com.cn`，需网关请求头）。请求体为 `multipart/form-data`，字段名 `file`。

响应 `data` 为 `{ url: string }`：

```json
{ "errCode": 0, "data": { "url": "https://..." }, "errMsg": "success" }
```

```js
const fd = new FormData();
fd.append("file", file);
// 注意：multipart 不要手动设置 Content-Type，由浏览器自动补 boundary
const { "Content-Type": _ct, ...uploadHeaders } = HEADERS;
const data = await fetch(`${BASE}/api/code-community-forum/api/upload/upload-im-file`, {
  method: "POST",
  headers: uploadHeaders,
  body: fd,
}).then((r) => r.json());
```

### 代码摘要

`POST /api/code-community/api/im-business/get-code-summary` ✍️ 未实测，依据源码签名

把一段代码在私信中生成分享卡片（标题 / 链接等），走 `code-community` 网关。请求体 `{ code: string, pid: number }`，响应 `data` 为 `CodeVo`（字段未验证）。**写操作，未实测**。

```js
await fetch(`${BASE}/api/code-community/api/im-business/get-code-summary`, {
  method: "POST",
  headers: HEADERS,
  body: JSON.stringify({ code: "// source", pid: 22169438826624 }),
}).then((r) => r.json());
```

### 获取课导老师

`GET /api/htoj-biz-gateway/api/im-business/getClassTutor` ❔ 未实测

按小组与题单获取对应的课导老师，响应 `data` 为 `IMTeacherResp`。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `gid` | string | 是 | 小组 id |
| `tid` | string | 是 | 题单 id |

> **未实测，依据源码签名**：路径由源码常量 `GATEWAY_PREFIX_COMMON`（`/api/htoj-biz-gateway`）拼接得到，探针未解析出该变量；`IMTeacherResp` 字段未验证。

```js
const data = await fetch(
  `${BASE}/api/htoj-biz-gateway/api/im-business/getClassTutor?gid=22156385706112&tid=22302141951872`,
  { headers: HEADERS },
).then((r) => r.json());
```
