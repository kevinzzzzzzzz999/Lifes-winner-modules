# 公开下载与使用验收 / Public download and usage checks

## 当前发布状态 · r6 / Current release status

人生赢家 / **Life's winner**，2026-10-24。三个独立中英文网页工具已发布，见[移动端入口与安装说明](MOBILE-APPS.md)。版本0.2.0对应源码提交 `afc92965d946a6cd93f0e03b70a4cc0755b3086c`。正式站的 **33/33个文件**已匿名取回，与验收成品逐字节及SHA-256一致；32项清单、6份中英文manifest核对通过，同一工具语言切换保持安装identity，三个工具各自独立。

The three standalone Chinese/English web apps are published as Life's winner 0.2.0; see [mobile access and installation](MOBILE-APPS.md). All **33 public files** were downloaded anonymously and match the accepted artifact byte for byte and by SHA-256. The 32 manifest entries and six language manifests were verified; each tool retains one install identity across languages and differs from the other tools.

- **本轮实际检查：**WebKit与已安装Chrome、手机/iPad两种视口、三个工具共12个独立环境，**121项通过**。包含中英文安装提示、语言记忆、关闭后重开、实际停止专用服务器后的离线重开及每工具12资源缓存摘要；没有外联或未处理异常。
- **安全更新证据：**此前21项安全更新检查仅沿用完全相同的安装/激活/缓存读取代码。本轮未冒称重跑这21项；本轮新增版本与12项资源的SRI首装、缓存字节已实际核验。
- **设备范围：**`physicalDeviceVerification=false`。桌面浏览器模拟尺寸及安装说明检查，不等于已在真实iPhone/iPad逐系统安装、运行或点击主屏幕安装。
- **源码归档范围：**当前ZIP的README、品牌和元数据已更新，不能再声称原38份归档字节未变。仅未改动引擎的历史行为证据继续适用；本轮另有**7项元数据相关新增回归**，与下文旧217/242项行为测试分列，不表示所有旧功能已重新全量运行。当前文件摘要以[下载清单](download-manifest.json)为准。

**Current checks:** 121 passed across 12 isolated WebKit/installed-Chrome, phone/iPad and app combinations, including bilingual install help, remembered language, close/reopen, offline startup with the dedicated server actually stopped, and each app's 12 cached resources. The earlier 21 safe-update checks are inherited only for the unchanged worker recipe; they were not rerun in this release. New resource SRI installation and cached bytes were tested. Physical-device verification remains false. Current archive READMEs, branding and metadata changed: reuse historical behavior evidence only for unchanged engines, and keep the seven new metadata regression checks separate from the old 217/242 behavior-test totals.

**Mac 0.1.2：公开下载与使用验收通过。** 四个应用 ZIP 和六份校验/帮助文件已匿名下载，全部摘要与公开发布清单一致。公开源码提交 `afc92965d946a6cd93f0e03b70a4cc0755b3086c` 的 Apple Silicon、Intel 构建机均完成原生启动/方案持久化及文档工作台窗口/合成文本预览检查。两原生 ZIP 的新文件夹名、双架构、系统依赖、逐架构匿名签名、中英文帮助通过；文档工作台两 ZIP 的元数据、安全相对链接、逐文件字节、13 个 Mach-O 签名、运行依赖与隐私扫描通过。第三方公共署名仅在逐项与官方输入上下文摘要一致时保留。没有使用个人签名身份，未经 Apple 公证。见[独立 Mac 应用](DESKTOP-APPS.md)。

**Mac 0.1.2: public-download acceptance passed.** Four app ZIPs and six metadata/help assets were downloaded anonymously with matching digests. Apple Silicon and Intel CI workers passed native launch/persistence and packaged Document Workbench window/synthetic-text checks from the source commit above. Extracted bytes, new native app folder names, architectures, bundled runtime dependencies, ad-hoc signatures and bilingual help were verified. Full archive privacy scans passed; exact official-vendor context checks preserve public third-party credits. No personal signing identity was used; these apps are not Apple-notarized. Older results below remain historical.

## 历史记录 · Mac 0.1.0 / Historical Mac 0.1.0

> 以下0.1.0、r3/r4及r2记录仅适用于所列固定源码SHA和当时归档。相对下载链接可能打开当前版本；不能据此推定当前ZIP与旧包字节相同，或把历史测试计为本轮重跑。
>
> The following records apply to their fixed source SHAs and original archives. Relative download links may open current files; historical results do not establish byte identity or a fresh test run for today's packages.

