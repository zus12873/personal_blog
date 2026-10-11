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

// 头像原图 1080×1080：avatar-full 用整张图（侧栏、动态、分享图）；
// AVATAR_CROP 取脸到上半身，只给导航栏小圆 logo；FAVICON_CROP 只取脸
const AVATAR_CROP = { left: 202, top: 138, width: 675, height: 675 };
const FAVICON_CROP = { left: 300, top: 200, width: 480, height: 480 };

await sharp(avatarSrc)
	.resize(512, 512)
	.avif({ quality: 60 })
	.toFile(path.join(imgDir, "avatar-full.avif"));
await sharp(avatarSrc)
	.extract(AVATAR_CROP)
	.resize(512, 512)
	.avif({ quality: 60 })
	.toFile(path.join(imgDir, "avatar.avif"));
for (const size of [32, 180, 512]) {
	await sharp(avatarSrc)
		.extract(FAVICON_CROP)
		.resize(size, size)
		.png({ palette: true, quality: 90, compressionLevel: 9 })
		.toFile(path.join(favDir, `huanmeng-${size}.png`));
}

// 电脑壁纸：2560×1440 墨绿黑底，人物贴右，左缘 380px 羽化
const W = 2560;
const H = 1440;
const INK = { r: 12, g: 17, b: 18 };
const scaled = await sharp(wallpaperSrc)
	.resize({ height: 1700 })
	.toBuffer({ resolveWithObject: true });
const artW = scaled.info.width;
const art = await sharp(scaled.data)
	.extract({ left: 0, top: 80, width: artW, height: H })
	.toBuffer();
const fade = 380 / artW;
const mask = Buffer.from(
	`<svg xmlns="http://www.w3.org/2000/svg" width="${artW}" height="${H}"><defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="${fade}" stop-color="#fff" stop-opacity="1"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`,
);
const feathered = await sharp(art)
	.ensureAlpha()
	.composite([{ input: mask, blend: "dest-in" }])
	.png()
	.toBuffer();
await sharp({ create: { width: W, height: H, channels: 3, background: INK } })
	.composite([{ input: feathered, left: W - artW, top: 0 }])
	.avif({ quality: 55 })
	.toFile(path.join(imgDir, "wallpaper-maria-desktop.avif"));

// 手机壁纸：原图竖版缩到宽 1080
await sharp(wallpaperSrc)
	.resize({ width: 1080 })
	.avif({ quality: 55 })
	.toFile(path.join(imgDir, "wallpaper-maria-mobile.avif"));

console.log("assets written to", imgDir, "and", favDir);
