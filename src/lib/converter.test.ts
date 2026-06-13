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

  it("marks land-only vs full-population transfers: Xã Hòa Bình (Kim Thành, Hải Dương)", () => {
    // NQ 1669/NQ-UBTVQH15 khoản 79 + 112: Hà Nam chỉ nhận một phần diện tích,
    // toàn bộ dân số về xã Kim Thành.
    const result = convertOldToNew("10798");
    expect(result).not.toBeNull();
    expect(result!.isAmbiguous).toBe(true);
    expect(result!.matches[0].wardName).toBe("Xã Kim Thành");
    expect(result!.matches[0].transfer).toBe("fullPopulation");
    const haNam = result!.matches.find((m) => m.wardName === "Xã Hà Nam");
    expect(haNam!.transfer).toBe("landOnly");
  });

  it("keeps generic divisions without a transfer kind: Phường Cống Vị", () => {
    const result = convertOldToNew("7");
    for (const m of result!.matches) {
      expect(m.transfer).toBeUndefined();
    }
  });

  it("resolves hamlets for a ward with full data: Xã Nguyễn Phích (U Minh, Cà Mau)", () => {
    // Báo Cà Mau 31/7/2025: ấp 7, 8, 9 của Nguyễn Phích cũ → xã Khánh An mới.
    const result = convertOldToNew("32053");
    expect(result).not.toBeNull();
    expect(result!.isAmbiguous).toBe(true);
    expect(result!.hamlets).toBeDefined();
    expect(result!.hamlets!.length).toBe(20);
    expect(result!.hamletSource).toBeTruthy();
    const ap7 = result!.hamlets!.find((h) => h.name === "Ấp 7");
    expect(ap7!.newWardCode).toBe("32059");
    // Every RESOLVED hamlet points at one of the listed candidate new wards.
    const matchCodes = new Set(result!.matches.map((m) => m.wardCode));
    for (const h of result!.hamlets!) {
      if (h.newWardCode) expect(matchCodes.has(h.newWardCode)).toBe(true);
    }
  });

  it("offers hamlets for an unsplit ward without claiming a destination: Phường Phúc Xá", () => {
    // Phúc Xá gộp trọn vào Hồng Hà (không chia) — vẫn show danh sách thôn để
    // hoàn thiện địa chỉ, nhưng không gắn newWardCode (không cần phân giải).
    const result = convertOldToNew("1");
    expect(result!.isAmbiguous).toBe(false);
    expect(result!.hamlets!.length).toBeGreaterThan(0);
    expect(result!.hamlets!.every((h) => h.newWardCode === undefined)).toBe(
      true,
    );
  });

  it("lists hamlets but resolves none for a split ward with ambiguous thôn: Phường Cống Vị", () => {
    // Các tổ dân phố của Cống Vị xuất hiện ở nhiều ứng viên → không gán được
    // newWardCode; UI cảnh báo và rơi về danh sách ứng viên đầy đủ.
    const result = convertOldToNew("7");
    expect(result!.isAmbiguous).toBe(true);
    expect(result!.hamlets!.length).toBeGreaterThan(0);
    expect(result!.hamlets!.every((h) => h.newWardCode === undefined)).toBe(
      true,
    );
    expect(result!.matches.length).toBeGreaterThan(1);
  });

  it("keeps the full candidate list for a ward with partial hamlet data: Phường Cự Khối", () => {
    const result = convertOldToNew("154");
    expect(result!.isAmbiguous).toBe(true);
    expect(result!.hamlets!.length).toBeGreaterThan(0);
    // Partial: at least one candidate new ward has no resolved hamlet —
    // users whose hamlet is missing still see all possible new wards.
    const destinations = new Set(
      result!.hamlets!.filter((h) => h.newWardCode).map((h) => h.newWardCode),
    );
    expect(destinations.size).toBeLessThan(result!.matches.length);
    expect(result!.matches.length).toBeGreaterThan(1);
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

  it("exposes new-ward hamlets each mapped to one old ward: Phường Hà Giang 2", () => {
    const result = convertNewToOld("691");
    expect(result).not.toBeNull();
    expect(result!.hamlets).toBeDefined();
    expect(result!.hamletSource).toBeTruthy();
    const banMan = result!.hamlets!.find((h) => h.name === "Bản Mán");
    expect(banMan!.oldWardCode).toBe("934"); // Xã Phong Quang (Vị Xuyên)
    const to18 = result!.hamlets!.find((h) => h.name === "Tổ 18");
    expect(to18!.oldWardCode).toBe("697"); // Phường Minh Khai (TP Hà Giang)
    // Every hamlet's old ward is one of the listed source wards.
    const sourceCodes = new Set(result!.sources.map((s) => s.wardCode));
    for (const h of result!.hamlets!) {
      expect(sourceCodes.has(h.oldWardCode)).toBe(true);
    }
    // nameNormalized is present for accent-insensitive search.
    expect(banMan!.nameNormalized).toBe("ban man");
  });

  it("drops hamlet names that are ambiguous across source old wards: Xã Khánh An", () => {
    // New Khánh An unions old Khánh An's "Ấp 7" and Nguyễn Phích's "Ấp 7";
    // the colliding name is dropped rather than guessed.
    const result = convertNewToOld("32059");
    const ap7 = result!.hamlets?.filter((h) => h.name === "Ấp 7") ?? [];
    expect(ap7.length).toBeLessThanOrEqual(1);
    if (ap7.length === 1) expect(ap7[0].oldWardCode).toBe("32059");
  });

  it("annotates sources with their hamlets now in the new ward: Xã Khánh An", () => {
    const result = convertNewToOld("32059");
    const nguyenPhich = result!.sources.find(
      (s) => s.wardName === "Xã Nguyễn Phích",
    );
    expect(nguyenPhich).toBeDefined();
    expect(nguyenPhich!.hamletNames).toContain("Ấp 7");
    expect(nguyenPhich!.hamletNames).toContain("Ấp 9");
  });

  it("marks land-only sources: Xã Hà Nam nhận Hòa Bình (Kim Thành) chỉ phần diện tích", () => {
    const result = convertNewToOld("10843");
    const hoaBinh = result!.sources.find(
      (s) =>
        s.wardName === "Xã Hòa Bình" && s.districtName === "Huyện Kim Thành",
    );
    expect(hoaBinh).toBeDefined();
    expect(hoaBinh!.transfer).toBe("landOnly");
  });
});

describe("normalizeVietnamese", () => {
  it("strips diacritics and lowercases", () => {
    expect(normalizeVietnamese("Thanh Khê")).toBe("thanh khe");
    expect(normalizeVietnamese("Quận Ba Đình")).toBe("quan ba dinh");
    expect(normalizeVietnamese("  Phường   Thủ Đức ")).toBe("phuong thu duc");
  });
});
