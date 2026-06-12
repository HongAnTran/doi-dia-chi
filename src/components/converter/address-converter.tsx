"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";

import { CopyButton } from "@/components/converter/copy-button";
import {
  SearchableCombobox,
  type ComboboxOption,
} from "@/components/converter/searchable-combobox";
import type {
  NewProvince,
  NewToOldResult,
  OldProvince,
  OldToNewResult,
  UnitBase,
} from "@/lib/address-types";
import { cn } from "@/lib/utils";

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

  return (
    <div className="space-y-5">
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
          onChange={setWardCode}
          placeholder="Chọn phường, xã"
          disabled={districtCode === null}
        />
      </Field>

      {resultQuery.isLoading && <ResultPending />}
      {resultQuery.isError && <ResultError />}
      {resultQuery.data && <OldToNewResultView result={resultQuery.data} />}
    </div>
  );
}

function NewToOldForm({ provinces }: { provinces: ProvinceOption[] }) {
  const [provinceCode, setProvinceCode] = React.useState<string | null>(null);
  const [wardCode, setWardCode] = React.useState<string | null>(null);

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

  return (
    <div className="space-y-5">
      <Field label="Tỉnh / Thành phố (mới)">
        <SearchableCombobox
          options={toOptions(provinces)}
          value={provinceCode}
          onChange={(code) => {
            setProvinceCode(code);
            setWardCode(null);
          }}
          placeholder="Chọn tỉnh, thành phố"
        />
      </Field>
      <Field label="Phường / Xã (mới)">
        <SearchableCombobox
          options={toOptions(provinceQuery.data?.wards ?? [])}
          value={wardCode}
          onChange={setWardCode}
          placeholder={
            provinceQuery.isLoading ? "Đang tải..." : "Chọn phường, xã"
          }
          disabled={provinceCode === null || provinceQuery.isLoading}
        />
      </Field>

      {resultQuery.isLoading && <ResultPending />}
      {resultQuery.isError && <ResultError />}
      {resultQuery.data && <NewToOldResultView result={resultQuery.data} />}
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

function OldToNewResultView({ result }: { result: OldToNewResult }) {
  return (
    <ResultSection title="Địa chỉ mới">
      <p className="text-muted-foreground mb-3 text-sm">
        {result.from.fullAddress}
      </p>
      {result.isAmbiguous && (
        <p className="border-brand/40 text-brand mb-3 border-l-2 pl-3 text-sm">
          Đơn vị cũ này được chia vào {result.matches.length} đơn vị mới. Hãy
          đối chiếu địa chỉ cụ thể (số nhà, tên đường) để chọn đúng.
        </p>
      )}
      <ul>
        {result.matches.map((m) => (
          <AddressRow key={m.wardCode} address={m.fullAddress} note={m.note} />
        ))}
      </ul>
    </ResultSection>
  );
}

function NewToOldResultView({ result }: { result: NewToOldResult }) {
  return (
    <ResultSection
      title={
        result.sources.length === 1
          ? "Đơn vị cũ tương ứng"
          : `Gộp từ ${result.sources.length} đơn vị cũ`
      }
    >
      <p className="text-muted-foreground mb-3 text-sm">
        {result.from.fullAddress}
      </p>
      <ul>
        {result.sources.map((s) => (
          <AddressRow key={s.wardCode} address={s.fullAddress} />
        ))}
      </ul>
    </ResultSection>
  );
}
