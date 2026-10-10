// 样例数据脱敏。
//
// key 一律按大小写不敏感匹配——接口里 username / userName / nickName 都出现过。
import { createHash } from 'node:crypto'

const hash = (value, len = 32) => createHash('sha256').update(String(value)).digest('hex').slice(0, len)
const fakeUid = (value) => hash(value)
const fakeName = (value) => `用户${hash(value, 6)}`
const fakeNumber = (value) => 1000000 + (parseInt(hash(value, 8), 16) % 9000000)

const placeholderUrl = (value) => {
  const ext = /\.(png|jpe?g|gif|webp|svg|bmp|ico)(\?|#|$)/i.exec(String(value))?.[1] ?? 'png'
  return `https://example.invalid/${hash(value, 12)}.${ext.toLowerCase()}`
}

/** 32 位十六进制字符串（uid） */
const UID_KEYS = 'uid|posterUid|toUid'
/** 数字型身份 id */
const UID_NUMBER_KEYS = 'userId|accountId|schoolId'
/** 人名 / 昵称类字段 */
const NAME_KEYS = 'username|nickname|realName|rankShowName|remarkName|author|modifiedUser|to'
const PHONE_KEYS = 'phoneNumber|userMobile'
const QQ_KEYS = 'qq'
const TOKEN_KEYS = 'token'
/** 用户自述 / 用户产出的正文，整段换掉 */
const BODY_KEYS = 'signature|posterContent|replyContent|userCode'

/** 位置类字段 → 固定占位值（key 用小写比较） */
const LOCATION_KEYS = new Map([
  ['province', '某省'],
  ['city', '某市'],
  ['area', '某地'],
  ['publisharea', '某地'],
  ['school', '某某中学'],
])

/** 图片 / 链接类字段（头像、徽章、背景图、二维码等） */
const MEDIA_KEY_PATTERN = /(avatar|icon|image|pic|cover|banner|background|qr|url)/i

const keyRe = (alternation) => new RegExp(`^(?:${alternation})$`, 'i')
const UID_KEY_RE = keyRe(UID_KEYS)
const UID_NUMBER_KEY_RE = keyRe(UID_NUMBER_KEYS)
const NAME_KEY_RE = keyRe(NAME_KEYS)
const PHONE_KEY_RE = keyRe(PHONE_KEYS)
const QQ_KEY_RE = keyRe(QQ_KEYS)
const TOKEN_KEY_RE = keyRe(TOKEN_KEYS)
const BODY_KEY_RE = keyRe(BODY_KEYS)

const HEX32 = /^[0-9a-f]{32}$/i
const HEX32_ANY = /[0-9a-f]{32}/gi
const PHONE_LIKE = /(?<!\d)1[3-9]\d{9}(?!\d)/g

/**
 * 兜底：样例里有些字段是「已截断的 JSON 字符串」（api-probe.json 的 sample、
 * probe 结果里的内联样本），结构化规则进不去，这里按文本再扫一遍。
 *
 * 两处与结构化规则不同：
 *   1. 尾引号故意不写进正则——被截断的样本常常没有结尾引号；有结尾引号时
 *      那一个引号会原样留在替换结果后面，正好收口。
 *   2. 这里连 `description` 一起抹掉：用户资料的简介（签名）就是这个字段名，
 *      而在截断片段里没法区分它是「比赛简介」还是「个人签名」，只能一律换掉。
 */
function scrubString(text) {
  return String(text)
    .replace(HEX32_ANY, (m) => fakeUid(m))
    .replace(PHONE_LIKE, '13800000000')
    .replace(new RegExp(`"(${UID_NUMBER_KEYS})"\\s*:\\s*(\\d+)`, 'gi'),
      (_m, key, value) => `"${key}":${fakeNumber(value)}`)
    .replace(new RegExp(`"(${NAME_KEYS})"\\s*:\\s*"([^"\\\\]*)`, 'gi'),
      (_m, key, value) => `"${key}":"${fakeName(value)}"`)
    .replace(new RegExp(`"(${BODY_KEYS}|description)"\\s*:\\s*"[^"\\\\]*(?:\\\\.[^"\\\\]*)*`, 'gi'),
      (_m, key) => `"${key}":"（已脱敏）"`)
    .replace(new RegExp(`"(${PHONE_KEYS})"\\s*:\\s*"[^"\\\\]*`, 'gi'), '"$1":"13800000000"')
    .replace(new RegExp(`"(${QQ_KEYS})"\\s*:\\s*"[^"\\\\]*`, 'gi'), '"$1":"100000000"')
    .replace(new RegExp(`"(${TOKEN_KEYS})"\\s*:\\s*"[^"\\\\]*`, 'gi'), '"$1":null')
    .replace(/"avatar"\s*:\s*"(https?:[^"\\]*)/gi, (_m, url) => `"avatar":"${placeholderUrl(url)}`)
    .replace(/"school"\s*:\s*"[^"\\]*/gi, '"school":"某某中学"')
    .replace(/"province"\s*:\s*"[^"\\]*/gi, '"province":"某省"')
    .replace(/"city"\s*:\s*"[^"\\]*/gi, '"city":"某市"')
    .replace(/"(area|publishArea)"\s*:\s*"[^"\\]*/gi, '"$1":"某地"')
}

function sanitizeValue(key, value) {
  if (value === null || value === undefined) return value

  if (Array.isArray(value)) {
    if (MEDIA_KEY_PATTERN.test(key) && value.every((item) => typeof item === 'string')) {
      return value.map(placeholderUrl)
    }
    return value.map((item) => sanitizeValue(key, item))
  }

  if (typeof value === 'object') {
    const result = {}
    for (const [k, v] of Object.entries(value)) result[k] = sanitizeValue(k, v)
    return result
  }

  if (typeof value === 'number') {
    return UID_NUMBER_KEY_RE.test(key) ? fakeNumber(value) : value
  }

  if (typeof value !== 'string') return value

  if (TOKEN_KEY_RE.test(key)) return null
  if (PHONE_KEY_RE.test(key)) return '13800000000'
  if (QQ_KEY_RE.test(key)) return '100000000'
  if (LOCATION_KEYS.has(key.toLowerCase())) return LOCATION_KEYS.get(key.toLowerCase())
  if (UID_KEY_RE.test(key) || NAME_KEY_RE.test(key)) return HEX32.test(value) ? fakeUid(value) : fakeName(value)
  if (BODY_KEY_RE.test(key)) {
    if (/usercode/i.test(key)) return '// 代码已脱敏'
    return /signature/i.test(key) ? '（签名已脱敏）' : '（正文已脱敏）'
  }
  if (MEDIA_KEY_PATTERN.test(key) && /^https?:\/\//i.test(value)) return placeholderUrl(value)

  return scrubString(value)
}

/** 解析 json 文本 → 脱敏 → 重新序列化（缩进保持 2 空格） */
export function desensitizeJson(text) {
  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    // 不是合法 JSON 就只做文本层面的替换
    return scrubString(text)
  }
  return `${JSON.stringify(sanitizeValue('', parsed), null, 2)}\n`
}
