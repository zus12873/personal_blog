# 对 Firefly 原文件的修改记录

合并上游（`git fetch upstream && git merge upstream/master`）时，按此表逐项检查冲突。
`src/config/*` 本来就是给用户改的，不在此记录；新增的 `*/huanmeng/*` 文件不会与上游冲突。

| 文件 | 修改 | 原因 | 合并注意 |
|---|---|---|---|
| `src/layouts/Layout.astro` | 在 `variables.styl` 之后 `import "@/styles/huanmeng/theme.css"` | 加载定制配色层 | 上游调整 import 顺序时，保证 theme.css 仍在 variables.styl 之后 |
| `src/pages/[...page].astro` | 第 1 页在 `<PostPage>` 前插入 `<FeaturedProjects />` | 首页精选项目行 | 上游改首页结构时，把这行放回文章列表之前 |
| `package.json` | scripts 增加 `test:huanmeng` | 定制层单测 | 合并时保留这条 script |
