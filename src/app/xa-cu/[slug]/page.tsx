import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { DataFreshness } from "@/components/common/data-freshness";
import { Faq, type FaqItem } from "@/components/seo/faq";
import { JsonLd } from "@/components/seo/json-ld";
import {
  convertOldToNew,
  getAllOldWards,
  getOldWardContext,
} from "@/lib/converter";
import {
  DATA_UPDATED_DISPLAY,
  SOURCE_RESOLUTION,
  absoluteUrl,
} from "@/lib/site-config";
import { buildSlug, codeFromSlug } from "@/lib/slug";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllOldWards().map((w) => ({ slug: buildSlug(w.name, w.code) }));
}

function getData(slug: string) {
  const code = codeFromSlug(slug);
  const context = getOldWardContext(code);
  if (!context) return null;
  const result = convertOldToNew(code);
  if (!result) return null;
  return { code, context, result };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = getData(slug);
  if (!data) return {};
  const { context, result } = data;
  const { ward, province } = context;
  const targets = result.matches;
  const canonical = `/xa-cu/${slug}`;

  const summary =
    targets.length === 0
      ? `${ward.name}, ${province.name} (cũ).`
      : targets.length === 1
        ? `${ward.name}, ${province.name} (cũ) nay thuộc ${targets[0].wardName}, ${targets[0].provinceName}.`
        : `${ward.name}, ${province.name} (cũ) được chia về ${targets.length} đơn vị mới sau sáp nhập ${DATA_UPDATED_DISPLAY}.`;

  return {
    title: `${ward.name} (${province.name} cũ) nay là gì?`,
    description: `${summary} Tra cứu mã, tỉnh mới và nghị quyết liên quan.`,
    alternates: { canonical },
    openGraph: { title: `${ward.name} đổi thành gì?`, url: canonical },
  };
}

