# @inkspace/ui

InkSpace 原有 React 功能界面的独立组件库：**30 个可挂载表面、10 个分域入口**，ESM 与 TypeScript 声明。React/ReactDOM 是 peer dependency。本目录没有复制完整 `App.tsx`、主进程或预加载入口。

Reusable React components for note editors, document margin notes, PDFs, knowledge graphs and spaces, notebooks, study tools, planning and media. Use the components in your own React 19 browser application; storage and native services are supplied through explicit callbacks or a host adapter. This source package requires a local build.

## 两种独立使用方式

**只需 props 和浏览器**：代码编辑、文本/公式、Markdown/CSV/HTML预览、结构化文档编辑、文档旁注、知识图、文字思维导图、记忆宫殿、空间漫游、单页PDF、批注列表及数学浮窗。数据和修改通过已有props/回调传入。涉及原文件、附件或外部打开的额外动作仍需要对应宿主能力，不能据纯文本示例宣称所有附件流程已完成。

**显式宿主适配**：知识空间的文件夹扫描、Notebook运行信息、便签/任务/日历存储、PDF阅读扩展、白板资源、学习记录、视频/剪辑、OCR、笔记交换和系统文件操作。调用方在挂载前明确提供对应接口；没有适配器或必需能力时，组件显示错误，不使用完整App全局接口、不填造样例数据。详细契约见 [HOST-CONTRACT.md](HOST-CONTRACT.md)。

库组件不是30个桌面安装包。原生PencilKit、系统文件权限、钥匙串、Python、FFmpeg、OCR/AI服务和浏览器内核不由React库提供。原功能没有被新的演示界面替换；保留原组件与其内部状态/操作逻辑，移除隐式宿主访问并添加可见错误边界。

## 构建与使用

单独下载本组件包时，解压后在包目录运行 `npm install`、`npm run build`。它自带完整源码、构建配置和MIT许可证，不依赖完整InkSpace源码目录。若在整个模块仓库中使用，可在根目录安装工作区依赖，然后：

```sh
npm --workspace @inkspace/ui run build
```

或者进入 `ui/` 安装其声明依赖并运行 `npm run build`。生成 `dist/*.js`、`dist/types/`、`dist/style.css`、数学静态资源与第三方许可副本。源提取清单见 [source-manifest.json](source-manifest.json)。

### 安装到自己的React项目

使用Node.js 24.15或更新版本，消费项目需React/ReactDOM 19。独立源码下载的默认文件夹名为`react-ui-components/`：

```sh
cd react-ui-components
npm install
npm run build
npm pack

cd ../my-react-app
npm install ../react-ui-components/inkspace-ui-0.1.1.tgz
```

`npm pack`把已构建的入口、类型、样式和资源放进本地安装包；上面的最后一行是在你的应用中安装它，不是向npm注册表发布。此流程已在独立消费项目中执行，公开入口的严格TypeScript检查与生产页面构建均通过。

```tsx
import {useState} from 'react';
import {CodeEditor} from '@inkspace/ui/editor';
import '@inkspace/ui/style.css';

export function Editor() {
  const [value, setValue] = useState('print(1)');
  return <div style={{height: 500}}>
    <CodeEditor path="example.py" value={value} onChange={setValue}/>
  </div>;
}
```

按分域入口导入可减少不使用的功能依赖。组件运行于浏览器DOM中；在支持服务器组件的框架里应从客户端组件引用，不宣称SSR兼容。通用基础样式作用于`.inkspace-ui`；原组件特定的class样式继续保留，调用方应评估与自己页面class命名的兼容性。弹出层仍遵循原组件的DOM/Portal行为。

## 入口和表面

| 导入入口 | 导出组件 | 核心边界 |
| --- | --- | --- |
| `@inkspace/ui/editor` | CodeEditor、TextBoxEditor | 受控文本；保存由调用方决定 |
| `@inkspace/ui/knowledge` | KnowledgeGraph、MindMapEditor、MemoryPalace、KnowledgeWalkthrough、KnowledgeSpace | 前四个可由props驱动；KnowledgeSpace需要文件接口 |
| `@inkspace/ui/documents` | DocumentPreview、FormulaView、CsvPreview、HtmlPreview、StructuredDocumentEditor、MarginNotes | 文档数据/回调；文件/外链动作需接口 |
| `@inkspace/ui/notebook` | NotebookEditor | 编辑与运行回调；运行信息/数据导入需宿主，未自带Python |
| `@inkspace/ui/planning` | QuickNotes、CourseChecklist、Calendar | 真实读写/冲突/订阅契约；未自带文件系统或系统通知 |
| `@inkspace/ui/pdf` | PDFPage、PDFReader | 单页按URL渲染；阅读器额外能力需宿主 |
| `@inkspace/ui/board` | BoardViewer、InkReplay | 白板数据/资源/操作回调；不含PencilKit引擎 |
| `@inkspace/ui/media` | MediaEditor、VideoPlayer | 项目/播放UI；媒体流/导出运行时需宿主 |
| `@inkspace/ui/study` | StudyPanel、ReviewPanel | 学习需记录接口；批注列表可由props驱动 |
| `@inkspace/ui/tools` | LocalOCR、NoteExchange、FileManagement、TranslationSettings、MathWorkbench | 系统/服务接口；数学浮窗需传入静态资源URL |
| `@inkspace/ui/host` | configureInkSpaceHost、能力/错误状态API与接口类型 | 明确的一次性适配器配置，无完整App回退 |

