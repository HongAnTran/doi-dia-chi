/**
 * Ingests Vietnam administrative-unit data from the open-source repo
 * https://github.com/tranngocminhhieu/vietnamadminunits (processed CSVs)
 * and emits the app's static source of truth:
 *
 *   src/data/old-units.json  — 63 provinces → districts → wards (pre-2025-07-01)
 *   src/data/new-units.json  — 34 provinces → wards (post-merger)
 *   src/data/mapping.json    — flat [{ oldWardCode, newWardCode, note? }]
 *
 * Run: pnpm tsx scripts/build-data.ts
 * Downloads are cached in scripts/.cache so reruns are offline.
 *
 * Special case: 5 island districts (Bạch Long Vĩ, Cồn Cỏ, Hoàng Sa, ...) have
 * no ward level in the old system and became "đặc khu". They are represented
 * as a synthetic ward with code "d<districtCode>" so the ward-level cascade
 * and mapping still cover them.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { normalizeVietnamese } from "../src/lib/normalize";
import type {
  MappingRecord,
  NewProvince,
  OldProvince,
  TransferKind,
} from "../src/lib/address-types";

const BASE_URL =
  "https://raw.githubusercontent.com/tranngocminhhieu/vietnamadminunits/main/data/processed";

const SOURCES = {
  legacy: "legacy_63-province-10040-ward_with_location.csv",
  new: "2025_34-province-3221-ward_with_location.csv",
  convert: "convert_legacy_2025_with_location_and_default_ward.csv",
} as const;

const CACHE_DIR = path.join(__dirname, ".cache");
const OUT_DIR = path.join(__dirname, "..", "src", "data");

// Official GSO/NSO conversion table ("Bảng chuyển đổi ĐVHC mới - cũ",
// Cục Thống kê — https://danhmuchanhchinh.nso.gov.vn/) used to cross-check
// the community-sourced mapping. Adjudicated divergences between the two
// sources live in data/gso-exceptions.json with NQ citations.
const GSO_XLSX_URL =
  "https://danhmuchanhchinh.nso.gov.vn/TAPTIN/BangChuyendoi%C4%90VHCmoi_cu_final.xlsx";
const GSO_XLSX = path.join(CACHE_DIR, "BangChuyendoiĐVHCmoi_cu_final.xlsx");
const GSO_EXCEPTIONS = path.join(
  __dirname,
  "..",
  "data",
  "gso-exceptions.json",
);

interface GsoExceptionPair {
  oldWardCode: string;
  newWardCode: string;
  reason: string;
  source: string;
  /** Kiểu chuyển giao theo nghị quyết, cho cặp không có trong bảng GSO. */
  transfer?: TransferKind;
}

interface GsoExceptions {
  keepPairs: GsoExceptionPair[];
  ignoreGsoPairs: GsoExceptionPair[];
}

function readZipEntry(zipPath: string, entry: string): string {
  return execFileSync("unzip", ["-p", zipPath, entry], {
    maxBuffer: 64 * 1024 * 1024,
  }).toString("utf8");
}

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

/**
 * Classifies the GSO "Ghi chú" wording for divided wards:
 * "Nhập một phần diện tích, toàn bộ dân số" → fullPopulation,
 * "Nhập một phần diện tích" (no dân số) → landOnly,
 * anything else (generic "Nhập một phần", "Nhập toàn bộ", ...) → undefined.
 */
function classifyTransfer(note: string): TransferKind | undefined {
  const n = normalizeVietnamese(note);
  if (!n.includes("mot phan")) return undefined;
  if (n.includes("toan bo dan so")) return "fullPopulation";
  if (n.includes("dien tich") && !n.includes("dan so")) return "landOnly";
  return undefined;
}

interface GsoPair {
  oldWardCode: string;
  newWardCode: string;
  transfer?: TransferKind;
}

/**
 * Reads the GSO xlsx and returns its old→new ward pairs (codes normalized,
 * zero-padding stripped). Rows without an old code (đặc khu island districts,
 * coastal alluvial areas) are skipped — our synthetic d-codes cover them.
 */
