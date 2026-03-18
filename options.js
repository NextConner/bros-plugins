const DEFAULT_SETTINGS = {
  defaultTargetLanguage: "zh",
  providers: {
    zh: "google",
    en: "dictionaryapi"
  },
  autoTranslate: true,
  backgroundTheme: "mist"
};

const targetLanguage = document.getElementById("target-language");
const providerZh = document.getElementById("provider-zh");
const providerEn = document.getElementById("provider-en");
const autoTranslate = document.getElementById("auto-translate");
const backgroundTheme = document.getElementById("background-theme");

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
  autoTranslate.checked = Boolean(settings.autoTranslate);
  backgroundTheme.value = settings.backgroundTheme;
}

targetLanguage.addEventListener("change", async () => {
  await chrome.storage.sync.set({ defaultTargetLanguage: targetLanguage.value });
});

providerZh.addEventListener("change", saveProviders);
providerEn.addEventListener("change", saveProviders);

autoTranslate.addEventListener("change", async () => {
  await chrome.storage.sync.set({ autoTranslate: autoTranslate.checked });
});

backgroundTheme.addEventListener("change", async () => {
  await chrome.storage.sync.set({ backgroundTheme: backgroundTheme.value });
});

async function saveProviders() {
  await chrome.storage.sync.set({
    providers: {
      zh: providerZh.value,
      en: providerEn.value
    }
  });
}
