import type { Metadata } from "next";

import { BulkConverter } from "@/components/bulk/bulk-converter";

export const metadata: Metadata = {
  title: "Chuyển địa chỉ hàng loạt từ Excel/CSV — Đổi địa chỉ",
  description:
    "Tải lên file Excel hoặc CSV, chuyển đổi toàn bộ địa chỉ hai chiều cũ ↔ mới rồi tải về. Tự nhận diện và làm sạch dữ liệu viết tắt.",
};

export default function BulkPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:py-16">
      <header className="mb-10">
        <p className="text-brand mb-2 text-xs font-medium tracking-widest uppercase">
          Chuyển đổi hàng loạt
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Chuyển địa chỉ hàng loạt
        </h1>
        <p className="text-muted-foreground mt-3 max-w-prose text-sm leading-relaxed sm:text-base">
          Tải lên danh sách địa chỉ từ Excel/CSV, chọn chiều chuyển (Cũ → Mới
          hoặc Mới → Cũ), app tự nhận diện và chuyển đổi từng dòng, giữ nguyên
          các cột gốc. Dữ liệu xử lý trên máy chủ, không lưu lại.
        </p>
      </header>

      <BulkConverter />
    </main>
  );
}
