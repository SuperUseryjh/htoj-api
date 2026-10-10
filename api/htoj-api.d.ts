/**
 * HTOJ 接口公共类型定义（非官方）。
 *
 * ⚠️ 本文件是人工整理的非官方类型定义，与核桃编程官方无关。
 *
 * 来源：
 *   1. 逆向前端打包代码整理的接口清单（re/api-inventory.json）；
 *   2. 插件开发过程中沉淀的类型（src/api/types.ts）；
 *   3. re/samples/ 下 41 份真实抓包响应（字段是否存在、实际类型以实测为准）。
 *
 * 接口会变，字段仅供 TypeScript 参考，不保证与服务端始终一致。
 * 凡标注「未验证」处没有实测依据，不要据此写死逻辑；类型无法确定时用 unknown。
 *
 * 命名对照（与 src/api/types.ts 的差异，正文分页统一用本文件的名字）：
 *   AcStatus            -> JudgeAnswerStatus
 *   ContestItem         -> ContestVO
 *   ContestProblem      -> ContestProblemVO
 *   ContestScoreRow     -> ContestScoreboardRow
 *   TrainingChapterProblem -> TrainingProblem
 */

// ---------------------------------------------------------------------------
// 登录参数混淆（encodeCredential）—— 说明，不是可执行函数
// ---------------------------------------------------------------------------
//
// /login/** 下的登录接口，`phoneNumber` 与 `password` 都不能明文提交，
// 需要先做一层 XOR 混淆再提交：
//
//   1. 对明文逐字符遍历；
//   2. 每个字符的 charCode 与固定密钥 0x65 异或，得到新字符（另一端可逆运算还原）；
//   3. 异或后的字符串再做 base64 编码，作为最终的参数值。
//
// 还原实现见插件源码 `src/util/xor.ts` 的 `encodeCredential`
// （以及 re/ 中前端还原版 packages/core/utils/encode.ts），此处只做说明。

// ---------------------------------------------------------------------------
// 信封与分页
// ---------------------------------------------------------------------------

/**
 * 网关统一响应体。
 * `errCode === 0` 表示成功，业务数据在 `data`；否则 `data` 为 null，`errMsg` 为错误文案。
 * 注意 HTTP 状态码恒为 200，业务错误只能靠 `errCode` 判断。
 */
export interface ApiEnvelope<T> {
  /** 业务错误码，0 为成功 */
  errCode?: number;
  /** 业务数据；失败时为 null */
  data: T;
  /** 错误文案 */
  errMsg?: string;
  /** 部分老接口用小写字段名 */
  errcode?: number;
  /** 部分老接口用小写字段名 */
  errmsg?: string;
}

/**
 * 网关自身拦截错误（被网关拒绝时返回，非业务服务结构）。
 * 形如 `{ "code": 403, "message": "Gateway Error:Access Denied" }`。
 */
export interface GatewayError {
  code: number;
  message: string;
}

/**
 * 分页结构，列表接口统一返回。
 * 请求参数固定为 `currentPage`（从 1 开始）与 `limit`；
 * 但服务端对 `limit` 有上限，`size` 会跟随实际上限，不要假设 `records.length === limit`。
 */
export interface Pagination<T> {
  /** 当前页数据 */
  records: T[];
  /** 总条数 */
  total: number;
  /** 本页实际条数（可能小于请求的 limit） */
  size: number;
  /** 当前页码，从 1 开始 */
  current: number;
  /** 总页数 */
  pages: number;
  /** 排序项，实测为空数组 */
  orders: unknown[];
  /** 是否查询总数 */
  searchCount: boolean;
}

// ---------------------------------------------------------------------------
// 基础类型
// ---------------------------------------------------------------------------

/** 最常见的 `{ id, name }` 键值对（标签、语言、来源、字典项等） */
export interface IdName {
  id: number;
  name: string;
}

/** 题目难度，比 IdName 多一个展示用颜色 */
export interface Difficulty extends IdName {
  /** 十六进制颜色，如 `#FF5100` */
  color: string;
}

/** 题目标签 */
export interface Tag extends IdName {}

