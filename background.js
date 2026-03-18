const DEFAULT_SETTINGS = {
  defaultTargetLanguage: "zh",
  providers: {
    zh: "google",
    en: "dictionaryapi"
  },
  triggerMode: "mouseup",
  autoTranslate: true
};

chrome.runtime.onInstalled.addListener(async () => {
  const stored = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  const nextSettings = {
    ...DEFAULT_SETTINGS,
    ...stored,
    providers: {
      ...DEFAULT_SETTINGS.providers,
      ...(stored.providers || {})
    }
  };

  await chrome.storage.sync.set(nextSettings);
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "translate-selection") {
    handleTranslation(message.payload)
      .then((result) => sendResponse({ ok: true, result }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message?.type === "get-settings") {
    chrome.storage.sync
      .get(DEFAULT_SETTINGS)
      .then((stored) => {
        sendResponse({
          ok: true,
          result: {
            ...DEFAULT_SETTINGS,
            ...stored,
            providers: {
              ...DEFAULT_SETTINGS.providers,
              ...(stored.providers || {})
            }
          }
        });
      })
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  return false;
});

async function handleTranslation(payload) {
  const text = sanitizeSelection(payload?.text || "");
  const targetLanguage = payload?.targetLanguage || DEFAULT_SETTINGS.defaultTargetLanguage;
  const provider = payload?.provider || DEFAULT_SETTINGS.providers[targetLanguage];

  if (!text) {
    throw new Error("No text selected.");
  }

  if (!/[a-zA-Z]/.test(text)) {
    throw new Error("Only English selections are supported in this version.");
  }

  if (targetLanguage === "zh") {
    if (provider === "mymemory") {
      return translateWithMyMemory(text);
    }

    return translateWithGoogle(text, "zh-CN");
  }

  if (targetLanguage === "en") {
    if (provider === "datamuse") {
      return lookupWithDatamuse(text);
    }

    return lookupWithDictionaryApi(text);
  }

  throw new Error("Unsupported target language.");
}

function sanitizeSelection(value) {
  return value.replace(/\s+/g, " ").trim().slice(0, 240);
}

async function translateWithGoogle(text, targetLanguage) {
  const url = new URL("https://translate.googleapis.com/translate_a/single");
  url.searchParams.set("client", "gtx");
  url.searchParams.set("sl", "en");
  url.searchParams.set("tl", targetLanguage);
  url.searchParams.append("dt", "t");
  url.searchParams.append("dt", "bd");
  url.searchParams.set("q", text);

  const [response, wordMeta] = await Promise.all([
    fetch(url),
    getWordMetaIfPossible(text)
  ]);

  if (!response.ok) {
    throw new Error("Google dictionary request failed.");
  }

  const data = await response.json();
  const translated = Array.isArray(data?.[0])
    ? data[0].map((item) => item?.[0] || "").join("")
    : "";
  const entries = extractGoogleDictionaryEntries(data);

  if (!translated) {
    throw new Error("No translation returned by Google.");
  }

  return {
    mode: isSingleEnglishWord(text) ? "dictionary-translation" : "translation",
    provider: "google",
    targetLanguage: "zh",
    sourceText: text,
    primary: translated,
    phonetic: wordMeta?.phonetic || "",
    entries,
    meta: isSingleEnglishWord(text) ? "Google bilingual dictionary" : "Google Web Translate"
  };
}

async function translateWithMyMemory(text) {
  const url = new URL("https://api.mymemory.translated.net/get");
  url.searchParams.set("q", text);
  url.searchParams.set("langpair", "en|zh-CN");

  const [response, wordMeta] = await Promise.all([
    fetch(url),
    getWordMetaIfPossible(text)
  ]);

  if (!response.ok) {
    throw new Error("MyMemory translation request failed.");
  }

  const data = await response.json();
  const translated = data?.responseData?.translatedText?.trim();
  const matches = Array.isArray(data?.matches) ? data.matches : [];
  const entries = dedupeEntries(matches
    .filter((item) => item?.translation)
    .slice(0, 4)
    .map((item) => ({
      label: item.translation,
      detail: item.segment || ""
    })));

  if (!translated) {
    throw new Error("No translation returned by MyMemory.");
  }

  return {
    mode: isSingleEnglishWord(text) ? "dictionary-translation" : "translation",
    provider: "mymemory",
    targetLanguage: "zh",
    sourceText: text,
    primary: translated,
    phonetic: wordMeta?.phonetic || "",
    entries,
    meta: isSingleEnglishWord(text) ? "MyMemory bilingual suggestions" : "MyMemory"
  };
}

async function lookupWithDictionaryApi(text) {
  const word = normalizeWordInput(text);
  const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("No English definition found for this selection.");
    }

    throw new Error("Dictionary API request failed.");
  }

  const data = await response.json();
  const first = data?.[0];
  const phonetic = first?.phonetic || first?.phonetics?.find((item) => item?.text)?.text || "";
  const entries = [];

  for (const meaning of first?.meanings || []) {
    for (const definition of meaning.definitions || []) {
      if (definition?.definition) {
        entries.push({
          label: definition.definition,
          detail: meaning.partOfSpeech || ""
        });
      }
      if (entries.length >= 6) {
        break;
      }
    }
    if (entries.length >= 6) {
      break;
    }
  }

  if (!entries.length) {
    throw new Error("Dictionary API returned no definitions.");
  }

  return {
    mode: "dictionary",
    provider: "dictionaryapi",
    targetLanguage: "en",
    sourceText: word,
    primary: entries[0].label,
    phonetic,
    entries,
    meta: "Free Dictionary API"
  };
}

