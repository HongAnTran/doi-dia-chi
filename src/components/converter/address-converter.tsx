"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, FileText, MapPin } from "lucide-react";

import { CopyButton } from "@/components/converter/copy-button";
import {
  SearchableCombobox,
  type ComboboxOption,
} from "@/components/converter/searchable-combobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  HamletRecord,
  NewProvince,
  NewToOldResult,
  NewWardHamlet,
  OldProvince,
  OldToNewResult,
  ParseResult,
  UnitBase,
} from "@/lib/address-types";
import { cn } from "@/lib/utils";

/** Joins optional street + hamlet into an address prefix, e.g. "12 Lê Lợi, Thôn A". */
function addressPrefix(...parts: (string | null | undefined)[]): string {
  return parts
    .map((p) => p?.trim())
    .filter(Boolean)
    .join(", ");
}

function withPrefix(prefix: string, address: string): string {
  return prefix ? `${prefix}, ${address}` : address;
}

type ProvinceOption = Pick<UnitBase, "code" | "name" | "nameNormalized">;

type Mode = "paste" | "oldToNew" | "newToOld";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json() as Promise<T>;
}

function toOptions(units: UnitBase[]): ComboboxOption[] {
  return units.map((u) => ({
    value: u.code,
    label: u.name,
    keywords: u.nameNormalized,
  }));
}

const MODES: ReadonlyArray<readonly [Mode, string]> = [
  ["paste", "Dán địa chỉ"],
  ["oldToNew", "Cũ → Mới"],
  ["newToOld", "Mới → Cũ"],
];

interface AddressConverterProps {
  oldProvinces: ProvinceOption[];
  newProvinces: ProvinceOption[];
}

