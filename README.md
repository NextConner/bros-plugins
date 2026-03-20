# bros-plugins

A Chromium extension for selected-text translation.

## Current plugin

`Bros Selection Translator` is a Manifest V3 extension that translates selected English text:

- `English -> Chinese`
  - providers: `Google Web`, `MyMemory`
  - single-word selection prioritizes phonetic symbols and multiple Chinese senses
  - phrase or sentence selection falls back to general translation
- `English -> English`
  - providers: `Free Dictionary API`, `Datamuse`
  - implemented as English dictionary lookup for single words
  - intended for definitions rather than sentence translation

## Features

- Translate selected English text directly on the page with an in-page floating result card
- Show phonetic symbols at the top of the card when a word has dictionary metadata
- Show multiple Chinese senses for English single-word selections when provider data is available
- Switch target mode between `English -> Chinese` and `English -> English`
- Choose translation or dictionary providers separately for each mode
- Persist settings with `chrome.storage.sync`
- Open a quick toolbar popup or full options page for configuration

## Files

- `manifest.json`: extension manifest
- `background.js`: provider routing and response normalization
- `content.js` + `content.css`: selected-text detection and in-page result card
- `popup.*`: quick settings in the toolbar popup
- `options.*`: full settings page
- `assets/icons/*`: release-ready extension icons
- `assets/store/*`: store listing screenshots
- `PRIVACY.md`: privacy policy source
- `privacy-policy.html`: publishable privacy policy page
- `STORE_LISTING.md`: English store listing copy
- `package-extension.ps1`: packaging script for store upload ZIP
- `docs/*`: GitHub Pages-ready privacy policy publishing directory
- `SUBMISSION_CHECKLIST.md`: store submission checklist

## Browser Support

- Microsoft Edge
- Google Chrome
- Other Chromium browsers that support Manifest V3 and `chrome.*` extension APIs

## Load in Edge

1. Open `edge://extensions/`
2. Enable `Developer mode`
3. Click `Load unpacked`
4. Select this repository folder: `D:\github\bros-plugins`

## Load in Chrome

1. Open `chrome://extensions/`
2. Enable `Developer mode`
3. Click `Load unpacked`
4. Select this repository folder: `D:\github\bros-plugins`

## Notes

- `English -> English` is a dictionary mode and currently focuses on single-word definitions.
- Translation providers are online services and may have rate limits or availability changes.
- The implementation uses standard `chrome.*` APIs and Manifest V3, so no code fork is required for Chrome.
- The repository now includes generated icons and screenshots for store submission.

## Chinese README

- [README.zh-CN.md](README.zh-CN.md)
- [RELEASE.zh-CN.md](RELEASE.zh-CN.md)
- [SUBMISSION_CHECKLIST.md](SUBMISSION_CHECKLIST.md)

## Release Guide

### 1. Prepare the package

1. Make sure the extension directory contains the latest source files.
2. Confirm `manifest.json` version is updated before each release.
3. Remove any local-only files that should not be published.
4. Package the extension directory as a `.zip` file when uploading to stores.

### 2. Chrome Web Store

1. Open the Chrome Web Store Developer Dashboard.
2. Create a new item and upload the packaged extension.
3. Fill in the store listing:
   - extension name
   - short description
   - detailed description
   - screenshots
   - icons
   - privacy policy URL if required by the store listing
4. Review requested permissions and host permissions.
5. Submit for review and wait for approval.

### 3. Edge Add-ons

1. Open the Microsoft Partner Center for Edge Add-ons.
2. Create a new extension submission.
3. Upload the same extension package used for Chrome.
4. Complete the store metadata:
   - title
   - short description
   - long description
   - screenshots
   - logos
   - category
   - privacy policy URL if required
5. Submit for certification and wait for approval.

### 4. Recommended publishing assets

- `16x16`, `32x32`, `48x48`, `128x128` extension icons
- at least 1 to 3 screenshots of the popup, options page, and in-page translation card
- store short and long descriptions
- privacy policy page describing use of online translation and dictionary providers
- versioned changelog for each release

Included in this repository:

- icons: `assets/icons/icon-16.png`, `icon-32.png`, `icon-48.png`, `icon-128.png`
- screenshots: `assets/store/screenshot-1-in-page-card.png`, `screenshot-2-popup.png`, `screenshot-3-settings.png`
- privacy policy source: `PRIVACY.md`
- privacy policy page: `privacy-policy.html`
- store listing copy: `STORE_LISTING.md`
- upload package script: `package-extension.ps1`

### 5. Current project gaps before store submission

- host `privacy-policy.html` at a public HTTPS URL and use that URL in Chrome Web Store and Edge Add-ons
- review whether the selected online providers and descriptions match your final production policy
- run `./package-extension.ps1` after final testing if you need a fresh upload ZIP

## ECDICT Offline Integration

This extension can use the `skywind3000/ECDICT` dataset as an offline English-to-Chinese provider for single-word lookups.

1. Generate the local dictionary bundle:

```powershell
node .\tools\build-ecdict.js
```

2. Reload the extension.
3. Switch the Chinese provider to `ECDICT Offline` in the popup or options page.

Notes:

- The build script downloads `ecdict.mini.csv` from the upstream ECDICT repository when the source file is missing.
- The generated file is written to `assets/dictionaries/ecdict.json`.
- `ECDICT Offline` is intended for single-word dictionary lookups. Phrases and sentences should continue to use `Google Web` or `MyMemory`.