async function lookupWithDatamuse(text) {
  const word = normalizeWordInput(text);
  const url = new URL("https://api.datamuse.com/words");
  url.searchParams.set("sp", word);
  url.searchParams.set("md", "d");
  url.searchParams.set("max", "5");

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Datamuse request failed.");
  }

  const data = await response.json();
  const exact = data.find((item) => item?.word?.toLowerCase() === word.toLowerCase()) || data[0];
  const defs = Array.isArray(exact?.defs) ? exact.defs : [];
  const entries = defs.slice(0, 6).map((item) => {
    const [partOfSpeech, ...rest] = item.split("\t");
    return {
      label: rest.join(" ").trim(),
      detail: partOfSpeech || ""
    };
  });

  if (!entries.length) {
    throw new Error("No English definition found in Datamuse.");
  }

  return {
    mode: "dictionary",
    provider: "datamuse",
    targetLanguage: "en",
    sourceText: word,
    primary: entries[0].label,
    phonetic: "",
    entries,
    meta: "Datamuse"
  };
}

function normalizeWordInput(text) {
  const word = text.trim();
  if (!/^[a-zA-Z][a-zA-Z'-]*$/.test(word)) {
    throw new Error("English dictionary mode currently supports single English words.");
  }

  return word;
}

function isSingleEnglishWord(text) {
  return /^[a-zA-Z][a-zA-Z'-]*$/.test(text.trim());
}

async function getWordMetaIfPossible(text) {
  if (!isSingleEnglishWord(text)) {
    return null;
  }

  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(text.trim())}`
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const first = data?.[0];
    return {
      phonetic: first?.phonetic || first?.phonetics?.find((item) => item?.text)?.text || ""
    };
  } catch (_error) {
    return null;
  }
}

function extractGoogleDictionaryEntries(data) {
  const rawEntries = Array.isArray(data?.[1]) ? data[1] : [];
  const entries = [];

  for (const part of rawEntries) {
    const partOfSpeech = part?.[0] || "";
    const terms = Array.isArray(part?.[1]) ? part[1] : [];

    for (const term of terms) {
      const label = Array.isArray(term) ? term[0] : "";
      if (!label) {
        continue;
      }

      entries.push({
        label,
        detail: partOfSpeech
      });

      if (entries.length >= 6) {
        return dedupeEntries(entries);
      }
    }
  }

  return dedupeEntries(entries);
}

function dedupeEntries(entries) {
  const seen = new Set();
  return entries.filter((entry) => {
    const key = `${entry.label}__${entry.detail}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}