/** 用户/出题人精简信息（OwnerVo） */
export interface OwnerVo {
  /** 用户 uid（32 位十六进制字符串） */
  uid: string;
  /** 昵称 */
  nickname: string;
  /** 头像 URL */
  avatar: string;
  /** CCF 等级，实测常为 null */
  ccfLevel?: string | number | null;
  /** 认证图标 URL，实测常为 null 或空串 */
  authenticationIcon?: string | null;
  /** 数字 userId，实测常为 null */
  userId?: number | null;
}

/**
 * 判题状态。用于提交记录、测试点结果、提交详情等处的 `status`。
 *
 * `id` 枚举：0=Accepted 1=Presentation Error 2=Time Limit Exceeded 3=Memory Limit Exceeded
 * 4=Wrong Answer 5=Runtime Error 6=Output Limit Exceeded 7=Compile Error 8=System Error
 * 49=Cancelled -10=Judging（评测中）。
 */
export interface JudgeStatus extends IdName {
  /** 缩写，如 `AC`，常为 null */
  shortName: string | null;
  /** 中文名，常为 null */
  chineseName: string | null;
}

/**
 * 题目列表里的「答题状态」（字段名 `acStatus`）。
 * 结构与 {@link JudgeStatus} 相同，但语义是筛选枚举，不是单次评测结果：
 * 1=通过 2=未提交 3=未通过 4=已通过（`answerStatus` 筛选接口另有 1=通过 2=未通过 3=未提交）。
 */
export interface JudgeAnswerStatus extends IdName {
  /** 缩写，实测为 null */
  shortName: string | null;
  /** 中文名，实测为 null */
  chineseName: string | null;
}

// ---------------------------------------------------------------------------
// 用户
// ---------------------------------------------------------------------------

/**
 * 当前用户信息（`get-user-info` / 登录后拉取）。
 * 字段主要依据 src/api/types.ts 与 re/samples/user-info.json。
 */
export interface UserInfo {
  /** 用户 uid */
  uid: string;
  /** 数字 userId（JWT payload 里的 id） */
  userId: number;
  /** 国家区号，如 `86` */
  countryCode: string;
  /** 国家简写，如 `CN` */
  countryShort: string;
  /** 手机号（服务端可能做打码/变形） */
  phoneNumber: string;
  /** 是否已设置密码 */
  setPassword: boolean;
  /** 用户名 */
  username: string;
  /** 个性签名 */
  signature: string | null;
  /** 昵称 */
  nickname: string;
  /** 头像 URL */
  avatar: string;
  /** 是否管理员 */
  isAdmin: boolean;
  /** token；实测该响应里可能为 null，需回退用 localStorage 里的值 */
  token: string | null;
  /** 是否已有账号，实测可能为 null */
  hasAccount: boolean | null;
  /** 当前 zone；实测样本中出现过数组 `[]`，与文档的字符串写法不一致，未验证 */
  myZone?: string | string[] | null;
  /** 语言偏好；文档示例为字符串 `"cpp"`，实测样本为数字 `7`，未验证 */
  language?: string | number | null;
  /** 省 */
  province: string | null;
  /** 市 */
  city: string | null;
  /** 加入的小组列表（实测存在，等价于 GroupVO[]） */
  myGroup?: GroupVO[] | null;
  /** 当前用户权限点列表（实测存在） */
  permissions?: string[] | null;
}

// ---------------------------------------------------------------------------
// 题目
// ---------------------------------------------------------------------------

/** 题目列表项（`get-problem-list` / 题单章节内的题目等） */
export interface ProblemListItem {
  /** 内部数字 id，详情/提交都用它（不是展示编号 problemId） */
  pid: number;
  /** 展示编号，如 `P1000` / `LGP11576` */
  problemId: string;
  /** 标题 */
  title: string;
  /** 难度 */
  difficulty: Difficulty | null;
  /** 出题人 */
  owner: OwnerVo | null;
  /** 1=OJ 编程题 2=选择题 5=客观题 */
  type: number;
  /** 标签；题单/比赛场景实测可能为 null */
  tags: Tag[] | null;
  /** 当前用户的答题状态 */
  acStatus: JudgeAnswerStatus;
  /** 提交总数 */
  total: number;
  /** 通过总数 */
  ac: number;
  /** 章节内序号，实测可能为 null */
  rn: number | null;
}

