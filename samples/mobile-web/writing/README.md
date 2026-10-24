# 书写画板 · Life's winner Writing PWA

愿每个使用这些开源工具的人，都成为各自的 Life's winner。

可用 iPhone、iPad 或电脑浏览器打开的独立本地画板。生产运行不需要 npm、Node、编译器、账号或外部字体/CDN。安装、分享、设备草稿和离线外壳使用上一层的 `shared.js` / `shared.css`；每个工具的离线范围由站点发布流程独立生成。

## 界面语言 / Interface language

顶部的 English / 中文 按钮可切换完整界面，文字和帮助弹窗内也提供同样按钮。语言仅保存在当前工具的设备存储中，重开后保留。切换不会重载页面或清空画布、选区、撤销、内部剪贴板、颜色／形状选择或正在输入的文字。用户卡片和打开文件的原文不会被翻译。首次默认语言按浏览器设置选择。

Use the English / 中文 button in the header, text dialog or help dialog to switch the whole interface. The choice is saved separately for this tool on this device. Switching updates controls in place: it preserves the board, selection, undo, clipboard, tool options and unfinished text input. Saved cards and imported user content are never translated. The initial language follows the browser.

## 使用

画笔、停留直线、六形拟合、半透明高亮置底、弧长波浪线、自动闭合填色、可揭开胶带、短暂激光和文字卡均为真实画布操作。工具行可横向滑动。手指与 Pencil 使用 Pointer Events；可用时读取合并点，浏览器不支持时回退到当前点。

选择工具支持矩形框选和点选。“复制副本”创建新标识的副本并选中；拖动蓝框时原位置变淡，同时持续绘制新位置和边框，松开后提交。选择模式长按可在指定位置粘贴应用内部剪贴板，不依赖 iOS 系统剪贴板权限。撤销按 20 步／约 6 MiB 历史预算保留，至少保留最近一步。

每次编辑后尝试写入独立键 `writing-draft-v1`，由共享层加命名空间。只读自己的键，不访问另两个工具或原笔记应用。JSON 格式为 `inkspace-writing-web` v1，并不是原应用或旧 Mac 示例格式。打开前提示替换，完整校验通过后才替换；读取期间若继续编辑则拒绝覆盖。无法读取的旧本机草稿保留且不自动覆盖，需用户明确新建或打开文件。保存／配额失败时当前内容保留在内存并提示导出。

文件／草稿上限 8 MiB；最多 500 笔迹、500 胶带、100 文字卡、总点数 200,000。导出不含激光、内部剪贴板、选择或撤销历史。无内容上传、统计、账号、远程字体或应用主动网络请求；首次加载和离线更新由站点自身提供静态资源。

## 边界

矢量笔迹不等同 PencilKit：无压力纹理、橡皮擦、无限缩放、精细套索或原生 Pencil 双击/挤压；单一活动指针，不能承诺系统级掌托防误触。输入框可由支持的 iPad 系统随手写处理，应用没有 OCR。文字过多无法完整放入画板时保留输入并要求拆分。iOS 下载和系统分享的最终界面取决于浏览器；主屏幕安装与 Safari 草稿可能分开，安装前请导出，安装后再打开。离线和数据保留并非永久备份，不自动跨设备同步。

## 来源与开发验证

`logic.js` 的直线、圆/椭圆/矩形/三角形/箭头/坐标轴、波浪/填色、高亮置底规则移植自公开 `InkSpaceWritingAids`（`HeldGeometry.swift`、`StrokeGeometry.swift`、`HighlighterUnderlay.swift`）。数据边界、绘制／撤销／胶带／卡片流程参考独立 Mac 示例 `samples/writing-aids`，按 Web 触控和固定世界画布重新解耦。没有修改原 App。

零依赖逻辑回归：

```sh
node tests.mjs
```

测试使用合成点和文字，覆盖六形拟合、拒绝回退、JSON 校验／大小限制、高亮顺序、胶带命中、复制新标识、源数据不变、移动坐标／边界及大点集。触控、响应式布局和浏览器保存行为还需对实际页面验收，不能仅凭逻辑测试宣称 iPhone/iPad 真机通过。MIT 许可随仓库根 LICENSE 提供。

## English

**Life's winner Writing** is an independent local vector board for an iPhone, iPad or desktop browser. May everyone using these open-source tools become their own Life's winner. Production use needs no npm, Node.js, compiler, account, external font or CDN. The parent shared shell supplies installation, device storage, sharing and per-tool offline support.

Use Pen, Held line, six explicit shapes, translucent highlights below ink, arc-length waves, closed-area fill, revealable tape, temporary laser trails and text cards. Swipe the tool row sideways. Select an item or box-select, then choose Duplicate: the new copy is selected immediately. Drag its blue box to see a continuously visible preview before release. Long-press in Select mode to paste from the internal clipboard without system clipboard permission.

Edits attempt to save a separate device draft. Export writes a JSON backup; Open validates a file completely before replacing the board. Share JSON uses system sharing when available, otherwise download. Invalid files, concurrent edits while reading, unreadable old drafts and quota failures preserve the current work. Clear site data, private browsing, uninstalling or system cleanup can remove device drafts; export regularly. Safari and an installed Home Screen app may use separate storage. There is no automatic cross-device sync.

The file format remains `inkspace-writing-web` version 1 and the draft key remains `writing-draft-v1`; this is not the original full app’s file format. Limits are 8 MiB, 500 strokes, 500 tapes, 100 cards and 200,000 total ink/tape points. Exports omit laser trails, selection, undo and the internal clipboard. The app has no account, analytics, content upload or access to original app data.

This is not PencilKit brush rendering: pressure texture, an eraser, infinite zoom, a full lasso and native Pencil gestures are outside scope. Only one pointer draws at a time; system-level palm rejection is not promised. Supported iPads can use system Scribble in the text box; the app has no OCR. Actual physical Pencil, Home Screen installation and production offline behavior need device/site validation.

Run `node tests.mjs` for dependency-free synthetic document, geometry, copy/move and localized-error checks. Browser UI evidence is separate; these tests do not by themselves establish a real-device pass. Existing technical source/API names and MIT attribution remain unchanged.
