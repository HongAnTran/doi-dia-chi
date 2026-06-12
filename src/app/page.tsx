import { AddressConverter } from "@/components/converter/address-converter";
import { getNewProvinceOptions, getOldProvinceOptions } from "@/lib/converter";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-12 sm:py-16">
      <header className="mb-10">
        <p className="text-brand mb-2 text-xs font-medium tracking-widest uppercase">
          Sáp nhập hành chính 01/07/2025
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Đổi địa chỉ
        </h1>
        <p className="text-muted-foreground mt-3 max-w-prose text-sm leading-relaxed sm:text-base">
          Tra cứu chuyển đổi địa chỉ giữa hệ thống hành chính cũ (63 tỉnh, 3
          cấp) và mới (34 tỉnh, 2 cấp), theo cả hai chiều.
        </p>
      </header>
      <AddressConverter
        oldProvinces={getOldProvinceOptions()}
        newProvinces={getNewProvinceOptions()}
      />
      <footer className="text-muted-foreground mt-16 border-t pt-6 text-xs leading-relaxed">
        Dữ liệu từ dự án mã nguồn mở{" "}
        <a
          href="https://github.com/tranngocminhhieu/vietnamadminunits"
          className="hover:text-foreground underline underline-offset-2"
          target="_blank"
          rel="noreferrer"
        >
          vietnamadminunits
        </a>
        . Kết quả mang tính tham khảo, vui lòng đối chiếu văn bản chính thức.
      </footer>
    </main>
  );
}
