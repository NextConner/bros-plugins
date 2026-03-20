const DEFAULT_SETTINGS = {
  defaultTargetLanguage: "zh",
  providers: {
    zh: "google",
    en: "dictionaryapi"
  },
  autoTranslate: true,
  backgroundTheme: "mist",
  disabledPages: []
};

const PROVIDER_OPTIONS = {
  zh: [
    { value: "google", label: "Google" },
    { value: "mymemory", label: "MyMemory" }
  ],
  en: [
    { value: "dictionaryapi", label: "Dictionary" },
    { value: "datamuse", label: "Datamuse" }
  ]
};

let settings = structuredClone(DEFAULT_SETTINGS);
let currentSelection = "";
let panel;
let sourceNode;
let headerPhoneticNode;
let targetGroup;
let providerGroup;
let refreshButton;
let statusNode;
let primaryNode;
let listNode;
let isPageDisabled = false;

init();

async function init() {
  settings = await loadSettings();
  createPanel();
  bindEvents();
}

function bindEvents() {
  if (!hasExtensionContext()) {
    return;
  }

  document.addEventListener("mouseup", handleSelectionEvent, true);
  document.addEventListener("keyup", (event) => {
    if (event.key === "Escape") {
      hidePanel();
      return;
    }

    handleSelectionEvent();
  }, true);

  document.addEventListener("mousedown", (event) => {
    if (!panel.contains(event.target)) {
      hidePanel();
    }
  }, true);

  window.addEventListener("scroll", (event) => {
    const target = event.target;
    const isPageScroll = target === document || target === document.documentElement || target === document.body;

    if (isPageScroll && !panel.hidden) {
      hidePanel();
    }
  }, true);

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "sync") {
      return;
    }

    if (changes.defaultTargetLanguage) {
      settings.defaultTargetLanguage = changes.defaultTargetLanguage.newValue;
    }

    if (changes.providers) {
      settings.providers = {
        ...settings.providers,
        ...(changes.providers.newValue || {})
      };
    }

    if (changes.backgroundTheme) {
      settings.backgroundTheme = changes.backgroundTheme.newValue;
      applyPanelTheme();
    }

    if (changes.disabledPages) {
      settings.disabledPages = Array.isArray(changes.disabledPages.newValue)
        ? changes.disabledPages.newValue
        : [];
      isPageDisabled = checkIsPageDisabled();
      if (isPageDisabled) {
        hidePanel();
      }
    }

    syncControls();
  });
}

function handleSelectionEvent() {
  window.setTimeout(async () => {
    if (isPageDisabled) {
      hidePanel();
      return;
    }

    if (!hasExtensionContext()) {
      renderError("Extension updated. Refresh the page to continue.");
      return;
    }

    const selection = window.getSelection();
    const text = selection?.toString().replace(/\s+/g, " ").trim() || "";

    if (!text || text === currentSelection) {
      return;
    }

    if (!/[a-zA-Z]/.test(text)) {
      return;
    }

    currentSelection = text;
    positionPanel(selection);
    syncControls();
    renderLoading(text);
    panel.hidden = false;

    if (settings.autoTranslate) {
      await translateCurrentSelection();
    }
  }, 0);
}

function createPanel() {
  panel = document.createElement("section");
  panel.id = "bros-selection-translator";
  panel.hidden = true;
  panel.innerHTML = `
    <div class="bst-shell">
      <div class="bst-toolbar">
        <div class="bst-chip-group" data-role="target"></div>
        <div class="bst-chip-group" data-role="provider"></div>
        <button class="bst-icon-button" type="button" title="Refresh">↻</button>
      </div>
      <div class="bst-header">
        <span class="bst-source"></span>
        <span class="bst-header-phonetic"></span>
      </div>
      <div class="bst-body">
        <span class="bst-status" hidden></span>
        <strong class="bst-primary"></strong>
        <div class="bst-list"></div>
      </div>
    </div>
  `;

  document.documentElement.appendChild(panel);

  sourceNode = panel.querySelector(".bst-source");
  headerPhoneticNode = panel.querySelector(".bst-header-phonetic");
  targetGroup = panel.querySelector('[data-role="target"]');
  providerGroup = panel.querySelector('[data-role="provider"]');
  refreshButton = panel.querySelector(".bst-icon-button");
  statusNode = panel.querySelector(".bst-status");
  primaryNode = panel.querySelector(".bst-primary");
  listNode = panel.querySelector(".bst-list");

  refreshButton.addEventListener("click", () => {
    if (currentSelection) {
      translateCurrentSelection();
    }
  });

  applyPanelTheme();
  syncControls();
}

function syncControls() {
  const target = settings.defaultTargetLanguage;
  renderChipGroup(targetGroup, [
    { value: "zh", label: "英中" },
    { value: "en", label: "英英" }
  ], target, async (value) => {
    settings.defaultTargetLanguage = value;
    await saveSettingsFragment({ defaultTargetLanguage: settings.defaultTargetLanguage });
    syncControls();
    if (currentSelection) {
      await translateCurrentSelection();
    }
  });

  renderChipGroup(providerGroup, PROVIDER_OPTIONS[target], settings.providers[target], async (value) => {
    settings.providers[target] = value;
    await saveSettingsFragment({ providers: settings.providers });
    if (currentSelection) {
      await translateCurrentSelection();
    }
  });
}

