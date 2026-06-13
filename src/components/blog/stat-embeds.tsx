// Server-rendered embeds usable inside MDX articles. They pull live numbers
// from the dataset so the prose around them stays accurate after each rebuild.

import {
  getOverview,
  getTopNewProvincesByWards,
  getTopOldProvincesBySplitWards,
} from "@/lib/stats";

export function MergeOverview() {
  const o = getOverview();
  const cells = [
    { label: "Tỉnh/thành", value: `${o.oldProvinces} → ${o.newProvinces}` },
    {
      label: "Phường/xã",
      value: `${o.oldWards.toLocaleString("vi-VN")} → ${o.newWards.toLocaleString("vi-VN")}`,
    },
    { label: "Giảm số phường/xã", value: `${o.wardReductionPct}%` },
  ];
  return (
    <div className="border-border bg-card my-6 grid grid-cols-1 gap-px overflow-hidden rounded-lg border sm:grid-cols-3">
      {cells.map((c) => (
        <div key={c.label} className="bg-card p-4">
          <p className="text-muted-foreground text-xs tracking-wide uppercase">
            {c.label}
          </p>
          <p className="mt-1 font-mono text-lg font-semibold">{c.value}</p>
        </div>
      ))}
    </div>
  );
}

function RankTable({
  rows,
  unit,
}: {
  rows: { name: string; value: number }[];
  unit: string;
}) {
  return (
    <table className="my-5 w-full border-collapse text-[15px]">
      <tbody>
        {rows.map((r, i) => (
          <tr key={r.name} className="border-border border-b">
            <td className="text-muted-foreground w-8 py-2 font-mono text-sm">
              {i + 1}
            </td>
            <td className="py-2">{r.name}</td>
            <td className="py-2 text-right font-mono font-medium">
              {r.value.toLocaleString("vi-VN")} {unit}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function TopNewProvinces({ limit = 10 }: { limit?: number }) {
  return <RankTable rows={getTopNewProvincesByWards(limit)} unit="phường/xã" />;
}

export function TopSplitProvinces({ limit = 10 }: { limit?: number }) {
  return (
    <RankTable rows={getTopOldProvincesBySplitWards(limit)} unit="đơn vị" />
  );
}