/** 题目基础信息（题目详情里的 `problemBaseVO`） */
export interface ProblemBaseVO {
  /** 内部数字 id */
  id: number;
  /** 展示编号 */
  problemId: string;
  /** 标题 */
  title: string;
  /** 题面 Markdown 源文（含 LaTeX 与防作弊内嵌 HTML） */
  content: string;
  /** 难度 */
  difficulty: Difficulty | null;
  /** 题目来源 */
  source: IdName | null;
  /** 1=OJ 编程题 2=选择题 5=客观题 */
  type: number;
  /** 标签 */
  tags: Tag[];
  /** 是否展示题解 */
  showProblemSolution: boolean;
  /** 是否展示评测记录 */
  showJudgeRecord: boolean;
  /** zone，如 `cpp` */
  zone: string;
  /** 提交总数 */
  total: number;
  /** 通过总数 */
  ac: number;
  /** 题库 id：1=核桃题库 3=洛谷 4=核桃比赛 22=历年真题 100=Becoder */
  wid: number | null;
  /** 当前用户的历史作答状态，未登录/无记录为 null */
  historyResult: JudgeStatus | null;
}

/** OJ 编程题（type=1）专有信息（题目详情里的 `problemOjDetailVO`） */
export interface ProblemOjDetailVO {
  /** 可用语言 */
  problemLanguage: IdName[];
  /** IO 模式：id 1=标准IO 2=文件IO */
  ioMode: IdName;
  /** 样例用例，实测为 null，结构未确认 */
  sampleCaseList: unknown;
  /** 时间限制（毫秒） */
  timeLimit: number;
  /** 内存限制（MB） */
  memoryLimit: number;
  /** 栈限制（MB） */
  stackLimit: number;
  /** 判题模式，如 `{ value: "default", name: "传统题" }` */
  judgeMode: { value: string; name: string };
  /** 文件 IO 题要求读入的文件名（仅 ioMode.id === 2 时有意义） */
  ioReadFileName: string;
  /** 文件 IO 题要求输出的文件名（仅 ioMode.id === 2 时有意义） */
  ioWriteFileName: string;
  /** 时间限制上限，实测存在 */
  timeLimitMax?: number;
  /** 内存限制上限，实测存在 */
  memoryLimitMax?: number;
  /** 栈限制上限，实测存在 */
  stackLimitMax?: number;
}

/** 选择题的一个选项 */
export interface ChoiceOption {
  /** 提交时用它；多选按逗号拼接 */
  id: string;
  /** 选项文本 */
  label: string;
  /** 选项图片 URL */
  picUrl?: string | null;
}

/** 选择题（type=2）专有信息（题目详情里的 `problemChoiceDetailVO`） */
export interface ProblemChoiceDetailVO {
  /** 2=单选 4=多选 */
  choiceType: number;
  /** 选项列表 */
  options: ChoiceOption[];
}

/**
 * 客观题（type=5）专有信息（题目详情里的 `problemObjectiveDetailVO`）。
 *
 * 未验证：实测样本中该字段恒为 null，无法确认结构，故保持 unknown。
 * 题目本体写在 `problemBaseVO.content` 的 markdown 里（用 `{{ select(1) }}` / `{{ input(2) }}`
 * 之类占位符出题），逐题批改结果见 {@link SubmissionAnswer}。
 */
export type ProblemObjectiveDetailVO = unknown;

/** 客观题（type=5）逐题批改结果里的一小题 */
export interface SubmissionAnswer {
  /** 小题号，如 `"1"`，也可能是区间 `"1-3"` */
  id: string;
  /** 我的答案 */
  myAnswer: string | null;
  /** 正确答案（仅在允许看答案时下发） */
  answer: string | null;
  /** -1=未作答 1=正确 2=错误 3=已作答 */
  status: number;
  /** 该小题分值 */
  score: number | null;
  /** 我的得分 */
  myScore: number | null;
}

