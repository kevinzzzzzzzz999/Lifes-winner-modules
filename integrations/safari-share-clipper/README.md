# Safari share clipper — source integration

这是一份可复用的 **iOS Share Extension 源码集成**，目前尚不是可直接安装的独立 App 或已完成的 Xcode target。本目录不依赖 InkSpace 的 App Group、共享容器或完整应用源代码。

扩展在用户选择 Safari 分享菜单后，只提取网页标题、来源 URL 和选中的文字，生成 `Web Clip.inkclip.json`。用户使用系统文件选择器保存该文件；保存后无需立即运行完整 InkSpace。消费剪藏内容的程序需支持 `format: inkspace.webclip`、`version: 1` 格式。现有完整 InkSpace 浏览器提供导入入口；其他程序也可自行实现此格式。这里不发送内容给网络服务。

## 文件和构建边界

- `ShareClipViewController.swift`：UIKit 分享界面、输入校验、文件导出与取消清理。
- `ClipPreprocessor.js`：Safari 的显式分享预处理，只取标题、URL、选中文字。
- `Info.plist`：分享扩展激活规则与入口类。

iOS 需要一个签名的承载 App 来安装分享扩展。你可以使用自己的最小 App；不要求安装完整 InkSpace。请先创建自己的 iOS App 和 Share Extension target，把上述文件加入扩展 target，将 `ClipPreprocessor.js` 加入 Copy Bundle Resources，使用这里的 Info.plist，并关闭自动生成扩展 Info.plist。入口类是 `$(PRODUCT_MODULE_NAME).ShareClipViewController`；设置自己的唯一Bundle Identifier、Team，匹配主App/扩展版本，并让承载App嵌入扩展。建议部署目标iOS 18.0及以上。

本仓库没有生成这样的承载App或扩展工程；尚未构建独立target、安装到设备或完成Safari分享验收。不要把源码复制视为可安装成品。若手动加入完整InkSpace工程，其现有项目生成器只维护主应用，重新运行会丢弃手动target配置；要长期维护，应将扩展纳入你自己的工程生成流程。

## 交换格式

```json
{
  "format": "inkspace.webclip",
  "version": 1,
  "title": "Example page",
  "url": "https://example.org/",
  "text": "User-selected text"
}
```

仅支持HTTP/HTTPS网页，URL/标题/选中文字有长度上限；不会导出网页HTML、表单、Cookie或整页正文。取消不代表保存成功，消费应用也应验证路径、大小、协议和字段。

## 验证与许可

本次仅完成plist检查、JavaScript与Swift源语法解析、预处理器的合成选中文字测试，以及与完整应用导入格式的静态对应；没有复用已签名的`.appex`。项目自有代码适用仓库根目录的 [MIT License](LICENSE)。

This is reusable iOS Share Extension source, not a prebuilt app. A signed containing app and a Share Extension target are still required. It exports a user-saved, versioned JSON file; a compatible importer is separate. No standalone target build or real Safari validation is claimed.
