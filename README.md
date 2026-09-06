# Better-X — 更好的推特

[![X @StoryComicAI](https://img.shields.io/badge/X-关注%40StoryComicAI-1d9bf0.svg)](https://x.com/StoryComicAI) [![Release](https://img.shields.io/github/v/release/GijelaAI/Better-X)](https://github.com/GijelaAI/Better-X/releases)

在 X 上读长文，不该这么累。Better-X 帮你：

- **长文大纲** — 右栏自动生成「文章标题 + 多级章节大纲」，点击直达、随读高亮
- **隐藏干扰** — 隐藏「有什么新鲜事」等多余模块，右栏只留搜索框
- **折叠导航** — 左导航一键折叠成图标条，正文加宽 15%
- **宽松/原始布局开关** — 左导航顶部一键切换「宽松布局」和「X 原始布局」，随时可回
- **帖子卡片** - 宽度适配，不需要放大图片也可直接看清
- **文章创作** - 文章创作页布局大调整，改为更美观的左中右布局
- **更多 X 工具持续加入** — 关注 [@StoryComicAI](https://x.com/StoryComicAI) 不错过更新

## 功能预览

Github 无法上传大于 10M 的视频，所以功能演示视频 [放到这里](https://x.com/StoryComicAI/status/2096536115322999024?s=20) 👈

| 功能 | 无插件 | 有插件 |
|---|---|---|
| 文章大纲 | 无大纲，长文只能手动滑 | 右栏自动生成标题 + 多级大纲（H1/H2/H3），点击直达、随读高亮 |
| 侧栏干扰 | 搜索框下全是趋势/相关用户/直播/页脚 | 只留搜索框 + 大纲面板 |
| 左导航 | 全宽文字导航占位 | 一键折叠成图标条（88px） |
| 布局开关 | 无 | 左导航顶部一键切换「宽松布局 / X 原始布局」 |
| 正文宽度 | 约 600px 窄栏 | 加宽 15%（约 690px） |
| 创作页布局 | 工具条分散、未对齐 | 工具条限宽居中、样式工具栏集中、编辑区垂直居中 |
| 文章阅读视图 | 原生窄宽 | 全局 max-width 1280px，宽屏充分利用 |

## 安装（Chrome / Edge / 其他 Chromium）


Github 无法上传大于 10M 的视频，所以安装视频 [放到这里](https://x.com/StoryComicAI/status/2096536115322999024?s=20) 👈

1. 到 [Releases](https://github.com/GijelaAI/Better-X/releases) 下载最新版 `Better-X-extension.zip`
2. 解压，得到 `Better-X-extension` 文件夹
3. 打开 `chrome://extensions/`，右上角开启「开发者模式」
4. 点「加载已解压的扩展程序」，选择解压出的文件夹
5. 打开任意 X 长文，开始享受 📑

## 开发

```bash
git clone https://github.com/GijelaAI/Better-X.git
cd Better-X
# 编辑 Better-X-extension/content.js 后
# chrome://extensions 里点「重新加载」即可热更新
```

## 发布流程（维护者）

```bash
git add -A && git commit -m "0.1.x：改动说明"
git push origin main
git tag v0.1.x && git push origin v0.1.x
gh release create v0.1.x Better-X-extension.zip --title "Better-X v0.1.x" --notes "…"
```

## 支持

- 关注 X：[**@StoryComicAI**](https://x.com/StoryComicAI) 
- 遇到问题 / 有想法 → 提 [Issue](https://github.com/GijelaAI/Better-X/issues)