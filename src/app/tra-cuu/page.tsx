import type { Metadata } from "next";
import Link from "next/link";

import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { DataFreshness } from "@/components/common/data-freshness";
import { getNewProvinceOptions, getOldProvinceOptions } from "@/lib/converter";
import { buildSlug } from "@/lib/slug";

export const metadata: Metadata = {
  title: "Tra cứu địa chỉ theo tỉnh thành",
  description:
    "Danh mục 34 tỉnh/thành mới và 63 tỉnh/thành cũ. Chọn tỉnh để xem toàn bộ phường/xã và tra cứu địa chỉ trước/sau sáp nhập 01/07/2025.",
  alternates: { canonical: "/tra-cuu" },
};

export default function DirectoryPage() {
  const newProvinces = getNewProvinceOptions();
  const oldProvinces = getOldProvinceOptions();

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <Breadcrumbs
        items={[{ name: "Trang chủ", href: "/" }, { name: "Tra cứu địa chỉ" }]}
      />

      <header className="mt-6">
        <h1 className="text-[clamp(24px,4vw,34px)] leading-tight font-bold tracking-tight">
          Tra cứu địa chỉ theo tỉnh thành
        </h1>
        <p className="text-foreground/80 mt-3 text-[17px] leading-relaxed">
          Chọn tỉnh/thành để xem toàn bộ phường/xã và tra cứu địa chỉ trước và
          sau sáp nhập {""}
          ngày 01/07/2025.
        </p>
      </header>

      <section className="mt-8">
        <h2 className="text-foreground/70 mb-3 text-sm font-semibold tracking-wide uppercase">
          34 tỉnh/thành mới
        </h2>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[15px] sm:grid-cols-3">
          {newProvinces.map((p) => (
            <li key={p.code}>
              <Link
                href={`/tinh-moi/${buildSlug(p.name, p.code)}`}
                className="text-foreground/80 hover:text-brand underline-offset-2 hover:underline"
              >
                {p.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-border mt-8 border-t pt-6">
        <h2 className="text-foreground/70 mb-3 text-sm font-semibold tracking-wide uppercase">
          63 tỉnh/thành cũ
        </h2>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[15px] sm:grid-cols-3">
          {oldProvinces.map((p) => (
            <li key={p.code}>
              <Link
                href={`/tinh-cu/${buildSlug(p.name, p.code)}`}
                className="text-muted-foreground hover:text-brand underline-offset-2 hover:underline"
              >
                {p.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <DataFreshness className="border-border mt-10 border-t pt-6" />
    </main>
  );
}
