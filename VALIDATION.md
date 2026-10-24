# 独立下载与功能覆盖复核 · 2026-10-24 r2

本轮从GitHub实际下载原发布的38份功能ZIP及完整软件源码，逐一核对公布的SHA256；检查对象固定为当时公开提交28d298d和83a92ef。随后修复下面的问题，并分别验证修正候选。

## 独立使用验证

| 范围 | 实际验证 |
| --- | --- |
| 19个Node包原下载 | 每包从仓库外解压，npm pack，在全新消费项目按自己的package.json安装；没有原App路径、NODE_PATH或原App依赖链接。19包/198测试通过，README JavaScript例子通过。 |
| 修正后的Node模块 | Office 11、Notebook 18、browser-utilities 46、math-lab 5项消费项目测试通过；加未改实现的模块，当前19包共217项行为回归通过。安装说明的ZIP工作目录另实测。见NODE-VALIDATION.md。 |
| 真实Notebook引擎 | 用独立Python环境从官方PyPI按摘要锁安装31项依赖；真实IPython运行3个合成单元格，验证42/43、变量延续、Matplotlib PNG输出与关闭后无进程。未借用原App运行目录。 |
| 16个Swift产品 | 每个真实下载包独立解压，manifest核查、外部消费者编译/链接并运行公开API。16/16通过；含真实资源读取、临时文件读写及扫描PDF输出。AI/OCR输入与页码测试不代表真实联网或所有识别流程。 |
| React 0.1.1 | 根据自己的声明从官方npm全新安装，构建ESM与类型，npm pack后安装到新消费项目。严格TypeScript7检查通过（skipLibCheck=false、无CSS兜底声明）。30个表面、10个分域入口，45次独立浏览器挂载/交互检查通过；无控制台错误。 |
| Obsidian | 原真实下载包35项合成回归通过；已修正独立解压后的安装/测试路径。需要Obsidian；纯查看无需完整InkSpace。 |
| Safari分享源码 | 修正独立README许可链接并把LICENSE实际放入包中；源码、JavaScript与iOS SDK类型检查通过。仍需承载App、扩展target和签名，未完成独立安装或真机端到端验收。 |

## 修正内容

- 19个Node ZIP的安装示例从开发工作区路径改为真实解压目录命令。
- 补回原功能中遗漏的LaTeX服务、可编辑PDF、提取Markdown笔记、旁注组装、浏览器扩展服务、数学导出校验和MarginNotes组件。
- 修复UI在严格TypeScript消费项目中的CSS类型声明错误。
- 补齐Notebook准备脚本、摘要锁、环境与PROVENANCE契约，移除硬编码Python版本。
- 修复Obsidian路径、Safari许可缺文件，给每份Swift下载补真实API示例。

## 覆盖边界

逐项功能目录共63组，源码引用与实际导出记录在coverage-audit.json。不是63个现成独立App：库函数、宿主组件、插件与仅集成源码分别标明；仍有原生书写辅助、应用偏好及完整应用壳三组只在完整App源码中。外部OCR、FFmpeg、Tectonic、浏览器、Apple框架和账号服务需按各包说明提供。

完整软件设备稳定性、iCloud传播和大笔迹压力限制仍按原记录保留。本轮没有修改用户笔记或操作真实设备；编译和组件检查不替代设备验收。
