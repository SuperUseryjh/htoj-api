import { defineConfig } from 'vitepress'

const REPO = 'https://github.com/SuperUseryjh/htoj-api'

/**
 * VitePress 会把 markdown 编译成 Vue 模板，正文里字面出现的 `{{ ... }}` 会被当成插值，
 * 渲染时直接报 `_ctx.select is not a function`。
 *
 * 文档里要展示客观题的占位符写法（`{{ select(n) }}` / `{{ input(n) }}`），
 * 所以把文本与行内代码里的 `{{` 转成 HTML 实体，让 Vue 不再解析它。
 * 围栏代码块不用管：VitePress 会给 `<pre>` 自动加 `v-pre`。
 */
function escapeVueInterpolation(md: any) {
  const escape = (s: string) => s.replace(/\{\{/g, '&#123;&#123;')
  const rules = md.renderer.rules

  const text = rules.text
  rules.text = (tokens: any[], idx: number, ...rest: any[]) =>
    escape(text ? text(tokens, idx, ...rest) : md.utils.escapeHtml(tokens[idx].content))

  const codeInline = rules.code_inline
  rules.code_inline = (tokens: any[], idx: number, ...rest: any[]) =>
    escape(codeInline(tokens, idx, ...rest))
}

/**
 * 正文里 30 多处 `[htoj-api.d.ts](./htoj-api.d.ts)` 指向的是原始文件，
 * 浏览器直接访问 .d.ts 会变成下载而不是显示。
 *
 * 这里统一改到构建时生成的渲染页 /api/types 上（原文仍可从该页下载）。
 */
function rewriteDtsLinks(md: any) {
  const original =
    md.renderer.rules.link_open ??
    ((tokens: any[], idx: number, options: any, _env: any, self: any) =>
      self.renderToken(tokens, idx, options))

  md.renderer.rules.link_open = (tokens: any[], idx: number, options: any, env: any, self: any) => {
    const href = tokens[idx].attrGet('href')
    // 只改进正文里的相对链接；类型页上指向 /api/htoj-api.d.ts 的「直接下载」保持原样
    if (typeof href === 'string' && !href.startsWith('/') && href.endsWith('htoj-api.d.ts')) {
      tokens[idx].attrSet('href', '/api/types')
    }
    return original(tokens, idx, options, env, self)
  }
}

/**
 * 站点根是 docs/（不是 docs/api/），这样文档里原有的相对链接
 * （./auth.md、./problems.md）无需改写就能用。
 *
 * docs/ 之外的文件（re/samples/*.json、re/api-inventory.json）正文里也引用了，
 * 由 .vitepress/prepare.mjs 复制到 docs/public/re/ 下；
 * 浏览器里 /api/auth 的 ../../re/samples/x.json 正好命中 /re/samples/x.json。
 */
export default defineConfig({
  lang: 'zh-CN',
  title: 'HTOJ API',
  description: 'HTOJ 非官方接口文档：网关约定、鉴权、分页与全部接口清单，逐条实测。',
  cleanUrls: true,
  lastUpdated: true,
  // docs/ 里除了 API 文档，还放着一份给核桃 OJ 团队的问题反馈（尚未修复前不能公开，
  // 里面含进行中比赛的原始响应与账号标识），绝不能当成页面发布出去。
  // ⚠️ 模式必须写成 `**/xxx`（与 VitePress 文档里 `**/README.md` 一致）：
  // 写成 `bug-report-*.md` 是**不生效**的，实测该文件曾被发布成 /bug-report-contest 页面。
  srcExclude: ['**/bug-report*.md'],
  ignoreDeadLinks: [
    // 正文把这些文件当「证据」引用，指向仓库而不是站点
    /re\/samples\//,
    /re\/api-(inventory|probe)\.json$/,
    /htoj-api\.d\.ts$/,
  ],
  head: [['meta', { name: 'theme-color', content: '#3451b2' }]],
  markdown: {
    config: (md: any) => {
      escapeVueInterpolation(md)
      rewriteDtsLinks(md)
    },
  },
  themeConfig: {
    nav: [
      { text: '总览', link: '/api/' },
      { text: '类型定义', link: '/api/types' },
      { text: 'GitHub', link: REPO },
    ],

    sidebar: [
      {
        text: 'HTOJ API',
        items: [
          { text: '总览与全局约定', link: '/api/' },
          { text: '登录与鉴权', link: '/api/auth' },
          { text: '题目与提交', link: '/api/problems' },
          { text: '题单（训练）', link: '/api/trainings' },
          { text: '比赛', link: '/api/contests' },
          { text: '小组', link: '/api/groups' },
          { text: '用户与消息', link: '/api/users' },
          { text: '讨论区与题解', link: '/api/community' },
          { text: '挑战与考试', link: '/api/challenges' },
          { text: '成长体系', link: '/api/growth' },
          { text: '星际对战', link: '/api/battle' },
          { text: '字典与首页', link: '/api/misc' },
          { text: '文件上传与下载', link: '/api/uploads' },
          { text: '类型定义 htoj-api.d.ts', link: '/api/types' },
        ],
      },
    ],

    outline: { level: [2, 3], label: '本页目录' },
    docFooter: { prev: '上一篇', next: '下一篇' },
    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式',
    sidebarMenuLabel: '目录',
    returnToTopLabel: '回到顶部',
    lastUpdatedText: '最后更新',
    externalLinkIcon: true,

    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: '搜索文档', buttonAriaLabel: '搜索文档' },
          modal: {
            noResultsText: '没有找到相关内容',
            resetButtonTitle: '清除查询条件',
            displayDetails: '显示详情',
            footer: { selectText: '选择', navigateText: '切换', closeText: '关闭' },
          },
        },
      },
    },
  },
})
