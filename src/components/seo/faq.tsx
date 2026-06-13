import { JsonLd } from "@/components/seo/json-ld";

export interface FaqItem {
  question: string;
  /** Plain-text answer (used verbatim in the FAQPage schema). */
  answer: string;
}

/** Renders an FAQ block plus FAQPage JSON-LD for rich results. */
export function Faq({
  items,
  heading = "Câu hỏi thường gặp",
}: {
  items: FaqItem[];
  heading?: string;
}) {
  if (items.length === 0) return null;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.question,
      acceptedAnswer: { "@type": "Answer", text: it.answer },
    })),
  };

  return (
    <section className="mt-10">
      <JsonLd data={jsonLd} />
      <h2 className="text-xl font-semibold tracking-tight">{heading}</h2>
      <dl className="mt-4 space-y-4">
        {items.map((it, i) => (
          <div key={i} className="border-border bg-card rounded-lg border p-4">
            <dt className="font-medium">{it.question}</dt>
            <dd className="text-foreground/80 mt-1.5 text-[15px] leading-relaxed">
              {it.answer}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
