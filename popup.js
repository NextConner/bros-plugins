const DEFAULT_SETTINGS = {
  defaultTargetLanguage: "zh",
  providers: {
    zh: "google",
    en: "dictionaryapi"
  }
};

const targetLanguage = document.getElementById("target-language");
const providerZh = document.getElementById("provider-zh");
const providerEn = document.getElementById("provider-en");
const openOptionsButton = document.getElementById("open-options");

init();

async function init() {
  const stored = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  const settings = {
    ...DEFAULT_SETTINGS,
    ...stored,
    providers: {
      ...DEFAULT_SETTINGS.providers,
      ...(stored.providers || {})
    }
  };

  targetLanguage.value = settings.defaultTargetLanguage;
  providerZh.value = settings.providers.zh;
  providerEn.value = settings.providers.en;
}

targetLanguage.addEventListener("change", async () => {
  await chrome.storage.sync.set({ defaultTargetLanguage: targetLanguage.value });
});

providerZh.addEventListener("change", async () => {
  const stored = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  const providers = {
    ...DEFAULT_SETTINGS.providers,
    ...(stored.providers || {}),
    zh: providerZh.value
  };

  await chrome.storage.sync.set({ providers });
});

providerEn.addEventListener("change", async () => {
  const stored = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  const providers = {
    ...DEFAULT_SETTINGS.providers,
    ...(stored.providers || {}),
    en: providerEn.value
  };

  await chrome.storage.sync.set({ providers });
});

openOptionsButton.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});
