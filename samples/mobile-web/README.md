# 人生赢家 / Life's winner · iPhone / iPad 主屏幕工具 / Home-screen tools

希望每一个使用我开源功能的人，都是各自的 Life's winner。

I hope everyone who uses my open-source tools can be their own Life's winner.

三个独立工具，分别安装到 iPhone / iPad 主屏幕。只需 Safari，无需 Xcode、Node.js、npm、账号或完整版。右上角可切换中文 / English，语言选择按工具保存，切换不会清空当前编辑。

Three independent tools, each installable on an iPhone/iPad Home Screen. Only Safari is needed: no Xcode, Node.js, npm, account or full application. Switch 中文 / English at the top. Each tool remembers its own language without clearing current edits.

| 工具 / Tool | 功能与源码 / Features and source |
| --- | --- |
| [书写画板 / Writing](writing/README.md) | 矢量笔迹、形状、演示工具、内部复制与可见拖动、文字卡及 JSON。<br>Vector ink, shapes, presentation aids, visible copy/drag, text cards and JSON files. |
| [偏好方案 / Preferences](preferences/README.md) | 四组配置、试写预览与 JSON 方案，只作用本工具。<br>Four configuration groups, live drawing preview and JSON plans; affects this tool only. |
| [文档工作台 / Documents](documents/README.md) | UTF-8 文件、只读预览、编辑副本、多标签、本机草稿、导出和分享。<br>UTF-8 files, read-only previews, editable copies, tabs, local drafts, export and sharing. |

## 安装 / Installation

从仓库首页的正式 HTTPS 链接打开某个工具 → Safari 分享 → 添加到主屏幕 → 添加。如出现“作为网页 App 打开”，保持开启。首次联网打开，等“可离线使用”。另两个工具按需分别安装；不会预先下载它们。建议使用近期 iOS / iPadOS。

Use a tool's published HTTPS link from the repository home page → Safari Share → Add to Home Screen → Add. Leave Open as Web App enabled if shown. Open online once and wait for Ready for offline use. Install the other tools separately if needed; they are not predownloaded. A recent iOS/iPadOS is recommended.

浏览器页面、安装后的应用、其他浏览器和设备不保证共享存储。安装前先导出重要草稿，再在主屏幕应用中打开。不要在“文件”中双击源码 HTML 安装；模块和离线功能需要 HTTPS。源码 ZIP 不是原生 IPA。

Browser tabs, installed apps, other browsers and devices may use different storage. Export important drafts before installation, then open them in the installed app. Opening a source HTML file in Files is not an installation method: modules and offline features need HTTPS. A source ZIP is not a native IPA.

## 隐私、保存与范围 / Privacy, saving and scope

没有账号、内容上传接口、广告或统计，不读取完整软件的私人资料。只处理主动导入或选择的内容；导出/分享由用户点击触发。静态托管方仍会收到普通网页请求和连接信息，内容与文件名不放入请求或网址。同源网页的独立键和缓存是逻辑隔离，不等同系统安全沙盒。

There are no accounts, content-upload endpoints, ads or analytics, and the full application's private data is not read. Only explicitly selected/imported content is processed. Export/sharing is user-triggered. Static hosts still receive ordinary page requests and connection information; content and filenames are not put into requests or URLs. Separate keys/caches on one origin are logical isolation, not operating-system sandboxes.

草稿仅在当前设备/浏览器，不自动跨设备同步。清理网站数据、卸载或系统回收可能删除草稿，重要内容请导出到“文件”。每个工具独立安装身份、启动范围、草稿键和缓存；公共资源随所选工具下载。各工具的限制见上表 README 和 `privacy.html`，不等同完整原生编辑器。

Drafts stay in the current device/browser without automatic device sync. Site-data removal, uninstalling or storage cleanup can erase them: export important work to Files. Each tool has its own installation identity, start/scope, draft keys and cache; shared resources download with the selected tool. See each README and `privacy.html` for limits. These are lightweight tools rather than complete native editors.

## 开发与自托管 / Development and self-hosting

完整可编辑源码采用 MIT 许可；运行时无 npm 依赖或外部 CDN。以下命令供开发者检查/生成站点，普通使用者不用安装这些工具。

Editable MIT-licensed source, without npm runtime dependencies or external CDNs. These commands are for developers; ordinary users do not need these tools.

```sh
node writing/tests.mjs
node preferences/tests.mjs
node documents/tests.mjs
python3 scripts/build-site.py --output /tmp/lifes-winner-mobile-site
```

输出目录必须尚不存在且位于源码外。将输出部署到 HTTPS 静态站点，支持子路径。构建仅复制各工具四个运行文件及公共界面，生成无多余元数据的 PNG、双语 manifest、各工具离线 worker 与逐文件 SHA 清单；测试、README、配置、开发缓存和个人资料不进入站点。App Store/TestFlight 原生发行另需合适账号、签名与审核，本发布不使用个人 Apple 身份。

The output directory must not exist and must be outside the source. Deploy it as an HTTPS static site, including under a subpath. The build copies only each tool's four runtime files and shared UI, then generates minimal-metadata PNGs, bilingual manifests, per-tool offline workers and file hashes. Tests, READMEs, settings, development caches and personal data are excluded. Native App Store/TestFlight distribution separately requires an appropriate account, signing and review; no personal Apple identity is used here.

## 每月更新 / Monthly updates

每月审查已完成源码变更，通过受影响测试与浏览器验证后部署。新离线版本等待当前工具所有窗口安全关闭再接管，不强刷正在编辑的内容。先保存或导出，再关闭重开；公开链接、摘要与离线检查未通过前不宣称发布完成。

Completed source changes are reviewed monthly and deployed after relevant tests and browser validation. New offline versions wait until all windows of that tool close safely, without forcing a refresh during editing. Save/export, close and reopen. Publication is complete only after public-link, hash and offline checks pass.
