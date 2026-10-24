# InkSpace Obsidian companion — independent integration

这是 **0.6.0** 的独立 Obsidian 插件。安装该插件后，可以在 Obsidian **1.8.7 或更新版本**中浏览已有的 `.inkspace.json` 白板和同仓库引用的 PDF、文字、公式、连线及定位点。**查看文件不要求安装或运行完整 InkSpace 软件**；这不是独立桌面程序，宿主是 Obsidian。

## 安装

将 `inkspace-companion/` 中的 `main.js`、`manifest.json`、`styles.css` 三个文件复制到你的 Obsidian 仓库配置目录的 `plugins/inkspace-companion/`，默认位置是 `.obsidian/plugins/inkspace-companion/`。在 Obsidian「设置 → 第三方插件」启用「人生赢家」。更新时同时替换三个文件，再重新启用插件。

用「选择白板」命令打开自己仓库里的 `.inkspace.json`，或打开已有 Markdown 入口。在普通笔记中也可使用：

````markdown
```inkspace
{"file":"InkSpace/My board.inkspace.json"}
```
````

`main.js` 是可编辑的 CommonJS JavaScript 源码，同时就是安装输入；不另附 TypeScript 工程，无需 npm 安装或编译。运行时只调用 Obsidian 提供的 API。插件不会创建用户白板或修改原文。

## 与完整软件的边界

插件的查看、平移、缩放、目录、搜索定位、原文件/PDF打开可以单独使用。原生书写、新建白板和原生导出不是插件功能。

「书写」「新建白板」会在用户明确点击后请求 `inkspace://` 协议。它们需要系统已注册并安装兼容的协议处理应用；系统没有处理程序时，这些入口不能完成原生操作。新建入口仅在 iOS 版 Obsidian 中发出请求。打开原文件仍由 Obsidian/系统的文件处理功能完成。

原生应用不同版本的白板可能含插件未支持的字段或更高的笔迹容量。此插件仍遵循其已有容量、格式及PDF预览限制，不承诺所有主应用新功能都在查看器中出现。旧文件缺完整网页笔迹时会提示仅有局部截图。详细说明见 [插件 README](inkspace-companion/README.md)。

## 验证

单独下载并解压后，进入含本 README 的 `obsidian-companion/` 目录运行：

```sh
node --check inkspace-companion/main.js
node --test tests/companion.test.cjs
```

已有35项模拟公开API回归通过。检查不会操作已安装的Obsidian或真实仓库；本次没有进行真实Obsidian界面验收。源码和通用合成测试来自已脱敏公开副本，未包含用户笔记、账号或设备记录。

## License

项目代码使用 [MIT License](LICENSE)。Obsidian 主程序单独安装并适用其自己的条款；本目录不分发 Obsidian、PDF.js 或 MathJax 的运行时。

This is a standalone Obsidian integration, not a standalone desktop executable. It can view existing InkSpace files without the full InkSpace app. Native writing/creation requires an installed system handler for `inkspace://`. Install the three plugin files, then enable the plugin in Obsidian. No npm install or build step is required.
