# Life's winner 偏好方案 · iPhone / iPad 网页版

用 Safari 打开这个工具的正式链接，即可使用；点右上角“安装”查看添加到主屏幕的步骤。不需要开发者账号、Xcode、签名或安装 IPA。首次联网打开并显示“可离线使用”后，可从主屏幕继续使用已缓存的工具。

它管理一份独立方案，不会修改 iPhone、iPad、Mac 系统或原完整版软件的设置。没有账号、统计或上传接口；方案只在当前设备和浏览器中保存，分享或导出由你主动选择。

## 可以做什么

- **外观**：中英文、预览工具栏位置、当前试写笔色；折叠项中保留工作区侧栏宽度与开合等方案字段。
- **工具栏**：按钮显隐、笔类型/名称/颜色/粗细/透明度、添加和删除预设、混排笔栏的上移下移及工具恢复。
- **手势**：Pencil双击/握压的意向、系统笔栏意向、停留阈值与几何模式。它们是方案选项，这个网页不会接管系统Pencil手势或执行形状拟合。
- **播放**：步长/速度、回放模式、字幕文字/描边/背景外观及服务选择。字幕样例会实时变化；不会播放视频、调用AI、联网翻译或收集密钥。

小试写区可以用手指或笔画线，试用撤销/重做、换笔、辅助线和工具栏位置。它最多保留20条预览线，每条512个点。试写不保存，也不会放入JSON方案。网页只画普通矢量线，不模拟PencilKit压力、纹理、套索或原生系统工具。

右上角的 **English / 中文** 可随时切换完整界面和操作提示，也将当前预览方案的语言设为所选语言；不会清空其他未保存修改、当前设置页或试写笔迹，不会刷新页面。方案仍需点“保存本机”才会保留。重新打开时优先记住的界面语言；若它与已存方案不同，仅将该语言叠加到当前预览并提示未保存，不会改写已存方案或其他字段。外观页也可选择跟随系统；导入、重新读取或恢复默认会采用相应方案的语言。笔名称等用户内容不会被翻译或改写。

## 保存、导入、导出

**保存本机**保留当前方案，重新打开同一工具会读取。**重新读取**会放弃未保存的预览；**恢复默认**先询问，再改变当前预览，仍需点保存才能保留。

**导入**只接受本工具支持的UTF-8 JSON。完整字段、枚举、数字范围、笔UUID与引用、版本和64 KiB文件大小都会检查。损坏、缺字段、未知字段、未知版本、其他应用格式或超大文件不会替换当前方案，也不会改写上次保存的数据。有效导入先进入当前预览，点保存后才留在本机。

**导出**准备一份`life-winner-preferences-plan.json`，由浏览器下载或保存到“文件”。**分享**优先使用系统文件分享；不支持时准备下载。取消分享不会改变方案。分享前请查看你自己输入的笔名称等内容。

浏览器数据清理、卸载、不同浏览器/主屏幕环境或系统回收存储都可能让本机方案消失。安装前已有方案应先导出，安装后再导入；重要方案请定期另存JSON。三个工具的本机存储名称和离线缓存各自独立。

## Mac方案互通与边界

使用独立 Mac 发行版偏好工具的版本1格式：`formatVersion: 1`、`domain: "org.inkspace.tools.preferences"`，并保留全部`InkSpacePreferences.PreferencesSnapshot`字段。健康的Mac发行版导出方案可互导，`selectedID`缺省或null均按未选择处理。UUID与颜色大小写会统一。

网页比Swift核心的容错读取更严格：不自动夹取越界数字、不丢弃未知字段、不自动修复丢失的笔栏引用。请先在Mac发行版保存并导出完整方案。旧开发示例使用的`com.example.inkspace.preferencesdemo`域不直接兼容；网页不会自动改写来源域。不同平台的字幕描边与笔触外观可能不同，方案值仍完整保留。

视觉沿用Mac示例和共享移动界面：白色表单、浅灰背景、蓝色主操作及四页设置。概念图中的全局主题颜色不是原Mac字段，因此没有虚构全局主题开关；颜色选择明确对应真实笔色和字幕外观。混排完整顺序保存在方案中，试写区只使用常用书写按钮。

## 维护与测试

纯静态HTML、CSS、ES模块，没有npm运行依赖、外部字体、CDN或分析服务。`app.js`只导入本目录逻辑与共享本机/分享/安装外壳。逻辑回归使用Node内置assert：

```sh
node tests.mjs
```

26项逻辑检查覆盖完整schema、大小/UTF-8/引用验证、Mac格式往返、保存重读、损坏导入/未知版本不覆盖、配额失败与恢复默认的预览事务。还使用当前Swift核心实际完成了网页JSON→Swift→网页的双向读取/保存检查，没有借用原App。

