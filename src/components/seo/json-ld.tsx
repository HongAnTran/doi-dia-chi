// Renders a JSON-LD <script> for structured data. Server-rendered, so the
// markup is in the initial HTML where crawlers expect it.

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // Structured data is build-time/server data, never user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
