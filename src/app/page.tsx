import { AddressConverter } from "@/components/converter/address-converter";
import { JsonLd } from "@/components/seo/json-ld";
import { getNewProvinceOptions, getOldProvinceOptions } from "@/lib/converter";
import { SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/site-config";

const homeJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: absoluteUrl("/icon.svg"),
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: SITE_URL,
      inLanguage: "vi-VN",
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "WebApplication",
      name: "Công cụ chuyển đổi địa chỉ hành chính",
      url: SITE_URL,
      applicationCategory: "UtilityApplication",
      operatingSystem: "Web",
      inLanguage: "vi-VN",
      offers: { "@type": "Offer", price: 0, priceCurrency: "VND" },
    },
  ],
};

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12 sm:py-16">
      <JsonLd data={homeJsonLd} />
      <header className="mb-8 text-center">
        <p className="text-muted-foreground mb-3 font-mono text-xs font-medium tracking-[0.06em] uppercase">
          Chuyển đổi địa chỉ hành chính
        </p>
        <h1 className="text-[clamp(26px,4.5vw,38px)] leading-tight font-bold tracking-tight text-balance">
          Dán địa chỉ cũ — nhận ngay địa chỉ mới, đã làm sạch
        </h1>
        <p className="text-foreground/80 mx-auto mt-4 text-lg leading-relaxed">
          Dán nguyên chuỗi địa chỉ dù viết tắt, không dấu hay còn thừa số nhà —
          hệ thống tự nhận diện và đối chiếu sang hệ 34 tỉnh, 2 cấp. Hoặc chọn
          từng cấp thủ công bên dưới.
        </p>
      </header>
      <AddressConverter
        oldProvinces={getOldProvinceOptions()}
        newProvinces={getNewProvinceOptions()}
      />
    </main>
  );
}
