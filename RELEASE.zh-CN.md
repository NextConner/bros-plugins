# 发布说明

本文档用于说明如何将 `Bros Selection Translator` 发布到 Chrome Web Store 和 Edge Add-ons。

## 1. 打包前检查

1. 确认扩展目录中的代码已更新到待发布版本。
2. 发布前更新 `manifest.json` 中的 `version`。
3. 清理不需要上传到商店的本地文件。
4. 将整个扩展目录打包为 `.zip` 文件，用于商店上传。

## 2. 发布到 Chrome Web Store

1. 打开 Chrome Web Store Developer Dashboard。
2. 创建新的扩展条目并上传打包后的扩展文件。
3. 完善商店信息：
   - 扩展名称
   - 简短描述
   - 详细描述
   - 截图
   - 图标
   - 如商店要求，提供隐私政策链接
4. 检查扩展申请的权限与 `host_permissions`。
5. 提交审核并等待通过。

## 3. 发布到 Edge Add-ons

1. 打开 Microsoft Partner Center 的 Edge Add-ons 发布页面。
2. 创建新的扩展提交流程。
3. 上传与 Chrome 相同的扩展安装包。
4. 完善商店元数据：
   - 标题
   - 简短描述
   - 详细描述
   - 截图
   - Logo
   - 分类
   - 如商店要求，提供隐私政策链接
5. 提交认证并等待审核结果。

## 4. 建议准备的发布素材

- `16x16`、`32x32`、`48x48`、`128x128` 图标
- 1 到 3 张截图，建议包含：
  - 页内划词翻译卡片
  - 工具栏弹窗
  - 设置页
- 商店短描述与长描述
- 隐私政策页面，说明会访问在线翻译和词典服务
- 每个版本对应的更新日志

当前仓库已提供：

- 图标：`assets/icons/icon-16.png`、`icon-32.png`、`icon-48.png`、`icon-128.png`
- 截图：`assets/store/screenshot-1-in-page-card.png`、`screenshot-2-popup.png`、`screenshot-3-settings.png`
- 隐私政策：`PRIVACY.md`、`PRIVACY.zh-CN.md`
- GitHub Pages 发布目录：`docs/`
- 商店文案：`STORE_LISTING.md`、`STORE_LISTING.zh-CN.md`
- 提交核对清单：`SUBMISSION_CHECKLIST.md`

## 5. 当前项目发布前还缺的内容

- 将隐私政策托管到公开的 HTTPS 地址，并把该 URL 填到商店后台
- 在最终提交前确认第三方翻译/词典来源与商店文案一致
- 最后一次手工联调后，将仓库内容打包为 ZIP 上传
