import { describe, expect, it } from "vitest";

import { convertNewToOld, convertOldToNew } from "./converter";
import { normalizeVietnamese } from "./normalize";

describe("convertOldToNew", () => {
  it("converts a merged ward: Phường Phúc Xá (Ba Đình, Hà Nội) → Phường Hồng Hà", () => {
    const result = convertOldToNew("1");
    expect(result).not.toBeNull();
    expect(result!.from.wardName).toBe("Phường Phúc Xá");
    expect(result!.isAmbiguous).toBe(false);
    expect(result!.matches).toHaveLength(1);
    expect(result!.matches[0].wardName).toBe("Phường Hồng Hà");
    expect(result!.matches[0].fullAddress).toBe(
      "Phường Hồng Hà, Thành phố Hà Nội",
    );
  });

  it("flags a divided ward as ambiguous: Phường Cống Vị → Ngọc Hà + Giảng Võ", () => {
    const result = convertOldToNew("7");
    expect(result).not.toBeNull();
    expect(result!.from.wardName).toBe("Phường Cống Vị");
    expect(result!.isAmbiguous).toBe(true);
    expect(result!.matches.length).toBeGreaterThan(1);
    const names = result!.matches.map((m) => m.wardName);
    expect(names).toContain("Phường Ngọc Hà");
    expect(names).toContain("Phường Giảng Võ");
  });

  it("handles a ward keeping its name but changing province: Xã Tân Hiệp (Hội An, Quảng Nam) → Đà Nẵng", () => {
    const result = convertOldToNew("20434");
    expect(result).not.toBeNull();
    expect(result!.from.wardName).toBe("Xã Tân Hiệp");
    expect(result!.from.provinceName).toBe("Tỉnh Quảng Nam");
    expect(result!.matches).toHaveLength(1);
    expect(result!.matches[0].wardName).toBe("Xã Tân Hiệp");
    expect(result!.matches[0].provinceName).toBe("Thành phố Đà Nẵng");
  });

  it("handles an island district without ward level: Huyện Bạch Long Vĩ → Đặc khu Bạch Long Vĩ", () => {
    const result = convertOldToNew("d318");
    expect(result).not.toBeNull();
    expect(result!.from.fullAddress).toBe(
      "Huyện Bạch Long Vĩ, Thành phố Hải Phòng",
    );
    expect(result!.matches).toHaveLength(1);
    expect(result!.matches[0].wardName).toBe("Đặc khu Bạch Long Vĩ");
    expect(result!.matches[0].note).toBeTruthy();
  });

  it("returns null for an unknown old ward code", () => {
    expect(convertOldToNew("999999")).toBeNull();
  });
});

describe("convertNewToOld", () => {
  it("returns the full list of old wards merged into Phường Hồng Hà", () => {
    const result = convertNewToOld("97");
    expect(result).not.toBeNull();
    expect(result!.from.wardName).toBe("Phường Hồng Hà");
    expect(result!.sources).toHaveLength(12);
    const names = result!.sources.map((s) => s.wardName);
    expect(names).toContain("Phường Phúc Xá");
    expect(names).toContain("Phường Chương Dương");
  });

  it("includes district and province in each source address", () => {
    const result = convertNewToOld("97");
    const phucXa = result!.sources.find((s) => s.wardName === "Phường Phúc Xá");
    expect(phucXa!.fullAddress).toBe(
      "Phường Phúc Xá, Quận Ba Đình, Thành phố Hà Nội",
    );
  });

  it("returns null for an unknown new ward code", () => {
    expect(convertNewToOld("999999")).toBeNull();
  });
});

describe("normalizeVietnamese", () => {
  it("strips diacritics and lowercases", () => {
    expect(normalizeVietnamese("Thanh Khê")).toBe("thanh khe");
    expect(normalizeVietnamese("Quận Ba Đình")).toBe("quan ba dinh");
    expect(normalizeVietnamese("  Phường   Thủ Đức ")).toBe("phuong thu duc");
  });
});
