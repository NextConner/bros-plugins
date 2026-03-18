# Privacy Policy

`Bros Selection Translator` processes only the text that the user actively selects on a webpage.

## What the extension does

- reads the selected text on the current page after the user highlights English content
- sends the selected text to the configured online translation or dictionary provider
- stores extension preferences in browser sync storage

## Data that may be sent to third-party services

Depending on the provider selected by the user, the extension may send the chosen text to:

- `https://translate.googleapis.com/`
- `https://api.mymemory.translated.net/`
- `https://api.dictionaryapi.dev/`
- `https://api.datamuse.com/`

The extension does not send full webpage contents. It sends only the text currently selected by the user.

## Data stored locally

The extension stores the following settings in `chrome.storage.sync`:

- default translation direction
- selected Chinese translation provider
- selected English dictionary provider
- auto-translate preference

## Data collection

- no account system is included
- no analytics or tracking SDK is included
- no personal profile is created by the extension
- no translation history is uploaded by this project itself

## User control

Users control:

- whether to use the extension at all
- what text to select
- which provider to use
- whether auto-translate is enabled

Users can remove the extension at any time and clear browser extension storage from the browser settings.

## Contact and hosting

Before publishing to the Chrome Web Store or Edge Add-ons, host this policy at a public HTTPS URL and use that URL in the store listing.