`MathWorkbench`必须传入`sourceURL`，例如由调用方静态服务托管的`/math-lab/simple.html`。构建后将`dist/math-lab/`作为静态目录部署；数学计算/绘图在iframe中运行，复制和图片导出通过显式宿主接口完成。不要把原完整App目录或自定义协议当默认资源路径。

### 文档旁注

`MarginNotes`保留原有的旁注编辑、Markdown阅读、图片插入入口、保存和右侧/下方位置切换。组件只通过props和回调交换状态，不需要完整InkSpace或全局宿主。`onSave`由调用方写入自己的存储，`onImage`由调用方提供图片选择及文本插入；已有图片的URL可由`resolveMedia`解析。

```tsx
import {useState} from 'react';
import {MarginNotes} from '@inkspace/ui/documents';
import '@inkspace/ui/style.css';

type MarginActions = {
  save: (text: string) => void;
  pickImage: (text: string, update: (value: string) => void) => void;
  close: () => void;
};

export function DocumentMargin({save, pickImage, close}: MarginActions) {
  const [text, setText] = useState('# Notes');
  const [position, setPosition] = useState<'right' | 'bottom'>('right');
  return <MarginNotes language="en" path="notes/margin.md"
    text={text} dirty={true} position={position}
    onChange={setText} onSave={() => save(text)}
    onImage={() => pickImage(text, setText)} onClose={close}
    onPosition={() => setPosition(p => p === 'right' ? 'bottom' : 'right')}/>;
}
```

上面`save`、`pickImage`和`close`是调用方提供的回调；示例不声称自带文件系统或图片选择器。

## 0.1.1 修正

补回独立文档旁注组件 `MarginNotes`；修正分发类型中的内部样式引用，并给公开样式入口提供类型声明。严格 TypeScript 消费项目无需借用完整App的样式声明配置。

## 实际验证

独立下载包解压后运行 `npm test`；在模块工作区中运行 `npm --workspace @inkspace/ui test`。脚本先构建库，再在本机临时测试服务器中使用**构建后的ESM**独立挂载表面，已通过45次独立挂载检查（15个props驱动表面、15个缺宿主明确失败、15个显式测试适配器挂载），并核对控制台、空白/框架错误、真实编辑/回调、PDF页面、空间视角切换及隔离内存便签保存。旁注新增验证覆盖编辑、阅读预览、保存回调、位置切换及图片选择回调。仅使用合成内容；测试页设置完整App全局接口访问哨兵以拒绝隐式回退。

2026-10-24复查从GitHub实际下载包开始，在仓库外按包自身声明从官方npm安装依赖；使用Node 24.19、React/ReactDOM 19.3.1和Chrome，原44次检查通过。补回旁注后的同一独立依赖环境构建与45次检查通过，没有链接完整软件的依赖目录。

0.1.1还通过了公开包类型消费检查，以及`npm pack`后安装到另一个全新项目的验证：`skipLibCheck=false`、无通配CSS声明，公开根入口/编辑器/旁注/样式均可导入；生产构建、代码编辑、旁注预览、保存回调和位置切换通过。测试截图仅含合成演示内容。

测试需要已安装Playwright及其Chromium；也可设置`INKSPACE_BROWSER_CHANNEL=chrome`使用已安装Chrome。`INKSPACE_PLAYWRIGHT_MODULE`可显式指定现有Playwright模块，无需改变源码。测试截图写入系统临时目录。Browser插件不可用时使用Playwright，未访问私人资料或AI账号。

这是一组挂载与适配器检查，不代表全部附件/系统能力、真实Pencil、Python执行、FFmpeg导出、AI/Keychain或跨设备数据已经验收。参考各组件的原格式/容量限制及完整软件已知问题。

## License

项目原创代码适用仓库MIT许可。依赖保持各自许可；构建时保留并记录实际打包依赖的许可文件/元数据到`dist/licenses/`，分发构建产物时应保留这些通知。
