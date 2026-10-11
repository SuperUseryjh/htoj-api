# 文件上传与下载

本页整理 HTOJ 的文件上传 / 下载接口，覆盖判题文件、测试点压缩包、样例与附加文件、小组文件、文件列表，以及头像 / Markdown / 奖项图片 / 答案文件等散装上传，共 22 个（全部来自前端 `api/common.ts`）。

> 全局约定（网关前缀、必带请求头、统一 `errCode` 信封、XOR 混淆口径）见 [index.md](./index.md)，本页不再重复。公共类型名见 [htoj-api.d.ts](./htoj-api.d.ts)；本页涉及的若干上传响应类型（`UploadZipResVO` / `UploadJudgeFileVO` / `SingleCaseVo` / `FileUrlVO` / `FileVo` / `AdditionalFileVo`）**不在**该 d.ts 内，下文用字段表描述，并标注证据来源。

本文覆盖 22 个接口：✅0 / ⚠️1 / 🚫0 / ✍️19 / ❔2。除 `getPublicUploadToken` 被探针真实命中（返回缺参 400）外，其余均为写操作或未验证项，**未在真实账号上复测**，请求 / 响应依据前端源码签名与类型整理，请勿据此写死字段。

```js
const BASE = "https://api.htoj.com.cn";
const token = localStorage.getItem("KEY_USER_LOGIN_TOKEN"); // 登录后才有
const HEADERS = {
  "Hetao-Oj-Zone": "cpp", // cpp | python；缺失会报 errCode=400 域属性为空或无效
  HT_PLATFORM: "htojWeb",
  HT_SYSTEM: "web",
  HT_VERSION: "1.0.0",
  app_id: "com.hetao101.oj",
  Authorization: token, // 原始 JWT，不加 Bearer 前缀
};
// 文件上传用 FormData：不要手动设置 Content-Type，浏览器会自动补 multipart 的 boundary
```

## 接口清单

