// Aggregate statistics derived live from the conversion dataset, for the
// data-driven blog articles. Computed on the server at build time, so the
// numbers always match whatever data the site currently ships.

import {
  convertOldToNew,
  getAllNewWards,
  getAllOldWards,
  getNewProvinceOptions,
  getOldProvinceOptions,
} from "./converter";

export interface Overview {
  oldProvinces: number;
  newProvinces: number;
  oldWards: number;
  newWards: number;
  wardReductionPct: number;
}

export function getOverview(): Overview {
  const oldWards = getAllOldWards().length;
  const newWards = getAllNewWards().length;
  return {
    oldProvinces: getOldProvinceOptions().length,
    newProvinces: getNewProvinceOptions().length,
    oldWards,
    newWards,
    wardReductionPct: Math.round((1 - newWards / oldWards) * 100),
  };
}

export interface RankRow {
  name: string;
  value: number;
}

/** New provinces ranked by how many phường/xã they contain. */
export function getTopNewProvincesByWards(limit = 10): RankRow[] {
  const counts = new Map<string, number>();
  for (const w of getAllNewWards()) {
    counts.set(w.provinceName, (counts.get(w.provinceName) ?? 0) + 1);
  }
  return [...counts]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

/**
 * Old provinces ranked by how many of their wards were *split* — i.e. divided
 * across more than one new unit. A proxy for "tỉnh nào chia tách nhiều nhất".
 */
export function getTopOldProvincesBySplitWards(limit = 10): RankRow[] {
  const counts = new Map<string, number>();
  for (const w of getAllOldWards()) {
    const r = convertOldToNew(w.code);
    if (r && r.isAmbiguous) {
      counts.set(w.provinceName, (counts.get(w.provinceName) ?? 0) + 1);
    }
  }
  return [...counts]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}