function renderLoading(text) {
  sourceNode.textContent = text;
  headerPhoneticNode.textContent = "";
  statusNode.hidden = false;
  statusNode.textContent = "Loading...";
  primaryNode.textContent = "";
  listNode.innerHTML = "";
}

function renderError(message) {
  statusNode.hidden = false;
  statusNode.textContent = message;
  primaryNode.textContent = "";
  headerPhoneticNode.textContent = "";
  listNode.innerHTML = "";
}

function renderResult(result) {
  statusNode.hidden = true;
  statusNode.textContent = "";
  primaryNode.textContent = result.primary || "";
  headerPhoneticNode.textContent = result.phonetic || "";
  listNode.innerHTML = "";

  for (const entry of result.entries || []) {
    const item = document.createElement("div");
    item.className = "bst-item";

    const main = document.createElement("span");
    main.className = "bst-item-main";
    main.textContent = entry.label || "";

    const detail = document.createElement("span");
    detail.className = "bst-item-detail";
    detail.textContent = entry.detail || "";

    item.append(main, detail);
    listNode.appendChild(item);
  }
}

async function translateCurrentSelection() {
  if (!hasExtensionContext()) {
    renderError("Extension updated. Refresh the page to continue.");
    return;
  }

  renderLoading(currentSelection);

  const payload = {
    text: currentSelection,
    targetLanguage: settings.defaultTargetLanguage,
    provider: settings.providers[settings.defaultTargetLanguage]
  };

  try {
    const response = await sendRuntimeMessage({
      type: "translate-selection",
      payload
    });

    if (!response?.ok) {
      throw new Error(response?.error || "Translation failed.");
    }

    renderResult(response.result);
  } catch (error) {
    renderError(error.message || "Translation failed.");
  }
}

async function loadSettings() {
  if (!hasExtensionContext()) {
    return structuredClone(DEFAULT_SETTINGS);
  }

  try {
    const response = await sendRuntimeMessage({ type: "get-settings" });
    if (response?.ok) {
      const nextSettings = {
        ...DEFAULT_SETTINGS,
        ...response.result,
        providers: {
          ...DEFAULT_SETTINGS.providers,
          ...(response.result.providers || {})
        }
      };
      isPageDisabled = isPageDisabledBySettings(nextSettings);
      return nextSettings;
    }
  } catch (_error) {
  }

  isPageDisabled = checkIsPageDisabled();
  return structuredClone(DEFAULT_SETTINGS);
}

function positionPanel(selection) {
  const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
  const rect = range?.getBoundingClientRect();

  if (!rect) {
    return;
  }

  const top = window.scrollY + rect.bottom + 10;
  const maxLeft = window.scrollX + window.innerWidth - 340;
  const left = Math.max(window.scrollX + 12, Math.min(window.scrollX + rect.left, maxLeft));

  panel.style.top = `${top}px`;
  panel.style.left = `${left}px`;
}

function hidePanel() {
  panel.hidden = true;
  currentSelection = "";
}

function renderChipGroup(container, options, activeValue, onSelect) {
  container.innerHTML = "";

  for (const option of options) {
    const node = document.createElement("button");
    node.type = "button";
    node.className = "bst-chip";
    node.textContent = option.label;
    node.dataset.value = option.value;
    node.setAttribute("aria-pressed", String(option.value === activeValue));

    if (option.value === activeValue) {
      node.dataset.active = "true";
    }

    node.addEventListener("click", () => {
      if (option.value !== activeValue) {
        Promise.resolve(onSelect(option.value)).catch(handleExtensionContextError);
      }
    });

    container.appendChild(node);
  }
}

function applyPanelTheme() {
  panel.dataset.theme = settings.backgroundTheme || DEFAULT_SETTINGS.backgroundTheme;
}

function hasExtensionContext() {
  return typeof chrome !== "undefined" && Boolean(chrome.runtime?.id);
}

async function sendRuntimeMessage(message) {
  if (!hasExtensionContext()) {
    throw new Error("Extension context invalidated.");
  }

  return chrome.runtime.sendMessage(message);
}

async function saveSettingsFragment(partial) {
  if (!hasExtensionContext()) {
    throw new Error("Extension context invalidated.");
  }

  return chrome.storage.sync.set(partial);
}

function handleExtensionContextError(error) {
  if (isExtensionContextInvalidated(error)) {
    renderError("Extension updated. Refresh the page to continue.");
    return;
  }

  renderError(error?.message || "Operation failed.");
}

function isExtensionContextInvalidated(error) {
  return /Extension context invalidated/i.test(error?.message || "");
}

function checkIsPageDisabled() {
  return isPageDisabledBySettings(settings);
}

function isPageDisabledBySettings(nextSettings) {
  const disabledPages = Array.isArray(nextSettings?.disabledPages) ? nextSettings.disabledPages : [];
  const currentPageKey = getCurrentPageKey();
  return disabledPages.includes(currentPageKey);
}

function getCurrentPageKey() {
  return `${window.location.origin}${window.location.pathname}`;
}