/** 「新手引导」相关配置（题目详情里的 `guideConfigVo`） */
export interface GuideConfigVo {
  guideProblemId: number;
  guideModelAnswer: string;
  guideBudge: string | null;
  guideTrainingId: number;
  guideBudgeId: number | null;
  guideTrainingBudgeId: number | null;
}

/** 题目详情（`get-problem-detail` 的 data） */
export interface ProblemDetail {
  /** 基础信息 */
  problemBaseVO: ProblemBaseVO;
  /** 选择题专有信息，非选择题为 null */
  problemChoiceDetailVO: ProblemChoiceDetailVO | null;
  /** 编程题专有信息，非编程题为 null */
  problemOjDetailVO: ProblemOjDetailVO | null;
  /** 客观题专有信息，实测恒为 null */
  problemObjectiveDetailVO: ProblemObjectiveDetailVO | null;
  /** 出题人 */
  ownerVo: OwnerVo | null;
  /** 是否新手引导题 */
  isGuide: boolean | null;
  /** 是否新手引导题单 */
  isGuideTraining: boolean | null;
  /** 标程（部分题目返回） */
  modelAnswer: string | null;
  /** 徽章图片 URL */
  budge: string | null;
  /** 徽章名 */
  budgeName: string | null;
  /** 点赞数 */
  likeCount: number;
  /** 点踩数 */
  dislikeCount: number;
  /** 小组 id */
  gid: number | null;
  /** 是否已是第一题 */
  noPrev: boolean;
  /** 是否已是最后一题 */
  noNext: boolean;
  /** 当前用户是否已通过 */
  accepted: boolean;
  /** 是否隐藏结果 */
  hideResult: boolean | null;
  /** 附加文件，实测为 null，结构未确认 */
  additionalFiles: unknown | null;
  /** 当前用户是否点过赞 */
  like: boolean;
  /** 当前用户是否点过踩 */
  dislike: boolean;
  /** 新手引导配置，实测存在 */
  guideConfigVo?: GuideConfigVo | null;
}

// ---------------------------------------------------------------------------
// 提交 / 评测
// ---------------------------------------------------------------------------

/** 提交记录（提交列表里的一条） */
export interface SubmissionRecord {
  /** 提交者 uid */
  uid: string;
  /** 提交 id */
  submitId: number;
  /** 提交者用户名 */
  username: string;
  /** 内部题目 id */
  pid: number;
  /** 展示编号 */
  displayPid: string;
  /** 标题 */
  title: string;
  /** 提交时间（毫秒时间戳） */
  submitTime: number;
  /** 判题状态 */
  status: JudgeStatus;
  /** 耗时（毫秒） */
  time: number | null;
  /** 内存（KB） */
  memory: number | null;
  /** 语言名，如 `"C++17 With O2"` */
  language: string;
  /** 得分 */
  score: number | null;
  /** 比赛 id，无则为 0 */
  cid: number;
  /** 题单 id，无则为 0 */
  tid: number;
  /** 小组 id，无则为 0 */
  gid: number;
  /** 1=HTOJ 2=核桃编程APP */
  source: number;
}

/** 单个测试点结果 */
export interface CaseResult {
  /** 测试点序号 */
  seq: number;
  /** 判题状态 */
  status: JudgeStatus;
  /** 耗时（毫秒） */
  time: number | null;
  /** 内存（KB） */
  memory: number | null;
  /** 得分 */
  score: number | null;
  /** 题目内部 id，实测存在 */
  pid?: number;
  /** 提交 id，实测存在 */
  submitId?: number;
  /** 所属测试点组号，实测存在 */
  groupNum?: number;
  /** 提示信息，实测存在（通常为空串） */
  message?: string;
  /** 该测试点所属用户 uid，实测为 null */
  uid?: string | null;
  /** 测试点 id，实测为 null */
  caseId?: number | null;
}

/** 测试点分组（对应一个 subtask） */
export interface CaseGroup {
  /** 分组得分 */
  groupScore: number;
  /** 分组内测试点 */
  caseResult: CaseResult[];
  /** 组号，实测存在 */
  groupNum?: number;
  /** 计分方式编码，实测存在 */
  calculateTypeCode?: number;
  /** 计分方式名，如 `SUM`，实测存在 */
  calculateTypeName?: string;
}

