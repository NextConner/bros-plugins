# 提交核对清单

## 上传前检查

- 确认扩展在 `chrome://extensions/` 和 `edge://extensions/` 中都能正常运行
- 确认 `manifest.json` 中的版本号是本次计划发布的版本
- 如果品牌、界面或截图内容有变更，重新生成商店素材：`./tools/generate-store-assets.ps1`
- 重新生成上传 ZIP：`./package-extension.ps1`
- 通过 GitHub Pages 或其他静态托管，将 `docs/privacy-policy.html` 发布到公开的 HTTPS 地址

## Chrome Web Store

- 上传 `dist/bros-selection-translator-1.0.0.zip`
- 使用 [STORE_LISTING.zh-CN.md](/D:/github/bros-plugins/STORE_LISTING.zh-CN.md) 或 [STORE_LISTING.md](/D:/github/bros-plugins/STORE_LISTING.md) 中的商店文案
- 上传 `assets/store/` 中的截图
- 上传 `assets/icons/` 中的图标
- 填写已经托管好的隐私政策 URL
- 检查权限说明和 `host_permissions` 是否与商店描述一致

## Edge Add-ons

- 上传 `dist/bros-selection-translator-1.0.0.zip`
- 复用 [STORE_LISTING.zh-CN.md](/D:/github/bros-plugins/STORE_LISTING.zh-CN.md) 或 [STORE_LISTING.md](/D:/github/bros-plugins/STORE_LISTING.md) 中的商店文案
- 上传 `assets/store/` 中的截图
- 上传 `assets/icons/` 中的图标
- 填写已经托管好的隐私政策 URL
- 提交前再次检查分类、标题和元数据

## GitHub Pages 托管步骤

1. 将当前仓库推送到 GitHub 远程仓库。
2. 进入 GitHub 仓库页面，打开 `Settings`。
3. 在左侧导航找到 `Pages`。
4. 在 `Build and deployment` 下，将 `Source` 设为 `Deploy from a branch`。
5. 在分支选择中选 `main`，目录选择 `/docs`。
6. 点击 `Save`。
7. 等待 GitHub 完成页面发布。
8. 发布成功后，访问类似下面的地址确认页面可打开：
   `https://<你的用户名>.github.io/<你的仓库名>/privacy-policy.html`
9. 将这个 HTTPS 地址填入 Chrome Web Store 和 Edge Add-ons 的隐私政策 URL。

## 建议提交

- 提交源码、文档、商店素材和脚本
- 不要提交 `dist/`
- 建议提交信息：`release: prepare bros selection translator 1.0.0`
