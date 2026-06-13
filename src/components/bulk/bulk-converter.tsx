"use client";

import * as React from "react";
import * as XLSX from "xlsx";

import { Button } from "@/components/ui/button";
import type { FreeformConversion } from "@/lib/address-types";
import { cn } from "@/lib/utils";

type Status = FreeformConversion["status"];
type Target = "new" | "old";

function statusLabel(status: Status, target: Target): string {
  switch (status) {
    case "converted":
      return "Đã chuyển";
    case "passthrough":
      return target === "new" ? "Đã là địa chỉ mới" : "Đã là địa chỉ cũ";
    case "ambiguous":
      return "Cần kiểm tra (1 → nhiều)";
    case "notFound":
      return "Không nhận diện";
  }
}

const STATUS_CLASS: Record<Status, string> = {
  converted: "text-foreground",
  passthrough: "text-muted-foreground",
  ambiguous: "text-brand",
  notFound: "text-destructive",
};

const CHUNK = 2000;

function noteFor(r: FreeformConversion): string {
  return [
    r.note,
    r.alternatives?.length ? `Khác: ${r.alternatives.join("; ")}` : "",
  ]
    .filter(Boolean)
    .join(" | ");
}

/** Heuristic: prefer a column named like an address, else the longest text. */
function guessAddressColumn(headers: string[], rows: string[][]): number {
  const named = headers.findIndex((h) =>
    /địa chỉ|address|dia chi|diachi/i.test(h),
  );
  if (named >= 0) return named;
  const sample = rows.slice(0, 30);
  let best = 0;
  let bestLen = -1;
  for (let c = 0; c < headers.length; c++) {
    const avg =
      sample.reduce((s, r) => s + (r[c]?.length ?? 0), 0) /
      (sample.length || 1);
    if (avg > bestLen) {
      bestLen = avg;
      best = c;
    }
  }
  return best;
}