/** 提交详情（评测结果，`get-submission-detail` 的 data） */
export interface SubmissionDetail {
  /** 提交 id */
  submitId: number;
  /** 0=评测中，非 0 表示已结束（1=SUCCESS 2=FAILURE 3=NOT_SHOW_RESULT 4=PURE_CODE） */
  resultCode: number;
  /** 判题状态，部分响应不返回 */
  status?: JudgeStatus | null;
  /** 总分 */
  score: number | null;
  /** 耗时（毫秒） */
  time: number | null;
  /** 内存（KB） */
  memory: number | null;
  /** 语言名 */
  language: string;
  /** 题目类型：1=编程 2=选择 5=客观 */
  type: number;
  /** 是否首次通过 */
  firstAc: boolean;
  /** 用户代码 */
  userCode: string | null;
  /** 测试点分组结果 */
  caseGroups: CaseGroup[] | null;
  /** 附加测试点结果 */
  additionalCaseResults: CaseResult[] | null;
  /** 客观题（type=5）逐题作答结果 */
  answers: SubmissionAnswer[] | null;
  /** 是否显示 AI 题解按钮 */
  showAiButton: boolean | null;
  /** 是否可发布题解 */
  canCreateProblemSolution: boolean | null;
  /** 题单 id */
  tid: number | null;
  /** 题单内未完成题数 */
  unfinishedProblemNum: number | null;
  /** 是否隐藏结果 */
  hideResult: boolean | null;
  /** 徽章图 URL，实测存在 */
  budge?: string | null;
  /** 徽章名，实测存在 */
  budgeName?: string | null;
  /** 作弊标记，实测存在 */
  cheatTag?: unknown;
}

// ---------------------------------------------------------------------------
// 题单（训练）
// ---------------------------------------------------------------------------

/** 题单列表项 / 题单详情（`get-training-list` 的 record、`get-training-detail` 的 data） */
export interface TrainingItem {
  /** 题单 id */
  id: number;
  /** 题单编号，如 `00240` */
  trainingNo: string | null;
  /** 标题 */
  title: string;
  /** 副标题 */
  subtitle: string | null;
  /** 描述（Markdown） */
  description: string | null;
  /** 作者 uid */
  author: string | null;
  /** 出题人信息 */
  ownerVo: OwnerVo | null;
  /** 权限枚举 */
  auth: number;
  /** 题目总数 */
  problemCount: number;
  /** 已通过题数 */
  acCount: number | null;
  /** 已完成题数 */
  completeCount: number | null;
  /** 总提交/参与数 */
  totalCount: number | null;
  /** 修改时间（毫秒时间戳） */
  gmtModified: number | null;
  /** 下一题 pid */
  nextPid: number | null;
  /** zone */
  zone: string;
  /** 语言列表 */
  languages: string[] | null;
  /** 状态，实测可能为 null */
  status: number | null;
  /** 当前用户是否已参与（false 时题目列表接口会报「请先点击开始练习」） */
  isAttend: boolean | null;
  /** 印记数，实测可能为 null */
  imMark: number | null;
  /** 产品线 id，实测为 null 或空数组，结构未确认 */
  productLineIds: unknown | null;
}

/**
 * 题单详情。字段与 {@link TrainingItem} 一致（官方文档描述为「与列表 record 一致」），
 * 另含完成进度 `completeCount` / `totalCount`（已在 TrainingItem 中）。
 */
export interface TrainingDetail extends TrainingItem {}

/**
 * 题单里的一「章」。
 *
 * 实测 `get-training-problem-list` 返回的 `trainingChapterVO` 为 `{ id, tid, name, sort }`；
 * 注意：早期文档把它写作 `title`，与实测的 `name` 不一致，以 `name` 为准（未验证是否两者并存）。
 */
export interface TrainingChapter {
  /** 章节 id */
  id: number;
  /** 所属题单 id，实测存在 */
  tid?: number;
  /** 章节名 */
  name: string;
  /** 排序，实测为 null */
  sort: number | null;
}

/**
 * 题单题目列表的一条记录（`get-training-problem-list` 的 record）：
 * 「章节 + 该章节下的题目」的结构。
 */
