const DEFAULT_SETTINGS = {
  defaultTargetLanguage: "zh",
  providers: {
    zh: "google",
    en: "dictionaryapi"
  },
  backgroundTheme: "mist",
  disabledPages: []
};

const targetLanguage = document.getElementById("target-language");
const providerZh = document.getElementById("provider-zh");
const providerEn = document.getElementById("provider-en");
const backgroundTheme = document.getElementById("background-theme");
const toggleCurrentPageButton = document.getElementById("toggle-current-page");
const openOptionsButton = document.getElementById("open-options");
let currentPageKey = "";

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
  const activeTab = await getActiveTab();

  targetLanguage.value = settings.defaultTargetLanguage;
  providerZh.value = settings.providers.zh;
  providerEn.value = settings.providers.en;
  backgroundTheme.value = settings.backgroundTheme;
  currentPageKey = getPageKeyFromUrl(activeTab?.url);
  syncCurrentPageButton(settings);
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

backgroundTheme.addEventListener("change", async () => {
  await chrome.storage.sync.set({ backgroundTheme: backgroundTheme.value });
});

toggleCurrentPageButton.addEventListener("click", async () => {
  if (!currentPageKey) {
    return;
  }

  const stored = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  const disabledPages = Array.isArray(stored.disabledPages) ? [...stored.disabledPages] : [];
  const nextDisabledPages = disabledPages.includes(currentPageKey)
    ? disabledPages.filter((item) => item !== currentPageKey)
    : [...disabledPages, currentPageKey];

  await chrome.storage.sync.set({ disabledPages: nextDisabledPages });
  syncCurrentPageButton({ ...stored, disabledPages: nextDisabledPages });
});

openOptionsButton.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

function syncCurrentPageButton(settings) {
  if (!currentPageKey) {
    toggleCurrentPageButton.disabled = true;
    toggleCurrentPageButton.textContent = "当前页面不支持切换";
    return;
  }

  const disabledPages = Array.isArray(settings.disabledPages) ? settings.disabledPages : [];
  const isDisabled = disabledPages.includes(currentPageKey);
  toggleCurrentPageButton.disabled = false;
  toggleCurrentPageButton.textContent = isDisabled ? "在当前页面启用" : "在当前页面不启用";
  toggleCurrentPageButton.dataset.active = String(isDisabled);
}

async function getActiveTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
}

function getPageKeyFromUrl(url) {
  if (!url) {
    return "";
  }

  try {
    const parsed = new URL(url);
    if (!/^https?:$/.test(parsed.protocol)) {
      return "";
    }

    return `${parsed.origin}${parsed.pathname}`;
  } catch (_error) {
    return "";
  }
}
