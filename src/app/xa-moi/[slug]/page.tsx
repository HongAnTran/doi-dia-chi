import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { DataFreshness } from "@/components/common/data-freshness";
import { Faq, type FaqItem } from "@/components/seo/faq";
import { JsonLd } from "@/components/seo/json-ld";
import { convertNewToOld, getNewWardContext } from "@/lib/converter";
import {
  DATA_UPDATED_DISPLAY,
  SOURCE_RESOLUTION,
  absoluteUrl,
} from "@/lib/site-config";
import { buildSlug, codeFromSlug } from "@/lib/slug";

// Render on-demand + cache vĩnh viễn: dữ liệu tĩnh, chỉ đổi khi redeploy.
// Build không pre-render ~3.3k trang; trang sinh ra ở request đầu rồi cache lại.
export const dynamicParams = true;
export const revalidate = false;

export function generateStaticParams() {
  return [];
}

function getData(slug: string) {
  const code = codeFromSlug(slug);
  const context = getNewWardContext(code);
  if (!context) return null;
  const result = convertNewToOld(code);
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
  const sources = result.sources;
  const canonical = `/xa-moi/${slug}`;

  const summary =
    sources.length === 0
      ? `${ward.name}, ${province.name}.`
      : `${ward.name}, ${province.name} được hình thành từ ${sources.length} đơn vị hành chính cũ sau sáp nhập ${DATA_UPDATED_DISPLAY}.`;

  return {
    title: `${ward.name}, ${province.name} sáp nhập từ đâu?`,
    description: `${summary} Tra cứu danh sách phường/xã cũ, mã và nghị quyết liên quan.`,
    alternates: { canonical },
  };
}

export default async function NewWardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = getData(slug);
  if (!data) notFound();
  const { code, context, result } = data;
  const { ward, province } = context;
  const sources = result.sources;
  const provinceSlug = buildSlug(province.name, province.code);

  const siblings = province.wards
    .filter((w) => w.code !== ward.code)
    .slice(0, 12);

  const faq: FaqItem[] = [
    {
      question: `${ward.name}, ${province.name} được sáp nhập từ những đơn vị nào?`,
      answer:
        sources.length === 0
          ? `Hiện chưa có dữ liệu về các đơn vị cũ tạo thành ${ward.name}.`
          : `${ward.name} được hình thành từ ${sources.length} đơn vị cũ: ${sources
              .map((s) => s.fullAddress)
              .join("; ")}.`,
    },
    {
      question: `Mã của ${ward.name} là gì?`,
      answer: `Mã đơn vị mới là ${code}${
        sources.length
          ? `, hình thành từ các mã cũ ${sources.map((s) => s.wardCode).join(", ")}`
          : ""
      }.`,
    },
    {
      question: "Việc thành lập đơn vị mới căn cứ theo văn bản nào?",
      answer: `Theo ${SOURCE_RESOLUTION} (cấp tỉnh) và nghị quyết của Ủy ban Thường vụ Quốc hội về sắp xếp đơn vị cấp xã, có hiệu lực từ ${DATA_UPDATED_DISPLAY}.`,
    },
  ];

  const placeJsonLd = {
    "@context": "https://schema.org",
    "@type": "AdministrativeArea",
    name: `${ward.name}, ${province.name}`,
    url: absoluteUrl(`/xa-moi/${slug}`),
    containedInPlace: {
      "@type": "AdministrativeArea",
      name: province.name,
      containedInPlace: { "@type": "Country", name: "Việt Nam" },
    },
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <JsonLd data={placeJsonLd} />
      <Breadcrumbs
        items={[
          { name: "Trang chủ", href: "/" },
          { name: "Tra cứu địa chỉ", href: "/tra-cuu" },
          { name: province.name, href: `/tinh-moi/${provinceSlug}` },
          { name: ward.name },
        ]}
      />

      <header className="mt-6">
        <p className="text-muted-foreground mb-2 font-mono text-xs tracking-[0.06em] uppercase">
          Đơn vị hành chính mới · mã {code}
        </p>
        <h1 className="text-[clamp(24px,4vw,34px)] leading-tight font-bold tracking-tight text-balance">
          {ward.name},{" "}
          <span className="text-foreground/70">{province.name}</span> sáp nhập
          từ đâu?
        </h1>
        <p className="text-foreground/80 mt-3 text-[17px] leading-relaxed">
          {ward.name} thuộc {province.name} trong hệ thống hành chính mới (34
          tỉnh, 2 cấp).{" "}
          {sources.length === 0
            ? "Hiện chưa có dữ liệu về các đơn vị cũ tạo thành đơn vị này."
            : `Đơn vị này được hình thành từ ${sources.length} phường/xã cũ sau sáp nhập ${DATA_UPDATED_DISPLAY}.`}
        </p>
      </header>

      <section className="mt-8">
        <h2 className="text-foreground/70 mb-3 text-sm font-semibold tracking-wide uppercase">
          Hình thành từ các đơn vị cũ
        </h2>
        <div className="grid gap-3">
          {sources.map((s) => {
            const sourceSlug = buildSlug(s.wardName, s.wardCode);
            return (
              <Link
                key={s.wardCode}
                href={`/xa-cu/${sourceSlug}`}
                className="border-border bg-card hover:border-brand/60 group rounded-lg border p-4 transition-colors"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="group-hover:text-brand text-[17px] font-semibold">
                    {s.wardName}
                  </span>
                  <span className="text-muted-foreground font-mono text-xs">
                    {s.wardCode} → {code}
                  </span>
                </div>
                <p className="text-muted-foreground mt-1 text-sm">
                  {s.districtName}, {s.provinceName}
                </p>
                {s.transfer && (
                  <p className="text-muted-foreground mt-1 text-xs">
                    {s.transfer === "fullPopulation"
                      ? "Chuyển toàn bộ dân cư về đây"
                      : "Chỉ một phần diện tích chuyển về đây"}
                  </p>
                )}
              </Link>
            );
          })}
          {sources.length === 0 && (
            <p className="text-muted-foreground text-sm">
              Chưa có dữ liệu về các đơn vị cũ.
            </p>
          )}
        </div>
      </section>

      <section className="border-border mt-8 border-t pt-6">
        <h2 className="text-foreground/70 mb-2 text-sm font-semibold tracking-wide uppercase">
          Nghị quyết liên quan
        </h2>
        <p className="text-foreground/80 text-[15px] leading-relaxed">
          Sắp xếp đơn vị hành chính cấp tỉnh theo{" "}
          <span className="font-mono text-sm">{SOURCE_RESOLUTION}</span>; cấp xã
          theo nghị quyết của Ủy ban Thường vụ Quốc hội cho {province.name},
          cùng hiệu lực từ {DATA_UPDATED_DISPLAY}.
        </p>
      </section>

      <Faq items={faq} />

      <section className="border-border mt-8 border-t pt-6">
        <h2 className="text-foreground/70 mb-3 text-sm font-semibold tracking-wide uppercase">
          Liên kết liên quan
        </h2>
        <ul className="text-[15px] leading-relaxed">
          <li>
            <Link
              href={`/tinh-moi/${provinceSlug}`}
              className="text-brand underline-offset-2 hover:underline"
            >
              Toàn bộ phường/xã của {province.name}
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
              Phường/xã khác thuộc {province.name}
            </p>
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {siblings.map((w) => (
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
          </>
        )}
      </section>

      <DataFreshness className="border-border mt-10 border-t pt-6" />
    </main>
  );
}