export interface TrainingProblem {
  /** 所属章节信息 */
  trainingChapterVO: TrainingChapter | null;
  /** 该章节下的题目列表 */
  problemVOList: ProblemListItem[] | null;
  /** 下一题 pid */
  nextPid: number | null;
  /** 是否已参与 */
  isAttend: boolean | null;
}

// ---------------------------------------------------------------------------
// 比赛
// ---------------------------------------------------------------------------

/**
 * 比赛信息（`get-contest-list` 的 record、`get-contest-info` 的 data 共用）。
 *
 * 注意：`typeDesc` / `statusDesc` 是对象 `{ id, name }`，不是字符串，
 * 展示文案要取 `.name`；`type` / `status` 才是数字枚举。
 */
export interface ContestVO {
  /** 比赛 id */
  id: number;
  /** 作者/主办方 */
  author: string | null;
  /** 标题 */
  title: string;
  /** 赛制：1=OI 2=ACM 3=乐多 4=IOI 5=IOI(OFS) 6=严格 IOI */
  type: number;
  /** 赛制描述（对象） */
  typeDesc: IdName;
  /** IO 模式：1=标准IO 2=文件IO */
  ioType: number | null;
  /** IO 模式名，如 `标准IO` */
  ioTypeName?: string | null;
  /** 描述（Markdown） */
  description: string | null;
  /** 状态：-1=未开始 0=进行中 1=已结束 */
  status: number;
  /** 状态描述（对象） */
  statusDesc: IdName;
  /** 服务端当前时间戳（毫秒），列表接口实测为 null */
  now: number | null;
  /** 开始时间（毫秒时间戳） */
  startTime: number;
  /** 结束时间（毫秒时间戳） */
  endTime: number;
  /** 时长 */
  duration: number;
  /** 封榜相关，实测类型不稳定（数字或布尔或 null） */
  sealRank?: number | boolean | null;
  /** 是否允许打印 */
  openPrint: boolean | null;
  /** 是否公开榜单 */
  openRank: boolean;
  /** 参赛人数 */
  count: number;
  /** 提交数 */
  submitCount: number | null;
  /** 题目数 */
  problemCount: number;
  /** 当前用户是否已报名 */
  registered: boolean | null;
  /** 是否已开始 */
  started: boolean | null;
  /** 剩余时间 */
  remainTime: number | null;
  /** 比赛剩余时间 */
  contestRemainTime: number | null;
  /** 参赛者头像列表 */
  avatarList: unknown[];
  /** 是否需要密码 */
  needPassword: boolean | null;
  /** 赛事类型 */
  matchType?: number | null;
  /** 赛事类型描述（对象） */
  matchTypeDesc?: IdName | null;
  /** 归属小组 id */
  gid: number | null;
  /** zone */
  zone: string | null;
  /** 报名状态：0=校验未通过 1=待收集信息 2=校验通过无需报名 3=已报名 */
  registerState?: number | null;
  /** 出题人信息 */
  ownerVo?: OwnerVo | null;
  /** 是否置顶 */
  top?: boolean | null;
  /** 是否隐藏结果 */
  hideResult?: number | null;
  /** 是否隐藏榜单 */
  hideScoreboard?: number | null;
}

/** 比赛题目里当前用户对该题的状态，比别处多一个 `score` */
export interface ContestProblemStatus {
  id: number;
  name: string;
  /** 当前用户在该题的得分 */
  score: number | null;
}

/** 比赛题目（`get-contest-problem` 的 record） */
export interface ContestProblemVO {
  /** 内部 id */
  id: number;
  /** 题号序号（数字）；展示题号请用 indexTitle */
  displayId: number;
  /** 比赛 id */
  cid: number;
  /** 题目内部 id */
  pid: number;
  /** 标题（不带 A. 前缀） */
  displayTitle: string;
  /** 题号，如 `A` / `B` */
  indexTitle: string;
  /** 题目类型 */
  type: number;
  /** 颜色，实测为 null */
  color: string | null;
  /** 通过数，比赛题目常为 null（需判空） */
  ac: number | null;
  /** 提交总数，比赛题目常为 null（需判空） */
  total: number | null;
  /** 当前用户对该题的状态（对象，多一个 score） */
  status: ContestProblemStatus | null;
  /** 难度，比赛题目常为 null */
  difficulty: Difficulty | null;
  /** 难度描述，实测为 null，结构未确认 */
  difficultyDesc: unknown;
  /** 标签，实测为 null */
  tags: Tag[] | null;
  /** 展示编号 */
  problemId: string;
  /** 题号序号，实测为 null */
  rn: number | null;
}

