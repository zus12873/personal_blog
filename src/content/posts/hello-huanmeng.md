---
title: 幻梦小站建站记录
published: 2026-10-08
pinned: true
description: 从把域名迁到 Cloudflare，到基于 Firefly 定制主题、在 Workers 上自部署 Twikoo 评论的全过程。
tags: [建站, Cloudflare, Astro, Twikoo]
category: 建站
slug: hello-huanmeng
---

## 为什么要建站

一直想要一个属于自己的角落：技术上踩过的坑、做过的项目、筛过一遍的前沿信息，还有追的番、玩的游戏和生活碎片，都想有个地方安放。社交平台来来去去，博客是自己的。

## 域名：交给 Cloudflare 托管

域名 `huanmeng.si` 是在 Hostinger 注册的。本想整个转到 Cloudflare Registrar，但它目前不支持 `.si` 后缀，所以最后只把 **DNS 托管** 交给 Cloudflare：

1. 在 Cloudflare 添加站点，拿到它分配的两个 nameserver；
2. 回到 Hostinger 把 NS 改成这两个；
3. 等 `.si` 注册局发布变更，Cloudflare 检测到后 zone 变成 `active`。

注册和续费仍在 Hostinger，解析、代理、证书都在 Cloudflare。实际几个小时内就生效了，比预想的 24 小时快得多。

> 小插曲：本机挂着代理（fake-ip 模式），`dig` 查到的都是 `198.18.x.x` 的假地址。验证 DNS 要走 DoH（比如 `cloudflare-dns.com/dns-query`），不然会被骗。

## 主题：Firefly + 从头像取色

主题选的是 [Firefly](https://github.com/CuteLeaf/Firefly)（基于 Astro 的 Fuwari 分支），fork 后做了一层自己的定制：

- **配色从头像里取**：纸白、薰衣草紫、雾蓝、星屑蓝、薄荷荧光、炭黑。Firefly 原本只用一个色相值生成全站配色，我把关键变量都换成了固定色值；
- **亮暗双主题**：亮色是紫蓝渐变星空（纯 CSS），暗色换成 JLIEN- 画的《Lady Maria》作为壁纸。两张图恰好都有一抹薄荷绿的发光点缀，就拿它当暗色的主色；
- **星屑**：两层遮罩做的闪烁星点，系统开启「减少动态效果」时会停下来；
- 首页加了一行**精选项目**，侧边栏只留左侧。

改动尽量放在独立的样式层和组件里，对上游文件的修改都记在仓库的 `CUSTOMIZATIONS.md`，方便以后合并 Firefly 的更新。

## 评论：Twikoo on Cloudflare Workers

评论系统想要能匿名留言、国内访问也友好，所以没用 Giscus（需要 GitHub 账号，国内加载不稳定），而是自部署 [Twikoo](https://twikoo.js.org) 的 Cloudflare 版：

- 后端跑在 Workers 上，数据存在 D1，冷启动很快；
- 绑定了自己的子域名，不走 `workers.dev`；
- 前端脚本从 npmmirror 加载，前后端版本保持一致。

## 部署

站点是纯静态构建，用 Workers 的静态资源功能直接托管 `dist/`，再绑定到 `blogs.huanmeng.si`；主域名和 `www` 由另一个小 Worker 跳转过来。

以后就在这里写字了，欢迎去 [留言板](/guestbook/) 打个招呼 ✦
