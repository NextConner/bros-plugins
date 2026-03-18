# bros-plugins

这是一个基于 Chromium 的划词翻译扩展。

## 当前插件

`Bros Selection Translator` 是一个 Manifest V3 扩展，支持对英文划词结果进行翻译或词典查询：

- `英译中`
  - 可选来源：`Google Web`、`MyMemory`
  - 当选中的是英文单词时，优先展示音标和多个中文义项
  - 当选中的是短语或句子时，回退为普通翻译结果
- `英译英`
  - 可选来源：`Free Dictionary API`、`Datamuse`
  - 采用英英词典方式实现
  - 当前面向单词释义，不适合整句翻译

## 功能说明

- 在网页中划词后，直接弹出页内结果卡片
- 单词查询时，音标显示在卡片顶部
- 英译中在可用时展示多个中文释义
- 支持在 `英译中` 和 `英译英` 之间切换
- 支持分别选择翻译来源和词典来源
- 设置通过 `chrome.storage.sync` 持久化
- 支持工具栏弹窗快速设置，也支持完整设置页

## 文件说明

- `manifest.json`：扩展清单
- `background.js`：翻译来源调度与结果归一化
- `content.js` + `content.css`：划词检测与页内浮层卡片
- `popup.*`：工具栏弹窗设置
- `options.*`：完整设置页
- `assets/icons/*`：可直接用于发布的扩展图标
- `assets/store/*`：商店截图素材
- `PRIVACY.zh-CN.md`：中文隐私政策
- `privacy-policy.zh-CN.html`：可直接托管的中文隐私政策页面
- `STORE_LISTING.zh-CN.md`：中文商店文案
- `package-extension.ps1`：生成上传 ZIP 的打包脚本
- `docs/*`：可直接用于 GitHub Pages 的静态发布目录
- `SUBMISSION_CHECKLIST.md`：商店提交流程核对清单
- `SUBMISSION_CHECKLIST.zh-CN.md`：中文提交流程核对清单

## 支持的浏览器

- Microsoft Edge
- Google Chrome
- 其他支持 Manifest V3 和 `chrome.*` 扩展 API 的 Chromium 浏览器

## 在 Edge 中加载

1. 打开 `edge://extensions/`
2. 开启“开发人员模式”
3. 点击“加载解压缩的扩展”
4. 选择仓库目录：`D:\github\bros-plugins`

## 在 Chrome 中加载

1. 打开 `chrome://extensions/`
2. 开启“开发者模式”
3. 点击“加载已解压的扩展程序”
4. 选择仓库目录：`D:\github\bros-plugins`

## 说明

- `英译英` 当前是词典模式，仅适合单词查询。
- 在线翻译/词典来源可能存在速率限制或可用性波动。
- 当前实现使用标准 Manifest V3 和 `chrome.*` API，因此无需为 Chrome 单独维护一套代码。
- 仓库中已包含图标和商店截图素材，可直接用于上架准备。

## 发布说明

- [RELEASE.zh-CN.md](RELEASE.zh-CN.md)
- [PRIVACY.zh-CN.md](PRIVACY.zh-CN.md)
- [STORE_LISTING.zh-CN.md](STORE_LISTING.zh-CN.md)
- [SUBMISSION_CHECKLIST.md](SUBMISSION_CHECKLIST.md)
- [SUBMISSION_CHECKLIST.zh-CN.md](SUBMISSION_CHECKLIST.zh-CN.md)
