# 幻梦小站定制 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal：** 把 Firefly fork 改造成「幻梦小站」，部署到 `https://huanmeng.si`，并接入自部署的 Twikoo 评论。

**Architecture：** 采用 1+2 混合方式。配色和背景放在独立样式层 `src/styles/huanmeng/theme.css`，用 CSS 变量覆盖和 `#wallpaper-wrapper` 伪元素实现。精选项目是新组件。其余定制走 `src/config/*`。对 Firefly 原文件的少量修改都记录在 `CUSTOMIZATIONS.md`。博客以 Workers 静态资源方式部署；评论后端是独立的 `twikoo-cloudflare` Worker 加 D1。

**Tech Stack：** Astro 7、Svelte 5、Tailwind 4、Stylus、sharp（素材处理）、Node 25 内置的 `node:test`、wrangler 4、Cloudflare Workers 和 D1。

**Spec：** `docs/superpowers/specs/2026-10-08-huanmeng-blog-design.md`

## Global Constraints

- 包管理器只能用 pnpm（由 `preinstall` 强制）；Node ≥ 22.23（本机为 v25.8.1）
- Biome 规范：tab 缩进、双引号；`pnpm lint` 只作用于 `./src`
- 亮色 token：纸白 `#F6F6F7`、星屑蓝 `#4A6CD5`、薰衣草 `#DAD4EB`、雾蓝 `#A5BFD7`、薄荷 `#B9EAE3`、炭黑 `#444048`、次要文字 `#8D909E`、腮红 `#EECCCA`
- 暗色 token：墨绿黑 `#0C1112`、主色薄荷 `#B9EAE3`、正文 `#E6ECEC`、次要文字 `#9FBABC`、血红 `#8E2424`
- `siteConfig.themeColor.hue = 265`；壁纸模式 `fullscreen`；显示设置面板保持关闭（`displaySettingsConfig.enable = false`）
- 站点：`title` 为「幻梦小站」，横幅主标题为 `Huanmeng's Blog`，昵称「幻梦」，`site_url` 为 `https://huanmeng.si`
- Twikoo：前后端都用 1.6.44；`envId` 为 `https://twikoo.huanmeng.si`；JS 地址 `https://registry.npmmirror.com/twikoo/1.6.44/files/dist/twikoo.min.js`
- 原图（头像 PNG、壁纸 JPG）不入库，只提交处理后的产物
- 每个任务结束都要跑 `pnpm check && pnpm type-check && pnpm build`；只有 Task 1 用 `pnpm build` 建立基线
- 每个任务提交一次，Conventional Commits，结尾加 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`；不 push

## Review Focus

1. **亮暗切换**：从亮色切到暗色，壁纸要立即出现、星空渐变要消失；反方向同理。切换后不能残留旧背景，也不能出现白闪。Task 5 用 Playwright 在两种模式下各截一次图，并读取 computed style 确认。
2. **移动端性能**：卡片毛玻璃 `backdrop-filter` 只在 ≥1024px 生效，手机上不叠加；`prefers-reduced-motion` 下星屑不动。Task 5 用 `matchMedia` 模拟并检查 `animation-name`。
3. **精选项目名单异常**：名单里有不存在的 id、重复 id、超过 3 个、或为空。行为分别是跳过、去重、截断、整行不渲染。Task 6 的单测覆盖这几种情况。
4. **评论路径一致**：`trailingSlash: "always"` 下，同一页面带不带 `/` 必须落到同一条评论线程；Twikoo 用 `getCurrentPath()`。Task 9 在留言板发一条测试评论后，刷新带斜杠的 URL，确认评论还在。
5. **国内可访问性**：评论 JS 不走 jsdelivr，而用 npmmirror；评论后端不用 workers.dev，而用自定义域名。Task 9 用 grep 确认构建产物中没有 `workers.dev`，也没有 `cdn.jsdelivr.net/npm/twikoo`。

---

## 文件结构

| 文件 | 职责 | 新建/修改 |
|---|---|---|
| `CUSTOMIZATIONS.md` | 记录对 Firefly 原文件的每处修改 | 新建 |
| `scripts/huanmeng/make-assets.mjs` | 一次性生成头像、favicon、暗色壁纸 | 新建 |
| `src/assets/images/huanmeng/{avatar,wallpaper-maria-desktop,wallpaper-maria-mobile}.avif` | 素材产物 | 新建 |
| `public/favicon/huanmeng-{32,180,512}.png` | favicon | 新建 |
| `src/styles/huanmeng/theme.css` | 亮暗色 token、星空、星屑、毛玻璃、点缀色 | 新建 |
| `src/layouts/Layout.astro` | 在 variables.styl 之后 import theme.css | 修改（1 行） |
| `src/config/huanmeng.ts` | 定制层配置（精选项目名单） | 新建 |
| `src/components/huanmeng/select-featured.ts` + `.test.ts` | 精选项目的选择逻辑和单测 | 新建 |
| `src/components/huanmeng/FeaturedProjects.astro` | 首页精选项目行 | 新建 |
| `src/pages/[...page].astro` | 第 1 页插入 `<FeaturedProjects />` | 修改（2 行） |
| `src/config/{siteConfig,profileConfig,backgroundWallpaper,navBarConfig,sidebarConfig,commentConfig,friendsConfig,announcementConfig}.ts` | 站点配置 | 修改 |
| `src/config/FooterConfig.html` | 页脚的壁纸出处 | 修改 |
| `src/content/**` | 删除示例，写入初始内容 | 删除/新建 |
| `wrangler.jsonc` | Worker 名、自定义域名、404 处理 | 修改 |
| `package.json` | 新增 `deploy:cf`、`test:huanmeng` 脚本 | 修改 |
| `~/Downloads/Projects/twikoo-cloudflare/` | 评论后端（独立仓库，不在本仓库内） | 新建 |

---

### Task 1：环境与基线

**Files:** Create `CUSTOMIZATIONS.md`

- [ ] **Step 1：安装依赖**
  Run: `pnpm install`
  Expected：成功，生成 `node_modules/`

- [ ] **Step 2：基线验证（改任何东西之前）**
  Run: `pnpm check && pnpm type-check && pnpm build`
  Expected：三项都通过，生成 `dist/index.html`。如果原仓库本身就报错，记下来作为已知基线问题，不算本计划引入的。

- [ ] **Step 3：新建 `CUSTOMIZATIONS.md`**

```markdown
# 对 Firefly 原文件的修改记录

合并上游（`git fetch upstream && git merge upstream/master`）时，按此表逐项检查冲突。
`src/config/*` 本来就是给用户改的，不在此记录；新增的 `*/huanmeng/*` 文件不会与上游冲突。

| 文件 | 修改 | 原因 | 合并注意 |
|---|---|---|---|
```

- [ ] **Step 4：Commit**

```bash
git add CUSTOMIZATIONS.md
git commit -m "chore: add customization ledger"
```

### Task 2：素材生成（头像、favicon、壁纸）

**Files:** Create `scripts/huanmeng/make-assets.mjs`；生成 `src/assets/images/huanmeng/*.avif`、`public/favicon/huanmeng-*.png`

**Interfaces — Produces：**
- `src/assets/images/huanmeng/avatar.avif`（512×512）
- `wallpaper-maria-desktop.avif`（2560×1440）
- `wallpaper-maria-mobile.avif`（宽 1080）
- `public/favicon/huanmeng-32.png`、`huanmeng-180.png`、`huanmeng-512.png`

- [ ] **Step 1：写脚本**

```js
// scripts/huanmeng/make-assets.mjs
// 一次性生成头像 / favicon / 暗色壁纸。原图不入库，路径通过参数传入：
//   node scripts/huanmeng/make-assets.mjs <avatar.png> <wallpaper.jpg>
import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const [avatarSrc, wallpaperSrc] = process.argv.slice(2);
if (!avatarSrc || !wallpaperSrc) {
	console.error("usage: make-assets.mjs <avatar.png> <wallpaper.jpg>");
	process.exit(1);
}

const root = path.resolve(import.meta.dirname, "../..");
const imgDir = path.join(root, "src/assets/images/huanmeng");
const favDir = path.join(root, "public/favicon");
await mkdir(imgDir, { recursive: true });

// 头像原图 1080×1080：AVATAR_CROP 取脸到上半身，FAVICON_CROP 只取脸
const AVATAR_CROP = { left: 202, top: 138, width: 675, height: 675 };
const FAVICON_CROP = { left: 330, top: 230, width: 420, height: 420 };

await sharp(avatarSrc).extract(AVATAR_CROP).resize(512, 512).avif({ quality: 60 }).toFile(path.join(imgDir, "avatar.avif"));
for (const size of [32, 180, 512]) {
	await sharp(avatarSrc).extract(FAVICON_CROP).resize(size, size).png().toFile(path.join(favDir, `huanmeng-${size}.png`));
}

// 电脑壁纸：2560×1440 墨绿黑底，人物贴右，左缘 380px 羽化
const W = 2560;
const H = 1440;
const INK = { r: 12, g: 17, b: 18 };
const scaled = await sharp(wallpaperSrc).resize({ height: 1700 }).toBuffer({ resolveWithObject: true });
const artW = scaled.info.width;
const art = await sharp(scaled.data).extract({ left: 0, top: 80, width: artW, height: H }).toBuffer();
const fade = 380 / artW;
const mask = Buffer.from(
	`<svg xmlns="http://www.w3.org/2000/svg" width="${artW}" height="${H}"><defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="${fade}" stop-color="#fff" stop-opacity="1"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`,
);
const feathered = await sharp(art).ensureAlpha().composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
await sharp({ create: { width: W, height: H, channels: 3, background: INK } })
	.composite([{ input: feathered, left: W - artW, top: 0 }])
	.avif({ quality: 55 })
	.toFile(path.join(imgDir, "wallpaper-maria-desktop.avif"));

// 手机壁纸：原图竖版缩到宽 1080
await sharp(wallpaperSrc).resize({ width: 1080 }).avif({ quality: 55 }).toFile(path.join(imgDir, "wallpaper-maria-mobile.avif"));

console.log("assets written to", imgDir, "and", favDir);
```

- [ ] **Step 2：运行**
  Run: `node scripts/huanmeng/make-assets.mjs "$SCRATCH/../images/3.png" "$SCRATCH/../downloads-wallpaper/lady-maria-jlien-55494625.jpg"`
  Expected：输出 `assets written to …`

- [ ] **Step 3：验证尺寸**
  Run: `node -e 'const s=require("sharp");for(const f of ["avatar","wallpaper-maria-desktop","wallpaper-maria-mobile"])s("src/assets/images/huanmeng/"+f+".avif").metadata().then(m=>console.log(f,m.width,m.height))'`
  Expected：`avatar 512 512`、`wallpaper-maria-desktop 2560 1440`、`wallpaper-maria-mobile 1080 1536`

- [ ] **Step 4：目视检查**
  用 Read 工具打开头像、favicon-512 和电脑壁纸。确认头像以脸为中心、favicon 能看清脸、壁纸左缘过渡自然、人物没有被裁掉头。不满意就调整裁剪常量后重跑。

- [ ] **Step 5：Commit**

```bash
git add scripts/huanmeng/make-assets.mjs src/assets/images/huanmeng/ public/favicon/huanmeng-32.png public/favicon/huanmeng-180.png public/favicon/huanmeng-512.png
git commit -m "feat: generate huanmeng avatar, favicons and dark wallpapers"
```

### Task 3：站点身份与壁纸配置

**Files:** Modify `src/config/siteConfig.ts`、`src/config/profileConfig.ts`、`src/config/backgroundWallpaper.ts`

**Interfaces — Consumes：** Task 2 的素材路径

- [ ] **Step 1：`siteConfig.ts`**
  - `title: "幻梦小站"`
  - `subtitle: "写代码，也写生活"`
  - `site_url: "https://huanmeng.si"`
  - `description: "幻梦的个人博客：记录写代码、折腾自托管服务与 AI 工具踩过的坑和做过的项目，也写追番、游戏和生活碎片。"`
  - `keywords: ["幻梦", "Huanmeng", "博客", "技术博客", "自托管", "AI", "ACGN"]`
  - `themeColor.hue: 265`
  - `favicon: [{ src: "/favicon/huanmeng-32.png", sizes: "32x32" }, { src: "/favicon/huanmeng-180.png", sizes: "180x180" }, { src: "/favicon/huanmeng-512.png", sizes: "512x512" }]`。`sizes` 字段以 `src/types/siteConfig.ts` 的 Favicon 类型为准，没有这个字段就去掉
  - `navbar.logo: { type: "image", value: "assets/images/huanmeng/avatar.avif", alt: "幻梦" }`，去掉 `valueDark`
  - `navbar.title: "幻梦小站"`
  - `siteStartDate: "2026-10-08"`
  - pages 开关改为：`booknav: false, sponsor: false, gallery: false, bilibili: false`（gallery 等有照片再开，bilibili 等拿到 UID 再开），其余保持不变

- [ ] **Step 2：`profileConfig.ts`**
  - `avatar: "assets/images/huanmeng/avatar.avif"`
  - `name: "幻梦"`
  - `bio: "写代码，折腾服务器，看番，偶尔在亚楠迷路。"`
  - `links: [{ name: "GitHub", icon: "fa7-brands:github", url: "https://github.com/zus12873", showName: false }, { name: "RSS", icon: "fa7-solid:rss", url: "/rss/", showName: false }]`

- [ ] **Step 3：`backgroundWallpaper.ts`**
  - `mode: "fullscreen"`
  - `playerEnable: false`，并删掉 `src.playerUrl`
  - `src.desktop: "assets/images/huanmeng/wallpaper-maria-desktop.avif"`
  - `src.mobile: "assets/images/huanmeng/wallpaper-maria-mobile.avif"`
  - `common.homeText.title: "Huanmeng's Blog"`
  - `subtitle` 换成 spec 2.2 的 4 句
  - `links: [{ name: "GitHub", icon: "fa7-brands:github", url: "https://github.com/zus12873" }]`
  - `fullscreen.position: "right center"`

- [ ] **Step 4：验证**
  Run: `pnpm check && pnpm type-check && pnpm build`
  Expected：通过。
  Run: `grep -o "Huanmeng's Blog" dist/index.html | head -1 && grep -c "huanmeng-32.png" dist/index.html`
  Expected：两项都有输出（计数 ≥ 1）

- [ ] **Step 5：Commit**

```bash
git add src/config/siteConfig.ts src/config/profileConfig.ts src/config/backgroundWallpaper.ts
git commit -m "feat: set huanmeng site identity, profile and wallpaper config"
```

### Task 4：导航、侧边栏、模块开关

**Files:** Modify `src/config/navBarConfig.ts`、`src/config/sidebarConfig.ts`、`src/config/announcementConfig.ts`；如果音乐和看板娘有自己的开关，也一并修改

- [ ] **Step 1：`navBarConfig.ts`**
  `getDynamicNavBarConfig` 的 links 改为：

```ts
links.push(LinkPresets.Home);
links.push({
	name: "文章",
	url: "#",
	icon: "material-symbols:article",
	children: [LinkPresets.Archive, LinkPresets.Categories, LinkPresets.Tags, LinkPresets.Series],
});
links.push(LinkPresets.Projects);
links.push({
	name: "生活",
	url: "#",
	icon: "material-symbols:local-cafe-rounded",
	children: [LinkPresets.Dynamic, LinkPresets.Gallery, LinkPresets.Bilibili],
});
links.push({
	name: "社交",
	url: "#",
	icon: "material-symbols:group",
	children: [LinkPresets.Friends, LinkPresets.Guestbook],
});
links.push(LinkPresets.About);
links.push({ name: "GitHub", url: "https://github.com/zus12873", external: true, icon: "fa7-brands:github" });
```

  先读 `LinkPresets` 的实现，确认页面开关关闭时对应项会被过滤掉；没有过滤的话，用 `siteConfig.pages.*` 条件推入。

- [ ] **Step 2：`sidebarConfig.ts`**
  - `position: "left"`
  - `leftComponents` 依次为：profile（top）、stats（top，`showOnPostPage: false`）、dynamic（top，`limit: 2`）、categories（sticky）、tags（sticky）、sidebarToc（sticky，`hideOnNonPostPage: true`）
  - 删掉 announcement 和 music
  - `rightComponents` 里保留原条目，全部 `enable: false`

- [ ] **Step 3：关闭公告、音乐、看板娘**
  - `announcementConfig` 设 `enable: false`
  - `grep -n "enable" src/config/musicConfig.ts src/config/pioConfig.ts`，把顶层 enable 都设为 `false`（pio 默认已经是 false）

- [ ] **Step 4：验证**
  Run: `pnpm check && pnpm type-check && pnpm build`
  Run: `grep -c 'href="/booknav/"' dist/index.html; grep -c 'href="/sponsor/"' dist/index.html; grep -c 'href="/projects/"' dist/index.html`
  Expected：`0`、`0`、≥ `1`

- [ ] **Step 5：Commit**

```bash
git add src/config/navBarConfig.ts src/config/sidebarConfig.ts src/config/announcementConfig.ts src/config/musicConfig.ts
git commit -m "feat: restructure navigation, left-only sidebar, disable unused modules"
```

### Task 5：配色与背景样式层

**Files:** Create `src/styles/huanmeng/theme.css`；Modify `src/layouts/Layout.astro`（1 行）、`CUSTOMIZATIONS.md`

- [ ] **Step 1：确认选择器**
  先读这几处，确认 `#wallpaper-wrapper` 在 fullscreen 模式下的定位，以及卡片和置顶标签的类名，再写样式：
  - `src/styles/layout-styles.css`
  - `src/components/layout/PostCard.astro`（找置顶标签的类名）
  - `.card-base` 的定义

- [ ] **Step 2：写 `theme.css`**

```css
/* 幻梦小站定制配色层：覆盖 Firefly 的 hue 公式变量。在 variables.styl 之后加载 */
:root {
	--hm-paper: #f6f6f7; --hm-lav: #dad4eb; --hm-mist: #a5bfd7; --hm-star: #4a6cd5;
	--hm-mint: #b9eae3; --hm-char: #444048; --hm-sub: #8d909e; --hm-blush: #eeccca;
	--hm-ink: #0c1112; --hm-blood: #8e2424;

	--primary: var(--hm-star);
	--page-bg: var(--hm-paper);
	--card-bg: #fff;
	--card-bg-transparent: rgb(255 255 255 / 0.72);
	--btn-content: var(--hm-star);
	--btn-regular-bg: var(--hm-lav);
	--btn-regular-bg-hover: #cfc7e6;
	--btn-regular-bg-active: #c3b9e0;
	--btn-plain-bg-hover: rgb(218 212 235 / 0.6);
	--btn-card-bg-hover: rgb(218 212 235 / 0.35);
	--deep-text: var(--hm-char);
	--title-active: var(--hm-star);
	--selection-bg: var(--hm-lav);
	--link-underline: rgb(74 108 213 / 0.25);
	--link-hover: rgb(218 212 235 / 0.6);
	--link-active: var(--hm-lav);
	--toc-item-active: var(--hm-star);
	--hm-star-a: rgb(255 255 255 / 0.95);
	--hm-star-b: rgb(74 108 213 / 0.75);
}

