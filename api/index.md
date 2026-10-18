# HTOJ API 文档

非官方整理的 [HTOJ](https://htoj.com.cn) 接口文档，由插件开发过程中逆向前端得到，并逐个实测确认。

> 本仓库与核桃编程官方无关。接口随时可能变化，尤其是下文标注「未实测」的部分。

本文件是总览与全局约定；具体接口按域分页：

| 页面 | 内容 |
| --- | --- |
| [auth.md](./auth.md) | 登录、验证码、二维码、token 续期 |
| [problems.md](./problems.md) | 题目列表 / 详情 / 提交 / 评测轮询 / 自测 / 提交记录 / 题库 |
| [trainings.md](./trainings.md) | 题单（训练）列表、章节、题目、进度 |
| [contests.md](./contests.md) | 比赛列表 / 详情 / 报名 / 开始 / 榜单 / 公告 |
| [groups.md](./groups.md) | 小组及其比赛、题单、题目、成员 |
| [users.md](./users.md) | 用户资料 / 答题记录 / 消息中心 / 私信 |
| [community.md](./community.md) | 讨论区、帖子、回复、题解、AI 题解批注、专栏 |
| [challenges.md](./challenges.md) | 挑战与考试（CSP 模拟等）：报名、身份核验、试卷、交卷 |
| [growth.md](./growth.md) | 成长体系：等级、任务、激励、背包、徽章、农场、活动 |
| [battle.md](./battle.md) | 星际对战（Battle Contest）：对战详情、提交、战报 |
| [misc.md](./misc.md) | 字典（语言 / 难度 / 地区 / 年级）、标签、搜索、首页、轮播 |
| [uploads.md](./uploads.md) | 文件上传 / 下载：判题文件、样例、附加文件、Markdown、头像 |

不方便直接列出的类型定义集中在 [htoj-api.d.ts](./htoj-api.d.ts)。

## 网关与地址

所有业务接口统一走网关：

```
https://api.htoj.com.cn/api/{service}/{path}
```

| service | 用途 |
| --- | --- |
| `code-community` | 主服务：题目、题单、比赛、小组、提交、讨论 |
| `htoj-biz-gateway` | 业务网关：题目详情、提交详情、用户信息、首页 |
| `code-community-forum` | 论坛：帖子、回复、题解、上传 |
| `code-community-actuator` | 激励 / 任务 / 背包 |
| `code-community-growth` | 成长体系、挑战 / 考试、另一套提交记录 |
| `code-community-heart-beat` | 时长心跳、奖励领取 |
| `code-community-websocket` | WebSocket 与心跳上报 |

其它域名：

| 域名 | 用途 |
| --- | --- |
| `https://api.hetao101.com` | 登录与用户体系（`/login/**`） |
| `https://im.hetao101.com` | 即时通讯（`/im-business/**`） |
| `https://htoj.com.cn` | 站点页面 |

环境：测试环境为 `api.testing.htoj.com.cn` / `api.testing.hetao101.com`，开发为 `api.hetaodev.*`（见前端 `utils/environment.ts`）。

## 请求头

所有网关请求都要带下列头，否则网关无法路由：

```
Hetao-Oj-Zone: cpp          # 必需；cpp | python
HT_PLATFORM: htojWeb
HT_SYSTEM: web
HT_VERSION: 1.0.0
app_id: com.hetao101.oj
```

登录后附加：

```
Authorization: <token>      # 原始 JWT，不要加 Bearer 前缀
```

- **`Hetao-Oj-Zone` 缺失会报 `errCode=400 域属性为空或无效，无法获取数据`**，这是最常见的坑。
- `Hetao-Oj-Zone` 只对相对路径（网关接口）追加；请求第三方绝对地址时不追加。
- 登录接口（`api.hetao101.com/login/**`）不走网关，不需要 `Hetao-Oj-Zone`。

## 统一响应格式

```json
{ "errCode": 0, "data": {}, "errMsg": "success" }
```

- `errCode === 0` 表示成功，业务数据在 `data`；否则 `data` 为 `null`。
- **HTTP 状态码恒为 200**，业务错误通过 `errCode` 表达，必须判断 `errCode` 而不是 `response.ok`。
- 被网关拦截时返回的是网关自身结构，不是上面的格式：

```json
{ "code": 403, "message": "Gateway Error:Access Denied" }
```

### 实测补充

- **后端参数校验信息是 Java 层的原样透出**，可以直接当文档用，例如：

  ```
  The required request parameters are missing：Required request parameter 'gid' for method parameter type Long is not present
  ```

  它同时告诉了你「哪个参数必填」和「参数类型」（`Long` / `String`）。本仓库实测时收集到的必填参数：`gid`（10 个接口）、`cid`（7 个）、`tid`（6 个）、`pid`（5 个）、`missionId`（4 个）、`posterId`（3 个）、`admissionId`、`testId`、`dirType`、`uploadKey`、`id` 等。
- **部分路径被网关直接拒绝**（`403 Gateway Error:Access Denied`），前端里仍留着调用但实际已不可用，实测确认的有：
  `get-problem-tag`、`get-problem-tags`、`get-problem-difficulty`、`get-problem-source`、`get-problem-language-and-case`、`get-problem-choice-detail`、`get-submission-case-list`、`get-contest-detail`、`get-contest-access`、`get-registered-contest-list`、`my/homeData`、`battle-contest-report-by-record`、`challenge/leaderboard/{accuracy,team,problem}`。
- 网关有频控，触发时返回「访问太频繁，请稍后再试！」；只读请求建议做退避重试。
- 正文里当作证据引用的样例 JSON（`/re/samples/*.json`、`/re/api-probe.json`）在发布前**已脱敏**：uid、昵称、姓名、手机号、QQ、学校 / 省市、头像与二维码地址、个人签名与提交代码都换成了占位值。字段名与结构保持原样，只有取值不可信。

## 鉴权与 token

token 存在浏览器 `localStorage`：

| key | 内容 |
| --- | --- |
| `KEY_USER_LOGIN_TOKEN` | JWT 明文，直接作为 `Authorization` 头 |
| `KEY_USER_INFO` | 用户基本信息（uid / userId / 昵称等） |
| `KEY_ZONE` | 当前 zone（`cpp` / `python`） |

JWT payload：

```json
{ "exp": 1793793330, "id": 8871358 }
```

`id` 是数字 userId，`exp` 是秒级过期时间。过期可调用 `GET https://api.hetao101.com/login/v1/account/changeToken?device=htojWeb` 续期。

## 分页

列表接口统一返回：

```json
{ "records": [], "total": 100, "size": 20, "current": 1, "orders": [], "searchCount": true, "pages": 5 }
```

请求参数固定为 `currentPage`（从 1 开始）与 `limit`。注意服务端对 `limit` 有上限，超出会直接报错（例如 `get-my-submission-list` 上限 20，传 30 会返回 `errCode=401 每页最多显示20条记录`）。

## 提交参数混淆

`/login/**` 下的登录接口，`phoneNumber` 与 `password` 都要经过 **XOR 混淆**后再提交，不是明文。算法见 [htoj-api.d.ts](./htoj-api.d.ts) 里的 `encodeCredential` 说明与插件源码 `src/util/xor.ts`。

## 通用枚举

**zone**：`cpp` | `python`（对应站点 `/cpp/` 与 `/py/`）

**题目难度**（`GET /api/code-community/api/zone-data-list?types=difficulty`）：

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

**题库 `wid`**：`1`=核桃题库，`3`=洛谷，`4`=核桃比赛，`22`=历年真题，`100`=Becoder

**题目类型 `type`**：`1`=OJ 编程题，`2`=选择题，`5`=客观题

**答案查看权限 `answerAuth`**：`1`=所有人，`2`=提交用户，`3`=通过用户，`4`=管理员，`5`=有测试点通过用户

**判题状态（测试点 / 提交的 `status.id`）**：

| id | name | 含义 |
| --- | --- | --- |
| 0 | Accepted | 通过 |
| 1 | Presentation Error | 格式错误 |
| 2 | Time Limit Exceeded | 超时 |
| 3 | Memory Limit Exceeded | 超内存 |
| 4 | Wrong Answer | 答案错误 |
| 5 | Runtime Error | 运行时错误 |
| 6 | Output Limit Exceeded | 输出超限 |
| 7 | Compile Error | 编译错误 |
| 8 | System Error | 系统错误 |
| 49 | Cancelled | 已取消 |
| -10 | Judging | 评测中 |

同一个枚举在**提交列表**里的含义不同：`0`=已通过，`1`=未通过，`2`=未提交，`3`=…（前端 `answerStatus` 用另一套 id，见 [problems.md](./problems.md#我的提交列表)）。

**提交整体结果 `resultCode`（轮询用）**：

| resultCode | 含义 | 轮询动作 |
| --- | --- | --- |
| 0 | PENDDING 评测中 | 继续轮询 |
| 1 | SUCCESS 已完成 | 停止 |
| 2 | FAILURE 已失败 | 停止 |
| 3 | NOT_SHOW_RESULT 结果不展示 | 停止 |
| 4 | PURE_CODE 纯代码提交 | 停止 |

**答题状态筛选 `answerStatus`**：`1`=通过，`2`=未通过，`3`=未提交

**比赛状态 `status`**：`-1`=未开始，`0`=进行中，`1`=已结束

**比赛赛制 `type`**：`1`=OI，`2`=ACM，`3`=乐多(LeetCode)，`4`=IOI，`5`=IOI(OFS)，`6`=严格 IOI

**帖子类型 `posterType`**：`1`=讨论，`2`=题解，`3`=题目，`4`=奖项

**讨论分类 `categoryId`**：`1`=学术交流，`2`=日常灌水

## 覆盖率与验证状态

本仓库对前端 `api/` 目录做了全量抽取（不含 `admin/**` 管理后台），共 **309 个接口 / 295 条唯一路径**。每个接口在分页文档里都会标注验证状态：

| 标记 | 含义 |
| --- | --- |
| ✅ | 已实测通过（带上有效参数返回 `errCode=0`） |
| ⚠️ | 已确认路由存在，但实测时参数/权限不足（错误信息里能看到后端要求什么） |
| 🚫 | 实测被网关拒绝（`403 Access Denied`），当前不可用 |
| ✍️ | 写操作，**未实测**（避免在真实账号上产生副作用）；文档依据前端源码签名与类型 |
| ❔ | 无法验证（路径在源码里是变量拼接、需要验证码票据等） |

分布：`code-community` 126 · `code-community-forum` 47 · `code-community-growth` 39 · `code-community-actuator` 36 · `htoj-biz-gateway` 32 · 登录域 9 · `im` 4 · 相对路径 14 · `code-community-heart-beat` 1 · `code-community-websocket` 1。
