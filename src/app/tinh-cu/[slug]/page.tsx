import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { DataFreshness } from "@/components/common/data-freshness";
import { JsonLd } from "@/components/seo/json-ld";
import {
  getNewProvincesForOldProvince,
  getOldProvince,
  getOldProvinceOptions,
} from "@/lib/converter";
import { DATA_UPDATED_DISPLAY, absoluteUrl } from "@/lib/site-config";
import { buildSlug, codeFromSlug } from "@/lib/slug";

export const dynamicParams = false;

export function generateStaticParams() {
  return getOldProvinceOptions().map((p) => ({
    slug: buildSlug(p.name, p.code),
  }));
}

function getData(slug: string) {
  const code = codeFromSlug(slug);
  const province = getOldProvince(code);
  if (!province) return null;
  return { province, newProvinces: getNewProvincesForOldProvince(code) };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = getData(slug);
  if (!data) return {};
  const { province, newProvinces } = data;
  const dest = newProvinces.map((p) => p.name).join(", ");
  return {
    title: `${province.name} (cũ) sáp nhập vào đâu?`,
    description: `${province.name} sau sáp nhập ${DATA_UPDATED_DISPLAY}${
      dest ? ` thuộc ${dest}` : ""
    }. Danh sách toàn bộ phường/xã cũ và đơn vị mới tương ứng.`,
    alternates: { canonical: `/tinh-cu/${slug}` },
  };
}

export default async function OldProvincePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = getData(slug);
  if (!data) notFound();
  const { province, newProvinces } = data;

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "AdministrativeArea",
          name: `${province.name} (cũ)`,
          url: absoluteUrl(`/tinh-cu/${slug}`),
          containedInPlace: { "@type": "Country", name: "Việt Nam" },
        }}
      />
      <Breadcrumbs
        items={[
          { name: "Trang chủ", href: "/" },
          { name: "Tra cứu địa chỉ", href: "/tra-cuu" },
          { name: `${province.name} (cũ)` },
        ]}
      />

      <header className="mt-6">
        <p className="text-muted-foreground mb-2 font-mono text-xs tracking-[0.06em] uppercase">
          Tỉnh/thành cũ · mã {province.code}
        </p>
        <h1 className="text-[clamp(24px,4vw,34px)] leading-tight font-bold tracking-tight text-balance">
          {province.name} (cũ) sáp nhập vào đâu?
        </h1>
        <p className="text-foreground/80 mt-3 text-[17px] leading-relaxed">
          {province.name} thuộc hệ thống 63 tỉnh trước đây. Sau sáp nhập{" "}
          {DATA_UPDATED_DISPLAY}, địa bàn{" "}
          {newProvinces.length === 0 ? (
            "đã được sắp xếp lại."
          ) : (
            <>
              nay thuộc{" "}
              {newProvinces.map((p, i) => (
                <span key={p.code}>
                  {i > 0 && ", "}
                  <Link
                    href={`/tinh-moi/${buildSlug(p.name, p.code)}`}
                    className="text-brand underline-offset-2 hover:underline"
                  >
                    {p.name}
                  </Link>
                </span>
              ))}
              .
            </>
          )}
        </p>
      </header>

      <section className="mt-8">
        <h2 className="text-foreground/70 mb-4 text-sm font-semibold tracking-wide uppercase">
          Toàn bộ phường/xã cũ
        </h2>
        <div className="space-y-6">
          {province.districts.map((district) => (
            <div key={district.code}>
              <h3 className="text-foreground mb-2 text-[15px] font-semibold">
                {district.name}
              </h3>
              <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                {district.wards.map((w) => (
                  <li key={w.code}>
                    <Link
                      href={`/xa-cu/${buildSlug(w.name, w.code)}`}
                      className="text-foreground/70 hover:text-brand underline-offset-2 hover:underline"
                    >
                      {w.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <DataFreshness className="border-border mt-10 border-t pt-6" />
    </main>
  );
}
