/**
 * Builds the hamlet (thôn/ấp/tổ dân phố) datasets used to refine conversion:
 *
 *   src/data/hamlets.json          — old→new: thôn của xã CŨ bị chia tách,
 *                                     mỗi thôn gắn xã MỚI nó được gán về.
 *   src/data/new-ward-hamlets.json — new→old: thôn của xã MỚI (gộp từ nhiều
 *                                     xã cũ), mỗi thôn gắn xã CŨ nó vốn thuộc.
 *
 * Nguồn: API công khai https://diachimoi.net/api/villages — trả thôn theo xã
 * cũ lẫn xã mới với MÃ THÔN quốc gia 8 số ổn định xuyên sáp nhập, nên join
 * bằng mã không cần khớp tên. Đã kiểm chứng chéo 2 ground truth độc lập:
 *  - NQ 1669/NQ-UBTVQH15: 11/11 thôn xã Hòa Bình (Kim Thành) chỉ ở xã Kim
 *    Thành mới (nơi nhận toàn bộ dân số), 0 ở Hà Nam (chỉ nhận đất).
 *  - Báo Cà Mau 31/7/2025: ấp 7, 8, 9 xã Nguyễn Phích cũ → xã Khánh An mới.
 *
 * Quy tắc an toàn (không suy diễn):
 *  - Join bằng MÃ thôn. Mã thôn của xã mới không khớp xã cũ nào → bỏ (partial).
 *  - old→new: thôn chỉ được gán khi mã của nó nằm trong ĐÚNG MỘT xã mới ứng
 *    viên; thôn ở nhiều ứng viên → bỏ; ứng viên landOnly mà có thôn → bỏ cả xã.
 *
 * Chạy: pnpm build-hamlets (cache scripts/.cache/diachimoi/, re-run offline).
 * Lần đầu fetch ~13k lượt (mọi xã cũ + mới) nên mất vài phút.
 */
import fs from "node:fs";
import path from "node:path";

import type {
  MappingRecord,
  NewUnitsFile,
  NewWardHamlets,
  OldUnitsFile,
  WardHamlets,
} from "../src/lib/address-types";

const API_BASE = "https://diachimoi.net/api";
const CACHE_DIR = path.join(__dirname, ".cache", "diachimoi");
const DATA_DIR = path.join(__dirname, "..", "src", "data");
const SOURCE_LABEL =
  "API diachimoi.net (mã thôn quốc gia 8 số), đối chiếu 06/2026; kiểm chứng chéo với bảng chuyển đổi GSO";

const CONCURRENCY = 4;
const DELAY_MS = 120;

