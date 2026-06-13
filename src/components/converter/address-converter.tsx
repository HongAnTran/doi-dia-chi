"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";

import { CopyButton } from "@/components/converter/copy-button";
import {
  SearchableCombobox,
  type ComboboxOption,
} from "@/components/converter/searchable-combobox";
import { Input } from "@/components/ui/input";
import type {
  HamletRecord,
  NewProvince,
  NewToOldResult,
  NewWardHamlet,
  OldProvince,
  OldToNewResult,
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

type Direction = "oldToNew" | "newToOld";

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

interface AddressConverterProps {
  oldProvinces: ProvinceOption[];
  newProvinces: ProvinceOption[];
}

export function AddressConverter({
  oldProvinces,
  newProvinces,
}: AddressConverterProps) {
  const [direction, setDirection] = React.useState<Direction>("oldToNew");

  return (
    <div>
      <div role="tablist" className="grid grid-cols-2 border-b">
        {(
          [
            ["oldToNew", "Cũ → Mới"],
            ["newToOld", "Mới → Cũ"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            id={`tab-${key}`}
            role="tab"
            type="button"
            aria-selected={direction === key}
            aria-controls="converter-panel"
            onClick={() => setDirection(key)}
            className={cn(
              "-mb-px border-b-2 pb-3 text-sm font-medium transition-colors",
              direction === key
                ? "border-brand text-brand"
                : "text-muted-foreground hover:text-foreground border-transparent",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <div
        id="converter-panel"
        role="tabpanel"
        aria-labelledby={`tab-${direction}`}
        className="pt-8"
      >
        {direction === "oldToNew" ? (
          <OldToNewForm provinces={oldProvinces} />
        ) : (
          <NewToOldForm provinces={newProvinces} />
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        {label}
      </p>
      {children}
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
    <div className="grid grid-cols-2 gap-4">
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
    <div className="grid grid-cols-2 gap-4">
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
  return <p className="text-muted-foreground text-sm">Đang tra cứu...</p>;
}

function ResultError() {
  return (
    <p className="text-destructive text-sm">
      Không tra cứu được kết quả. Vui lòng thử lại.
    </p>
  );
}

function ResultSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t pt-6">
      <h2 className="text-muted-foreground mb-4 text-xs font-medium tracking-wide uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}

function AddressRow({ address, note }: { address: string; note?: string }) {
  return (
    <li className="flex items-start justify-between gap-3 border-b py-3 last:border-b-0">
      <div className="min-w-0">
        <p className="text-sm leading-relaxed">{address}</p>
        {note && <p className="text-muted-foreground mt-0.5 text-xs">{note}</p>}
      </div>
      <CopyButton text={address} />
    </li>
  );
}

function HamletDisclaimer({ source }: { source?: string }) {
  return (
    <p className="text-muted-foreground mt-4 border-t pt-3 text-xs leading-relaxed">
      Lưu ý: dữ liệu thôn/tổ dân phố lấy từ nguồn cộng đồng (diachimoi.net), đối
      chiếu theo mã thôn — mang tính tham khảo và có thể chưa chính xác. Vui
      lòng kiểm tra lại với giấy tờ, văn bản chính thức.
      {source ? ` Nguồn: ${source}` : ""}
    </p>
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
        <ResultSection title="Địa chỉ mới">
          <p className="text-muted-foreground mb-3 text-sm">
            {withPrefix(prefix, result.from.fullAddress)}
          </p>
          <ul>
            <AddressRow
              address={withPrefix(prefix, match.fullAddress)}
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
          <HamletDisclaimer source={result.hamletSource} />
        </ResultSection>
      );
    }

    // Hamlet is in the data but its new ward couldn't be determined safely.
    return (
      <ResultSection title="Địa chỉ mới">
        <p className="text-muted-foreground mb-3 text-sm">
          {withPrefix(prefix, result.from.fullAddress)}
        </p>
        <p className="border-brand/40 text-brand mb-3 border-l-2 pl-3 text-sm">
          Chưa xác định được chắc chắn thôn “{selectedHamlet.name}” thuộc xã mới
          nào — dưới đây là tất cả {result.matches.length} xã mới có thể, hãy
          đối chiếu thêm.
        </p>
        <ul>
          {result.matches.map((m) => (
            <AddressRow
              key={m.wardCode}
              address={withPrefix(prefix, m.fullAddress)}
              note={[m.note, m.transfer && NEW_TRANSFER_LABELS[m.transfer]]
                .filter(Boolean)
                .join(" — ")}
            />
          ))}
        </ul>
        <HamletDisclaimer source={result.hamletSource} />
      </ResultSection>
    );
  }

  return (
    <ResultSection title="Địa chỉ mới">
      <p className="text-muted-foreground mb-3 text-sm">
        {withPrefix(prefix, result.from.fullAddress)}
      </p>
      {result.isAmbiguous && result.hamlets && result.hamlets.length > 0 && (
        <p className="text-muted-foreground mb-3 border-l-2 pl-3 text-sm">
          Xã này có dữ liệu thôn: chọn thôn ở ô trên để ra đúng một kết quả.
          Không thấy thôn của bạn? Danh sách dưới đây là tất cả{" "}
          {result.matches.length} xã mới có thể.
        </p>
      )}
      {result.isAmbiguous && residential.length === 1 && (
        <p className="text-muted-foreground mb-3 border-l-2 pl-3 text-sm">
          Về dân cư, địa chỉ mới là {residential[0].wardName} — các đơn vị còn
          lại chỉ nhận phần diện tích không có dân cư (theo bảng chuyển đổi của
          Cục Thống kê).
        </p>
      )}
      {result.isAmbiguous && residential.length !== 1 && (
        <p className="border-brand/40 text-brand mb-3 border-l-2 pl-3 text-sm">
          Đơn vị cũ này được chia vào {result.matches.length} đơn vị mới. Hãy
          đối chiếu địa chỉ cụ thể (số nhà, tên đường) để chọn đúng.
        </p>
      )}
      <ul>
        {result.matches.map((m) => (
          <AddressRow
            key={m.wardCode}
            address={withPrefix(prefix, m.fullAddress)}
            note={[m.note, m.transfer && NEW_TRANSFER_LABELS[m.transfer]]
              .filter(Boolean)
              .join(" — ")}
          />
        ))}
      </ul>
      {result.hamlets && result.hamlets.length > 0 && (
        <HamletDisclaimer source={result.hamletSource} />
      )}
    </ResultSection>
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
    <ResultSection title="Địa chỉ cũ">
      <p className="text-muted-foreground mb-3 text-sm">
        {withPrefix(prefix, result.from.fullAddress)}
      </p>
      {ready ? (
        <ul>
          <AddressRow address={withPrefix(prefix, pinned!.fullAddress)} />
        </ul>
      ) : (
        <p className="border-brand/40 text-brand mb-3 border-l-2 pl-3 text-sm">
          {result.hamlets && result.hamlets.length > 0
            ? "Chọn thôn/xóm để ra địa chỉ cũ chính xác (số nhà, tên đường không bắt buộc)."
            : "Xã mới này chưa có dữ liệu thôn — xem danh sách các xã cũ thành phần bên dưới để đối chiếu."}
        </p>
      )}

      <div className="mt-6">
        <h3 className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
          {single
            ? "Đơn vị cũ tương ứng"
            : `Gồm ${result.sources.length} đơn vị cũ (tham khảo)`}
        </h3>
        <ul>
          {result.sources.map((s) => (
            <AddressRow
              key={s.wardCode}
              address={s.fullAddress}
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
      {result.hamlets && result.hamlets.length > 0 && (
        <HamletDisclaimer source={result.hamletSource} />
      )}
    </ResultSection>
  );
}
