import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { DataFreshness } from "@/components/common/data-freshness";
import { JsonLd } from "@/components/seo/json-ld";
import {
  getNewProvince,
  getNewProvinceOptions,
  getOldProvincesForNewProvince,
} from "@/lib/converter";
import { DATA_UPDATED_DISPLAY, absoluteUrl } from "@/lib/site-config";
import { buildSlug, codeFromSlug } from "@/lib/slug";

export const dynamicParams = false;

export function generateStaticParams() {
  return getNewProvinceOptions().map((p) => ({
    slug: buildSlug(p.name, p.code),
  }));
}

function getData(slug: string) {
  const code = codeFromSlug(slug);
  const province = getNewProvince(code);
  if (!province) return null;
  return { province, oldProvinces: getOldProvincesForNewProvince(code) };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = getData(slug);
  if (!data) return {};
  const { province, oldProvinces } = data;
  const from = oldProvinces.map((p) => p.name).join(", ");
  return {
    title: `${province.name} — danh sách phường/xã mới`,
    description: `${province.name} có ${province.wards.length} phường/xã sau sáp nhập ${DATA_UPDATED_DISPLAY}${
      from ? `, hợp nhất từ ${from}` : ""
    }. Tra cứu mã và đơn vị cũ tương ứng.`,
    alternates: { canonical: `/tinh-moi/${slug}` },
  };
}

export default async function NewProvincePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = getData(slug);
  if (!data) notFound();
  const { province, oldProvinces } = data;

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "AdministrativeArea",
          name: province.name,
          url: absoluteUrl(`/tinh-moi/${slug}`),
          containedInPlace: { "@type": "Country", name: "Việt Nam" },
        }}
      />
      <Breadcrumbs
        items={[
          { name: "Trang chủ", href: "/" },
          { name: "Tra cứu địa chỉ", href: "/tra-cuu" },
          { name: province.name },
        ]}
      />

      <header className="mt-6">
        <p className="text-muted-foreground mb-2 font-mono text-xs tracking-[0.06em] uppercase">
          Tỉnh/thành mới · mã {province.code} · {province.wards.length}{" "}
          phường/xã
        </p>
        <h1 className="text-[clamp(24px,4vw,34px)] leading-tight font-bold tracking-tight text-balance">
          {province.name}
        </h1>
        <p className="text-foreground/80 mt-3 text-[17px] leading-relaxed">
          {province.name} thuộc hệ thống hành chính mới (34 tỉnh, 2 cấp).{" "}
          {oldProvinces.length > 1 ? (
            <>
              Được hợp nhất từ{" "}
              {oldProvinces.map((p, i) => (
                <span key={p.code}>
                  {i > 0 && ", "}
                  <Link
                    href={`/tinh-cu/${buildSlug(p.name, p.code)}`}
                    className="text-brand underline-offset-2 hover:underline"
                  >
                    {p.name}
                  </Link>
                </span>
              ))}{" "}
              sau sáp nhập {DATA_UPDATED_DISPLAY}.
            </>
          ) : (
            `Có ${province.wards.length} phường/xã sau sáp nhập ${DATA_UPDATED_DISPLAY}.`
          )}
        </p>
      </header>

      <section className="mt-8">
        <h2 className="text-foreground/70 mb-4 text-sm font-semibold tracking-wide uppercase">
          Danh sách phường/xã mới
        </h2>
        <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
          {province.wards.map((w) => (
            <li key={w.code}>
              <Link
                href={`/xa-moi/${buildSlug(w.name, w.code)}`}
                className="text-foreground/70 hover:text-brand underline-offset-2 hover:underline"
              >
                {w.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <DataFreshness className="border-border mt-10 border-t pt-6" />
    </main>
  );
}
