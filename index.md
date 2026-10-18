---
layout: home

hero:
  name: HTOJ API
  text: 非官方接口文档
  tagline: 网关约定 · 鉴权与续期 · 分页 · 309 个接口逐条实测
  actions:
    - theme: brand
      text: 开始阅读
      link: /api/
    - theme: alt
      text: 仓库源码
      link: https://github.com/SuperUseryjh/htoj-api

features:
  - title: 按域拆分
    details: 登录、题目、题单、比赛、小组、用户、讨论区、挑战、成长体系、对战、字典、上传，共 13 个分页。
  - title: 逐条实测
    details: 每个接口都标了验证状态——实测可用 / 路由存在但参数不足 / 网关 403 / 写操作未实测 / 无法验证。
  - title: 坑点收录
    details: 必填参数的 Java 校验原文、limit 上限、被 gid 过滤掉的提交记录、GET 但会改状态的接口等，全部记在正文里。
  - title: 有据可查
    details: 字段依据 41 份真实抓包响应与反编译源码；正文里引用的样例 JSON 都能直接下载对照。
---

## 这是什么

把 [HTOJ](https://htoj.com.cn) 前端逆向还原后，用 TypeScript 编译器 API 抽出全部接口清单、对只读接口做了真实实测，整理出的非官方 API 文档。

> 与核桃编程官方无关。接口随时可能变化，尤其是标注「未实测」的部分。
> 
> 文档最后更新日期：2026-10-16 22:07 | UTC +8
> 
> 对应 HTOJ 快照版本（以最后一个更新的 chunk 为准）： 2026-10-15 16:42:39 | UTC +8
> 
> 文档由 DeepSeek V4.1 Flash 整理，可能出现错误，欢迎纠正

从 [总览与全局约定](/api/) 开始读：那里有网关与地址、必带请求头、统一响应格式、鉴权与 token 续期、分页、通用枚举，以及全部 13 个分页的目录。