/** 比赛榜单里某一行在某一题上的成绩 */
export interface ContestScoreboardProblemCell {
  /** 内部题目 id */
  pid: number;
  /** 题目顺序号（对应 indexTitle 的字母序号） */
  cpid: number;
  /** 题号，如 `A` */
  title: string;
  /** 得分 */
  score: number;
  /** 封榜前得分，实测为 null */
  afterScore: number | null;
  /** 该题某次提交 id */
  submitId: number;
  /** 是否通过 */
  pass: boolean;
  /** 提交次数 */
  retry: number;
  /** 是否首次提交 */
  firstSubmit: boolean | null;
  /** 用时 */
  time: number;
  /** 罚时 */
  penaltyTime: number;
  /** 最大用时，实测可能为 null */
  maxTime: number | null;
  /** 封榜相关，实测为 null */
  sort?: number | null;
  /** 封榜相关，实测为 0 */
  afterSubmitId?: number;
  /** 封榜相关，实测为 null */
  afterPass?: boolean | null;
}

/** 比赛成绩表里的一行（`get-contest-scoreboard` 的 record） */
export interface ContestScoreboardRow {
  /** 比赛 id */
  id: number;
  /** 赛制 */
  type: number;
  /** 用户信息 */
  ownerVo: OwnerVo | null;
  /** 用户 uid */
  uid: string;
  /** 昵称 */
  nickname: string;
  /** 真实姓名，实测为 null */
  realName: string | null;
  /** 是否展示真实姓名 */
  showRealName: boolean;
  /** 头像，实测为 null */
  avatar: string | null;
  /** 特殊标记，实测为 null */
  specialMark: unknown;
  /** 排名 */
  rank: number;
  /** 总分 */
  totalScore: number;
  /** 封榜前总分，实测为 null */
  afterTotalScore: number | null;
  /** 总用时 */
  totalTime: number | null;
  /** 各题成绩 */
  problemScoreList: ContestScoreboardProblemCell[];
  /** 赛制描述（对象） */
  typeDesc: IdName | null;
  /** 作弊标记，实测为 null */
  cheatTag: unknown;
  /** 代码互看设置 */
  userShareCode: number;
}

/**
 * 比赛 / 小组公告。
 *
 * 未验证：实测样本（contest-announcement.json、组公告接口）中列表均为空，
 * 字段结构未经确认，故不定义具体字段，保留为开放对象。
 */
export type Announcement = Record<string, unknown>;

// ---------------------------------------------------------------------------
// 小组
// ---------------------------------------------------------------------------

/**
 * 小组成员视角的小组信息（源自 `get-user-info` 的 `myGroup[]`，
 * 与 `group/get`、`get-group-home` 返回的 `GroupVO` / `GroupInfoVO` 应属同一族）。
 */
export interface GroupVO {
  /** 小组 id */
  gid: number;
  /** 小组名 */
  name: string;
  /** 简介 */
  description: string;
  /** zone */
  zone: string;
  /** 组长 uid */
  uid: string;
  /** 当前用户是否为组长 */
  isOwner: boolean;
  /** 角色，实测是字符串（如 `"[308]"` / `"[]"`）或 null */
  roles: string | null;
  /** 权限点列表，实测可能为 null */
  permissions: string[] | null;
}

// ---------------------------------------------------------------------------
// 讨论区
// ---------------------------------------------------------------------------

/**
 * 帖子（讨论区列表 record / 详情 data 共用）。
 * 列表接口字段较少，详情接口会多出若干字段，故统一标为可选。
 */
