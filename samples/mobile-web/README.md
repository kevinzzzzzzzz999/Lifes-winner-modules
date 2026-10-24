# life'winner · 三个独立主屏幕应用

希望每一个使用我开源功能的人，都是各自的 life'winner。

书写画板、偏好方案、文档工作台分别安装到 iPhone / iPad 主屏幕。只需要 Safari；使用者无需 Xcode、Node.js、npm、账号或完整版 life'winner。三个入口各有自己的 manifest 身份、启动页、安装 scope、本地草稿键及离线缓存。公共界面文件会随所选工具下载，不会预先下载另外两个工具。

用正式 HTTPS 链接打开某个工具 → Safari 分享 → 添加到主屏幕 → 添加。若出现“作为网页 App 打开”，保持开启。首次联网打开，等到“可离线使用”。重要文件应导出备份；浏览器页面与安装后的 App、不同浏览器、设备之间不保证共用存储。推荐使用近期版本的 iOS / iPadOS。

- [书写画板](writing/README.md)：矢量笔迹、停留形状、演示辅助、内部复制与可见拖动、文字卡片，独立 JSON 文件。
- [偏好方案](preferences/README.md)：四组配置、实际试写预览及 JSON 方案；只作用本工具和导出的方案。
- [文档工作台](documents/README.md)：有界 UTF-8 文本打开、只读预览、编辑副本、多标签、本机草稿、导出及分享。

## 隐私与存储

没有账号、内容上传接口、广告或统计，不读取原 life'winner 数据。应用只处理显式导入的内容；文件导出/系统分享由用户主动触发。静态托管方仍会收到普通网页请求和连接信息；内容不放入请求或网址。独立存储键与缓存是逻辑边界，同源网页不是操作系统安全沙盒。清理网站数据、卸载或系统回收可能清除草稿，不能取代导出备份。完整说明见 `privacy.html`。

## 开发与自托管

本目录是完整可编辑源，MIT 许可。运行时无构建依赖和外部 CDN。下面的 Python 与 Node 命令只供开发者检查/生成站点，普通使用者不用安装。

```sh
node writing/tests.mjs
node preferences/tests.mjs
node documents/tests.mjs
python3 scripts/build-site.py --output /tmp/inkspace-mobile-site
```

输出目录必须尚不存在，且在源码目录之外。将输出目录部署为 HTTPS 静态站点即可；支持放在子路径。构建显式只复制每个工具的四个运行文件与公共界面，再生成 metadata-free PNG 图标、manifest、按工具隔离的离线 worker 和逐文件 SHA 清单。测试、README、本机配置、开发缓存与原始个人数据不进入站点。

不要直接在 iPhone 的“文件”中双击源码 HTML 作为安装方式，模块脚本和离线能力需要正式 HTTPS 网站；源码 ZIP 不是可直接安装的 IPA。原生 App Store / TestFlight 版本另需合适的组织账号、签名和审核，本发布不使用个人 Apple 身份。

## 更新

在现有每月同步中审查完成的源修改、运行受影响测试与浏览器验证，再部署新站点。离线新版本等待当前工具的所有窗口安全关闭后接管，不强行刷新正在编辑的内容。不能在未通过公开链接、文件摘要和断网验证前宣称发布完成。
