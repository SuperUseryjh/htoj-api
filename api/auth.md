# 登录与鉴权

本页收录 HTOJ 登录体系（`login.ts`）下的全部接口，以及站点侧的登录态约定。这些接口都在 `https://api.hetao101.com/login/**`，**不走网关、不需要 `Hetao-Oj-Zone` 头**，但需要带 `app_id` / `HT_PLATFORM` / `HT_SYSTEM` / `HT_VERSION`（见 [index.md](./index.md#请求头)）。响应仍是统一的 `{ errCode, data, errMsg }` 信封。

> 登录接口的 `data` 在成功时至少包含 `token`（原始 JWT）。插件即取 `data.token` 作为后续请求的 `Authorization`。

## 接口一览

| 接口 | 方法 | 路径 | 状态 |
| --- | --- | --- | --- |
| 获取国家区号 | GET | `/login/v2/countryCodes` | ✅ |
| 账号密码登录 | POST | `/login/v2/account/oauth/password` | ✅ |
| 发送短信验证码 | POST | `/login/v3/account/oauth/verifyCode/htojWeb:Login` | ❔ |
| 短信验证码登录 | POST | `/login/v2/account/oauth/verifyCode` | ✍️ |
| 微信扫码登录（网站版） | POST | `/login/v2/account/oauth/mobileWeiXin` | ✍️ |
| 临时 code 换 token | GET | `/login/v2/account/oauth/tokenByCode` | ⚠️ |
| token 换临时 code | GET | `/login/v2/account/oauth/codeByToken` | ✍️ |
| 飞书员工 token 登录 | POST | `/login/v2/account/oauth/staff/token` | ✍️ |
| 获取微信 SDK 配置 | GET | `/login/v1/wechat/configInfo` | ✅ |
| 小程序扫码取二维码 | GET | `/login/v1/wechat/miniprogram/qrcode` | ✅ |
| 小程序扫码查结果 | GET | `/login/v1/wechat/miniprogram/loginCheck` | ✅ |
| 续期 token | GET | `/login/v1/account/changeToken` | ❔ |

> 部分接口在前端有「SaaS OJ」备用路径：`sendVerifyCode` / `loginByVerifyCode` / `changeToken` 在 SaaS 模式下改走网关前缀（分别为 `/api/htoj-biz-gateway/gwpub/get-verified-code`、`/api/htoj-biz-gateway/gwpub/login-by-phone`、`/api/htoj-biz-gateway/gwpub/change-token`）。HTOJ 主站走的是上表里的 `hetoa101` 路径。

## 手机号与密码的混淆

`/login/**` 下所有涉及 `phoneNumber`、`password` 的接口，提交前都要经过一层 **XOR 混淆**，提交的不是明文。

- 规则：对字符串**逐字符**处理，把每个字符的码位与 `0x65` 做异或，再转回字符。
- 这是可逆的（同一个函数再做一次就还原），不是加密，仅用于避免明文抓包。
- 实现见插件源码 `src/util/xor.ts` 的 `encodeCredential`（前端对应 `packages/core/utils/encode.ts`）：

```js
// src/util/xor.ts —— 逐字符与 0x65 异或
const encodeCredential = (input) =>
  [...input].map((c) => String.fromCharCode(c.charCodeAt(0) ^ 0x65)).join("");
```

短信验证码登录的 `verifyCode` **不**做混淆，直接传原始数字串。

---

## 获取国家区号
`GET https://api.hetao101.com/login/v2/countryCodes` ✅

返回国家/地区列表，每项含区号与本地区手机号的校验正则，前端用它来切换 `countryCode` / `short`。

**参数**：无。

**响应**：`data` 为数组，实测 27 项，每项结构如下：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| country | string | 英文名，如 `China` |
| name | string | 中文名，如 `中国` |
| short | string | 两位缩写，如 `CN` |
| code | string | 区号，如 `86` |
| regular | string | 手机号正则，如 `^[1]\d{10}$` |

> 响应骨架（字段依据正文，已实测；数组此处仅示 1 项，值已占位）

```json
[
  {
    "country": "",
    "name": "",
    "short": "",
    "code": "",
    "regular": ""
  }
]
```

```js
const res = await fetch("https://api.hetao101.com/login/v2/countryCodes", {
  headers: {
    app_id: "com.hetao101.oj",
    HT_PLATFORM: "htojWeb",
    HT_SYSTEM: "web",
    HT_VERSION: "1.0.0",
  },
});
const { errCode, data } = await res.json();
```

---

## 账号密码登录
`POST https://api.hetao101.com/login/v2/account/oauth/password` ✅

手机号 + 密码登录。**无需验证码票据**，是插件推荐的登录方式（插件以此登录后会保存凭据用于静默续期）。手机号与密码都要先做 [XOR 混淆](#手机号与密码的混淆)。

**body（JSON）**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| phoneNumber | string | 是 | 手机号，**混淆后**的字符串 |
| password | string | 是 | 密码，**混淆后**的字符串 |
| countryCode | string | 否 | 区号，默认 `86` |
| short | string | 否 | 国家缩写，默认 `CN` |

**响应**：`data` 至少含 `token`（JWT 明文）。

> 响应骨架（字段依据正文，已实测；真实 token 已截断为占位）

```json
{
  "token": "…"
}
```

```js
const encodeCredential = (input) =>
  [...input].map((c) => String.fromCharCode(c.charCodeAt(0) ^ 0x65)).join("");

const res = await fetch(
  "https://api.hetao101.com/login/v2/account/oauth/password",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      app_id: "com.hetao101.oj",
      HT_PLATFORM: "htojWeb",
      HT_SYSTEM: "web",
      HT_VERSION: "1.0.0",
    },
    body: JSON.stringify({
      phoneNumber: encodeCredential("15000000000"),
      password: encodeCredential("your-password"),
      countryCode: "86",
      short: "CN",
    }),
  },
);
const { errCode, data } = await res.json();
// data.token -> 后续作为 Authorization 头
```

---

## 发送短信验证码
`POST https://api.hetao101.com/login/v3/account/oauth/verifyCode/htojWeb:Login` ❔

触发发送短信验证码。**该接口强制校验腾讯 TCaptcha 票据，第三方（浏览器扩展 / 非备案域名）无法调用**，因此标注为不可验证。前端源码注释里标注了发送验证码时用的头为 `HT_PLATFORM: parentApp` / `HT_SYSTEM: android` / `HT_VERSION: 2.0.3`。

**body（JSON）**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| checkType | number | 是 | 前端固定传 `1` |
| platform | string | 是 | 前端传 `htojWeb` |
| clientName | string | 是 | 前端传 `htojWeb` |
| countryCode | string | 是 | 区号，如 `86` |
| phoneNumber | string | 是 | 手机号，**混淆后**的字符串 |
| ticket | string | 是 | 腾讯 TCaptcha 票据 |
| randstr | string | 是 | 腾讯 TCaptcha 校验串 |

**票据校验行为（实测）**：

```
空 ticket    → {"errCode":1011,"errMsg":"参数异常"}
伪造 ticket  → {"errCode":2024,"errMsg":"票据校验异常"}
```

票据只能由腾讯 TCaptcha 组件在**已备案域名的浏览器页面**中生成，扩展的 Webview 域名无法通过校验。请改用微信扫码登录。

> 响应结构未验证（成功响应字段正文未给出）

```json
null
```

```js
const res = await fetch(
  "https://api.hetao101.com/login/v3/account/oauth/verifyCode/htojWeb:Login",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      app_id: "com.hetao101.oj",
      HT_PLATFORM: "htojWeb",
      HT_SYSTEM: "web",
      HT_VERSION: "1.0.0",
    },
    body: JSON.stringify({
      checkType: 1,
      platform: "htojWeb",
      clientName: "htojWeb",
      countryCode: "86",
      phoneNumber: encodeCredential("15000000000"),
      ticket: "",       // 需由腾讯 TCaptcha 生成
      randstr: "",      // 需由腾讯 TCaptcha 生成
    }),
  },
);
const { errCode, errMsg } = await res.json();
// 票据无效：errCode = 1011（空）或 2024（伪造）
```

---

## 短信验证码登录
`POST https://api.hetao101.com/login/v2/account/oauth/verifyCode` ✍️

手机号 + 短信验证码登录（第二步）。写操作，未实测：要跑通它需要一条真实短信验证码，而验证码的获取本身受 [发送短信验证码](#发送短信验证码) 的票据限制，第三方无法完成。手机号需 [XOR 混淆](#手机号与密码的混淆)，`verifyCode` 不混淆。

**body（JSON）**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| phoneNumber | string | 是 | 手机号，**混淆后**的字符串 |
| verifyCode | string | 是 | 6 位数字验证码，原文 |
| countryCode | string | 否 | 区号，默认 `86` |
| short | string | 否 | 国家缩写，默认 `CN` |

**响应**：`data` 至少含 `token`。

> 响应骨架（字段依据正文，**未实测**）

```json
{
  "token": "…"
}
```

```js
const res = await fetch(
  "https://api.hetao101.com/login/v2/account/oauth/verifyCode",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      app_id: "com.hetao101.oj",
      HT_PLATFORM: "htojWeb",
      HT_SYSTEM: "web",
      HT_VERSION: "1.0.0",
    },
    body: JSON.stringify({
      phoneNumber: encodeCredential("15000000000"),
      verifyCode: "123456",
      countryCode: "86",
      short: "CN",
    }),
  },
);
const { errCode, data } = await res.json();
```

---

## 微信扫码登录（网站版）
`POST https://api.hetao101.com/login/v2/account/oauth/mobileWeiXin?mode=htojWeb&openType=2` ✍️

网站端微信开放平台扫码登录（由微信回调带来 `code`），前端轮询用户是否已扫码登录。写操作，未实测。

**query**：`mode=htojWeb`、`openType=2`。

**body（JSON）**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| code | string | 是 | 微信回调带回的授权 code |
| state | string | 是 | 前端生成的时间戳（防 CSRF） |

**响应**：`data` 至少含 `token`。

> 响应骨架（字段依据正文，**未实测**）

```json
{
  "token": "…"
}
```

```js
const res = await fetch(
  "https://api.hetao101.com/login/v2/account/oauth/mobileWeiXin?mode=htojWeb&openType=2",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      app_id: "com.hetao101.oj",
      HT_PLATFORM: "htojWeb",
      HT_SYSTEM: "web",
      HT_VERSION: "1.0.0",
    },
    body: JSON.stringify({ code: "<wechat-code>", state: String(Date.now()) }),
  },
);
const { errCode, data } = await res.json();
```

---

## 临时 code 换 token
`GET https://api.hetao101.com/login/v2/account/oauth/tokenByCode?code=` ⚠️

用临时 `code` 换取登录 token（小程序端自动登录用）。路由存在，但实测用无效 code 调用返回业务错误：

```
{"errCode":9500,"errMsg":"code无效"}
```

**query**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| code | string | 是 | 临时 code（由 [token 换临时 code](#token-换临时-code) 生成，1 分钟有效、一次使用即失效） |

**响应**：`data` 至少含 `token`。前端调用超时设为 30s。

> 响应骨架（字段依据正文，**未实测**）

```json
{
  "token": "…"
}
```

```js
const res = await fetch(
  "https://api.hetao101.com/login/v2/account/oauth/tokenByCode?code=<temp-code>",
  {
    headers: {
      app_id: "com.hetao101.oj",
      HT_PLATFORM: "htojWeb",
      HT_SYSTEM: "web",
      HT_VERSION: "1.0.0",
    },
  },
);
const { errCode, data } = await res.json();
// code 无效时：errCode = 9500
```

---

## token 换临时 code
`GET https://api.hetao101.com/login/v2/account/oauth/codeByToken` ✍️

用当前登录 token 生成一个临时 `code`，供小程序端自动登录。写操作（GET，有副作用），未实测。

**参数**：无；请求需带 `Authorization`（当前 token）。

**响应**：`data` 为 `{ code: string }`。

> 响应骨架（字段依据正文，**未实测**）

```json
{
  "code": ""
}
```

```js
const res = await fetch(
  "https://api.hetao101.com/login/v2/account/oauth/codeByToken",
  {
    headers: {
      Authorization: "<token>", // 原始 JWT，不加 Bearer
      app_id: "com.hetao101.oj",
      HT_PLATFORM: "htojWeb",
      HT_SYSTEM: "web",
      HT_VERSION: "1.0.0",
    },
  },
);
const { errCode, data } = await res.json();
// data.code，1 分钟有效、一次使用即失效
```

---

## 飞书员工 token 登录
`POST https://api.hetao101.com/login/v2/account/oauth/staff/token` ✍️

核桃内部员工用飞书 token 登录。写操作，未实测。前端注释里另有一处备用参数 `user_id_tmp`（已被注释掉，不生效）。

**body（JSON）**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| staffToken | string | 是 | 飞书员工 token |
| crmStaffId | number | 是 | CRM 员工 id |

**响应**：`data` 至少含 `token`。

> 响应骨架（字段依据正文，**未实测**）

```json
{
  "token": "…"
}
```

```js
const res = await fetch(
  "https://api.hetao101.com/login/v2/account/oauth/staff/token",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      app_id: "com.hetao101.oj",
      HT_PLATFORM: "htojWeb",
      HT_SYSTEM: "web",
      HT_VERSION: "1.0.0",
    },
    body: JSON.stringify({ staffToken: "<staff-token>", crmStaffId: 0 }),
  },
);
const { errCode, data } = await res.json();
```

---

## 获取微信 SDK 配置
`GET https://api.hetao101.com/login/v1/wechat/configInfo?mode=` ✅

获取微信开放平台登录所需的 `appId`（配置为空时返回空串）。需要带 `Referer` / `share-referer`（前端注释）。

**query**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| mode | string | 否 | 默认 `htojWeb` |

**响应**：`data` 为 `{ appId: string }`，实测无参数时返回 `{"appId":""}`。

> 响应骨架（字段依据正文，已实测：无参数时返回 `{"appId":""}`）

```json
{
  "appId": ""
}
```

```js
const res = await fetch(
  "https://api.hetao101.com/login/v1/wechat/configInfo?mode=htojWeb",
  {
    headers: {
      app_id: "com.hetao101.oj",
      HT_PLATFORM: "htojWeb",
      HT_SYSTEM: "web",
      HT_VERSION: "1.0.0",
    },
  },
);
const { errCode, data } = await res.json();
```

---

## 小程序扫码取二维码
`GET https://api.hetao101.com/login/v1/wechat/miniprogram/qrcode?mode=htbcxas` ✅

获取微信小程序登录二维码。这是插件采用的登录方式（服务端不校验腾讯验证码票据，可完整跑通）。实测缺 `mode` 时返回 `{"errCode":1011,"errMsg":"参数异常：mode不可以为空"}`。

**query**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| mode | string | 是 | 前端固定传 `htbcxas` |

**响应**：`data` 为 `{ ticketBase64: string; sessionId: string }`。`ticketBase64` 是二维码图片的 base64（前端拼 `data:image/png;base64,`），`sessionId` 用于下一步轮询。

> 响应骨架（字段依据正文，已实测；值为占位）

```json
{
  "ticketBase64": "",
  "sessionId": ""
}
```

```js
const res = await fetch(
  "https://api.hetao101.com/login/v1/wechat/miniprogram/qrcode?mode=htbcxas",
  {
    headers: {
      app_id: "com.hetao101.oj",
      HT_PLATFORM: "htojWeb",
      HT_SYSTEM: "web",
      HT_VERSION: "1.0.0",
    },
  },
);
const { errCode, data } = await res.json();
// data.ticketBase64、data.sessionId
```

---

## 小程序扫码查结果
`GET https://api.hetao101.com/login/v1/wechat/miniprogram/loginCheck?sid=` ✅

轮询扫码结果。实测缺 `sid` 时返回 `{"errCode":1011,"errMsg":"参数异常：sessionId不可以为空"}`。

**query**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| sid | string | 是 | 上一步拿到的 `sessionId` |

**响应**：`data` 结构 `{ qrCodeStatus: number; token?: string; userInfo?: UserVO }`。前端按 `qrCodeStatus` 分支（来自 `login.service.ts`）：

| qrCodeStatus | 含义 | 处理 |
| --- | --- | --- |
| 2 | 已扫码、未绑定手机号 | 继续轮询 |
| 3 | 登录成功，`token` 就绪 | 取 `token` 完成登录 |
| 4 | 二维码已失效 | 停止轮询，提示重新获取 |

> 响应骨架（字段依据正文，已实测；`token` / `userInfo` 仅在 `qrCodeStatus` 为 3 时出现）

```json
{
  "qrCodeStatus": 0,
  "token": "…",
  "userInfo": null
}
```

```js
const res = await fetch(
  "https://api.hetao101.com/login/v1/wechat/miniprogram/loginCheck?sid=<sessionId>",
  {
    headers: {
      app_id: "com.hetao101.oj",
      HT_PLATFORM: "htojWeb",
      HT_SYSTEM: "web",
      HT_VERSION: "1.0.0",
    },
  },
);
const { errCode, data } = await res.json();
if (data.qrCodeStatus === 3 && data.token) {
  // 扫码登录成功
}
```

---

## 续期 token
`GET https://api.hetao101.com/login/v1/account/changeToken?device=htojWeb` ❔

换取一个新 token。前端源码里路径由变量（`HT_PLATFORM`）拼出，未实测。

**query**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| device | string | 是 | 前端传 `htojWeb` |

**响应**：`data` 为 `{ token: string }`。

> 响应骨架（字段依据正文，**未实测**）

```json
{
  "token": "…"
}
```

```js
const res = await fetch(
  "https://api.hetao101.com/login/v1/account/changeToken?device=htojWeb",
  {
    headers: {
      Authorization: "<token>", // 原始 JWT，不加 Bearer
      app_id: "com.hetao101.oj",
      HT_PLATFORM: "htojWeb",
      HT_SYSTEM: "web",
      HT_VERSION: "1.0.0",
    },
  },
);
const { errCode, data } = await res.json();
```

---

## 站点侧登录态

站点（`https://htoj.com.cn`）登录成功后，token 与用户信息存在浏览器 `localStorage`：

| key | 内容 |
| --- | --- |
| `KEY_USER_LOGIN_TOKEN` | JWT 明文，直接作为 `Authorization` 头 |
| `KEY_USER_INFO` | 用户基本信息（`uid` / `userId` / 昵称等） |
| `KEY_ZONE` | 当前 zone（`cpp` / `python`） |

`Authorization` **不加 `Bearer` 前缀**，直接用 JWT 原文；该头只对网关接口（相对路径 `/api/**`）附带，登录接口本身不需要。

**JWT 结构**：payload 至少包含 `exp` 与 `id`：

```json
{ "exp": 1793793330, "id": 8871358 }
```

`id` 是数字 userId（与 [get-user-info](../../re/samples/user-info.json) 返回的 `userId` 一致），`exp` 是秒级过期时间。

**续期**：token 快过期时可调用 `GET .../login/v1/account/changeToken?device=htojWeb` 换新。注意两点：

- 判断过期应**解析 JWT 自带的 `exp`**，不要看接口报错——核桃的 `errCode=401` 也被用于「每页最多显示 20 条记录」这类业务错误，用它当「登录失效」会误判。
- 插件里的做法不同：不调 `changeToken`，而是**用登录时保存的手机号 + 密码重新走一次 `password` 登录**换新 token（凭据存 VS Code SecretStorage，剩余寿命不足 5 分钟时静默续期）。所以 `changeToken` 本身未被插件实测。

**退出**：站点侧清除上面三个 `localStorage` key 即可。插件侧对应命令会删除本地保存的 token 与密码凭据。
