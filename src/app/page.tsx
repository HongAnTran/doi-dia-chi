import { AddressConverter } from "@/components/converter/address-converter";
import { getNewProvinceOptions, getOldProvinceOptions } from "@/lib/converter";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-[640px] px-6 py-12 sm:py-16">
      <header className="mb-8 text-center">
        <p className="text-muted-foreground mb-3 font-mono text-xs font-medium tracking-[0.06em] uppercase">
          Chuyển đổi địa chỉ hành chính
        </p>
        <h1 className="text-[clamp(26px,4.5vw,38px)] leading-tight font-bold tracking-tight text-balance">
          Dán địa chỉ cũ — nhận ngay địa chỉ mới, đã làm sạch
        </h1>
        <p className="text-foreground/80 mx-auto mt-4 max-w-[560px] text-[17px] leading-relaxed">
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
