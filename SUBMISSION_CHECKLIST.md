# Submission Checklist

## Before Upload

- Confirm the extension works in both `chrome://extensions/` and `edge://extensions/`
- Confirm `manifest.json` version is the intended release version
- Regenerate store assets if branding or UI changed: `./tools/generate-store-assets.ps1`
- Regenerate the upload ZIP: `./package-extension.ps1`
- Host `docs/privacy-policy.html` at a public HTTPS URL via GitHub Pages or another static host

## Chrome Web Store

- Upload `dist/bros-selection-translator-1.0.0.zip`
- Use the copy from `STORE_LISTING.md`
- Upload screenshots from `assets/store/`
- Upload icons from `assets/icons/`
- Fill in the hosted privacy policy URL
- Verify permissions and host permissions match the listing description

## Edge Add-ons

- Upload `dist/bros-selection-translator-1.0.0.zip`
- Reuse the copy from `STORE_LISTING.md`
- Upload screenshots from `assets/store/`
- Upload icons from `assets/icons/`
- Fill in the hosted privacy policy URL
- Verify metadata and category before submission

## GitHub Pages

- Push the repository to GitHub
- In repository settings, set GitHub Pages source to `Deploy from a branch`
- Choose branch `main` and folder `/docs`
- After publish, verify `docs/privacy-policy.html` is reachable over HTTPS

## Suggested Commit

- Stage source files, docs, store assets, and scripts
- Do not commit `dist/`
- Suggested message: `release: prepare bros selection translator 1.0.0`