[Mac下载说明](DESKTOP-APPS.md)。以下为当时三个无需Xcode、Node.js或Python的成品应用记录，来自公开构建流程的固定源码修订 `bff27e09d743ee7a14ffaf3cf904d53db6c32829`；对应构建配方随r4工作区源码公开。

- 4个应用ZIP和6份说明/校验文件均已从未登录的公开Release链接实际下载，GitHub摘要、发布清单和下载字节全部一致。
- 两个原生Universal包：实际CI新ZIP和可执行文件Hash核对、22个文件的UTF-8/UTF-16隐私扫描、解压后签名/系统依赖/双架构与macOS13最低声明检查通过；系统路径不含开发工具时，两个App启动与方案保存/重读通过，下载后帮助窗也已观察。
- 文档工作台两架构包：629个ZIP条目、文件权限/相对链接、零extra/注释/UID元数据，解压字节、13个Mach-O签名和运行依赖闭包通过。全量字节的私有词/本机路径扫描无用户信息；第三方官方组件中的既有公共署名逐项与官方输入上下文摘要一致，依法保留。
- 云端Apple芯片和Intel构建机均完成原生启动/方案持久化检查及文档工作台成品窗口、帮助和合成文本预览；各App使用纯系统PATH，不依赖外部Node/Xcode。本机另对公开arm64文档工作台重新实际启动与预览，零renderer异常。
- 原生导入/保存/导出、格式错误保留当前值、重新启动恢复和帮助界面按发行适配的专门验证记录，不冒充所有旧系统/硬件均已实测。最低系统声明不等于macOS13实机验收。

所有包使用不含个人身份的ad-hoc签名，未经过Apple公证；系统首次确认仍由使用者按Apple说明决定。本次没有移除下载隔离属性、修改系统防护或使用个人证书。OS在解压后自行生成的本机provenance属性不来自ZIP，也未被移除。

## 历史记录 · 源码模块r3 / Historical source modules r3

源码模块验收：2026-10-24 r3。固定模块源码修订：`98666bd61bce39b1ae341a141bd5018a21935e40`。

**r3当时新增三组独立库和可启动示例。该修订的三个ZIP及完整模块工作区已通过未登录的GitHub公开链接实际下载，SHA-256与当时发布清单一致；在仓库外安装、编译并运行随包测试，52/52通过，0失败。没有借用完整App。这是固定r3版本的结果，不是当前更新后归档的字节或全量重测声明。**

At the fixed r3 revision, the three standalone archives and complete module workspace were downloaded anonymously from GitHub. Their digests match the public manifests. Isolated consumers of those downloaded archives passed all 52 included tests; the integrated application was not used.

## r3历史用法与测试 / r3 usage and test record

下表链接指向当前包；历史测试范围见上述固定r3提交，实际操作优先阅读当前随包README。

Links below open current packages. Historical test evidence is tied to the fixed r3 commit above; follow the current bundled README for usage.

| 功能 | 独立下载 | 启动与实测 |
| --- | --- | --- |
| 书写与演示辅助 | [InkSpaceWritingAids](swift-InkSpaceWritingAids.zip?raw=1) | 解压后在包根运行 `bash Example/script/build_and_run.sh`。11项随包测试和示例构建通过；实际Mac窗口已验证文字卡提交、胶带揭开、JSON导出→清空→重新打开。 |
| 语言、布局、工具栏和操作偏好 | [InkSpacePreferences](swift-InkSpacePreferences.zip?raw=1) | 同样运行 `bash Example/script/build_and_run.sh`。16项随包测试和示例构建通过；实际窗口四页设置、修改/保存/重读、重启恢复与两个进程存取通过。 |
| 首页、文档打开和多窗口应用壳 | [application-shell](node-application-shell.zip?raw=1) | 进入解压目录 `examples/electron`，运行 `npm ci`、`npm start`。核心独立npm安装后25项测试通过，README示例通过；相同源字节的独立Electron消费者12组图形窗口检查通过。 |

两个原生示例需要macOS 13+与Xcode/Swift工具链；各ZIP的`Example/`已经带有指向解压根的正确依赖。启动脚本仅做本地ad-hoc签名，不使用Apple账号、个人证书或私钥。应用壳示例需要Node.js 24.15+，首次安装从官方来源取得精确锁定的Electron依赖；核心本身没有生产依赖。详细环境、API、源码来源和操作步骤均在随包README。