:root.dark {
	--primary: var(--hm-mint);
	--page-bg: var(--hm-ink);
	--card-bg: #141b1d;
	--card-bg-transparent: rgb(16 22 24 / 0.6);
	--btn-content: var(--hm-mint);
	--btn-regular-bg: rgb(185 234 227 / 0.14);
	--btn-regular-bg-hover: rgb(185 234 227 / 0.22);
	--btn-regular-bg-active: rgb(185 234 227 / 0.3);
	--btn-plain-bg-hover: rgb(185 234 227 / 0.1);
	--btn-card-bg-hover: rgb(185 234 227 / 0.08);
	--deep-text: #e6ecec;
	--title-active: var(--hm-mint);
	--selection-bg: rgb(185 234 227 / 0.28);
	--link-underline: rgb(185 234 227 / 0.3);
	--link-hover: rgb(185 234 227 / 0.14);
	--link-active: rgb(185 234 227 / 0.22);
	--toc-item-active: var(--hm-mint);
	--float-panel-bg: #121a1c;
	--hm-star-a: rgb(185 234 227 / 0.9);
	--hm-star-b: rgb(185 234 227 / 0.55);
}

/* 亮色：遮住壁纸图，改画紫蓝星空 */
:root:not(.dark) #wallpaper-wrapper {
	background:
		radial-gradient(ellipse at 18% 22%, rgb(218 212 235 / 0.95), transparent 55%),
		radial-gradient(ellipse at 85% 15%, rgb(165 191 215 / 0.95), transparent 50%),
		radial-gradient(ellipse at 60% 70%, rgb(185 234 227 / 0.45), transparent 55%),
		linear-gradient(160deg, #c6bce6 0%, #a9bfe0 45%, #e3e0f0 100%);
}
:root:not(.dark) #banner-images-container {
	opacity: 0;
}

