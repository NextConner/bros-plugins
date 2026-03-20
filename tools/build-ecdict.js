"use strict";

const fs = require("node:fs");
const path = require("node:path");
const https = require("node:https");

const ROOT_DIR = path.resolve(__dirname, "..");
const DEFAULT_SOURCE_URL = "https://raw.githubusercontent.com/skywind3000/ECDICT/master/ecdict.mini.csv";
const DEFAULT_INPUT_PATH = path.join(ROOT_DIR, "assets", "dictionaries", "ecdict.mini.csv");
const DEFAULT_OUTPUT_PATH = path.join(ROOT_DIR, "assets", "dictionaries", "ecdict.json");
const WORD_PATTERN = /^[A-Za-z][A-Za-z'-]*$/;

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const inputPath = path.resolve(ROOT_DIR, args.input || DEFAULT_INPUT_PATH);
  const outputPath = path.resolve(ROOT_DIR, args.output || DEFAULT_OUTPUT_PATH);
  const sourceUrl = args.source || DEFAULT_SOURCE_URL;

  await fs.promises.mkdir(path.dirname(inputPath), { recursive: true });
  await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });

  if (!fs.existsSync(inputPath)) {
    await downloadFile(sourceUrl, inputPath);
  }

  const entries = Object.create(null);
  let rowCount = 0;
  let keptCount = 0;
  let headers = null;

  await parseCsvFile(inputPath, (row) => {
    if (!headers) {
      headers = row;
      return;
    }

    rowCount += 1;
    const record = Object.fromEntries(headers.map((header, index) => [header, row[index] || ""]));
    const normalized = normalizeRecord(record);
    if (!normalized) {
      return;
    }

    const existing = entries[normalized.key];
    if (!existing || scoreEntry(normalized.entry) > scoreEntry(existing)) {
      entries[normalized.key] = normalized.entry;
    }

    keptCount += 1;
  });

  const payload = {
    meta: {
      source: sourceUrl,
      input: path.relative(ROOT_DIR, inputPath).replace(/\\/g, "/"),
      generatedAt: new Date().toISOString(),
      rows: rowCount,
      entries: Object.keys(entries).length,
      keptRows: keptCount
    },
    entries
  };

  await fs.promises.writeFile(outputPath, JSON.stringify(payload), "utf8");

  process.stdout.write(
    `Built ${Object.keys(entries).length} entries from ${rowCount} rows -> ${path.relative(ROOT_DIR, outputPath)}\n`
  );
}

function parseArgs(argv) {
  const args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      continue;
    }

    const key = token.slice(2);
    const value = argv[index + 1];
    args[key] = value;
    index += 1;
  }

  return args;
}

async function downloadFile(url, filePath) {
  process.stdout.write(`Downloading ${url}\n`);

  await new Promise((resolve, reject) => {
    const request = https.get(url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        response.resume();
        downloadFile(response.headers.location, filePath).then(resolve, reject);
        return;
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Download failed with status ${response.statusCode}`));
        response.resume();
        return;
      }

      const file = fs.createWriteStream(filePath);
      response.pipe(file);

      file.on("finish", () => {
        file.close(resolve);
      });

      file.on("error", (error) => {
        reject(error);
      });
    });

    request.on("error", reject);
  });
}

async function parseCsvFile(filePath, onRow) {
  const stream = fs.createReadStream(filePath, { encoding: "utf8" });
  let field = "";
  let row = [];
  let inQuotes = false;
  let sawCarriageReturn = false;
  let isStart = true;

  const flushField = () => {
    row.push(field);
    field = "";
  };

  const flushRow = () => {
    flushField();
    onRow(row);
    row = [];
  };

  for await (const chunk of stream) {
    for (let index = 0; index < chunk.length; index += 1) {
      const char = chunk[index];

      if (isStart && char === "\uFEFF") {
        continue;
      }

      isStart = false;

      if (sawCarriageReturn) {
        sawCarriageReturn = false;
        if (char === "\n") {
          continue;
        }
      }

      if (char === '"') {
        if (inQuotes && chunk[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }

      if (!inQuotes && char === ",") {
        flushField();
        continue;
      }

      if (!inQuotes && (char === "\n" || char === "\r")) {
        if (char === "\r") {
          sawCarriageReturn = true;
        }
        flushRow();
        continue;
      }

      field += char;
    }
  }

  if (field || row.length) {
    flushRow();
  }
}

function normalizeRecord(record) {
  const word = cleanText(record.word);
  if (!WORD_PATTERN.test(word)) {
    return null;
  }

  const entry = {
    w: word
  };

  assignIfPresent(entry, "p", record.phonetic);
  assignIfPresent(entry, "t", record.translation);
  assignIfPresent(entry, "d", record.definition);
  assignIfPresent(entry, "s", record.pos);
  assignIfPresent(entry, "g", record.tag);
  assignIfPresent(entry, "x", record.exchange);

  const collins = cleanText(record.collins);
  const oxford = cleanText(record.oxford);

  if (collins && collins !== "0") {
    entry.c = collins;
  }

  if (oxford && oxford !== "0") {
    entry.o = oxford;
  }

  if (!entry.t && !entry.d) {
    return null;
  }

  return {
    key: word.toLowerCase(),
    entry
  };
}

function assignIfPresent(target, key, value) {
  const cleaned = cleanText(value);
  if (cleaned) {
    target[key] = cleaned;
  }
}

function cleanText(value) {
  return String(value || "")
    .replace(/\r/g, "")
    .replace(/\t/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .trim();
}

function scoreEntry(entry) {
  return ["t", "d", "p", "s", "g", "x", "c", "o"].reduce((score, key) => {
    return score + (entry[key] ? String(entry[key]).length : 0);
  }, 0);
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});