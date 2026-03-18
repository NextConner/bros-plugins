const DEFAULT_SETTINGS = {
  defaultTargetLanguage: "zh",
  providers: {
    zh: "google",
    en: "dictionaryapi"
  },
  autoTranslate: true
};

const PROVIDER_OPTIONS = {
  zh: [
    { value: "google", label: "Google Web" },
    { value: "mymemory", label: "MyMemory" }
  ],
  en: [
    { value: "dictionaryapi", label: "Free Dictionary" },
    { value: "datamuse", label: "Datamuse" }
  ]
};

let settings = structuredClone(DEFAULT_SETTINGS);
let currentSelection = "";
let panel;
let sourceNode;
let headerPhoneticNode;
let targetSelect;
let providerSelect;
let refreshButton;
let statusNode;
let primaryNode;
let listNode;
let footerNode;

init();

async function init() {
  settings = await loadSettings();
  createPanel();
  bindEvents();
}

function bindEvents() {
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

  window.addEventListener("scroll", () => {
    if (!panel.hidden) {
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

    syncControls();
  });
}

function handleSelectionEvent() {
  window.setTimeout(async () => {
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
    <div class="bst-header">
      <strong class="bst-title">Selection Translator</strong>
      <span class="bst-header-phonetic"></span>
      <span class="bst-source"></span>
    </div>
    <div class="bst-body">
      <div class="bst-controls">
        <select class="bst-select" data-role="target">
          <option value="zh">英译中</option>
          <option value="en">英译英</option>
        </select>
        <select class="bst-select" data-role="provider"></select>
        <button class="bst-button" type="button" title="Refresh">↻</button>
      </div>
      <span class="bst-status"></span>
      <strong class="bst-primary"></strong>
      <div class="bst-list"></div>
    </div>
    <div class="bst-footer"></div>
  `;

  document.documentElement.appendChild(panel);

  sourceNode = panel.querySelector(".bst-source");
  headerPhoneticNode = panel.querySelector(".bst-header-phonetic");
  targetSelect = panel.querySelector('[data-role="target"]');
  providerSelect = panel.querySelector('[data-role="provider"]');
  refreshButton = panel.querySelector(".bst-button");
  statusNode = panel.querySelector(".bst-status");
  primaryNode = panel.querySelector(".bst-primary");
  listNode = panel.querySelector(".bst-list");
  footerNode = panel.querySelector(".bst-footer");

  targetSelect.addEventListener("change", async () => {
    settings.defaultTargetLanguage = targetSelect.value;
    await chrome.storage.sync.set({ defaultTargetLanguage: settings.defaultTargetLanguage });
    syncControls();
    if (currentSelection) {
      await translateCurrentSelection();
    }
  });

  providerSelect.addEventListener("change", async () => {
    settings.providers[targetSelect.value] = providerSelect.value;
    await chrome.storage.sync.set({ providers: settings.providers });
    if (currentSelection) {
      await translateCurrentSelection();
    }
  });

  refreshButton.addEventListener("click", () => {
    if (currentSelection) {
      translateCurrentSelection();
    }
  });

  syncControls();
}

function syncControls() {
  const target = settings.defaultTargetLanguage;
  targetSelect.value = target;
  providerSelect.innerHTML = "";

  for (const option of PROVIDER_OPTIONS[target]) {
    const node = document.createElement("option");
    node.value = option.value;
    node.textContent = option.label;
    providerSelect.appendChild(node);
  }

  providerSelect.value = settings.providers[target];
}

function renderLoading(text) {
  sourceNode.textContent = text;
  headerPhoneticNode.textContent = "";
  statusNode.textContent = "Loading...";
  primaryNode.textContent = "";
  listNode.innerHTML = "";
  footerNode.textContent = "";
}

function renderError(message) {
  statusNode.textContent = message;
  primaryNode.textContent = "";
  headerPhoneticNode.textContent = "";
  listNode.innerHTML = "";
  footerNode.textContent = "";
}

function renderResult(result) {
  statusNode.textContent = describeMode(result.mode, targetSelect.value);
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

  footerNode.textContent = `${result.meta} · ${describeProvider(result.provider)}`;
}

async function translateCurrentSelection() {
  renderLoading(currentSelection);

  const payload = {
    text: currentSelection,
    targetLanguage: targetSelect.value,
    provider: providerSelect.value
  };

  try {
    const response = await chrome.runtime.sendMessage({
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
  try {
    const response = await chrome.runtime.sendMessage({ type: "get-settings" });
    if (response?.ok) {
      return {
        ...DEFAULT_SETTINGS,
        ...response.result,
        providers: {
          ...DEFAULT_SETTINGS.providers,
          ...(response.result.providers || {})
        }
      };
    }
  } catch (_error) {
  }

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

function describeProvider(provider) {
  switch (provider) {
    case "google":
      return "Google Web";
    case "mymemory":
      return "MyMemory";
    case "dictionaryapi":
      return "Free Dictionary";
    case "datamuse":
      return "Datamuse";
    default:
      return provider;
  }
}

function describeMode(mode, targetLanguage) {
  if (targetLanguage === "en") {
    return "English Dictionary";
  }

  if (mode === "dictionary-translation") {
    return "Bilingual Dictionary";
  }

  return "Translation";
}