## r3历史验证边界 / Historical r3 limits

- 书写库返回几何/状态，附Mac矢量画布和可选iOS系统Scribble输入适配；PencilKit笔压、纹理、撤销与实际画布插入由调用者负责。iOS 18 arm64模拟器SDK编译通过，未做真实Apple Pencil/Scribble识别验收；鼠标停留/拖动逻辑由行为测试覆盖。
- 设置库只存操作偏好，不执行翻译、AI、视频播放或Pencil硬件动作。存储domain和位置显式指定，不读取/迁移原App偏好。示例使用合成默认值和独立临时JSON；生产应用自行指定持久目录。
- 应用壳是真正可运行的只读文档/工作区示例，可预览有界UTF-8文本。PDF、Office、媒体等完整编辑器和原生SwiftUI场景由集成方接入。图形测试将原生选择器返回值替换为合成路径，没有声称点击系统选择器；示例不注册系统协议，URL仅路由本会话已授权工作区，不包含跨进程单实例恢复。
- 运行示例的界面和数据采用通用合成内容。发布文件不含个人笔记、课程资料、账号凭据、设备/签名材料、本机代理配置或构建缓存。

## 历史记录 · 其他源码归档 / Historical archive checks

r3当时共 **41份独立功能归档：20个Node包、18个Swift产品、React组件、Obsidian伴侣和Safari集成源码**，另有完整模块工作区及完整软件源码。下表保留固定版本的原始验收；当前归档的README和元数据已有变更，历史行为结论只沿用于未改引擎，不代表当前文件字节未变或本轮已重复全部界面检查。

| 范围 | 验收依据 |
| --- | --- |
| 原19个Node包 | 固定修订 `11fb58cf27dc4dbe44f50b6f35f6e27635413df2` 实际匿名下载，逐包npm pack后安装到新消费者；19个README例子与217项行为测试通过。加新应用壳25项，共20包242项。 |
| 原16个Swift产品 | 每份下载的独立消费者编译、链接并运行公开API；资源读取、合成文件及PDF输出按原记录验证。新增两包的27项测试另行记录，不改写历史测试数。 |
| React 0.1.1 | 30个表面、10个分域入口；45次挂载/交互、严格TypeScript独立消费与生产构建通过。当时归档与该验收源字节一致；当前README/元数据更新另计。 |
| Obsidian | 最终下载包35项回归通过；需要Obsidian宿主，原生打开/书写需要系统协议处理程序；未做真实Obsidian UI验收。 |
| Safari | 许可、文档链接、源字节及iOS SDK检查通过；仍是需要承载App、扩展target和签名的集成源码，未做独立真机安装验收。 |
| 完整模块工作区 | r3 ZIP实际公开下载并校验，1063项源码与manifest和仓库展开文件一致；55个发布文件和110个首页链接核对通过。 |
| 完整软件历史快照（旧名InkSpace） | 源码修订 `d65fcddd1de4b66b52ccef4d12707c763ea07936` 的公开ZIP下载与摘要检查通过；按完整仓库说明构建，设备稳定性限制继续保留。 |

此前r2的全部40份归档曾经匿名公开下载并校验通过。Notebook真实IPython的三个合成单元格、变量延续、Matplotlib PNG与正常关闭保留原验收依据；外部OCR、FFmpeg、Tectonic、AI/翻译和系统授权条件见各包说明，未实际运行的服务没有计入通过结果。

## 功能覆盖与自行复核

[63个功能组](FEATURES.md)和[覆盖审计](coverage-audit.json)中的C09、H03、H05现已登记独立入口，不再是仅完整App源码的条目。核心库、组件、插件与集成源码仍各有范围；这不代表所有原生工作流或每份ZIP都成为完整成品App。

从[下载目录](README.md)选择功能，按随包README使用；用[下载清单](download-manifest.json)核对SHA-256，完整工作区逐文件摘要见[source-tree-manifest.json](source-tree-manifest.json)。[Node记录](NODE-VALIDATION.md)、[其他验证记录](VALIDATION.md)和源码测试说明了精确范围。

历史结论仅适用于上述固定修订及摘要相同的旧归档；当前下载以当前清单及顶部发行状态为准。未来同步时分别记录变更代码的新验证与未改引擎的历史依据，不把文档/元数据更新或沿用记录说成全量重新验收。
