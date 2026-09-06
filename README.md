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

| 功能 | 无插件 | 有插件 |
|---|---|---|
| 📑 文章大纲 | 无大纲，长文只能手动滑 | 右栏自动生成标题 + 多级大纲（H1/H2/H3），点击直达、随读高亮 |
| 🧹 侧栏干扰 | 搜索框下全是趋势/相关用户/直播/页脚 | 只留搜索框 + 大纲面板 |
| 🗂 左导航 | 全宽文字导航占位 | 一键折叠成图标条（88px） |
| 📐 正文宽度 | 约 600px 窄栏 | 加宽 15%（约 690px） |
| ✍️ 创作页布局 | 工具条分散、未对齐 | 工具条限宽居中、样式工具栏集中、编辑区垂直居中 |
| 🖥 文章阅读视图 | 原生窄宽 | 全局 max-width 1280px，宽屏充分利用 |
| 💖 引导关注 | 无 | 未关注作者时文末署名卡 + 关注按钮（已关注自动隐藏） |

### 🖼 效果对比图（待补充）

对照上面表格逐行补图。默认只看功能表即可，但配上对比图更能打动用户。

> **截图规范**：所有「无插件 vs 有插件」对比，务必用**同一篇 X 长文、同一浏览器窗口宽度**（建议 1280px）拍摄——无插件 = 卸载扩展后刷新该页，有插件 = 启用扩展后刷新该页。截图统一放 `assets/screenshots/` 目录，用相对路径引用即可自动内嵌在仓库页面。

| # | 截图内容 | 无插件状态 | 有插件状态 | 文件名 |
|---|---|---|---|---|
| 1 | **长文阅读页顶部（主图）** | 右栏全是趋势/相关用户等干扰，正文窄 | 右栏只留搜索框 + 文章大纲，正文加宽 | `assets/screenshots/read-empty.png` / `read-plugin.png` |
| 2 | **大纲高亮跟随（动图）** | — | 滚动长文时右栏大纲随读高亮当前章节 | `assets/screenshots/outline-follow.gif` |
| 3 | **创作页 `/compose/articles`** | 工具条分散、元素未对齐 | 工具条限宽居中、折叠按钮就位 | `assets/screenshots/compose-empty.png` / `compose-plugin.png` |

_补好图后，把对应行替换为 `![](assets/screenshots/文件名)` 即可内嵌展示（可再配一句说明）。动图建议单张 < 3MB，静态图 < 1MB。_

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