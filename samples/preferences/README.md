# Preferences Demo

独立可启动的macOS设置演示，消费 `InkSpacePreferences` SwiftPM产品。需macOS 13+和Xcode/Swift 5.9+。使用合成默认值、独立JSON文件和明确存储域，不需要完整InkSpace。

在包含此README和`Package.swift`的目录运行：

```sh
bash script/build_and_run.sh
```

脚本构建并启动独立`.app`，为示例添加本机ad-hoc临时签名，无需Apple账号、个人证书或私钥；这不代表已公证的公众安装包。可用 `--verify` 检查启动进程、`--debug`进入调试器、`--logs`查看进程日志。也可以在Xcode中打开此目录，或运行 `swift run InkSpacePreferencesDemo`。

四页设置分别包含语言与布局、工具栏与笔预设、Pencil操作选择、播放与字幕外观。修改后点Save，再Reload；也可退出重开，检查保留的值。Save快捷键为⌘S。默认文件在系统临时目录的`InkSpacePreferencesDemo/settings.json`，可随系统清理；生产应用应注入自己的持久目录。语言“跟随系统”只读取宿主提供的语言列表，不读取原App偏好。

```sh
swift test
swift run InkSpacePreferencesDemo --self-test /tmp/preferences-synthetic.json
swift run InkSpacePreferencesDemo --verify-persistence /tmp/preferences-synthetic.json
```

最后两条分别以独立进程保存与重读同一份合成JSON。GUI也可显式指定位置：`swift run InkSpacePreferencesDemo --store /tmp/preferences-demo.json`。不要把私人应用设置或密钥文件作为示例路径。

库提供实际校验、顺序编辑和持久化；Pencil硬件事件、PencilKit书写、字幕播放/翻译/AI服务仍需各自宿主接入。演示只保存这些操作的偏好，不连接服务，也不打开资料库。
