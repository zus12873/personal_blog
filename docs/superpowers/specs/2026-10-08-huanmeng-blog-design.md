# 幻梦小站（Huanmeng's Blog）定制设计

- 日期：2026-10-08
- 仓库：`github.com/zus12873/Firefly`（fork 自 `CuteLeaf/Firefly` 6.16.8），工作分支 `huanmeng-theme`
- 线上域名：`huanmeng.si`（注册商 Hostinger，DNS 托管在 Cloudflare zone `<zone-id>`）

## 1. 目标与已确认的决定

做一个风格属于自己、可以长期维护的个人博客，兼顾两种定位：「技术 + 生活/二次元」的博客，以及「个人主页/作品集」。

| 决定 | 结论 | 来源 |
|---|---|---|
| 主题框架 | Firefly，fork 到自己的仓库 | 用户 |
| 视觉方向 | B · 星夜毛玻璃：保留 Firefly 骨架（导航 + 横幅 + 左侧个人卡片 + 毛玻璃卡片流） | 用户在预览页选择 |
| 亮/暗 | 双主题。亮色用头像配色和紫蓝渐变星空，暗色用壁纸《Lady Maria》（JLIEN-）；默认跟随系统 | 用户 |
| 模块 | 项目展示、动态、相册、番剧（B 站）、友链、留言板/评论 | 用户 |
| 改造方式 | 1+2 混合：默认写在独立定制层；覆盖实现太别扭时直接改源码，并记录到 `CUSTOMIZATIONS.md` | 用户 |
| 评论 | 自部署 Twikoo，采用官方 Cloudflare 版 `twikoojs/twikoo-cloudflare`（Workers + D1） | 用户选自部署，Workers + D1 是推荐方案 |
| 其余细节 | 一律按推荐方案执行 | 用户 /goal 指令 |

## 2. 视觉系统

### 2.1 配色 token

在 `src/styles/huanmeng/theme.css` 中用显式颜色覆盖 Firefly 的变量（`--primary`、`--page-bg`、`--card-bg*`、`--btn-*`、`--deep-text`、`--link-*`、`--selection-bg`、`--toc-*` 等）。
`siteConfig.themeColor.hue` 固定为 `265`，用来兜底那些仍按色相计算的零散样式；设置面板里的色相滑块隐藏。

| 用途 | 亮色 | 暗色 |
|---|---|---|
| 页面底色 `--page-bg` | 纸白 `#F6F6F7` | 墨绿黑 `#0C1112` |
| 主色 `--primary`（链接、按钮、当前导航） | 星屑蓝 `#4A6CD5` | 薄荷 `#B9EAE3` |
| 卡片 `--card-bg-transparent` | `rgb(255 255 255 / 0.70)` + 毛玻璃 | `rgb(16 22 24 / 0.58)` + 毛玻璃 |
| 标签、悬停背景 `--btn-regular-bg` | 薰衣草 `#DAD4EB` | `rgb(185 234 227 / 0.14)` |
| 描边、头像外圈 | 雾蓝 `#A5BFD7` | `rgb(185 234 227 / 0.55)` |
| 正文 / 次要文字 | `#444048` / `#8D909E` | `#E6ECEC` / `#9FBABC` |
| 点缀 | 腮红 `#EECCCA`（置顶标签） | 血红 `#8E2424`（只用于置顶标签和打字机光标） |

文字与背景的对比度：亮色主色 `#4A6CD5` 在白底上约 4.9:1，暗色主色 `#B9EAE3` 在 `#0C1112` 上大于 12:1，都满足 WCAG AA。

### 2.2 背景、横幅与特效

- 壁纸模式统一用 `fullscreen`，亮暗两种主题结构一致，只替换背景层；关闭访客切换壁纸模式的开关。
- **亮色**：用纯 CSS 遮住壁纸图片层（`html:not(.dark) #banner-images-container { opacity: 0 }`），在 `#wallpaper-wrapper` 上画紫蓝渐变星空。不修改 Firefly 组件。
- **暗色**：显示壁纸，图片由原图 2388×3397 预处理生成：
  - 电脑版 `wallpaper-maria-desktop.avif`，2560×1440：人物贴右侧，左侧羽化过渡成 `#0C1112`
  - 手机版 `wallpaper-maria-mobile.avif`，宽 1080 的竖图
  - 处理脚本 `scripts/huanmeng/make-wallpapers.mjs`（用 sharp），原图不入库