| 接口 | 方法 | 路径 | 验证 | 说明 |
| --- | --- | --- | --- | --- |
| [获取公开上传 token](#获取公开上传-token) | GET | `/api/code-community/gwpub/file/token-for-test` | ⚠️ | 预签名上传凭证，`dirType` 必填 |
| [上传 zip 压缩包](#上传-zip-压缩包) | POST | `/api/code-community/api/file/upload-zip` | ✍️ | 上传判题数据包 zip |
| [上传判题文件](#上传判题文件) | POST | `/api/code-community/gwpub/file/upload-files` | ✍️ | 多文件上传（管理端） |
| [上传测试点文件](#上传测试点文件) | POST | `/api/code-community/gwpub/file/upload-test-case` | ✍️ | 上传自测 / 测试点样例，需 `pid` |
| [上传测试点 case 文件](#上传测试点-case-文件) | POST | `/api/code-community/gwpub/file/upload-group-case` | ✍️ | `.in`/`.out` 成对上传，需 `gid` |
| [下载测试点 case 文件](#下载测试点-case-文件) | POST | `/api/code-community/gwpub/file/download-group-case` | ✍️ | 按文件路径下载，需 `gid` |
| [上传样例 case](#上传样例-case) | POST | `/api/code-community/gwpub/file/upload-sample-case` | ✍️ | 下发样例 `.in`/`.out`（管理端） |
| [下载样例 case](#下载样例-case) | POST | `/api/code-community/gwpub/file/download-sample-case` | ✍️ | 打包下载样例 |
| [上传附加文件](#上传附加文件) | POST | `/api/code-community/gwpub/file/upload-additional-files` | ✍️ | 下发附件（管理端） |
| [下载附加文件](#下载附加文件) | POST | `/api/code-community/gwpub/file/download-additional-files` | ✍️ | 按文件路径下载附件 |
| [上传小组判题文件](#上传小组判题文件) | POST | `/api/code-community/gwpub/file/upload-group-files` | ✍️ | 小组版多文件上传，需 `gid` |
| [上传小组样例 case](#上传小组样例-case) | POST | `/api/code-community/gwpub/file/upload-group-sample-case` | ✍️ | 小组版下发样例，需 `gid` |
| [下载小组样例 case](#下载小组样例-case) | POST | `/api/code-community/gwpub/file/download-group-sample-case` | ✍️ | 小组版下载样例 |
| [上传小组附加文件](#上传小组附加文件) | POST | `/api/code-community/gwpub/file/upload-group-additional-files` | ✍️ | 小组版附件上传，需 `gid` |
| [下载小组附加文件](#下载小组附加文件) | POST | `/api/code-community/gwpub/file/download-group-additional-files` | ✍️ | 小组版附件下载 |
| [附加文件列表](#附加文件列表) | GET | `/api/code-community/gwpub/file/get-additional-file-list` | ❔ | 按 `uploadKey` 查附加文件，未实测 |
| [小组附加文件列表](#小组附加文件列表) | GET | `/api/code-community/gwpub/file/get-group-additional-file-list` | ❔ | 按 `uploadKey`+`gid` 查，未实测 |
| [上传头像](#上传头像) | POST | `/api/code-community-forum/api/content/upload-avatar` | ✍️ | 论坛头像（字段名 `image`） |
| [上传 Markdown 图片](#上传-markdown-图片) | POST | `/api/code-community-forum/api/upload/upload-image` | ✍️ | 富文本编辑器图床，返回 `url` |
| [上传消费者 Markdown 图片](#上传消费者-markdown-图片) | POST | `/api/code-community-forum/api/content/upload-md-img` | ✍️ | 面向 C 端帖子的图床 |
| [上传奖项图片](#上传奖项图片) | POST | `/api/code-community-forum/api/upload/upload-award-file` | ✍️ | 奖项认证材料图片 |
| [上传答案文件](#上传答案文件) | POST | `/api/code-community/gwpub/file/upload-answer-file` | ✍️ | 提交答案题的文件 |

---

## 上传流程概览

前端存在两套上传路径，选哪套取决于接口本身：

**A. 表单直传网关（本页大多数接口）**

调用方把文件塞进 `FormData`，直接 POST 到本页的 `upload-*` 网关接口，响应里返回文件 URL 或 key，前端再把它带进后续业务请求。适用：`uploadZip`、`uploadJudgeFile`、`uploadTestSampleFiles`、`uploadSampleCase`、`uploadAdditionalFiles`、`uploadAvatar`、`uploadMarkdownFile`、`uploadConsumerMarkdownFile`、`uploadAwardImage`、`uploadAnswerFile` 等。多文件接口统一用同一个字段名 `file` 追加多份（头像 / Markdown 系列用 `image`）。

**B. 预签名直传对象存储（`utils/common/upload.ts` 的 `commonUpload`）**

流程为「拿凭证 → 直传 OSS/COS → 回调登记」，用于农场分享等场景，也是理解 `uploadKey` / `dirType` 的关键：

1. 先调凭证接口取临时密钥：公开场景用 [`getPublicUploadToken`](#获取公开上传-token)；带 `gid` 或管理端则用 `getCommonUploadToken`（小组 / 管理端版本，见 [groups.md](./groups.md) 与源码 `api/groupCommon.ts`、`api/admin/common.ts`）。
2. 用返回的临时密钥直传对象存储（**不走网关**）：`cloudId === 1` 走阿里云 OSS（`ali-oss`，`multipartUpload` 分片 10MB、并发 4），`cloudId === 2` 走腾讯云 COS（`cos-js-sdk-v5`，`>10MB` 才分块）。
3. 对象 key 由凭证里的 `dir` 前缀拼上子目录 / `uuid` 与文件名得到：`fileKey = ${config.dir}${subdir|dir}/${file.name}`；完整访问地址 `fileUrl = ${config.host}/${fileKey}`。
4. 把 `fileKey`（即后续接口里的 `uploadKey` 一类标识）随业务请求提交，交由后端登记。

**关于 `uploadKey` 与 `dirType`**：这两个是 index.md 提到的实测必填参数。`dirType` 是凭证接口的目录类型（缺它直接 400），`uploadKey` 是压缩包上传解压后用于回查文件列表 / 题目信息的 key，二者连起来就是上面这条链路。实测报错原文（Java 校验原样透出，证明其必填性）：

```
The required request parameters are missing：Required request parameter 'dirType' for method parameter type String is not present
The required request parameters are missing：Required request parameter 'uploadKey' for method parameter type String is not present
```

> 小组专属的 `uploadMarkdownFile` / `getCommonUploadToken` / `getCommonUploadCaseList` / `getCommonUploadProblem` 四个接口（`groupCommon.ts`）已由 [groups.md](./groups.md) 覆盖，本页不再展开。

---

## 预签名与上传凭证

### 获取公开上传 token

`GET /api/code-community/gwpub/file/token-for-test` ⚠️ 路由存在但参数不足

获取公开场景的临时上传凭证（注释注明「用于农场分享等场景，这是正式的接口」）。前端默认 `dirType` 为 `"slider"`。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `dirType` | string | 是 | 目录类型；缺失返回 `errCode=400 The required request parameters are missing：Required request parameter 'dirType' for method parameter type String is not present` |

响应字段（依据 `utils/common/upload.ts` 对返回值的消费整理，**未在 [htoj-api.d.ts](./htoj-api.d.ts) 中定义，无抓包样本**）：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `cloudId` | number | 云厂商：`1`=阿里云 OSS，`2`=腾讯云 COS；其它值会抛「当前只支持阿里云和腾讯云」 |
| `region` | string | 存储区域 |
| `accessKeyId` | string | 临时 AccessKeyId |
| `accessKeySecret` | string | 临时 AccessKeySecret |
| `securityToken` | string | 临时 STS Token（OSS 的 `stsToken` / COS 的 `SecurityToken`） |
| `bucketName` | string | 存储桶名 |
| `dir` | string | 对象 key 前缀 |
| `host` | string | 访问域名前缀，用于拼 `fileUrl` |
| `startTime` | number | 密钥生效时间（仅 COS 用到） |
| `expiredTime` | number | 密钥过期时间（仅 COS 用到） |

> 响应骨架（字段依据正文（源码用法），**未实测**）

```json
{
  "cloudId": 0,
  "region": "",
  "accessKeyId": "",
  "accessKeySecret": "",
  "securityToken": "",
  "bucketName": "",
  "dir": "",
  "host": "",
  "startTime": 0,
  "expiredTime": 0
}
```

```js
await fetch(
  `${BASE}/api/code-community/gwpub/file/token-for-test?dirType=slider`,
  { headers: HEADERS },
).then((r) => r.json());
```

---

## 判题文件与测试点

### 上传 zip 压缩包

`POST /api/code-community/api/file/upload-zip` ✍️ 写操作未实测

以 `multipart/form-data` 上传一个 zip 判题数据包，返回类型为 `UploadZipResVO`。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `file` | File | 是 | 表单字段名固定为 `file`，单个 zip |

响应类型 `UploadZipResVO` **未验证**（不在 [htoj-api.d.ts](./htoj-api.d.ts) 中，源码里也没有消费点，无法确认字段）。

> 响应骨架（依据类型 `UploadZipResVO` 推导，**未实测**；字段定义不在仓库内，结构未知）

```json
null
```

```js
const form = new FormData();
form.append("file", zipFile);
await fetch(`${BASE}/api/code-community/api/file/upload-zip`, {
  method: "POST",
  headers: HEADERS, // 不要手动加 Content-Type
  body: form,
}).then((r) => r.json());
```

### 上传判题文件

`POST /api/code-community/gwpub/file/upload-files` ✍️ 写操作未实测

批量上传判题文件，多份文件都用同一字段名 `file` 追加。返回 `UploadJudgeFileVO[]`，应使用 `UploadJudgeFile.vue` 组件按 `fileName` 去重与回显（组件限制：单文件 ≤ 1GB、最多 6 个、文件名仅允许数字 / 字母 / 下划线 / 中划线 / 圆点）。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `file` | File | 是 | 重复追加，支持多份 |

响应字段（依据 `components/base/UploadJudgeFile.vue` 使用处）：`fileName`（文件名，用于去重即回显）。其余字段未确认。

> 响应骨架（字段依据正文（源码用法），**未实测**；仅列已确认字段 `fileName`）

```json
[
  {
    "fileName": ""
  }
]
```

```js
const form = new FormData();
files.forEach((f) => form.append("file", f));
await fetch(`${BASE}/api/code-community/gwpub/file/upload-files`, {
  method: "POST",
  headers: HEADERS,
  body: form,
}).then((r) => r.json());
```

### 上传测试点文件

`POST /api/code-community/gwpub/file/upload-test-case` ✍️ 写操作未实测

上传自测 / 测试点的 `.in`、`.out` 文件（成对），需带题目 `pid`。返回 `SingleCaseVo`。

| 参数 | 类型 | 必填 | 位置 | 说明 |
| --- | --- | --- | --- | --- |
| `file` | File | 是 | body | 重复追加，`.in` / `.out` 各一份 |
| `pid` | number | 是 | query | 题目内部 id |

响应字段（依据 `pages/oj/problem/detail/components/codeEditor.service.ts` 与 `FormDispatchSampleTable.service.ts`）：`inUrl`（输入文件地址）、`outUrl`（输出文件地址）。

> 响应骨架（字段依据正文（源码用法），**未实测**）

```json
{
  "inUrl": "",
  "outUrl": ""
}
```

```js
const form = new FormData();
form.append("file", inFile);
form.append("file", outFile);
await fetch(
  `${BASE}/api/code-community/gwpub/file/upload-test-case?pid=22169438826624`,
  { method: "POST", headers: HEADERS, body: form },
).then((r) => r.json());
```

### 上传测试点 case 文件

`POST /api/code-community/gwpub/file/upload-group-case` ✍️ 写操作未实测

上传单个 case 点（`.in` + `.out` 两个文件）——注意路径带 `group`，实为小组场景，需带 `gid`。返回 `SingleCaseVo`（`inUrl` / `outUrl`）。

| 参数 | 类型 | 必填 | 位置 | 说明 |
| --- | --- | --- | --- | --- |
| `file` | File | 是 | body | `.in` / `.out` 成对 |
| `gid` | number | 是 | query | 小组 id |

> 响应骨架（字段依据正文（源码用法），**未实测**）

```json
{
  "inUrl": "",
  "outUrl": ""
}
```

```js
const form = new FormData();
form.append("file", inFile);
form.append("file", outFile);
await fetch(
  `${BASE}/api/code-community/gwpub/file/upload-group-case?gid=22156385706112`,
  { method: "POST", headers: HEADERS, body: form },
).then((r) => r.json());
```

### 下载测试点 case 文件

`POST /api/code-community/gwpub/file/download-group-case` ✍️ 写操作未实测

按文件路径列表下载 case 点，参数全部走 query，需带 `gid`。返回 `{ url: string }`。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `file` | string[] | 是 | 要下载的文件路径列表（如 `[inurl, outurl]`） |
| `gid` | number | 是 | 小组 id |

响应：`data` 为 `{ "url": "<下载地址>" }`。

> 响应骨架（字段依据正文（源码用法），**未实测**）

```json
{
  "url": ""
}
```

```js
await fetch(
  `${BASE}/api/code-community/gwpub/file/download-group-case?file=a.in&file=a.out&gid=22156385706112`,
  { method: "POST", headers: HEADERS },
).then((r) => r.json());
```

---

## 样例与附加文件

### 上传样例 case

`POST /api/code-community/gwpub/file/upload-sample-case` ✍️ 写操作未实测

管理端上传下发样例 `.in` / `.out`（成对）。返回 `SingleCaseVo`（`inUrl` / `outUrl`）。前端在行数据里写入 `inurl` / `outurl`，导出时补默认 `groupNum=0`、`calculateType=1`、`caseScore=0`（不补后端会报错）。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `file` | File | 是 | `.in` / `.out` 成对，字段名 `file` |

> 与本页「上传测试点文件」不同：本接口不带 `pid`（样例在上传后由业务侧关联）。

> 响应骨架（字段依据正文（源码用法），**未实测**）

```json
{
  "inUrl": "",
  "outUrl": ""
}
```

```js
const form = new FormData();
form.append("file", inFile);
form.append("file", outFile);
await fetch(`${BASE}/api/code-community/gwpub/file/upload-sample-case`, {
  method: "POST",
  headers: HEADERS,
  body: form,
}).then((r) => r.json());
```

### 下载样例 case

`POST /api/code-community/gwpub/file/download-sample-case` ✍️ 写操作未实测

按文件路径列表下载样例，参数走 query。响应为 `FileUrlVO`。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `file` | string[] | 是 | 文件路径列表（如 `[record.inurl, record.outurl]`） |
| `gid` | number | 否 | 小组 id（源码签名里带，公域可为 `0`） |

响应 `FileUrlVO`（依据 `FormDispatchSampleTable.service.ts` 取 `res.url` 打开）：字段 `url`（下载地址）。类型定义不在 [htoj-api.d.ts](./htoj-api.d.ts) 中。

> 响应骨架（字段依据正文（源码用法），**未实测**）

```json
{
  "url": ""
}
```

```js
await fetch(
  `${BASE}/api/code-community/gwpub/file/download-sample-case?file=a.in&file=a.out&gid=0`,
  { method: "POST", headers: HEADERS },
).then((r) => r.json());
```

### 上传附加文件

`POST /api/code-community/gwpub/file/upload-additional-files` ✍️ 写操作未实测

管理端上传下发附件（额外文件）。返回 `FileVo[]`。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `file` | File | 是 | 重复追加，支持多份 |

响应类型 `FileVo[]` **未验证**（不在 [htoj-api.d.ts](./htoj-api.d.ts) 中，源码无消费点）。仅拿到「解压后 info」的场景用的是 [`getAdditionalFileList`](#附加文件列表)（`AdditionalFileVo`），两者不要混淆。

> 响应骨架（依据类型 `FileVo[]` 推导，**未实测**；字段定义不在仓库内，结构未知）

```json
null
```

```js
const form = new FormData();
files.forEach((f) => form.append("file", f));
await fetch(`${BASE}/api/code-community/gwpub/file/upload-additional-files`, {
  method: "POST",
  headers: HEADERS,
  body: form,
}).then((r) => r.json());
```

### 下载附加文件

`POST /api/code-community/gwpub/file/download-additional-files` ✍️ 写操作未实测

按单个文件路径下载附件，参数走 query。响应为 `FileUrlVO`（字段 `url`）。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `file` | string | 是 | 单个文件路径 |

> 响应骨架（字段依据正文（源码用法），**未实测**）

```json
{
  "url": ""
}
```

```js
await fetch(
  `${BASE}/api/code-community/gwpub/file/download-additional-files?file=demo.pdf`,
  { method: "POST", headers: HEADERS },
).then((r) => r.json());
```

---

## 小组文件

> 下列接口均为小组版，**必须带 `gid`**。公域对应接口路径里没有 `group`。

### 上传小组判题文件

`POST /api/code-community/gwpub/file/upload-group-files` ✍️ 写操作未实测

小组版批量上传判题文件，需 `gid`。返回 `UploadJudgeFileVO[]`（字段 `fileName`，同 [上传判题文件](#上传判题文件)）。

| 参数 | 类型 | 必填 | 位置 | 说明 |
| --- | --- | --- | --- | --- |
| `file` | File | 是 | body | 重复追加，支持多份 |
| `gid` | number | 是 | query | 小组 id |

> 响应骨架（字段依据正文（源码用法），**未实测**；仅列已确认字段 `fileName`）

```json
[
  {
    "fileName": ""
  }
]
```

```js
const form = new FormData();
files.forEach((f) => form.append("file", f));
await fetch(
  `${BASE}/api/code-community/gwpub/file/upload-group-files?gid=22156385706112`,
  { method: "POST", headers: HEADERS, body: form },
).then((r) => r.json());
```

### 上传小组样例 case

`POST /api/code-community/gwpub/file/upload-group-sample-case` ✍️ 写操作未实测

小组版下发样例，`.in` / `.out` 成对，需 `gid`。返回 `SingleCaseVo`（`inUrl` / `outUrl`）。

| 参数 | 类型 | 必填 | 位置 | 说明 |
| --- | --- | --- | --- | --- |
| `file` | File | 是 | body | `.in` / `.out` 成对 |
| `gid` | number | 是 | query | 小组 id |

> 响应骨架（字段依据正文（源码用法），**未实测**）

```json
{
  "inUrl": "",
  "outUrl": ""
}
```

```js
const form = new FormData();
form.append("file", inFile);
form.append("file", outFile);
await fetch(
  `${BASE}/api/code-community/gwpub/file/upload-group-sample-case?gid=22156385706112`,
  { method: "POST", headers: HEADERS, body: form },
).then((r) => r.json());
```

### 下载小组样例 case

`POST /api/code-community/gwpub/file/download-group-sample-case` ✍️ 写操作未实测

小组版按文件路径列表下载样例。响应为 `FileUrlVO`（字段 `url`）。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `file` | string[] | 是 | 文件路径列表 |
| `gid` | number | 是 | 小组 id |

> 响应骨架（字段依据正文（源码用法），**未实测**）

```json
{
  "url": ""
}
```

```js
await fetch(
  `${BASE}/api/code-community/gwpub/file/download-group-sample-case?file=a.in&file=a.out&gid=22156385706112`,
  { method: "POST", headers: HEADERS },
).then((r) => r.json());
```

### 上传小组附加文件

`POST /api/code-community/gwpub/file/upload-group-additional-files` ✍️ 写操作未实测

小组版上传下发附件，需 `gid`。返回 `FileVo[]`（字段未验证，同 [上传附加文件](#上传附加文件)）。

| 参数 | 类型 | 必填 | 位置 | 说明 |
| --- | --- | --- | --- | --- |
| `file` | File | 是 | body | 重复追加，支持多份 |
| `gid` | number | 是 | query | 小组 id |

> 响应骨架（依据类型 `FileVo[]` 推导，**未实测**；字段定义不在仓库内，结构未知）

```json
null
```

```js
const form = new FormData();
files.forEach((f) => form.append("file", f));
await fetch(
  `${BASE}/api/code-community/gwpub/file/upload-group-additional-files?gid=22156385706112`,
  { method: "POST", headers: HEADERS, body: form },
).then((r) => r.json());
```

### 下载小组附加文件

`POST /api/code-community/gwpub/file/download-group-additional-files` ✍️ 写操作未实测

小组版按单个文件路径下载附件。响应为 `FileUrlVO`（字段 `url`）。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `file` | string | 是 | 单个文件路径 |
| `gid` | number | 是 | 小组 id |

> 响应骨架（字段依据正文（源码用法），**未实测**）

```json
{
  "url": ""
}
```

```js
await fetch(
  `${BASE}/api/code-community/gwpub/file/download-group-additional-files?file=demo.pdf&gid=22156385706112`,
  { method: "POST", headers: HEADERS },
).then((r) => r.json());
```

---

## 文件列表

### 附加文件列表

`GET /api/code-community/gwpub/file/get-additional-file-list` ❔ 未实测

按 `uploadKey` 查询压缩包解压后的附加文件信息（管理端）。**探针未请求**（清单把该 GET 判为「疑似写操作（GET）」，未纳入只读实测），无实测样本。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `uploadKey` | string | 是 | 上传 key（上传解压后得到的标识） |

`uploadKey` 的必填性有旁证：同族的 [`getCommonUploadCaseList` / `getCommonUploadProblem`](./groups.md) 实测缺 `uploadKey` 时返回 `errCode=400 ... Required request parameter 'uploadKey' for method parameter type String is not present`。

响应类型 `AdditionalFileVo` **未验证**（不在 [htoj-api.d.ts](./htoj-api.d.ts) 中）。同族类型的字段线索（来自 `pages/admin/problem/components/OjDetail.service.ts` 的 `handleChangeDispatchFiles`）：`additionalSamples`（下发样例数组）、`additionalAttachments`（附件数组）、`additionalFileKey`（zip 文件标识，提交时作为 `extraZipFile` 回传）。上述字段是否为本接口返回，未确认。

> 响应骨架（字段依据正文（源码用法），**未实测**；字段取自同族消费点，是否为本接口返回未确认）

```json
{
  "additionalSamples": null,
  "additionalAttachments": null,
  "additionalFileKey": null
}
```

```js
await fetch(
  `${BASE}/api/code-community/gwpub/file/get-additional-file-list?uploadKey=xxx`,
  { headers: HEADERS },
).then((r) => r.json());
```

### 小组附加文件列表

`GET /api/code-community/gwpub/file/get-group-additional-file-list` ❔ 未实测

小组版附加文件列表，需 `uploadKey` + `gid`。**探针未请求**（同上），无实测样本。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `uploadKey` | string | 是 | 上传 key |
| `gid` | number | 是 | 小组 id |

响应类型 `AdditionalFileVo`，字段同 [附加文件列表](#附加文件列表)，未验证。

> 响应骨架（字段依据正文（源码用法），**未实测**；字段取自同族消费点，是否为本接口返回未确认）

```json
{
  "additionalSamples": null,
  "additionalAttachments": null,
  "additionalFileKey": null
}
```

```js
await fetch(
  `${BASE}/api/code-community/gwpub/file/get-group-additional-file-list?uploadKey=xxx&gid=22156385706112`,
  { headers: HEADERS },
).then((r) => r.json());
```

---

## 其它（头像 / Markdown / 奖项 / 答案）

### 上传头像

`POST /api/code-community-forum/api/content/upload-avatar` ✍️ 写操作未实测

上传用户头像，走论坛服务 `code-community-forum`。表单字段名为 `image`（**不是** `file`）。返回类型为 `UploadJudgeFileVO[]`（源码如此声明，字段同 [上传判题文件](#上传判题文件) 的 `fileName`，未验证）。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `image` | File | 是 | 头像图片 |

> 响应骨架（字段依据正文（源码用法），**未实测**；仅列已确认字段 `fileName`）

```json
[
  {
    "fileName": ""
  }
]
```

```js
const form = new FormData();
form.append("image", avatarFile);
await fetch(`${BASE}/api/code-community-forum/api/content/upload-avatar`, {
  method: "POST",
  headers: HEADERS,
  body: form,
}).then((r) => r.json());
```

### 上传 Markdown 图片

`POST /api/code-community-forum/api/upload/upload-image` ✍️ 写操作未实测

富文本编辑器（HTMdEditor）插入图片用的图床，表单字段名 `image`。返回 `{ url: string }`。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `image` | File | 是 | 图片 |

响应：`data` 为 `{ "url": "<图片地址>" }`。

> 响应骨架（字段依据正文（源码用法），**未实测**）

```json
{
  "url": ""
}
```

```js
const form = new FormData();
form.append("image", imgFile);
await fetch(`${BASE}/api/code-community-forum/api/upload/upload-image`, {
  method: "POST",
  headers: HEADERS,
  body: form,
}).then((r) => r.json());
```

### 上传消费者 Markdown 图片

`POST /api/code-community-forum/api/content/upload-md-img` ✍️ 写操作未实测

面向 C 端帖子正文的 Markdown 图床，表单字段名 `image`。返回 `{ url: string }`。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `image` | File | 是 | 图片 |

> 与「上传 Markdown 图片」路径不同（`content/upload-md-img` vs `upload/upload-image`），选哪个取决于发帖场景；小组版图床 `upload/group/upload-image?gid=${gid}` 见 [groups.md](./groups.md)。

> 响应骨架（字段依据正文（源码用法），**未实测**）

```json
{
  "url": ""
}
```

```js
const form = new FormData();
form.append("image", imgFile);
await fetch(`${BASE}/api/code-community-forum/api/content/upload-md-img`, {
  method: "POST",
  headers: HEADERS,
  body: form,
}).then((r) => r.json());
```

### 上传奖项图片

`POST /api/code-community-forum/api/upload/upload-award-file` ✍️ 写操作未实测

上传奖项认证材料图片（表单字段名 `file`），返回 `{ url: string }`，一般用于奖项申请表单的图片字段。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `file` | File | 是 | 奖项图片 |

> 响应骨架（字段依据正文（源码用法），**未实测**）

```json
{
  "url": ""
}
```

```js
const form = new FormData();
form.append("file", awardImgFile);
await fetch(`${BASE}/api/code-community-forum/api/upload/upload-award-file`, {
  method: "POST",
  headers: HEADERS,
  body: form,
}).then((r) => r.json());
```

### 上传答案文件

`POST /api/code-community/gwpub/file/upload-answer-file` ✍️ 写操作未实测

上传「提交答案题」的答案文件（表单字段名 `file`），返回 `{ url: string }`；随后提交题目时把该地址作为 `answerFileKey` 之类的 key 带上（见 [problems.md](./problems.md#提交评测) 的 `answerFileKey`）。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `file` | File | 是 | 答案文件 |

响应：`data` 为 `{ "url": "<文件地址>" }`（依据 `codeEditor.service.ts` 取 `res.url`）。

> 响应骨架（字段依据正文（源码用法），**未实测**）

```json
{
  "url": ""
}
```

```js
const form = new FormData();
form.append("file", answerFile);
await fetch(`${BASE}/api/code-community/gwpub/file/upload-answer-file`, {
  method: "POST",
  headers: HEADERS,
  body: form,
}).then((r) => r.json());
```
