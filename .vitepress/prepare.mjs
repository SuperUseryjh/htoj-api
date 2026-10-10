// 构建前把文档正文引用到、但不在站点范围内的文件准备好，并做脱敏。
//
// 1) re/samples/*.json、re/api-inventory.json、re/api-probe.json 复制到 docs/public/re/。
//    正文里这些链接是按「仓库相对路径」写的（例如 auth.md 中的 ../../re/samples/user-info.json），
//    站点上页面 URL 是 /api/auth，浏览器解析相对路径后正好是 /re/samples/user-info.json，
//    所以只要把文件放到 public/re/ 下，链接无需改写即可取到原文。
//    **这些样例含真实个人信息，一律经 desensitize.mjs 脱敏后再落盘。**
//
// 2) docs/api/htoj-api.d.ts 原始文件放进 public/api/ 供下载；同时生成渲染好的
//    docs/api/types.md 当阅读页（浏览器直接打开 .d.ts 会变成下载）。
import { access, cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { constants } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { desensitizeJson } from './desensitize.mjs'

const here = path.dirname(fileURLToPath(import.meta.url)) // docs/.vitepress
const docsDir = path.resolve(here, '..') // docs
const repoRoot = path.resolve(docsDir, '..') // 仓库根
const reDir = path.join(repoRoot, 're')
const pubRe = path.join(docsDir, 'public', 're')

const log = (msg) => console.log(`[prepare] ${msg}`)

const exists = async (p) => {
  try {
    await access(p, constants.F_OK)
    return true
  } catch {
    return false
  }
}

/** 读 → 脱敏 → 写到目标路径 */
async function writeSanitized(from, to) {
  const text = await readFile(from, 'utf8')
  await mkdir(path.dirname(to), { recursive: true })
  await writeFile(to, desensitizeJson(text))
  log(`脱敏 ${path.relative(repoRoot, from)} -> ${path.relative(repoRoot, to)}`)
}

// --- 1. 样例与清单（脱敏） ---------------------------------------------------

await rm(pubRe, { recursive: true, force: true })

const samplesDir = path.join(reDir, 'samples')
if (await exists(samplesDir)) {
  const files = (await readdir(samplesDir)).filter((f) => f.endsWith('.json'))
  for (const file of files) {
    await writeSanitized(path.join(samplesDir, file), path.join(pubRe, 'samples', file))
  }
  log(`样例 ${files.length} 份已脱敏`)
} else {
  console.warn('[prepare] 跳过：re/samples 不存在')
}

for (const name of ['api-inventory.json', 'api-probe.json']) {
  const from = path.join(reDir, name)
  if (await exists(from)) await writeSanitized(from, path.join(pubRe, name))
  else console.warn(`[prepare] 跳过：re/${name} 不存在`)
}

// --- 2. 类型定义（原文下载 + 渲染页） ----------------------------------------

const dtsSource = path.join(docsDir, 'api', 'htoj-api.d.ts')
const dtsDownload = path.join(docsDir, 'public', 'api', 'htoj-api.d.ts')
const dtsPage = path.join(docsDir, 'api', 'types.md')

if (await exists(dtsSource)) {
  await mkdir(path.dirname(dtsDownload), { recursive: true })
  await rm(dtsDownload, { force: true })
  await cp(dtsSource, dtsDownload)
  log(`${path.relative(repoRoot, dtsSource)} -> ${path.relative(repoRoot, dtsDownload)}`)

  const dts = await readFile(dtsSource, 'utf8')
  const page = [
    '# 类型定义（htoj-api.d.ts）',
    '',
    '正文各分页引用的类型名都集中定义在下面这个文件里；原文可从 ',
    '[htoj-api.d.ts](/api/htoj-api.d.ts) 直接下载。',
    '',
    '> 本页由 `docs/.vitepress/prepare.mjs` 在构建前生成，不要直接编辑本页——',
    '> 要改类型请改 `docs/api/htoj-api.d.ts`。',
    '',
    '```ts',
    dts.trimEnd(),
    '```',
    '',
  ].join('\n')
  await writeFile(dtsPage, page)
  log(`${path.relative(repoRoot, dtsSource)} -> ${path.relative(repoRoot, dtsPage)}`)
} else {
  console.warn(`[prepare] 跳过：${path.relative(repoRoot, dtsSource)} 不存在`)
}