- **星屑**：两层 SVG 星点，分别用不同的闪烁动画（各自的 `animation-delay`）；亮色用白色和蓝色，暗色用薄荷色。系统开启「减少动态效果」（`prefers-reduced-motion: reduce`）时静止。樱花特效关闭。
- **横幅文字**：主标题 `Huanmeng's Blog`，打字机轮播以下 4 句；标题下只放 GitHub 图标链接。
  1. 写代码，也写生活。
  2. 白天调 API，晚上补番。
  3. 把服务藏进隧道，把碎碎念留在这里。
  4. 狩人啊，愿你在醒来的世界找到自己的价值。
- 打字机光标：亮色用星屑蓝，暗色用血红。

### 2.3 头像、图标、字体

- 头像：原图 1080×1080 的 PNG，以脸部为中心裁成正方形，输出 512px AVIF 到 `src/assets/images/huanmeng/avatar.avif`。
- Favicon：同一张脸部裁剪，生成 32、180、512 三种 PNG，放在 `public/favicon/huanmeng-*.png`。
- 字体：沿用 Firefly 自带的 Noto Sans SC，不额外增加字体。

## 3. 页面与模块

### 3.1 站点信息

| 字段 | 值 |
|---|---|
| `title`（导航 logo、浏览器标签） | 幻梦小站 |
| 横幅主标题 | Huanmeng's Blog |
| `subtitle` | 写代码，也写生活 |
| `site_url` | `https://huanmeng.si` |
| 昵称 | 幻梦 |
| 侧边栏简介 | 写代码，折腾服务器，看番，偶尔在亚楠迷路。 |
| 社交链接 | 只放 GitHub：`https://github.com/zus12873` |
| 语言 | zh_CN |

### 3.2 导航栏

`首页 · 文章▾(归档/分类/标签/系列) · 项目 · 生活▾(动态/相册/番剧) · 社交▾(友链/留言板) · 关于 · GitHub 图标`

- 关闭的页面：书签导航、赞助、Bangumi、VNDB、MAL
- 关闭的组件：看板娘（Live2D/Spine）、音乐播放器、樱花
- 删除指向 Firefly 自身的外链
- 「相册」：在 `src/content` 里有第一组照片之前，不出现在导航栏（页面开关保持关闭）
- 「番剧」：需要用户的 B 站 UID，在拿到之前页面开关保持关闭，导航栏不出现。拿到后改两处：`siteConfig.bilibili.uid` 和页面开关

### 3.3 首页

横幅 → 精选项目行 → 文章列表。

精选项目行是新组件 `src/components/huanmeng/FeaturedProjects.astro`。

- 精选名单写在 `src/config/huanmeng.ts` 的 `featuredProjects`（项目 id 数组）里
- 不修改 projects 集合的 schema，以后合并上游时少一处冲突
- 组件按名单顺序取最多 3 个项目，复用 Firefly 的 `ProjectCard` 渲染
- 名单里不存在的 id 或草稿项目会被跳过
- 名单为空时整行不渲染

### 3.4 侧边栏

只保留左侧，从上到下：个人卡片（profile）→ 统计（stats）→ 最新动态（dynamic）→ 分类 → 标签；文章页额外显示目录（sidebarToc）。关闭：公告、音乐、日历、站点信息、广告。

### 3.5 初始内容

- 删除全部 Firefly 示例文章（`src/content/posts/*`）、示例动态和示例项目
- 文章：一篇《幻梦小站建站记录》，内容是域名迁到 Cloudflare、基于 Firefly 定制、自部署 Twikoo，由 Claude 起草
- 动态：一条「幻梦小站上线了 ✦」
- 项目：
  - `llm-factor-platform`（精选）
  - `waterline-ai-inspector`（精选）
  - `pearl-prl-mining-guide`
  - `financial_browser_plugin`
  - 描述取自各仓库的 GitHub description