export interface PosterVO {
  /** 帖子 id */
  id: number;
  /** 标题 */
  posterName: string;
  /** 正文（Markdown） */
  posterContent: string;
  /** 作者 uid */
  uid: string;
  /** 作者昵称 */
  nickname: string;
  /** 作者头像 */
  avatar: string;
  /** 是否金牌教师 */
  goldenTeacher: boolean;
  /** 关联题目 id，无则 0 */
  problemId: number;
  /** 浏览数，实测为 null */
  viewCount: number | null;
  /** 点赞数 */
  thumbCount: number;
  /** 回复数 */
  replyCount: number;
  /** 是否本人发布 */
  isMine: boolean;
  /** 分类，实测为 null */
  posterCategory: unknown;
  /** 是否置顶 */
  top: boolean;
  /** zone */
  zone: string;
  /** 是否已点赞 */
  thumbed: boolean | null;
  /** 发布时间（毫秒时间戳） */
  publishTime: number;
  /** 更新时间（毫秒时间戳），实测为 null */
  updateTime: number | null;
  /** 发布地区 */
  publishArea: string;
  /** 认证图标，实测为 null */
  authenticationIcon: string | null;
  /** CCF 等级，实测为 null */
  ccfLevel: number | null;
  /** 备注名，如 `管理员` */
  remarkName: string | null;
  /** 帖子类型：1=讨论 2=题解 3=题目 4=奖项 */
  posterType: number;
  /** 状态 */
  status: number;
  /** 状态名，如 `公开` */
  statusName: string;
  /** 标签 */
  label: string | null;
  /** 审核拒因 */
  refuseReason: string | null;
  /** AI 审核建议 */
  aiAuditSuggestion: unknown;
  /** 申诉状态 */
  appealStatus: unknown;
  /** 申诉理由 */
  appealReason: string | null;
  /** 申诉时间 */
  appealTime: number | null;
  /** 申诉驳回理由 */
  appealRejectReason: string | null;
  /** 驳回类型 */
  rejectType: unknown;
  /** 驳回理由 */
  rejectReason: string | null;
  /** 申诉次数 */
  appealCount: number | null;
  /** 关联父题解 id（详情接口返回） */
  parentSolutionId?: number | null;
  /** 关联题目对象（详情接口返回） */
  problem?: unknown;
  /** 是否同步帖子（详情接口返回） */
  syncPoster?: number | null;
  /** 是否允许评论（详情接口返回） */
  allowComment?: number;
  /** 来源（详情接口返回） */
  source?: number;
  /** 是否已编辑（详情接口返回） */
  updated?: boolean;
}

/** 帖子回复（`poster/replyList` 的 record，含子回复 `replyVoList`） */
export interface PosterReplyVO {
  /** 回复 id */
  replyId: number;
  /** 回复内容 */
  replyContent: string;
  /** 回复者 uid */
  uid: string;
  /** 回复者昵称 */
  nickname: string;
  /** 回复者头像 */
  avatar: string;
  /** CCF 等级，实测为 null */
  ccfLevel: number | null;
  /** 是否金牌教师 */
  goldenTeacher: boolean;
  /** 认证图标，实测为 null */
  authenticationIcon: string | null;
  /** 备注名 */
  remarkName: string | null;
  /** 点赞数 */
  thumbCount: number;
  /** 回复数 */
  replyCount: number;
  /** 地区 */
  area: string;
  /** 是否已点赞 */
  thumbed: boolean;
  /** 创建时间（毫秒时间戳） */
  createTime: number;
  /** @ 的目标，实测为 null */
  to: unknown;
  /** @ 的目标 uid，实测为 null */
  toUid: string | null;
  /** 被回复的回复 id，无则 0 */
  toReplyId: number;
  /** 是否本人回复 */
  isMine: boolean;
  /** 是否已删除 */
  deleted: boolean;
  /** 是否隐藏，实测为 null */
  hidden: boolean | null;
  /** 所属帖子作者 uid */
  posterUid: string;
  /** 子回复列表 */
  replyVoList: PosterReplyVO[];
  /** 所属帖子状态 */
  posterStatus: number;
  /** 是否置顶，实测为 0 */
  top: number;
  /** 是否为顶层回复 */
  rootFlag: boolean;
}
