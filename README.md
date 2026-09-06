# Better-X — X 平台增强工具箱

[![X @StoryComicAI](https://img.shields.io/badge/X-关注%40StoryComicAI-1d9bf0.svg)](https://x.com/StoryComicAI) [![Release](https://img.shields.io/github/v/release/GijelaAI/Better-X)](https://github.com/GijelaAI/Better-X/releases)

在 X 上读长文，不该这么累。Better-X 帮你：

- 📑 **长文大纲** — 右栏自动生成「文章标题 + 多级章节大纲」，点击直达、随读高亮
- 🧹 **隐藏干扰** — 隐藏「有什么新鲜事」等多余模块，右栏只留搜索框
- 🗂 **折叠导航** — 左导航一键折叠成图标条，正文加宽 15%
- ✨ **更多 X 工具持续加入** — 关注 [@StoryComicAI](https://x.com/StoryComicAI) 不错过更新

## 📦 安装（Chrome / Edge / 其他 Chromium）

1. 到 [Releases](https://github.com/GijelaAI/Better-X/releases) 下载最新版 `Better-X-extension.zip`
2. 解压，得到 `Better-X-extension` 文件夹
3. 打开 `chrome://extensions/`，右上角开启「开发者模式」
4. 点「加载已解压的扩展程序」，选择解压出的文件夹
5. 打开任意 X 长文，开始享受 📑

> 也可用 Tampermonkey 安装根目录的 `Better-X.user.js`

## ✨ 功能预览

_（效果对比图：无插件 vs 有插件，敬请期待）_

| 无插件 | 有插件 |
|---|---|
| 右栏全是趋势干扰、正文无大纲 | 右栏只留搜索框 + 文章大纲、正文更宽 |

## 🛠 开发

```bash
git clone https://github.com/GijelaAI/Better-X.git
cd Better-X
# 编辑 Better-X-extension/content.js 后
# chrome://extensions 里点「重新加载」即可热更新
```

## 📖 发布流程（维护者）

```bash
git add -A && git commit -m "0.1.x：改动说明"
git push origin main
git tag v0.1.x && git push origin v0.1.x
gh release create v0.1.x Better-X-extension.zip --title "Better-X v0.1.x" --notes "…"
```

## 🙌 支持

- 关注 X：[**@StoryComicAI**](https://x.com/StoryComicAI) 🧡
- 遇到问题 / 有想法 → 提 [Issue](https://github.com/GijelaAI/Better-X/issues)