- 关于页：用户定稿的文案（见附录 A）
- 友链：空列表，附交换友链的说明
- 留言板：页面开启，接入 Twikoo
- 页脚：注明「壁纸：Lady Maria by JLIEN-」，并链接到 `https://www.pixiv.net/artworks/55494625`

## 4. 评论：Twikoo on Cloudflare

- 后端：`twikoojs/twikoo-cloudflare`（依赖 twikoo-func ^1.6.44），放在本仓库之外的独立目录 `~/Downloads/Projects/twikoo-cloudflare`
  - Worker 名 `huanmeng-twikoo`，D1 数据库 `huanmeng-twikoo`
  - 自定义域名 `twikoo.huanmeng.si`（workers.dev 在国内被墙，必须用自定义域名）
  - 不配 R2，评论里不能上传图片，其他功能不受影响
- 前端：`commentConfig.type = "twikoo"`，`envId = "https://twikoo.huanmeng.si"`，前端 JS 版本固定为 1.6.44，与后端一致
  - JS 从 npmmirror 加载，国内访问更好：`https://registry.npmmirror.com/twikoo/1.6.44/files/dist/twikoo.min.js`
- 安全：部署后首次进入 Twikoo 管理面板设置管理员密码，并把 `CORS_ALLOW_ORIGIN` 设为 `https://huanmeng.si`。管理员密码由用户自己设置，Claude 不代设
- 已知限制（上游文档说明）：没有 IP 属地显示，没有邮件 SMTP 通知（可以改用 SendGrid 或 MailChannels），图片上传需要 R2

## 5. 部署

- 博客：静态构建（不设置 `CF_WORKERS`，不用 adapter），`pnpm build` 输出到 `dist/`，用仓库里的 `wrangler.jsonc` 以 Workers 静态资源方式部署
  - Worker 名 `huanmeng-blog`
  - 自定义域名绑定 `huanmeng.si`，`www.huanmeng.si` 用重定向规则 301 到根域名
- 凭据：沿用 `<cloudflare-env-file>` 中的 scoped token，需要用户补充以下权限：
  - Workers Scripts Edit
  - D1 Edit
  - Account Settings Read
  - Workers Routes Edit
- 新增脚本 `pnpm deploy:cf` = `pnpm build && wrangler deploy`
- 自动部署（push 后自动构建）不在本期范围，以后可以接 Cloudflare Workers Builds

## 6. 工程约定

- 定制层的位置：
  - `src/styles/huanmeng/`
  - `src/components/huanmeng/`
  - `src/assets/images/huanmeng/`
  - `public/favicon/huanmeng-*`
  - `scripts/huanmeng/`
- 对 Firefly 原文件的每一处修改，都记录到根目录的 `CUSTOMIZATIONS.md`：文件、原因、合并上游时注意什么
- `src/config/*` 本来就是给用户改的，改动不逐条记录；但组件和样式文件的修改要记录
- 验证（本仓库没有单元测试框架）：每个任务结束都要跑
  - `pnpm check`
  - `pnpm type-check`
  - `pnpm build`
  - 视觉改动另外用 Playwright 分别截亮色、暗色、桌面、手机的图核对
- 提交：遵循 Conventional Commits，每完成一个任务提交一次；不 push，等用户授权后再 push

## 7. 不在范围内

- 自动部署流水线
- 邮件通知
- 评论图片上传（R2）
- 相册的实际内容
- B 站 UID（等用户提供）
- 多语言文案调整

## 附录 A：关于页文案（用户定稿）

> 你好，我是幻梦。
>
> 平时主要写写代码，喜欢折腾一些自托管的服务和各类 AI 工具，家里的机器上总跑着一些自己的小服务。这里会记录我曾踩过的坑、做过的项目，各种经过滤后的前沿信息。也会写写记录在追的番、在玩的游戏和生活里的碎片。
>
> 如果某篇文章刚好帮到了你，欢迎前往下方留言板进行留言。
