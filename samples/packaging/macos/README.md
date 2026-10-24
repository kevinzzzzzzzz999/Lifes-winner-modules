# Build the standalone Mac apps

这是构建者使用的发行配方。普通用户下载构建好的 `.app` 即可，不需要 Xcode、Swift、Python 或 Node；互联网下载后的首次打开仍由 macOS 安全策略决定。

在有 Xcode / Swift 和 Python 3 的 Mac 上：

```sh
python3 build-native-apps.py --output /tmp/inkspace-native-output
```

输出 Universal（Apple Silicon + Intel）的 `InkSpace Writing.app`、`InkSpace Preferences.app`，以及中英文使用帮助和 MIT 许可证。最低 macOS 13。`--work` 可指定私有构建目录；输出目录不能已有同名 App。脚本不上传任何文件、不使用个人证书或 Apple 账号、不公证、不改安全设置。

配方从两个原始开发示例复制一份到私有构建目录，保持原示例和旧 Swift 下载包不变。发行覆盖层：

- 书写画板和偏好方案编辑器的中英文名称、Help 菜单与本地帮助。
- 偏好方案默认保存到当前用户的 `~/Library/Application Support/InkSpace Preferences/settings.json`，使用独立 domain `org.inkspace.tools.preferences`，不读取系统或原 InkSpace 偏好。
- 偏好方案的导入/导出使用系统文件对话框；导入复用 `PreferencesStore` 的大小、版本、domain 和内容校验，失败不改变当前方案。导入后仍需点保存。
- 程序绘制的独立图标、Info.plist 和 MIT 许可证。
- 两种架构分别优化编译，Swift/Clang 路径映射、无调试信息、符号裁剪、Universal 合并、移除开发工具的绝对运行时搜索路径，最后只做本地 ad-hoc 签名。

`build-manifest.json` 不记录构建者路径或身份。发行者仍须检查最终二进制的字符串、运行时依赖和最低系统，并测试实际启动与文件保存。脚本故意不自动移除 quarantine。缺少 Apple 开发者证书与公证时，不能承诺从互联网下载后零确认首次打开；参见 [Apple 官方说明](https://support.apple.com/en-us/102445)。
