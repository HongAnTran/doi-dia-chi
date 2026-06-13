import type { Metadata } from "next";

import { DonateQR } from "@/components/donate/donate-qr";

export const metadata: Metadata = {
  title: "Ủng hộ tác giả",
  description:
    "Đổi Địa Chỉ là công cụ miễn phí. Nếu thấy hữu ích, bạn có thể ủng hộ để giúp duy trì máy chủ và phát triển thêm tính năng.",
  alternates: { canonical: "/ung-ho" },
};

export default function DonatePage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-bold tracking-tight">Ủng hộ tác giả</h1>
      <p className="text-muted-foreground mt-2 text-[15px] leading-relaxed">
        Đổi Địa Chỉ là công cụ hoàn toàn miễn phí và không quảng cáo. Nếu thấy
        hữu ích, bạn có thể ủng hộ để giúp duy trì máy chủ, cập nhật dữ liệu và
        phát triển thêm tính năng mới. Mọi đóng góp đều rất đáng quý!
      </p>

      <div className="bg-card border-border mt-8 flex justify-center rounded-md border p-6 sm:p-8">
        <DonateQR size={260} />
      </div>
    </main>
  );
}