export default async function OldWardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = getData(slug);
  if (!data) notFound();
  const { code, context, result } = data;
  const { ward, district, province } = context;
  const targets = result.matches;
  const isSplit = result.isAmbiguous;
  const provinceSlug = buildSlug(province.name, province.code);

  const siblings = district.wards
    .filter((w) => w.code !== ward.code)
    .slice(0, 12);

  const faq: FaqItem[] = [
    {
      question: `${ward.name}, ${district.name}, ${province.name} (cũ) nay là phường/xã nào?`,
      answer:
        targets.length === 0
          ? `Hiện chưa có dữ liệu ánh xạ cho ${ward.name}.`
          : targets.length === 1
            ? `Sau sáp nhập ${DATA_UPDATED_DISPLAY}, ${ward.name} thuộc ${targets[0].wardName}, ${targets[0].provinceName}.`
            : `${ward.name} được chia về ${targets.length} đơn vị mới: ${targets
                .map((t) => `${t.wardName} (${t.provinceName})`)
                .join("; ")}.`,
    },
    {
      question: `Mã phường/xã mới của ${ward.name} là gì?`,
      answer:
        targets.length === 0
          ? "Chưa có mã mới tương ứng trong dữ liệu."
          : `Mã cũ ${code} → ${targets
              .map((t) => `${t.wardCode} (${t.wardName})`)
              .join(", ")}.`,
    },
    {
      question: "Việc sáp nhập căn cứ theo văn bản nào?",
      answer: `Việc sắp xếp đơn vị hành chính cấp tỉnh thực hiện theo ${SOURCE_RESOLUTION}; cấp xã theo nghị quyết của Ủy ban Thường vụ Quốc hội cho từng tỉnh, có hiệu lực từ ${DATA_UPDATED_DISPLAY}.`,
    },
  ];

  const placeJsonLd = {
    "@context": "https://schema.org",
    "@type": "Place",
    name: `${ward.name}, ${district.name}, ${province.name}`,
    url: absoluteUrl(`/xa-cu/${slug}`),
    address: {
      "@type": "PostalAddress",
      addressCountry: "VN",
      addressRegion: province.name,
    },
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <JsonLd data={placeJsonLd} />
      <Breadcrumbs
        items={[
          { name: "Trang chủ", href: "/" },
          { name: "Tra cứu địa chỉ", href: "/tra-cuu" },
          { name: `${province.name} (cũ)`, href: `/tinh-cu/${provinceSlug}` },
          { name: ward.name },
        ]}
      />

      <header className="mt-6">
        <p className="text-muted-foreground mb-2 font-mono text-xs tracking-[0.06em] uppercase">
          Đơn vị hành chính cũ · mã {code}
        </p>
        <h1 className="text-[clamp(24px,4vw,34px)] leading-tight font-bold tracking-tight text-balance">
          {ward.name} (
          <span className="text-foreground/70">{province.name} cũ</span>) nay là
          gì?
        </h1>
        <p className="text-foreground/80 mt-3 text-[17px] leading-relaxed">
          {ward.name}, {district.name}, {province.name} thuộc hệ thống hành
          chính cũ (63 tỉnh). Sau sáp nhập ngày {DATA_UPDATED_DISPLAY},{" "}
          {targets.length === 0
            ? "đơn vị này chưa có ánh xạ trong dữ liệu hiện có."
            : isSplit
              ? `địa bàn được chia về ${targets.length} đơn vị mới như sau.`
              : `địa bàn thuộc về đơn vị mới như sau.`}
        </p>
      </header>

      <section className="mt-8">
        <h2 className="text-foreground/70 mb-3 text-sm font-semibold tracking-wide uppercase">
          {isSplit ? "Chia tách thành" : "Chuyển thành"}
        </h2>
        <div className="grid gap-3">
          {targets.map((t) => {
            const targetSlug = buildSlug(t.wardName, t.wardCode);
            return (
              <Link
                key={t.wardCode}
                href={`/xa-moi/${targetSlug}`}
                className="border-border bg-card hover:border-brand/60 group rounded-lg border p-4 transition-colors"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="group-hover:text-brand text-[17px] font-semibold">
                    {t.wardName}
                  </span>
                  <span className="text-muted-foreground font-mono text-xs">
                    {code} → {t.wardCode}
                  </span>
                </div>
                <p className="text-muted-foreground mt-1 text-sm">
                  {t.provinceName}
                </p>
                {t.transfer && (
                  <p className="text-muted-foreground mt-1 text-xs">
                    {t.transfer === "fullPopulation"
                      ? "Chuyển toàn bộ dân cư về đây"
                      : "Chỉ chuyển một phần diện tích, không kèm dân cư"}
                  </p>
                )}
                {t.note && (
                  <p className="text-muted-foreground mt-1 text-xs">{t.note}</p>
                )}
              </Link>
            );
          })}
          {targets.length === 0 && (
            <p className="text-muted-foreground text-sm">
              Chưa có dữ liệu ánh xạ sang đơn vị mới.
            </p>
          )}
        </div>
        {isSplit && result.hamlets && result.hamlets.length > 0 && (
          <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
            Vì đơn vị cũ bị chia về nhiều nơi, hãy{" "}
            <Link
              href="/"
              className="text-brand underline-offset-2 hover:underline"
            >
              dùng công cụ chuyển đổi
            </Link>{" "}
            và chọn thôn/tổ dân phố để xác định chính xác địa chỉ mới.
          </p>
        )}
      </section>

      <section className="border-border mt-8 border-t pt-6">
        <h2 className="text-foreground/70 mb-2 text-sm font-semibold tracking-wide uppercase">
          Nghị quyết liên quan
        </h2>
        <p className="text-foreground/80 text-[15px] leading-relaxed">
          Việc sắp xếp đơn vị hành chính cấp tỉnh thực hiện theo{" "}
          <span className="font-mono text-sm">{SOURCE_RESOLUTION}</span>. Việc
          sắp xếp đơn vị cấp xã của {province.name} thực hiện theo nghị quyết
          của Ủy ban Thường vụ Quốc hội, cùng có hiệu lực từ{" "}
          {DATA_UPDATED_DISPLAY}.
        </p>
      </section>

      <Faq items={faq} />

      <RelatedLinks
        provinceName={province.name}
        provinceHref={`/tinh-cu/${provinceSlug}`}
        districtName={district.name}
        siblings={siblings.map((w) => ({
          name: w.name,
          href: `/xa-cu/${buildSlug(w.name, w.code)}`,
        }))}
      />

      <DataFreshness className="border-border mt-10 border-t pt-6" />
    </main>
  );
}

function RelatedLinks({
  provinceName,
  provinceHref,
  districtName,
  siblings,
}: {
  provinceName: string;
  provinceHref: string;
  districtName: string;
  siblings: { name: string; href: string }[];
}) {
  return (
    <section className="border-border mt-8 border-t pt-6">
      <h2 className="text-foreground/70 mb-3 text-sm font-semibold tracking-wide uppercase">
        Liên kết liên quan
      </h2>
      <ul className="text-[15px] leading-relaxed">
        <li>
          <Link
            href={provinceHref}
            className="text-brand underline-offset-2 hover:underline"
          >
            Toàn bộ phường/xã của {provinceName} (cũ)
          </Link>
        </li>
        <li>
          <Link
            href="/blog/doi-cccd-sau-sap-nhap"
            className="text-brand underline-offset-2 hover:underline"
          >
            Có phải đổi CCCD/sổ đỏ sau sáp nhập không?
          </Link>
        </li>
        <li>
          <Link
            href="/"
            className="text-brand underline-offset-2 hover:underline"
          >
            Công cụ chuyển đổi địa chỉ hai chiều
          </Link>
        </li>
      </ul>
      {siblings.length > 0 && (
        <>
          <p className="text-muted-foreground mt-4 mb-2 text-xs tracking-wide uppercase">
            Phường/xã khác thuộc {districtName} (cũ)
          </p>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {siblings.map((s) => (
              <li key={s.href}>
                <Link
                  href={s.href}
                  className="text-foreground/70 hover:text-brand underline-offset-2 hover:underline"
                >
                  {s.name}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