export function BulkConverter() {
  const [fileName, setFileName] = React.useState("");
  const [headers, setHeaders] = React.useState<string[]>([]);
  const [rows, setRows] = React.useState<string[][]>([]);
  const [addressCol, setAddressCol] = React.useState(0);
  const [target, setTarget] = React.useState<Target>("new");
  const [results, setResults] = React.useState<FreeformConversion[] | null>(
    null,
  );
  // The target the current results were produced with (for labels/headers).
  const [resultTarget, setResultTarget] = React.useState<Target>("new");
  const [busy, setBusy] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [error, setError] = React.useState("");
  const [dragging, setDragging] = React.useState(false);

  function reset() {
    setResults(null);
    setProgress(0);
    setError("");
  }

  async function loadFile(file: File) {
    reset();
    setFileName(file.name);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const aoa = XLSX.utils.sheet_to_json<string[]>(sheet, {
        header: 1,
        defval: "",
        raw: false,
        blankrows: false,
      });
      if (aoa.length < 2) {
        setError("File cần có dòng tiêu đề và ít nhất một dòng dữ liệu.");
        setHeaders([]);
        setRows([]);
        return;
      }
      const head = aoa[0].map((h) => String(h ?? "").trim());
      const body = aoa
        .slice(1)
        .map((r) => head.map((_, i) => String(r[i] ?? "")));
      setHeaders(head);
      setRows(body);
      setAddressCol(guessAddressColumn(head, body));
    } catch {
      setError("Không đọc được file. Hãy dùng .xlsx, .xls hoặc .csv.");
      setHeaders([]);
      setRows([]);
    }
  }

  async function convert() {
    setBusy(true);
    reset();
    try {
      const inputs = rows.map((r) => r[addressCol] ?? "");
      const out: FreeformConversion[] = [];
      for (let i = 0; i < inputs.length; i += CHUNK) {
        const slice = inputs.slice(i, i + CHUNK);
        const res = await fetch("/api/parse-bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ addresses: slice, target }),
        });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as { results: FreeformConversion[] };
        out.push(...data.results);
        setProgress(Math.round((out.length / inputs.length) * 100));
      }
      setResultTarget(target);
      setResults(out);
    } catch {
      setError("Có lỗi khi chuyển đổi. Vui lòng thử lại với file nhỏ hơn.");
    } finally {
      setBusy(false);
    }
  }

  const resultColLabel = resultTarget === "new" ? "Địa chỉ mới" : "Địa chỉ cũ";

  function buildWorkbook() {
    const aoa = [
      [...headers, resultColLabel, "Trạng thái", "Ghi chú"],
      ...rows.map((row, i) => {
        const r = results![i];
        return [
          ...row,
          r.result ?? "",
          statusLabel(r.status, resultTarget),
          noteFor(r),
        ];
      }),
    ];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "KetQua");
    return wb;
  }

  function download(kind: "xlsx" | "csv") {
    const base = (fileName.replace(/\.[^.]+$/, "") || "dia-chi") + "-da-chuyen";
    XLSX.writeFile(buildWorkbook(), `${base}.${kind}`, { bookType: kind });
  }

  function downloadSample() {
    const ws = XLSX.utils.aoa_to_sheet([
      ["STT", "Họ tên", "Địa chỉ"],
      ["1", "Nguyễn Văn A", "123 Nguyễn Văn Linh, Thanh Khê, Đà Nẵng"],
      ["2", "Trần Thị B", "56 Lê Lợi, P. Bến Nghé, Q1, TPHCM"],
      ["3", "Lê Văn C", "Phúc Xá, Ba Đình, Hà Nội"],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Mau");
    XLSX.writeFile(wb, "file-mau.xlsx");
  }

  const summary = React.useMemo(() => {
    const s = { converted: 0, passthrough: 0, ambiguous: 0, notFound: 0 };
    for (const r of results ?? []) s[r.status]++;
    return s;
  }, [results]);

  return (
    <div className="space-y-6">
      {/* Upload */}
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const f = e.dataTransfer.files?.[0];
          if (f) loadFile(f);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed px-6 py-10 text-center transition-colors",
          dragging
            ? "border-brand bg-muted/40"
            : "border-input hover:bg-muted/30",
        )}
      >
        <span className="text-sm font-medium">
          Kéo thả file vào đây, hoặc bấm để chọn
        </span>
        <span className="text-muted-foreground text-xs">
          Hỗ trợ .xlsx, .xls, .csv — file cần có dòng tiêu đề
        </span>
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) loadFile(f);
          }}
        />
      </label>
      <p className="text-muted-foreground -mt-3 text-xs">
        Chưa có file?{" "}
        <button
          type="button"
          onClick={downloadSample}
          className="hover:text-foreground underline underline-offset-2"
        >
          Tải file mẫu
        </button>
        . Chuyển đổi theo chiều bạn chọn (Cũ → Mới hoặc Mới → Cũ); hiểu cả viết
        tắt (P6, Q1, TP.HCM) và gõ không dấu như khi chuyển từng địa chỉ.
      </p>

      {error && <p className="text-destructive text-sm">{error}</p>}

      {/* Column picker + direction + run */}
      {headers.length > 0 && (
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1.5">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Cột chứa địa chỉ
            </p>
            <select
              value={addressCol}
              onChange={(e) => setAddressCol(Number(e.target.value))}
              className="border-input bg-background h-9 rounded-lg border px-2.5 text-sm"
            >
              {headers.map((h, i) => (
                <option key={i} value={i}>
                  {h || `Cột ${i + 1}`}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Chiều chuyển
            </p>
            <div className="flex h-9 overflow-hidden rounded-lg border">
              {(
                [
                  ["new", "Cũ → Mới"],
                  ["old", "Mới → Cũ"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTarget(key)}
                  className={cn(
                    "px-3 text-sm transition-colors",
                    target === key
                      ? "bg-brand text-white"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="text-muted-foreground text-sm">
            {rows.length.toLocaleString("vi")} dòng · {fileName}
          </div>
          <Button type="button" onClick={convert} disabled={busy}>
            {busy ? `Đang chuyển… ${progress}%` : "Chuyển đổi hàng loạt"}
          </Button>
        </div>
      )}

      {/* Summary */}
      {results && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(
            [
              ["converted", summary.converted],
              ["passthrough", summary.passthrough],
              ["ambiguous", summary.ambiguous],
              ["notFound", summary.notFound],
            ] as const
          ).map(([key, n]) => (
            <div key={key} className="rounded-lg border p-3">
              <div className={cn("text-2xl font-semibold", STATUS_CLASS[key])}>
                {n.toLocaleString("vi")}
              </div>
              <div className="text-muted-foreground text-xs">
                {statusLabel(key, resultTarget)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Download */}
      {results && (
        <div className="flex flex-wrap gap-3">
          <Button type="button" onClick={() => download("xlsx")}>
            Tải Excel (.xlsx)
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => download("csv")}
          >
            Tải CSV
          </Button>
        </div>
      )}

      {/* Preview */}
      {results && (
        <div>
          <p className="text-muted-foreground mb-2 text-xs">
            Xem trước {Math.min(rows.length, 20)} /{" "}
            {rows.length.toLocaleString("vi")} dòng
          </p>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">
                    {headers[addressCol] || "Địa chỉ gốc"}
                  </th>
                  <th className="px-3 py-2 text-left font-medium">
                    {resultColLabel}
                  </th>
                  <th className="px-3 py-2 text-left font-medium">
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 20).map((row, i) => {
                  const r = results[i];
                  return (
                    <tr key={i} className="border-t align-top">
                      <td className="text-muted-foreground px-3 py-2">
                        {row[addressCol]}
                      </td>
                      <td className="px-3 py-2">{r.result ?? "—"}</td>
                      <td
                        className={cn(
                          "px-3 py-2 whitespace-nowrap",
                          STATUS_CLASS[r.status],
                        )}
                      >
                        {statusLabel(r.status, resultTarget)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