export function AddressConverter({
  oldProvinces,
  newProvinces,
}: AddressConverterProps) {
  const [mode, setMode] = React.useState<Mode>("paste");

  return (
    <section
      aria-label="Công cụ chuyển đổi"
      className="bg-card border-border rounded-md border p-5 sm:p-6"
    >
      {/* Segmented mode toggle — đỏ son when active */}
      <div
        role="tablist"
        className="bg-secondary border-border mb-6 flex w-full gap-0.5 rounded-md border p-[3px]"
      >
        {MODES.map(([key, label]) => (
          <button
            key={key}
            id={`tab-${key}`}
            role="tab"
            type="button"
            aria-selected={mode === key}
            aria-controls="converter-panel"
            onClick={() => setMode(key)}
            className={cn(
              "min-h-10 flex-1 rounded-[4px] text-sm font-semibold whitespace-nowrap transition-colors",
              mode === key
                ? "bg-primary text-primary-foreground"
                : "text-foreground/70 hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div id="converter-panel" role="tabpanel" aria-labelledby={`tab-${mode}`}>
        {mode === "paste" && <PasteAddressForm />}
        {mode === "oldToNew" && <OldToNewForm provinces={oldProvinces} />}
        {mode === "newToOld" && <NewToOldForm provinces={newProvinces} />}
      </div>
    </section>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: React.ReactNode;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <p className="text-foreground/85 text-[13px] font-semibold tracking-[0.01em]">
        {label}
      </p>
      {children}
      {hint && <p className="text-muted-foreground text-[13px]">{hint}</p>}
    </div>
  );
}

function OldToNewForm({ provinces }: { provinces: ProvinceOption[] }) {
  const [provinceCode, setProvinceCode] = React.useState<string | null>(null);
  const [districtCode, setDistrictCode] = React.useState<string | null>(null);
  const [wardCode, setWardCode] = React.useState<string | null>(null);
  const [hamletIdx, setHamletIdx] = React.useState<string | null>(null);
  const [hamletText, setHamletText] = React.useState("");
  const [street, setStreet] = React.useState("");

  const provinceQuery = useQuery({
    queryKey: ["old-units", provinceCode],
    queryFn: () => fetchJson<OldProvince>(`/api/old-units/${provinceCode}`),
    enabled: provinceCode !== null,
    staleTime: Infinity,
  });

  const resultQuery = useQuery({
    queryKey: ["convert", "old-to-new", wardCode],
    queryFn: () =>
      fetchJson<OldToNewResult>(`/api/convert/old-to-new/${wardCode}`),
    enabled: wardCode !== null,
    staleTime: Infinity,
  });

  const districts = provinceQuery.data?.districts ?? [];
  const wards = districts.find((d) => d.code === districtCode)?.wards ?? [];
  const hamlets = resultQuery.data?.hamlets ?? [];
  const hasHamletData = hamlets.length > 0;
  const selectedHamlet =
    hamletIdx !== null ? (hamlets[Number(hamletIdx)] ?? null) : null;
  // The hamlet text carried into the result: the combobox pick (if data) or
  // whatever the user typed (free text).
  const hamletName = hasHamletData ? (selectedHamlet?.name ?? "") : hamletText;
  const prefix = addressPrefix(street, hamletName);

  return (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Tỉnh / Thành phố (cũ)">
          <SearchableCombobox
            options={toOptions(provinces)}
            value={provinceCode}
            onChange={(code) => {
              setProvinceCode(code);
              setDistrictCode(null);
              setWardCode(null);
            }}
            placeholder="Chọn tỉnh, thành phố"
          />
        </Field>
        <Field label="Quận / Huyện (cũ)">
          <SearchableCombobox
            options={toOptions(districts)}
            value={districtCode}
            onChange={(code) => {
              setDistrictCode(code);
              setWardCode(null);
            }}
            placeholder={
              provinceQuery.isLoading ? "Đang tải..." : "Chọn quận, huyện"
            }
            disabled={provinceCode === null || provinceQuery.isLoading}
          />
        </Field>
        <Field label="Phường / Xã (cũ)">
          <SearchableCombobox
            options={toOptions(wards)}
            value={wardCode}
            onChange={(code) => {
              setWardCode(code);
              setHamletIdx(null);
            }}
            placeholder="Chọn phường, xã"
            disabled={districtCode === null}
          />
        </Field>
        <Field label="Thôn / Ấp / Tổ dân phố (cũ) — không bắt buộc">
          {hasHamletData ? (
            <SearchableCombobox
              options={hamlets.map((h, i) => ({
                value: String(i),
                label: h.name,
                keywords: h.nameNormalized,
              }))}
              value={hamletIdx}
              onChange={setHamletIdx}
              placeholder="Chọn thôn để xác định chính xác xã mới"
            />
          ) : (
            <Input
              value={hamletText}
              onChange={(e) => setHamletText(e.target.value)}
              placeholder="Nhập thôn/xóm (nếu có)"
              disabled={wardCode === null}
            />
          )}
        </Field>
        <Field label="Số nhà, tên đường — không bắt buộc">
          <Input
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            placeholder="VD: 123 Lê Lợi"
            disabled={wardCode === null}
          />
        </Field>
      </div>

      {resultQuery.isLoading && <ResultPending />}
      {resultQuery.isError && <ResultError />}
      {resultQuery.data && (
        <OldToNewResultView
          result={resultQuery.data}
          selectedHamlet={selectedHamlet}
          prefix={prefix}
          onShowAll={() => setHamletIdx(null)}
        />
      )}
    </div>
  );
}

const PASTE_EXAMPLES: ReadonlyArray<readonly [string, string]> = [
  ["Viết tắt + số nhà", "123/4 Lê Lợi, P.Bến Nghé, Q1, TP.HCM"],
  ["Gõ không dấu", "p vu ninh tp bac ninh"],
  ["Phường đánh số", "so 5 p.6 q3 tphcm"],
  ["Ca cần chọn thôn", "xã hòa tiến, hòa vang, đà nẵng"],
];

function PasteAddressForm() {
  const [text, setText] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [candidateIdx, setCandidateIdx] = React.useState(0);

  const parseQuery = useQuery({
    queryKey: ["parse", query],
    queryFn: () =>
      fetchJson<ParseResult>(`/api/parse?q=${encodeURIComponent(query)}`),
    enabled: query.trim().length > 0,
    staleTime: Infinity,
  });

  const candidates = parseQuery.data?.candidates ?? [];
  const candidatesLoading = parseQuery.isLoading;
  const chosen = candidates[candidateIdx];

  // Convert the chosen candidate by reusing the directional endpoints.
  const oldToNew = useQuery({
    queryKey: ["convert", "old-to-new", chosen?.wardCode],
    queryFn: () =>
      fetchJson<OldToNewResult>(`/api/convert/old-to-new/${chosen!.wardCode}`),
    enabled: chosen?.system === "old",
    staleTime: Infinity,
  });
  const newToOld = useQuery({
    queryKey: ["convert", "new-to-old", chosen?.wardCode],
    queryFn: () =>
      fetchJson<NewToOldResult>(`/api/convert/new-to-old/${chosen!.wardCode}`),
    enabled: chosen?.system === "new",
    staleTime: Infinity,
  });

  function submit(value: string = text) {
    setCandidateIdx(0);
    setText(value);
    setQuery(value);
  }

  return (
    <div className="space-y-5">
      <Field
        label="Dán nguyên địa chỉ — gõ kiểu gì cũng được"
        hint="Hiểu viết tắt (P6, Q1, TP.HCM), gõ không dấu, và tự bỏ số nhà / tên đường."
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
          }}
          rows={2}
          placeholder="VD: 123/4 Lê Lợi, P.Bến Nghé, Q1, TP.HCM"
          className="border-input bg-card focus-visible:border-ring focus-visible:ring-ring/40 min-h-[60px] w-full resize-y rounded-md border px-4 py-3 text-base leading-relaxed outline-none focus-visible:ring-3"
        />
      </Field>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground mr-1 text-xs font-semibold tracking-[0.04em] uppercase">
          Thử nhanh
        </span>
        {PASTE_EXAMPLES.map(([label, value]) => (
          <button
            key={label}
            type="button"
            onClick={() => submit(value)}
            className="bg-muted border-border text-foreground/80 hover:border-brand hover:text-brand rounded-full border px-3 py-1 text-[13px] transition-colors"
          >
            {label}
          </button>
        ))}
      </div>

      <Button
        type="button"
        onClick={() => submit()}
        disabled={!text.trim()}
        className="w-full"
      >
        Nhận diện &amp; chuyển đổi
      </Button>

      {query.trim() && candidates.length === 0 && !candidatesLoading && (
        <div className="border-input text-muted-foreground flex items-start gap-3 rounded-md border border-dashed p-5 text-sm">
          <AlertTriangle className="text-brand mt-0.5 size-5 shrink-0" />
          <div>
            <p className="text-foreground font-semibold">
              Chưa nhận diện được đơn vị hành chính
            </p>
            <p className="mt-1 leading-relaxed">
              Hãy kiểm tra lại, hoặc dùng tab “Cũ → Mới” / “Mới → Cũ” để chọn
              thủ công.
            </p>
          </div>
        </div>
      )}

      {candidates.length > 0 && chosen && (
        <div className="space-y-5">
          {/* "Bạn dán → Đã làm sạch" panel */}
          <div className="border-input overflow-hidden rounded-md border">
            <div className="bg-muted border-border flex items-start gap-3 border-b px-5 py-4">
              <span className="text-muted-foreground min-w-[78px] shrink-0 pt-0.5 font-mono text-[11px] tracking-[0.04em] uppercase">
                Bạn dán
              </span>
              <span className="text-muted-foreground text-[15px]">
                {query.trim()}
              </span>
            </div>
            <div className="flex flex-col gap-3 px-5 py-4">
              <span className="flex items-center gap-2 text-xs font-semibold tracking-[0.04em] text-[#2e6b43] uppercase">
                Đã làm sạch &amp; nhận diện ·{" "}
                {chosen.system === "old" ? "địa chỉ cũ" : "địa chỉ mới"}
              </span>
              <div className="flex flex-wrap gap-2">
                {chosen.street && (
                  <span className="bg-card border-input inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                    <span className="text-muted-foreground font-mono text-[11px] uppercase">
                      Đã bỏ
                    </span>
                    <span className="text-muted-foreground line-through decoration-[#e6c4bd]">
                      {chosen.street}
                    </span>
                  </span>
                )}
                <span className="bg-card border-input inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                  <span className="text-muted-foreground font-mono text-[11px] uppercase">
                    Đơn vị
                  </span>
                  {chosen.label}
                </span>
              </div>
            </div>
          </div>

          {candidates.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {candidates.map((c, i) => (
                <button
                  key={`${c.system}:${c.wardCode}`}
                  type="button"
                  onClick={() => setCandidateIdx(i)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-[13px] transition-colors",
                    i === candidateIdx
                      ? "border-brand text-brand"
                      : "text-muted-foreground hover:text-foreground border-border",
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}

          {(oldToNew.isLoading || newToOld.isLoading) && <ResultPending />}
          {(oldToNew.isError || newToOld.isError) && <ResultError />}
          {chosen.system === "old" && oldToNew.data && (
            <OldToNewResultView
              result={oldToNew.data}
              selectedHamlet={null}
              prefix={chosen.street}
              onShowAll={() => {}}
            />
          )}
          {chosen.system === "new" && newToOld.data && (
            <NewToOldResultView
              result={newToOld.data}
              selectedHamlet={null}
              hamletName=""
              street={chosen.street}
            />
          )}
        </div>
      )}
    </div>
  );
}

function NewToOldForm({ provinces }: { provinces: ProvinceOption[] }) {
  const [provinceCode, setProvinceCode] = React.useState<string | null>(null);
  const [wardCode, setWardCode] = React.useState<string | null>(null);
  const [hamletIdx, setHamletIdx] = React.useState<string | null>(null);
  const [hamletText, setHamletText] = React.useState("");
  const [street, setStreet] = React.useState("");

  const provinceQuery = useQuery({
    queryKey: ["new-units", provinceCode],
    queryFn: () => fetchJson<NewProvince>(`/api/new-units/${provinceCode}`),
    enabled: provinceCode !== null,
    staleTime: Infinity,
  });

  const resultQuery = useQuery({
    queryKey: ["convert", "new-to-old", wardCode],
    queryFn: () =>
      fetchJson<NewToOldResult>(`/api/convert/new-to-old/${wardCode}`),
    enabled: wardCode !== null,
    staleTime: Infinity,
  });

  function resetWard(code: string | null) {
    setWardCode(code);
    setHamletIdx(null);
    setHamletText("");
  }

  const hamlets = resultQuery.data?.hamlets ?? [];
  const hasHamletData = hamlets.length > 0;
  const selectedHamlet =
    hamletIdx !== null ? (hamlets[Number(hamletIdx)] ?? null) : null;
  const hamletName = hasHamletData ? (selectedHamlet?.name ?? "") : hamletText;

  return (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Tỉnh / Thành phố (mới)">
          <SearchableCombobox
            options={toOptions(provinces)}
            value={provinceCode}
            onChange={(code) => {
              setProvinceCode(code);
              resetWard(null);
            }}
            placeholder="Chọn tỉnh, thành phố"
          />
        </Field>
        <Field label="Phường / Xã (mới)">
          <SearchableCombobox
            options={toOptions(provinceQuery.data?.wards ?? [])}
            value={wardCode}
            onChange={resetWard}
            placeholder={
              provinceQuery.isLoading ? "Đang tải..." : "Chọn phường, xã"
            }
            disabled={provinceCode === null || provinceQuery.isLoading}
          />
        </Field>
        <Field label="Thôn / Ấp / Tổ dân phố (mới) — bắt buộc">
          {hasHamletData ? (
            <SearchableCombobox
              options={hamlets.map((h, i) => ({
                value: String(i),
                label: h.name,
                keywords: h.nameNormalized,
              }))}
              value={hamletIdx}
              onChange={setHamletIdx}
              placeholder="Chọn thôn/xóm trong địa chỉ của bạn"
            />
          ) : (
            <Input
              value={hamletText}
              onChange={(e) => setHamletText(e.target.value)}
              placeholder="Nhập thôn/xóm trong địa chỉ của bạn"
              disabled={wardCode === null}
            />
          )}
        </Field>
        <Field label="Số nhà, tên đường — không bắt buộc">
          <Input
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            placeholder="VD: 123 Lê Lợi"
            disabled={wardCode === null}
          />
        </Field>
      </div>

      {resultQuery.isLoading && <ResultPending />}
      {resultQuery.isError && <ResultError />}
      {resultQuery.data && (
        <NewToOldResultView
          result={resultQuery.data}
          selectedHamlet={selectedHamlet}
          hamletName={hamletName}
          street={street}
        />
      )}
    </div>
  );
}

function ResultPending() {
  return (
    <div className="text-muted-foreground flex items-center justify-center gap-3 py-10 text-sm">
      <span className="border-input border-t-brand size-[18px] animate-spin rounded-full border-2" />
      Đang đối chiếu dữ liệu…
    </div>
  );
}

function ResultError() {
  return (
    <p className="text-destructive text-sm">
      Không tra cứu được kết quả. Vui lòng thử lại.
    </p>
  );
}

/** "Trích lục" result card — official-document framing. */
function ResultCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-input overflow-hidden rounded-md border">
      <div className="bg-secondary border-border flex items-center gap-3 border-b px-5 py-3">
        <FileText className="text-foreground/70 size-[18px]" />
        <span className="text-foreground/85 text-[13px] font-semibold">
          {title}
        </span>
        <span className="bg-muted border-border text-muted-foreground ml-auto inline-flex items-center gap-2 rounded border px-2 py-0.5 font-mono text-[11px] tracking-[0.02em] whitespace-nowrap">
          <span className="bg-brand inline-block size-[5px] rounded-full" />
          NQ 202/2025/QH15
        </span>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

/** Warm-paper warning banner (matches the design's ambiguous banner). */
function Banner({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-foreground mb-4 rounded-md border border-l-4 border-[#c08a2a] bg-[#f2e8cc] px-5 py-4 text-sm leading-relaxed">
      {children}
    </div>
  );
}

function AddressRow({
  address,
  code,
  note,
}: {
  address: string;
  code?: string;
  note?: string;
}) {
  return (
    <li className="border-border flex items-start justify-between gap-3 border-b py-3 last:border-b-0">
      <div className="min-w-0">
        <p className="text-[15px] leading-relaxed">{address}</p>
        {code && (
          <p className="text-muted-foreground mt-1 flex items-center gap-1.5 font-mono text-xs">
            <MapPin className="text-brand size-3.5" />
            Mã ĐVHC <span>{code}</span>
          </p>
        )}
        {note && <p className="text-muted-foreground mt-1 text-xs">{note}</p>}
      </div>
      <CopyButton text={address} />
    </li>
  );
}

const NEW_TRANSFER_LABELS: Record<string, string> = {
  landOnly: "Chỉ nhận một phần diện tích, không có dân cư chuyển về",
  fullPopulation: "Nhận toàn bộ dân cư của đơn vị cũ",
};

const OLD_TRANSFER_LABELS: Record<string, string> = {
  landOnly: "Chỉ góp một phần diện tích, dân cư không chuyển về đây",
  fullPopulation: "Toàn bộ dân cư của đơn vị này chuyển về đây",
};

function OldToNewResultView({
  result,
  selectedHamlet,
  prefix,
  onShowAll,
}: {
  result: OldToNewResult;
  selectedHamlet: HamletRecord | null;
  prefix: string;
  onShowAll: () => void;
}) {
  // Đơn vị mới có nhận dân cư — phần "chỉ diện tích" không liên quan
  // tới địa chỉ của người dân.
  const residential = result.matches.filter((m) => m.transfer !== "landOnly");

  if (selectedHamlet) {
    // Resolve the destination: single-match ward → its only new ward; split
    // ward → the hamlet's assigned new ward (when known).
    const match = !result.isAmbiguous
      ? result.matches[0]
      : selectedHamlet.newWardCode
        ? result.matches.find((m) => m.wardCode === selectedHamlet.newWardCode)
        : undefined;

    if (match) {
      return (
        <ResultCard title="Trích lục đối chiếu · Địa chỉ mới">
          <p className="text-muted-foreground mb-3 text-sm">
            {withPrefix(prefix, result.from.fullAddress)}
          </p>
          <ul>
            <AddressRow
              address={withPrefix(prefix, match.fullAddress)}
              code={match.wardCode}
              note={
                result.isAmbiguous
                  ? `${selectedHamlet.name} thuộc đơn vị mới này`
                  : undefined
              }
            />
          </ul>
          {result.isAmbiguous && (
            <button
              type="button"
              onClick={onShowAll}
              className="text-muted-foreground hover:text-foreground mt-3 text-sm underline underline-offset-2"
            >
              Không đúng thôn của bạn? Xem tất cả {result.matches.length} xã mới
              có thể
            </button>
          )}
        </ResultCard>
      );
    }

    // Hamlet is in the data but its new ward couldn't be determined safely.
    return (
      <ResultCard title="Trích lục đối chiếu · Địa chỉ mới">
        <p className="text-muted-foreground mb-3 text-sm">
          {withPrefix(prefix, result.from.fullAddress)}
        </p>
        <Banner>
          Chưa xác định được chắc chắn thôn “{selectedHamlet.name}” thuộc xã mới
          nào — dưới đây là tất cả {result.matches.length} xã mới có thể, hãy
          đối chiếu thêm.
        </Banner>
        <ul>
          {result.matches.map((m) => (
            <AddressRow
              key={m.wardCode}
              address={withPrefix(prefix, m.fullAddress)}
              code={m.wardCode}
              note={[m.note, m.transfer && NEW_TRANSFER_LABELS[m.transfer]]
                .filter(Boolean)
                .join(" — ")}
            />
          ))}
        </ul>
      </ResultCard>
    );
  }

  return (
    <ResultCard title="Trích lục đối chiếu · Địa chỉ mới">
      <p className="text-muted-foreground mb-3 text-sm">
        {withPrefix(prefix, result.from.fullAddress)}
      </p>
      {result.isAmbiguous && result.hamlets && result.hamlets.length > 0 && (
        <p className="text-muted-foreground border-border mb-3 border-l-2 pl-3 text-sm">
          Xã này có dữ liệu thôn: chọn thôn ở ô trên để ra đúng một kết quả.
          Không thấy thôn của bạn? Danh sách dưới đây là tất cả{" "}
          {result.matches.length} xã mới có thể.
        </p>
      )}
      {result.isAmbiguous && residential.length === 1 && (
        <p className="text-muted-foreground border-border mb-3 border-l-2 pl-3 text-sm">
          Về dân cư, địa chỉ mới là {residential[0].wardName} — các đơn vị còn
          lại chỉ nhận phần diện tích không có dân cư (theo bảng chuyển đổi của
          Cục Thống kê).
        </p>
      )}
      {result.isAmbiguous && residential.length !== 1 && (
        <Banner>
          Đơn vị cũ này được chia vào {result.matches.length} đơn vị mới. Hãy
          đối chiếu địa chỉ cụ thể (số nhà, tên đường) để chọn đúng.
        </Banner>
      )}
      <ul>
        {result.matches.map((m) => (
          <AddressRow
            key={m.wardCode}
            address={withPrefix(prefix, m.fullAddress)}
            code={m.wardCode}
            note={[m.note, m.transfer && NEW_TRANSFER_LABELS[m.transfer]]
              .filter(Boolean)
              .join(" — ")}
          />
        ))}
      </ul>
    </ResultCard>
  );
}

function NewToOldResultView({
  result,
  selectedHamlet,
  hamletName,
  street,
}: {
  result: NewToOldResult;
  selectedHamlet: NewWardHamlet | null;
  hamletName: string;
  street: string;
}) {
  const single = result.sources.length === 1;
  // The precise old ward: if there is hamlet data, the chosen hamlet pins it;
  // for a single-source new ward it is the only source.
  const pinned = selectedHamlet
    ? result.sources.find((s) => s.wardCode === selectedHamlet.oldWardCode)
    : single
      ? result.sources[0]
      : null;
  const prefix = addressPrefix(street, hamletName);
  // Chọn thôn (hoặc xã mới chỉ có 1 nguồn) là đủ để ra địa chỉ cũ; số nhà,
  // tên đường chỉ để nối thêm vào, không bắt buộc.
  const ready = pinned && (single || hamletName.trim());

  return (
    <ResultCard title="Trích lục đối chiếu · Địa chỉ cũ">
      <p className="text-muted-foreground mb-3 text-sm">
        {withPrefix(prefix, result.from.fullAddress)}
      </p>
      {ready ? (
        <ul>
          <AddressRow
            address={withPrefix(prefix, pinned!.fullAddress)}
            code={pinned!.wardCode}
          />
        </ul>
      ) : (
        <Banner>
          {result.hamlets && result.hamlets.length > 0
            ? "Chọn thôn/xóm để ra địa chỉ cũ chính xác (số nhà, tên đường không bắt buộc)."
            : "Xã mới này chưa có dữ liệu thôn — xem danh sách các xã cũ thành phần bên dưới để đối chiếu."}
        </Banner>
      )}

      <div className="mt-6">
        <h3 className="text-muted-foreground mb-2 font-mono text-[11px] font-semibold tracking-[0.04em] uppercase">
          {single
            ? "Đơn vị cũ tương ứng"
            : `Gồm ${result.sources.length} đơn vị cũ (tham khảo)`}
        </h3>
        <ul>
          {result.sources.map((s) => (
            <AddressRow
              key={s.wardCode}
              address={s.fullAddress}
              code={s.wardCode}
              note={[
                s.transfer && OLD_TRANSFER_LABELS[s.transfer],
                s.hamletNames &&
                  `Gồm các thôn: ${s.hamletNames.join(", ")} (nay thuộc xã mới này)`,
              ]
                .filter(Boolean)
                .join(" — ")}
            />
          ))}
        </ul>
      </div>
    </ResultCard>
  );
}