interface Village {
  name: string;
  code: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const pad = (code: string, len: number) => code.padStart(len, "0");

async function fetchVillages(
  params: Record<string, string>,
): Promise<Village[] | null> {
  const qs = new URLSearchParams(params).toString();
  const cacheFile = path.join(
    CACHE_DIR,
    `${qs.replace(/[^a-zA-Z0-9=_-]/g, "_")}.json`,
  );
  if (fs.existsSync(cacheFile)) {
    return JSON.parse(fs.readFileSync(cacheFile, "utf8"));
  }
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(`${API_BASE}/villages?${qs}`, {
        headers: {
          "User-Agent": "doi-dia-chi data build (contact: repo owner)",
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = (await res.json()) as { success: boolean; data?: Village[] };
      if (!body.success || !Array.isArray(body.data))
        throw new Error("API !success");
      const villages = body.data.filter((v) => v.code && v.name?.trim());
      fs.mkdirSync(CACHE_DIR, { recursive: true });
      fs.writeFileSync(cacheFile, JSON.stringify(villages));
      await sleep(DELAY_MS);
      return villages;
    } catch (err) {
      if (attempt === 3) {
        console.warn(`  WARN: villages?${qs} failed (${err}); skipping`);
        return null;
      }
      await sleep(1000 * attempt);
    }
  }
  return null;
}

/** Maps over items with a small concurrency pool. */
async function pool<T, R>(
  items: T[],
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  return results;
}

async function main() {
  const oldUnits = JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, "old-units.json"), "utf8"),
  ) as OldUnitsFile;
  const newUnits = JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, "new-units.json"), "utf8"),
  ) as NewUnitsFile;
  const mapping = JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, "mapping.json"), "utf8"),
  ) as MappingRecord[];

  // Old-ward → its province/district codes (needed for the "old" API call).
  const oldCtx = new Map<
    string,
    { provinceCode: string; districtCode: string }
  >();
  for (const p of oldUnits.provinces)
    for (const d of p.districts)
      for (const w of d.wards)
        oldCtx.set(w.code, { provinceCode: p.code, districtCode: d.code });
  const newProvinceByWard = new Map<string, string>();
  for (const p of newUnits.provinces)
    for (const w of p.wards) newProvinceByWard.set(w.code, p.code);

  // Group mapping by old ward and (reverse) by new ward.
  const byOldWard = new Map<string, MappingRecord[]>();
  const byNewWard = new Map<string, MappingRecord[]>();
  for (const m of mapping) {
    (
      byOldWard.get(m.oldWardCode) ??
      byOldWard.set(m.oldWardCode, []).get(m.oldWardCode)!
    ).push(m);
    (
      byNewWard.get(m.newWardCode) ??
      byNewWard.set(m.newWardCode, []).get(m.newWardCode)!
    ).push(m);
  }

  // 1. Fetch every old ward's hamlets (skip đặc-khu d-codes: no hamlet level).
  const oldWardCodes = [...oldCtx.keys()].filter((c) => !c.startsWith("d"));
  console.log(`1/4 Fetching old-ward hamlets (${oldWardCodes.length})...`);
  const oldVillages = new Map<string, Village[]>();
  const codeToOldWard = new Map<string, string>();
  await pool(oldWardCodes, async (code) => {
    const ctx = oldCtx.get(code)!;
    const v = await fetchVillages({
      status: "old",
      provinceCode: pad(ctx.provinceCode, 2),
      districtCode: pad(ctx.districtCode, 3),
      wardCode: pad(code, 5),
    });
    if (!v || v.length === 0) return;
    oldVillages.set(code, v);
    for (const village of v) codeToOldWard.set(village.code, code);
  });
  console.log(
    `  old wards with data: ${oldVillages.size}/${oldWardCodes.length}`,
  );

  // 2. Fetch every new ward's hamlets.
  const newWardCodes = [...newProvinceByWard.keys()];
  console.log(`2/4 Fetching new-ward hamlets (${newWardCodes.length})...`);
  const newVillages = new Map<string, Village[]>();
  await pool(newWardCodes, async (code) => {
    const v = await fetchVillages({
      status: "new",
      provinceCode: pad(newProvinceByWard.get(code)!, 2),
      wardCode: pad(code, 5),
    });
    if (v && v.length > 0) newVillages.set(code, v);
  });
  console.log(
    `  new wards with data: ${newVillages.size}/${newWardCodes.length}`,
  );

  // 3. new→old: for each new ward merged from ≥2 old wards, map each hamlet
  //    (by code) back to the old ward that contained it.
  console.log("3/4 Building new→old hamlet index...");
  const newRecords: NewWardHamlets[] = [];
  let newToOldHamlets = 0;
  let newToOldUnmapped = 0;
  let newToOldAmbiguousNames = 0;
  for (const [newCode, villages] of newVillages) {
    const components = new Set(
      (byNewWard.get(newCode) ?? []).map((m) => m.oldWardCode),
    );
    if (components.size < 2) continue; // single-source new ward: no need

    // Group by hamlet NAME (what the user picks). diachimoi unions the source
    // wards' hamlets without applying post-merger renames, so the same name
    // can appear for two different old wards — that name can't safely pin one.
    const oldWardsByName = new Map<string, Set<string>>();
    for (const v of villages) {
      const oldWardCode = codeToOldWard.get(v.code);
      if (!oldWardCode || !components.has(oldWardCode)) {
        newToOldUnmapped++;
        continue;
      }
      (
        oldWardsByName.get(v.name) ??
        oldWardsByName.set(v.name, new Set()).get(v.name)!
      ).add(oldWardCode);
    }
    const hamlets: NewWardHamlets["hamlets"] = [];
    for (const [name, oldWards] of oldWardsByName) {
      if (oldWards.size !== 1) {
        newToOldAmbiguousNames++;
        continue; // name maps to >1 old ward → drop (ambiguous)
      }
      hamlets.push({ name, oldWardCode: [...oldWards][0] });
    }
    if (hamlets.length === 0) continue;
    hamlets.sort((a, b) => a.name.localeCompare(b.name, "vi"));
    newRecords.push({ newWardCode: newCode, source: SOURCE_LABEL, hamlets });
    newToOldHamlets += hamlets.length;
  }
  newRecords.sort((a, b) => Number(a.newWardCode) - Number(b.newWardCode));
  fs.writeFileSync(
    path.join(DATA_DIR, "new-ward-hamlets.json"),
    JSON.stringify(newRecords),
  );

  // 4. old→new: emit a hamlet list for EVERY old ward that has data (so the
  //    Cũ→Mới combobox can show thôn even when the ward wasn't split). For a
  //    split ward, each hamlet gets newWardCode when its code lands in exactly
  //    one candidate new ward; otherwise newWardCode is omitted (unresolved →
  //    the UI warns and falls back to the full candidate list).
  console.log("4/4 Building old→new hamlet index...");
  const newVillageCodes = new Map<string, Set<string>>();
  for (const [code, villages] of newVillages)
    newVillageCodes.set(code, new Set(villages.map((v) => v.code)));

  const oldRecords: WardHamlets[] = [];
  let resolvedHamlets = 0;
  let unresolvedHamlets = 0;
  let resolvableWards = 0;
  for (const [code, villages] of oldVillages) {
    const recs = byOldWard.get(code) ?? [];
    // Candidate new wards a hamlet could be resolved into (split ward only).
    const candidates =
      recs.filter((r) => r.transfer !== "landOnly").length >= 2
        ? recs.filter((r) => newVillageCodes.has(r.newWardCode))
        : [];
    const hamlets: WardHamlets["hamlets"] = [];
    let wardHasResolved = false;
    for (const v of villages) {
      const owners = candidates.filter((r) =>
        newVillageCodes.get(r.newWardCode)!.has(v.code),
      );
      if (owners.length === 1) {
        hamlets.push({ name: v.name, newWardCode: owners[0].newWardCode });
        resolvedHamlets++;
        wardHasResolved = true;
      } else {
        // Unresolved: ambiguous across candidates, or a non-split ward where
        // the single destination is implied by the conversion itself.
        hamlets.push({ name: v.name });
        if (candidates.length >= 2) unresolvedHamlets++;
      }
    }
    if (hamlets.length === 0) continue;
    if (wardHasResolved) resolvableWards++;
    oldRecords.push({ oldWardCode: code, source: SOURCE_LABEL, hamlets });
  }
  oldRecords.sort((a, b) => Number(a.oldWardCode) - Number(b.oldWardCode));
  fs.writeFileSync(
    path.join(DATA_DIR, "hamlets.json"),
    JSON.stringify(oldRecords),
  );

  console.log("Done.");
  console.log(
    `  new→old: ${newRecords.length} new wards, ${newToOldHamlets} hamlets mapped, ${newToOldUnmapped} unmapped, ${newToOldAmbiguousNames} dropped (duplicate name)`,
  );
  const totalOld = oldRecords.reduce((n, r) => n + r.hamlets.length, 0);
  console.log(
    `  old→new: ${oldRecords.length} old wards, ${totalOld} hamlets (${resolvedHamlets} resolved to a new ward, ${unresolvedHamlets} unresolved in split wards), ${resolvableWards} wards with ≥1 resolved hamlet`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