桌面WebKit在390×844、1024×1366视口通过30项交互检查：四页设置、语言、保存重开、试写撤销/重做、实际JSON下载与导入、坏schema/版本/UTF-8保留当前方案、恢复默认确认及配额失败状态；没有横向溢出或应用异常。配额失败使用行内提示，导出按钮仍可操作。正式HTTPS链接、离线缓存、主屏幕添加与CSP见整体发布验收记录。


## English guide

**Life's winner Preferences** is a standalone tool for iPhone and iPad. Open its published link in Safari and use **Install** for Add to Home Screen instructions. No account, Xcode, signing certificate or IPA is needed. After the first online visit reports that offline use is ready, the cached tool can be reopened offline. This is a web app, not an unsigned native installation package.

Use **English / 中文** in the header to translate the whole interface, help, confirmations and validation errors. It also sets the current preview plan’s language. It preserves other unsaved values, the current tab and preview ink, without reloading the page. **Save** is still required to keep the plan. On reopening, the remembered interface language takes priority. If it differs from the saved plan, only the preview language is overlaid and marked unsaved; the stored plan and all other fields remain intact. **Follow system** uses the browser’s language; Import, Reload and Reset apply the corresponding plan language. Names you entered for pens are content and are never translated or replaced.

### What it does

- **Appearance:** language, preview palette position and current pen color. Advanced options retain file/assistant sidebar widths, sidebar visibility and compact palette preferences for a compatible host.
- **Tools:** show or hide toolbar controls; name, add, remove and edit pen presets; change pen type, color, width and opacity; reorder a mixed palette and restore hidden utility tools.
- **Gestures:** record Pencil double-tap/squeeze and system palette preferences, hold timing and geometry choices. These are plan values; the web app does not change device settings, handle system Pencil gestures or perform shape fitting.
- **Playback:** record seek intervals, rate and replay style; preview subtitle size, outline, color and background; choose AI/translation services as settings. The app does not play video, call AI/translation services or collect accounts or keys.

The small canvas supports finger/pen drawing, undo/redo, switching pens, guide lines and palette placement. It keeps up to 20 preview strokes with 512 points each. Preview ink is temporary and is not included in the plan JSON. The web preview draws ordinary vector lines; it does not simulate PencilKit pressure/textures or native lasso tools.

### Saving and exchanging plans

**Save** keeps the plan in this device’s browser. **Reload** asks before discarding unsaved changes. **Reset defaults** asks before replacing the preview; the stored plan is not changed until Save.

**Import** accepts this tool’s supported UTF-8 JSON format and validates every required field, unknown field, enum, numeric range, UUID, pen reference, format version and 64 KiB size limit. Damaged or unsupported files do not replace the current preview or saved data. A valid import enters the preview first; Save keeps it locally.

**Export** prepares `life-winner-preferences-plan.json` for Downloads or Files. **Share** opens system file sharing when available, or falls back to download. Cancelling sharing does not alter the plan. Review names and other content you entered before sharing it.

This app does not upload notes or plans, use analytics, or read the full application’s storage. Browser data cleanup, uninstalling, separate browser/Home Screen environments or storage eviction can remove a local plan. Export important plans regularly. Export before installing to the Home Screen, then import there if the storage is separate. Each of the three tools has its own local storage keys and offline cache.

### Mac compatibility and limits

The format matches the standalone Mac Preferences release: `formatVersion: 1`, domain `org.inkspace.tools.preferences`, and all fields in `InkSpacePreferences.PreferencesSnapshot`. A complete healthy Mac plan can round-trip. An omitted or null `selectedID` means no explicit pen selection; UUIDs and colors are normalized.

The web validator is stricter than the Swift core’s tolerant loader: it rejects out-of-range numbers, unknown fields and missing palette references instead of repairing them. Save and export a complete plan from the Mac release first. The older development demo domain `com.example.inkspace.preferencesdemo` is intentionally not rewritten or accepted automatically. Subtitle rendering and pen appearance can differ by platform; plan values remain intact.

Only this independent tool’s preview and exported plan are affected. It does not alter iOS, iPadOS, macOS or the original full application. Sidebars, non-preview toolbar actions, native Pencil gestures, geometry and playback choices need an appropriate host to perform their associated actions.

### Development and verification

The app is static HTML, CSS and ES modules with no npm runtime dependencies, external fonts, CDN or analytics. Run `node tests.mjs` for the 26 dependency-free logic checks, including bilingual errors and transactional rejection. Shared language, file sharing, local storage, installation and offline support are provided by the adjacent local shell. Real browser verification and the final HTTPS/offline publishing checks are recorded separately; desktop WebKit checks are not a claim that every iPhone/iPad OS version was tested.

希望每一个使用我开源功能的人，都是各自的 Life's winner。

I hope everyone who uses these open-source tools becomes Life's winner in their own way.