/* 星屑：两层遮罩 + 不同节奏的闪烁 */
#wallpaper-wrapper::before,
#wallpaper-wrapper::after {
	content: "";
	position: absolute;
	inset: 0;
	z-index: 6;
	pointer-events: none;
	-webkit-mask-repeat: repeat;
	mask-repeat: repeat;
	animation: hm-twinkle 3.2s ease-in-out infinite;
}
#wallpaper-wrapper::before {
	background-color: var(--hm-star-a);
	--hm-stars: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='520' height='520'%3E%3Cg fill='%23000'%3E%3Cpath transform='translate(60 90) scale(.55)' d='M12 0C13 8 16 11 24 12 16 13 13 16 12 24 11 16 8 13 0 12 8 11 11 8 12 0Z'/%3E%3Cpath transform='translate(300 40) scale(.35)' d='M12 0C13 8 16 11 24 12 16 13 13 16 12 24 11 16 8 13 0 12 8 11 11 8 12 0Z'/%3E%3Cpath transform='translate(430 260) scale(.45)' d='M12 0C13 8 16 11 24 12 16 13 13 16 12 24 11 16 8 13 0 12 8 11 11 8 12 0Z'/%3E%3Cpath transform='translate(170 400) scale(.3)' d='M12 0C13 8 16 11 24 12 16 13 13 16 12 24 11 16 8 13 0 12 8 11 11 8 12 0Z'/%3E%3C/g%3E%3C/svg%3E");
	-webkit-mask-image: var(--hm-stars);
	mask-image: var(--hm-stars);
}
#wallpaper-wrapper::after {
	background-color: var(--hm-star-b);
	--hm-stars: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='760' height='640'%3E%3Cg fill='%23000'%3E%3Cpath transform='translate(220 180) scale(.4)' d='M12 0C13 8 16 11 24 12 16 13 13 16 12 24 11 16 8 13 0 12 8 11 11 8 12 0Z'/%3E%3Cpath transform='translate(600 120) scale(.3)' d='M12 0C13 8 16 11 24 12 16 13 13 16 12 24 11 16 8 13 0 12 8 11 11 8 12 0Z'/%3E%3Cpath transform='translate(520 480) scale(.5)' d='M12 0C13 8 16 11 24 12 16 13 13 16 12 24 11 16 8 13 0 12 8 11 11 8 12 0Z'/%3E%3Cpath transform='translate(40 560) scale(.35)' d='M12 0C13 8 16 11 24 12 16 13 13 16 12 24 11 16 8 13 0 12 8 11 11 8 12 0Z'/%3E%3C/g%3E%3C/svg%3E");
	-webkit-mask-image: var(--hm-stars);
	mask-image: var(--hm-stars);
	animation-duration: 4.6s;
	animation-delay: -1.7s;
}
@keyframes hm-twinkle {
	0%, 100% { opacity: 0.35; }
	50% { opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
	#wallpaper-wrapper::before,
	#wallpaper-wrapper::after { animation: none; opacity: 0.7; }
}

/* 毛玻璃：只在桌面端开启，避免手机上掉帧 */
@media (min-width: 1024px) {
	.card-base {
		-webkit-backdrop-filter: blur(12px);
		backdrop-filter: blur(12px);
	}
}

/* 打字机光标 */
#banner-subtitle .typewriter::after { color: var(--hm-mist); }
:root.dark #banner-subtitle .typewriter::after { color: var(--hm-blood); }

/* 横幅标题：亮色在浅背景上加蓝色投影保证可读 */
:root:not(.dark) .banner-title,
:root:not(.dark) .banner-subtitle { text-shadow: 0 2px 14px rgb(74 108 213 / 0.45); }
```

  Step 1 里如果找到置顶标签的类名（记作 `PINNED`），追加：

```css
PINNED { background: var(--hm-blush); color: var(--hm-char); }
:root.dark PINNED { background: rgb(142 36 36 / 0.3); color: #e7a0a0; }
```

- [ ] **Step 3：在 `Layout.astro` 接入**
  在 `import "@/styles/variables.styl";` 这一行下面加：`import "@/styles/huanmeng/theme.css";`
  同时在 `CUSTOMIZATIONS.md` 追加一行：`| src/layouts/Layout.astro | 在 variables.styl 后 import huanmeng/theme.css | 加载定制配色层 | 上游改 import 顺序时，保证 theme.css 在 variables.styl 之后 |`

- [ ] **Step 4：构建验证**
  Run: `pnpm check && pnpm type-check && pnpm build`

- [ ] **Step 5：视觉验证（Playwright，`pnpm preview` 在 4321 端口）**
  分别截 4 张图：亮色 1440×900、暗色 1440×900、亮色 390×844、暗色 390×844。暗色通过 `document.documentElement.classList.add('dark')` 切换，或 `emulateMedia colorScheme: dark`。
  再用 `getComputedStyle` 检查：
  - 亮色：`--primary` 为 `#4a6cd5`；`#banner-images-container` 的 opacity 为 `0`
  - 暗色：`--primary` 为 `#b9eae3`；opacity 为 `1`
  - `prefers-reduced-motion` 下伪元素的 `animation-name` 为 `none`
  Expected：截图与预览页 B 方案一致；文字清晰；暗色下人物在右侧。

- [ ] **Step 6：Commit**

```bash
git add src/styles/huanmeng/theme.css src/layouts/Layout.astro CUSTOMIZATIONS.md
git commit -m "feat: add huanmeng light/dark palette layer with starfield and glass cards"
```

### Task 6：首页精选项目

**Files:** Create `src/config/huanmeng.ts`、`src/components/huanmeng/select-featured.ts`、`src/components/huanmeng/select-featured.test.ts`、`src/components/huanmeng/FeaturedProjects.astro`；Modify `src/pages/[...page].astro`、`package.json`、`CUSTOMIZATIONS.md`

**Interfaces — Produces：** `selectFeatured<T extends { id: string }>(items: readonly T[], ids: readonly string[], max?: number): T[]`；`huanmengConfig.featuredProjects: string[]`

- [ ] **Step 1：写失败的单测**

```ts
// src/components/huanmeng/select-featured.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { selectFeatured } from "./select-featured.ts";

const items = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }];

test("按名单顺序挑选", () => {
	assert.deepEqual(selectFeatured(items, ["c", "a"]).map((i) => i.id), ["c", "a"]);
});
test("跳过不存在的 id", () => {
	assert.deepEqual(selectFeatured(items, ["x", "b"]).map((i) => i.id), ["b"]);
});
test("重复 id 只取一次", () => {
	assert.deepEqual(selectFeatured(items, ["a", "a", "b"]).map((i) => i.id), ["a", "b"]);
});
test("最多取 max 个", () => {
	assert.equal(selectFeatured(items, ["a", "b", "c", "d"]).length, 3);
	assert.equal(selectFeatured(items, ["a", "b", "c"], 2).length, 2);
});
test("名单为空返回空数组", () => {
	assert.deepEqual(selectFeatured(items, []), []);
});
```

- [ ] **Step 2：确认测试失败**
  Run: `node --test src/components/huanmeng/select-featured.test.ts`
  Expected：FAIL，提示找不到模块 `./select-featured.ts`

- [ ] **Step 3：实现**

```ts
// src/components/huanmeng/select-featured.ts
/** 按名单顺序从 items 中挑出精选条目：跳过不存在的 id、去重、最多 max 个 */
export function selectFeatured<T extends { id: string }>(
	items: readonly T[],
	ids: readonly string[],
	max = 3,
): T[] {
	const byId = new Map(items.map((item) => [item.id, item]));
	const picked: T[] = [];
	for (const id of ids) {
		if (picked.length >= max) break;
		const item = byId.get(id);
		if (item && !picked.includes(item)) picked.push(item);
	}
	return picked;
}
```

- [ ] **Step 4：确认测试通过**
  Run: `node --test src/components/huanmeng/select-featured.test.ts`
  Expected：5 passed。
  然后在 `package.json` 的 scripts 里加 `"test:huanmeng": "node --test src/components/huanmeng/*.test.ts"`。

- [ ] **Step 5：配置与组件**

```ts
// src/config/huanmeng.ts
// 幻梦小站定制层配置（Firefly 没有的功能放这里，避免改动上游 schema）
export const huanmengConfig: { featuredProjects: string[] } = {
	// 首页「精选项目」：src/content/projects 下的文件名（不含扩展名），按顺序最多显示 3 个
	featuredProjects: ["llm-factor-platform", "waterline-ai-inspector"],
};
```

```astro
---
// src/components/huanmeng/FeaturedProjects.astro
import ProjectCard from "@/components/pages/projects/ProjectCard.astro";
import { huanmengConfig } from "@/config/huanmeng";
import { getSortedProjects } from "@/utils/content-utils";
import { getFileDirFromPath, removeFileExtension, url } from "@/utils/url-utils";
import { selectFeatured } from "./select-featured";

const projects = (await getSortedProjects()).map((p) => ({
	id: removeFileExtension(p.id),
	title: p.data.title,
	description: p.data.description,
	image: p.data.image,
	basePath: getFileDirFromPath(p.filePath || ""),
	tags: p.data.tags,
	published: p.data.published,
	link: p.data.link,
	status: p.data.status,
}));
const featured = selectFeatured(projects, huanmengConfig.featuredProjects);
---

{featured.length > 0 && (
	<section class="hm-featured onload-animation mb-4" aria-label="精选项目">
		<div class="hm-featured__head">
			<h2>精选项目</h2>
			<a href={url("/projects/")}>全部项目 →</a>
		</div>
		<div class="hm-featured__grid">
			{featured.map((p) => <ProjectCard {...p} />)}
		</div>
	</section>
)}

<style>
	.hm-featured__head { display: flex; align-items: baseline; justify-content: space-between; padding: 0 0.25rem 0.75rem; }
	.hm-featured__head h2 { font-size: 1.1rem; font-weight: 700; color: var(--deep-text); }
	.hm-featured__head a { font-size: 0.875rem; color: var(--primary); }
	.hm-featured__grid { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }
</style>
```

  如果 `url` 不是从 `url-utils` 导出的，从 ProjectCard 的 import 里确认正确路径。

- [ ] **Step 6：插入首页**
  在 `src/pages/[...page].astro` 的 import 区加 `import FeaturedProjects from "@/components/huanmeng/FeaturedProjects.astro";`，并把 `<PostPage page={page} />` 前面加上 `{page.currentPage === 1 && <FeaturedProjects />}`。
  在 `CUSTOMIZATIONS.md` 追加一行：`| src/pages/[...page].astro | 第 1 页在 PostPage 前插入 FeaturedProjects | 首页精选项目 | 上游改首页结构时，重新放回 PostPage 之前 |`

- [ ] **Step 7：验证**
  Run: `pnpm test:huanmeng && pnpm check && pnpm type-check && pnpm build`
  这一步要等 Task 7 写入项目内容后才会有输出；在 Task 7 之前，`精选项目` 在 dist 中出现 0 次是对的（名单 id 都还不存在 → 不渲染）。
  Run: `grep -c "精选项目" dist/index.html`
  Expected（Task 6 完成时）：`0`

- [ ] **Step 8：Commit**

```bash
git add src/config/huanmeng.ts src/components/huanmeng/ "src/pages/[...page].astro" package.json CUSTOMIZATIONS.md
git commit -m "feat: add featured projects row on home page"
```

### Task 7：内容替换与页脚出处

**Files:** 删除 `src/content/posts/*`（含 `guide/`、`images/`）、`src/content/dynamic/*`、`src/content/projects/*`；新建 4 个项目、1 条动态、1 篇文章；修改 `src/content/spec/{about.md,friends.mdx,guestbook.md}`、`src/config/friendsConfig.ts`、`src/config/FooterConfig.html`

- [ ] **Step 1：删除示例内容**

```bash
git rm -r -q src/content/posts src/content/dynamic src/content/projects
mkdir -p src/content/posts src/content/dynamic src/content/projects
```

- [ ] **Step 2：项目**
  每个项目一个文件：`src/content/projects/<repo>.md`。frontmatter 包含 `title`、`published`（仓库最近推送日期）、`order`、`description`、`tags`、`status`、`link: [{ label: "GitHub", icon: "fa7-brands:github", value: "https://github.com/zus12873/<repo>" }]`；正文写一段中文简介。

  | 文件 | title | published | order | status | tags | description |
  |---|---|---|---|---|---|---|
  | waterline-ai-inspector.md | 船舶吃水线 AI 识别 | 2025-12-08 | 90 | published | [JavaScript, Gemini, 计算机视觉] | 用 Gemini 3 识别船舶吃水标志并读出吃水值的 AI 工具。 |
  | pearl-prl-mining-guide.md | Pearl L1 挖矿指南 | 2026-09-27 | 80 | published | [指南, 区块链] | 实测整理的中英双语、对 AI 友好的 Pearl L1 挖矿指南。 |
  | financial_browser_plugin.md | 金融浏览器插件 | 2025-05-06 | 70 | published | [JavaScript, 浏览器插件] | 一个辅助浏览金融信息的浏览器插件。 |

  写之前先用 `gh repo view zus12873/<repo> --json description` 核对描述；如果仓库 README 与上表冲突，以 README 为准。

- [ ] **Step 3：动态** `src/content/dynamic/2026-10-08-120000.md`

```markdown
---
published: 2026-10-08 12:00:00
---

幻梦小站上线了 ✦ 白天是紫蓝星空，夜里换成亚楠的月光。欢迎去留言板打个招呼～
```

- [ ] **Step 4：文章** `src/content/posts/hello-huanmeng.md`
  frontmatter：`title: 幻梦小站建站记录`、`published: 2026-10-08`、`pinned: true`、`description: 从把域名迁到 Cloudflare，到基于 Firefly 定制主题、在 Workers 上自部署 Twikoo 评论的全过程。`、`tags: [建站, Cloudflare, Astro, Twikoo]`、`category: 建站`、`slug: hello-huanmeng`。
  正文 5 节：
  1. 为什么要建站
  2. 域名迁到 Cloudflare：`.si` 不支持转移注册商，只改 NS 托管 DNS
  3. 选主题与配色：Firefly、从头像取色、亮暗双主题
  4. 评论系统：Twikoo on Workers + D1、国内访问的考虑
  5. 部署：Workers 静态资源、自定义域名

  只写事实，不放密钥、IP、zone id 等信息。

- [ ] **Step 5：spec 页面**
  - `about.md` 的正文换成 spec 附录 A 的文案，frontmatter 保持不变
  - `guestbook.md` 保留 3 条守则，加一句「支持匿名留言，填写邮箱可以收到回复提醒（如果开启了通知）」
  - `friends.mdx` 的 `site` 改为：

```js
export const site = {
  name: "幻梦小站",
  desc: "写代码，也写生活。",
  url: "https://huanmeng.si",
  avatar: "https://huanmeng.si/favicon/huanmeng-512.png",
  email: "",
};
```

  如果模板在 `email` 为空时会渲染出空的 mailto，就把那一行删掉。

- [ ] **Step 6：`friendsConfig.ts`** 把 `friendsConfig` 设为 `[]`

- [ ] **Step 7：页脚** `src/config/FooterConfig.html` 追加：

```html
<p class="hm-credit">暗色壁纸：<a href="https://www.pixiv.net/artworks/55494625" target="_blank" rel="noopener noreferrer">Lady Maria</a> by JLIEN-</p>
```

- [ ] **Step 8：验证**
  Run: `pnpm check && pnpm type-check && pnpm build`
  Run: `ls dist/posts/hello-huanmeng/index.html && grep -c "精选项目" dist/index.html && grep -c "JLIEN-" dist/index.html && ls dist/posts | wc -l`
  Expected：文件存在；`精选项目` ≥ 1；`JLIEN-` ≥ 1；`dist/posts` 只剩新文章（加上 Firefly 自动生成的目录）

- [ ] **Step 9：Commit**

```bash
git add -A src/content src/config/friendsConfig.ts src/config/FooterConfig.html
git commit -m "feat: replace demo content with huanmeng posts, projects and pages"
```

（`git add -A` 只作用于 `src/content`，因为这里有大量删除；其余文件逐个列出。）

### Task 8：Twikoo 后端（Cloudflare Workers + D1）

**前置条件：** 用户已经给 token 加上 Workers Scripts Edit、D1 Edit、Account Settings Read、Workers Routes Edit。
检查：`curl -s -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" .../accounts/$ID/d1/database` 返回 `success: true`。

**Files:** 新目录 `~/Downloads/Projects/twikoo-cloudflare/`（独立 git 仓库，不放进本博客仓库）

- [ ] **Step 1：获取代码并安装依赖**

```bash
cd ~/Downloads/Projects && git clone https://github.com/twikoojs/twikoo-cloudflare.git && cd twikoo-cloudflare && npm install
echo "" > node_modules/jsdom/lib/api.js
echo "" > node_modules/tencentcloud-sdk-nodejs/tencentcloud/index.js
echo "" > node_modules/nodemailer/lib/nodemailer.js
```

- [ ] **Step 2：创建 D1 并写入 schema**

```bash
set -a; . <cloudflare-env-file>; set +a
npx wrangler d1 create huanmeng-twikoo          # 记下 database_id
npx wrangler d1 execute huanmeng-twikoo --remote --file=./schema.sql
```

- [ ] **Step 3：`wrangler.toml`**
  - `name = "huanmeng-twikoo"`
  - `[[d1_databases]]` 的 `database_name = "huanmeng-twikoo"`，`database_id` 填上一步的值
  - 删除 `[[r2_buckets]]` 和 `[vars] R2_PUBLIC_URL`
  - 加：

```toml
routes = [{ pattern = "twikoo.huanmeng.si", custom_domain = true }]
workers_dev = false
```

- [ ] **Step 4：部署**
  Run: `npx wrangler deploy --minify`
  Expected：输出里包含 `twikoo.huanmeng.si (custom domain)`，并且 bundle 小于 1 MiB

- [ ] **Step 5：验证**
  Run: `curl -s -X POST https://twikoo.huanmeng.si -H 'content-type: application/json' -d '{"event":"GET_FUNC_VERSION"}'`
  Expected：JSON 中包含版本号 `1.6.x`
  再用 DoH 查 `twikoo.huanmeng.si` 有 A 或 AAAA 记录

- [ ] **Step 6：提交 twikoo-cloudflare 的本地修改**

```bash
git add wrangler.toml
git commit -m "chore: configure huanmeng twikoo deployment"
```

### Task 9：前端接入 Twikoo

**Files:** Modify `src/config/commentConfig.ts`

- [ ] **Step 1：修改配置**
  - `type: "twikoo"`
  - `twikoo.envId: "https://twikoo.huanmeng.si"`
  - `jsUrl: "https://registry.npmmirror.com/twikoo/1.6.44/files/dist/twikoo.min.js"`
  - `lang: "zh-CN"`
  - `visitorCount: true`
  - 保留 `cssUrl`

- [ ] **Step 2：构建验证**
  Run: `pnpm check && pnpm type-check && pnpm build`
  Run: `grep -rl "twikoo.huanmeng.si" dist | head -3; grep -rl "workers.dev" dist | wc -l; grep -rl "cdn.jsdelivr.net/npm/twikoo" dist | wc -l`
  Expected：有命中文件；后两个计数都是 `0`

- [ ] **Step 3：端到端验证（Playwright + `pnpm preview`）**
  1. 打开 `/guestbook/`，评论框能渲染
  2. 以昵称「Claude 测试」发一条「部署自检，稍后删除」
  3. 刷新 `/guestbook/`，评论还在
  4. 进 Twikoo 管理面板，把这条评论删掉；如果用户还没设管理员密码，就在最终汇报里提醒用户删除

- [ ] **Step 4：Commit**

```bash
git add src/config/commentConfig.ts
git commit -m "feat: enable self-hosted twikoo comments"
```

### Task 10：部署博客到 huanmeng.si

**Files:** Modify `wrangler.jsonc`、`package.json`、`CUSTOMIZATIONS.md`

- [ ] **Step 1：`wrangler.jsonc`**

```jsonc
{
	"name": "huanmeng-blog",
	"compatibility_date": "2025-01-01",
	"compatibility_flags": ["nodejs_compat"],
	"assets": {
		"directory": "./dist",
		"not_found_handling": "404-page"
	},
	"routes": [{ "pattern": "huanmeng.si", "custom_domain": true }],
	"workers_dev": false
}
```

  在 `package.json` 加 `"deploy:cf": "pnpm build && wrangler deploy"`。
  在 `CUSTOMIZATIONS.md` 追加：
  - `| wrangler.jsonc | name、routes、404 处理 | 部署到 huanmeng.si | 上游改该文件时保留本站的值 |`
  - `| package.json | scripts 增加 deploy:cf、test:huanmeng | 部署与单测 | 合并时保留这两条 |`

- [ ] **Step 2：部署**
  Run: `set -a; . <cloudflare-env-file>; set +a; pnpm deploy:cf`
  Expected：wrangler 输出 `huanmeng.si (custom domain)`

- [ ] **Step 3：验证线上**
  - DoH 查 `huanmeng.si` 的 A 记录，应指向 Cloudflare
  - `curl -s -o /dev/null -w "%{http_code}" https://huanmeng.si/` 为 `200`；如果本机有 fake-ip 代理导致结果异常，就改用 Playwright 访问
  - 用 Playwright 截线上首页的亮色和暗色，并打开 `/guestbook/` 确认评论框能加载

- [ ] **Step 3b：www 跳转**
  1. 新增 proxied 记录 `www` AAAA `100::`
  2. 用 Ruleset API 写入 `http_request_dynamic_redirect` 阶段的规则：`(http.host eq "www.huanmeng.si")` → `concat("https://huanmeng.si", http.request.uri.path)`，301，保留 query
  3. 如果 API 返回 403（token 缺 Dynamic Redirect 权限），删掉这条 `www` 记录，并在最终汇报里说明
  4. 验证：`curl -sI https://www.huanmeng.si/about/` 返回 301，`location` 指向 `https://huanmeng.si/about/`

- [ ] **Step 4：Twikoo 安全设置（交给用户）**
  在最终汇报里给出步骤：打开 `https://huanmeng.si/guestbook/` → 评论框右下角齿轮 → 设置管理员密码 → 在配置里把 `CORS_ALLOW_ORIGIN` 设为 `https://huanmeng.si`。

- [ ] **Step 5：Commit**

```bash
git add wrangler.jsonc package.json CUSTOMIZATIONS.md
git commit -m "chore: deploy blog to huanmeng.si via workers static assets"
```

### Task 11：收尾

- [ ] **Step 1：确认 `CUSTOMIZATIONS.md` 完整**
  Run: `git diff --stat upstream/master..HEAD -- src/components src/layouts src/pages src/styles ':!*/huanmeng/*'`
  每个被改动的上游文件都要在 `CUSTOMIZATIONS.md` 中有对应行。

- [ ] **Step 2：完整验证**
  Run: `pnpm test:huanmeng && pnpm check && pnpm type-check && pnpm lint && pnpm build`
  Expected：全部通过。`pnpm lint` 如果因自动修复产生了改动，提交为 `style: biome fixes`。

- [ ] **Step 3：最终汇报**
  内容包括：
  - 线上地址
  - 改了哪些东西
  - 用户需要做的事：Twikoo 管理员密码和 CORS、给出 B 站 UID 以开启番剧页、是否 push 到 GitHub、可以撤掉 token 上多余的权限
  - 还没做的：自动部署、相册、邮件通知