function parseGsoPairs(): GsoPair[] {
  const shared = readZipEntry(GSO_XLSX, "xl/sharedStrings.xml");
  const strings = [...shared.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) =>
    decodeXmlEntities(
      [...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join(""),
    ),
  );
  // sheet2.xml = "Tổng hợp_không merge" (sheet1 has merged cells with gaps)
  const sheetXml = readZipEntry(GSO_XLSX, "xl/worksheets/sheet2.xml");
  const pairs: GsoPair[] = [];
  for (const row of sheetXml.matchAll(
    /<row [^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g,
  )) {
    if (Number(row[1]) <= 2) continue; // two header rows
    const cells: Record<string, string> = {};
    for (const c of row[2].matchAll(
      /<c r="([A-Z]+)\d+"(?:[^>]*t="(\w+)")?[^>]*>(?:<v>([\s\S]*?)<\/v>)?/g,
    )) {
      const [, col, type, val] = c;
      cells[col] = type === "s" ? strings[Number(val)] : (val ?? "");
    }
    // C = mã xã mới, E = mã xã cũ, F = ghi chú; province group rows have neither code
    const newWardCode = parseCode(cells.C ?? "");
    const oldWardCode = parseCode(cells.E ?? "");
    if (!newWardCode || !oldWardCode) continue;
    const transfer = classifyTransfer((cells.F ?? "").trim());
    pairs.push({ oldWardCode, newWardCode, ...(transfer ? { transfer } : {}) });
  }
  return pairs;
}

async function download(file: string): Promise<string> {
  const cached = path.join(CACHE_DIR, file);
  if (fs.existsSync(cached)) {
    console.log(`  using cache: ${file}`);
    return fs.readFileSync(cached, "utf8");
  }
  console.log(`  downloading: ${file}`);
  const res = await fetch(`${BASE_URL}/${file}`);
  if (!res.ok) throw new Error(`Download failed (${res.status}): ${file}`);
  const text = await res.text();
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(cached, text);
  return text;
}

/** Downloads the official NSO conversion xlsx into the cache (binary). */
async function downloadGsoXlsx(): Promise<void> {
  if (fs.existsSync(GSO_XLSX)) {
    console.log(`  using cache: ${path.basename(GSO_XLSX)}`);
    return;
  }
  console.log(
    `  downloading: ${path.basename(GSO_XLSX)} (danhmuchanhchinh.nso.gov.vn)`,
  );
  const res = await fetch(GSO_XLSX_URL);
  if (!res.ok) {
    throw new Error(`Download failed (${res.status}): ${GSO_XLSX_URL}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(GSO_XLSX, buf);
}

/** Minimal RFC-4180 CSV parser (handles quoted fields with commas/newlines). */
function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c !== "\r") {
      field += c;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  const [header, ...body] = rows;
  return body.map((cells) =>
    Object.fromEntries(header.map((h, i) => [h, cells[i] ?? ""])),
  );
}

/** Codes appear as "1", "1.0" or "" — normalize to an integer string or null. */
function parseCode(raw: string): string | null {
  if (!raw) return null;
  const n = Number.parseFloat(raw);
  if (Number.isNaN(n)) return null;
  return String(Math.trunc(n));
}

function unit(code: string, name: string) {
  return { code, name, nameNormalized: normalizeVietnamese(name) };
}

/** Old-ward key shared by old-units.json and mapping.json. */
function oldWardKey(wardCode: string | null, districtCode: string): string {
  return wardCode ?? `d${districtCode}`;
}

async function main() {
  console.log("1/3 Downloading source data...");
  const [legacyCsv, newCsv, convertCsv] = await Promise.all([
    download(SOURCES.legacy),
    download(SOURCES.new),
    download(SOURCES.convert),
  ]);
  await downloadGsoXlsx();

  console.log("2/3 Normalizing...");
  const legacyRows = parseCsv(legacyCsv);
  const newRows = parseCsv(newCsv);
  const convertRows = parseCsv(convertCsv);

  // --- old-units.json ---
  const oldProvinces = new Map<string, OldProvince>();
  const oldDistricts = new Map<
    string,
    ReturnType<typeof unit> & { wards: ReturnType<typeof unit>[] }
  >();
  let oldWardCount = 0;
  for (const r of legacyRows) {
    const provinceCode = parseCode(r.provinceCode);
    const districtCode = parseCode(r.districtCode);
    if (!provinceCode || !districtCode) {
      throw new Error(`Legacy row missing codes: ${JSON.stringify(r)}`);
    }
    let province = oldProvinces.get(provinceCode);
    if (!province) {
      province = { ...unit(provinceCode, r.province), districts: [] };
      oldProvinces.set(provinceCode, province);
    }
    const districtKey = `${provinceCode}/${districtCode}`;
    let district = oldDistricts.get(districtKey);
    if (!district) {
      district = { ...unit(districtCode, r.district), wards: [] };
      oldDistricts.set(districtKey, district);
      province.districts.push(district);
    }
    const wardCode = parseCode(r.wardCode);
    // Island districts without a ward level → synthetic ward named after the district.
    const name = wardCode ? r.ward : r.district;
    district.wards.push(unit(oldWardKey(wardCode, districtCode), name));
    oldWardCount++;
  }

  // --- new-units.json ---
  const newProvinces = new Map<string, NewProvince>();
  for (const r of newRows) {
    const provinceCode = parseCode(r.provinceCode);
    const wardCode = parseCode(r.wardCode);
    if (!provinceCode || !wardCode) {
      throw new Error(`New row missing codes: ${JSON.stringify(r)}`);
    }
    let province = newProvinces.get(provinceCode);
    if (!province) {
      province = { ...unit(provinceCode, r.province), wards: [] };
      newProvinces.set(provinceCode, province);
    }
    province.wards.push(unit(wardCode, r.ward));
  }

  // --- mapping.json ---
  // Group per old ward; for divided wards put the default new ward first.
  const groups = new Map<
    string,
    { record: MappingRecord; isDefault: boolean }[]
  >();
  for (const r of convertRows) {
    const districtCode = parseCode(r.districtCode);
    const newWardCode = parseCode(r.newWardCode);
    if (!districtCode || !newWardCode) {
      throw new Error(`Convert row missing codes: ${JSON.stringify(r)}`);
    }
    const oldCode = oldWardKey(parseCode(r.wardCode), districtCode);
    const record: MappingRecord = { oldWardCode: oldCode, newWardCode };
    if (oldCode.startsWith("d")) {
      record.note = "Đơn vị cấp huyện không có cấp xã, chuyển thành đặc khu";
    }
    const group = groups.get(oldCode) ?? [];
    group.push({ record, isDefault: r.isDefaultNewWard === "True" });
    groups.set(oldCode, group);
  }
  const oldWardCodes = new Set<string>();
  for (const p of oldProvinces.values())
    for (const d of p.districts)
      for (const w of d.wards) oldWardCodes.add(w.code);
  const newWardCodes = new Set<string>();
  for (const p of newProvinces.values())
    for (const w of p.wards) newWardCodes.add(w.code);
  if (oldWardCodes.size !== oldWardCount) {
    throw new Error("Old ward codes are not unique");
  }

  // --- cross-check against the official GSO conversion table ---
  // Keep a community pair only if GSO confirms it (or it is an adjudicated
  // exception); add GSO pairs we miss (unless adjudicated as a GSO error).
  const gsoPairs = parseGsoPairs();
  const exceptions = JSON.parse(
    fs.readFileSync(GSO_EXCEPTIONS, "utf8"),
  ) as GsoExceptions;
  const pairKey = (o: string, n: string) => `${o}>${n}`;
  const gsoSet = new Set(
    gsoPairs.map((p) => pairKey(p.oldWardCode, p.newWardCode)),
  );
  // Transfer kind (đất/dân cư) per pair: from the GSO Ghi chú, with the
  // adjudicated exceptions (sourced from NQ wording) taking precedence.
  const transferByPair = new Map<string, TransferKind>();
  for (const p of gsoPairs) {
    if (p.transfer)
      transferByPair.set(pairKey(p.oldWardCode, p.newWardCode), p.transfer);
  }
  for (const e of exceptions.keepPairs) {
    if (e.transfer)
      transferByPair.set(pairKey(e.oldWardCode, e.newWardCode), e.transfer);
  }
  const keepSet = new Set(
    exceptions.keepPairs.map((e) => pairKey(e.oldWardCode, e.newWardCode)),
  );
  const ignoreSet = new Set(
    exceptions.ignoreGsoPairs.map((e) => pairKey(e.oldWardCode, e.newWardCode)),
  );
  let droppedCount = 0;
  for (const [oldCode, group] of groups) {
    if (oldCode.startsWith("d")) continue; // đặc khu rows have no old code in GSO
    const kept = group.filter(({ record }) => {
      const k = pairKey(record.oldWardCode, record.newWardCode);
      if (gsoSet.has(k) || keepSet.has(k)) {
        const transfer = transferByPair.get(k);
        if (transfer) record.transfer = transfer;
        return true;
      }
      console.log(`  GSO cross-check: drop ${k} (not in official table)`);
      droppedCount++;
      return false;
    });
    if (kept.length === 0) {
      throw new Error(`GSO cross-check left old ward ${oldCode} unmapped`);
    }
    groups.set(oldCode, kept);
  }

  // Order within a divided group: nơi nhận toàn bộ dân cư trước, rồi xã
  // "mặc định" của nguồn cộng đồng, rồi phần đất-không-dân cuối cùng.
  const rank = (e: { record: MappingRecord; isDefault: boolean }) =>
    e.record.transfer === "fullPopulation"
      ? 0
      : e.record.transfer === "landOnly"
        ? 3
        : e.isDefault
          ? 1
          : 2;
  const mapping: MappingRecord[] = [];
  for (const group of groups.values()) {
    group.sort((a, b) => rank(a) - rank(b));
    for (const { record } of group) mapping.push(record);
  }

  const ourSet = new Set(
    mapping.map((m) => pairKey(m.oldWardCode, m.newWardCode)),
  );
  let addedCount = 0;
  for (const p of gsoPairs) {
    const k = pairKey(p.oldWardCode, p.newWardCode);
    if (ourSet.has(k) || ignoreSet.has(k)) continue;
    if (!oldWardCodes.has(p.oldWardCode) || !newWardCodes.has(p.newWardCode)) {
      throw new Error(`GSO pair references unknown ward code: ${k}`);
    }
    console.log(`  GSO cross-check: add ${k} (missing from community source)`);
    mapping.push({
      oldWardCode: p.oldWardCode,
      newWardCode: p.newWardCode,
      ...(p.transfer ? { transfer: p.transfer } : {}),
    });
    ourSet.add(k);
    addedCount++;
  }

  // --- validation ---
  for (const m of mapping) {
    if (!oldWardCodes.has(m.oldWardCode))
      throw new Error(`Mapping references unknown old ward: ${m.oldWardCode}`);
    if (!newWardCodes.has(m.newWardCode))
      throw new Error(`Mapping references unknown new ward: ${m.newWardCode}`);
  }
  const mappedOldWards = new Set(mapping.map((m) => m.oldWardCode));
  const unmapped = [...oldWardCodes].filter((c) => !mappedOldWards.has(c));
  if (unmapped.length > 0) {
    console.warn(`  WARNING: ${unmapped.length} old wards have no mapping`);
  }

  console.log("3/3 Writing src/data/*.json...");
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const oldUnits = { provinces: [...oldProvinces.values()] };
  const newUnits = { provinces: [...newProvinces.values()] };
  fs.writeFileSync(
    path.join(OUT_DIR, "old-units.json"),
    JSON.stringify(oldUnits),
  );
  fs.writeFileSync(
    path.join(OUT_DIR, "new-units.json"),
    JSON.stringify(newUnits),
  );
  fs.writeFileSync(path.join(OUT_DIR, "mapping.json"), JSON.stringify(mapping));

  const divided = [...groups.values()].filter((g) => g.length > 1).length;
  console.log("Done.");
  console.log(`  old provinces : ${oldProvinces.size}`);
  console.log(`  old wards     : ${oldWardCount}`);
  console.log(`  new provinces : ${newProvinces.size}`);
  console.log(`  new wards     : ${newWardCodes.size}`);
  console.log(
    `  mapping records: ${mapping.length} (${divided} old wards divided into multiple new wards)`,
  );
  console.log(
    `  GSO cross-check: ${droppedCount} dropped, ${addedCount} added, ` +
      `${keepSet.size} kept by exception, ${ignoreSet.size} GSO rows ignored`,
  );
  const landOnly = mapping.filter((m) => m.transfer === "landOnly").length;
  const fullPop = mapping.filter((m) => m.transfer === "fullPopulation").length;
  console.log(
    `  transfer kinds : ${fullPop} toàn bộ dân số, ${landOnly} chỉ diện tích (không dân cư)`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
