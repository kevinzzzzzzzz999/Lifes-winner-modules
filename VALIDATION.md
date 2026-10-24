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

r2时逐项功能目录共63组，其中三组当时只在完整App源码中；本轮已补独立库与示例（见下方r3记录）。源码引用与实际导出记录在coverage-audit.json，库函数、宿主组件、插件与集成源码分别标明；这仍不表示63个完整成品App。外部OCR、FFmpeg、Tectonic、浏览器、Apple框架和账号服务需按各包说明提供。

完整软件设备稳定性、iCloud传播和大笔迹压力限制仍按原记录保留。本轮没有修改用户笔记或操作真实设备；编译和组件检查不替代设备验收。

## r3：三组独立库与可运行示例

本轮新增 `InkSpaceWritingAids`、`InkSpacePreferences` 和 `application-shell`，合计20个Node包、18个Swift产品。原有包未改行为实现，沿用其固定公开下载验收，不把旧测试冒充新增代码测试。

| 新入口 | 实际验证与边界 |
| --- | --- |
| WritingAidsDemo | 仓库外公开API消费者、11项行为测试；实际Mac窗口中文字提交/清空、胶带揭开、合成JSON导出→清空→重新打开。停留/形状等逻辑由测试覆盖，没有声称自动化验证真实鼠标拖动。iOS系统随手写适配编译通过，未做真机Pencil/Scribble验收。 |
| InkSpacePreferencesDemo | 仓库外公开API消费者、16项行为测试、两个进程保存/重读；实际Mac窗口四页观察、修改/保存/重读、删笔与重启恢复；iOS SDK编译通过。仅用独立domain和合成默认值，原App偏好不读取/迁移。 |
| application-shell | 新npm pack安装到独立消费者，25项测试与README示例通过；精确锁定依赖后12组真实Electron窗口操作、零renderer异常。原生选择器返回值用合成路径替代，未声称自动点击系统选择器；未注册系统协议。 |

Node合计242项测试（原19包217项+新包25项）。Swift新增27项单独记录，不改写首次16产品20项测试的历史。新的Swift ZIP自带 `Example/` 和仅依赖解压根的清单；可用 `bash Example/script/build_and_run.sh` 编译启动，脚本只做本地ad-hoc签名，不使用Apple账号/证书，也不代表公证安装包。

最终独立ZIP的依赖闭包和随包测试会再次检查；公开下载与摘要验收见仓库门户的 `DOWNLOAD-CHECKS.md`。全量原App界面、真实Pencil硬件、iCloud和所有二进制文档编辑器均不由这三个示例替代。
