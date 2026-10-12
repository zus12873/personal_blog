# 对 Firefly 原文件的修改记录

合并上游（`git fetch upstream && git merge upstream/master`）时，按此表逐项检查冲突。
`src/config/*` 本来就是给用户改的，不在此记录；新增的 `*/huanmeng/*` 文件不会与上游冲突。

| 文件 | 修改 | 原因 | 合并注意 |
|---|---|---|---|
| `src/layouts/Layout.astro` | 在 `variables.styl` 之后 `import "@/styles/huanmeng/theme.css"` | 加载定制配色层 | 上游调整 import 顺序时，保证 theme.css 仍在 variables.styl 之后 |
| `src/pages/[...page].astro` | 第 1 页在 `<PostPage>` 前插入 `<FeaturedProjects />` | 首页精选项目行 | 上游改首页结构时，把这行放回文章列表之前 |
| `package.json` | scripts 增加 `test:huanmeng`、`deploy:cf`、`deploy:redirect` | 定制层单测、部署 | 合并时保留这三条 script |
| `wrangler.jsonc` | Worker 名 `huanmeng-blog`、`routes` 绑定 `blogs.huanmeng.si`、`not_found_handling: 404-page`、`workers_dev: false` | 部署到 blogs.huanmeng.si | 上游改该文件时保留本站的值 |
| `workers/redirect/`（新增） | 独立的小 Worker `huanmeng-redirect`，绑定 `huanmeng.si` 和 `www.huanmeng.si`，302 到 `https://blogs.huanmeng.si` 并保留路径和参数 | token 没有 Redirect Rules 权限，用 Worker 代替；用 302 是为了以后主域名可以另作他用；`pnpm deploy:redirect` 部署 | 上游没有这个目录，不会冲突 |
| `.github/workflows/deploy.yml`（删除）、`deploy-cloudflare.yml`（新增） | 删掉上游部署到 GitHub Pages 的流程；新增推送 `huanmeng-theme` 即测试、构建并部署到 Cloudflare 的流程，PR 只构建不部署 | 本站部署在 Cloudflare Workers，不用 GitHub Pages | 上游改 deploy.yml 时会出现「上游修改 / 本地删除」冲突，保持删除 |
| `src/content/spec/friends.mdx` | 删掉邮箱申请说明；步骤徽章与勾选图标加 `dark:text-(--hm-ink)` | 不公开邮箱；暗色主色是浅薄荷，白字看不清 | 上游改友链模板时保留这两处 |

## theme.css 依赖的上游选择器（合并后必须复查）

这些选择器不会产生 git 冲突，上游一改，定制就会**悄悄失效**。每次合并上游后，在亮、暗两种模式下各看一遍首页、文章页和友链页。

| 上游选择器 / 规则 | 所在文件 | theme.css 的依赖方式 |
|---|---|---|
| `#wallpaper-wrapper`、`#wallpaper-wrapper::before`、`#wallpaper-wrapper::after` | `src/styles/layout-styles.css`（`::after` 原为暗角渐变，特异性 1,1,2） | 亮色渐变星空画在 wrapper 背景上；两层星屑占用 `::before` / `::after`，`::after` 用重复 id（2,1,2）压过暗角 |
| `html[data-wallpaper-mode="fullscreen"] #wallpaper-wrapper img`（`object-position: center !important`，1,2,2） | `src/styles/layout-styles.css` | 桌面端用 `#wallpaper-wrapper#wallpaper-wrapper img`（2,1,2）改为靠右 |
| `#banner-images-container`、`.banner-dim-overlay` | `src/components/layout/WallpaperSection.astro` 等 | 亮色模式把这两者设为 `opacity: 0`，露出星空 |
| `.wallpaper-transparent .card-base` 与 `body.wallpaper-transparent` 的开关逻辑 | `src/styles/main.css`、`src/utils/setting-utils.ts`、`src/layouts/Layout.astro` | 毛玻璃卡片依赖 `fullscreen.layout: "hero"` 时上游给 body 加的这个类 |
| `.category-pill[data-active]`（主色底 + 白字） | `src/styles/categories.css` | 暗色改墨色字 |
| `group-hover:text-white!`（归档面板徽章） | `src/components/controls/ArchivePanel.astro` | 在 `@layer base` 里用 important 覆盖成墨色字 |
| `.plantuml-error button` | `src/styles/markdown-extend.styl` | 暗色改墨色字 |
| `dark:bg-(--primary)`（侧栏分类/标签计数徽章） | `src/components/common/ButtonLink.astro` | 按 class 记号匹配，暗色改墨色字 |
| `.twikoo .el-button--primary`、`.tk-pagination-pager.__current` | `public/assets/css/twikoo-custom.css` 与 Twikoo 自带样式 | 暗色改墨色字 |
| `img.navbar-logo`、`.pinned-btn`、`#banner-subtitle .typewriter` | 导航栏、置顶按钮、横幅打字机组件 | 圆形 logo、固定配色、光标颜色 |

## 内容与生成文件

- 上游的示例内容（`src/content/posts`、`projects`、`dynamic` 等）已全部删除。合并时遇到「上游修改 / 本地删除」冲突，保持删除（`git rm`）。
- `src/constants/lqips.json`、`src/constants/github-card-data.json` 由构建生成。冲突时随便取一边，再跑 `pnpm build` 重新生成并提交，不要手动合并。
