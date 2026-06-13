import Image from "next/image";

import { DONATE_CAPTION, DONATE_QR_SRC } from "@/lib/site-config";

/** The donation QR image plus caption — shared by the /ung-ho page and the
 * donate modal. QR codes are square, so width === height. */
export function DonateQR({ size = 240 }: { size?: number }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="border-border rounded-md border bg-white p-3">
        <Image
          src={DONATE_QR_SRC}
          alt="Mã QR ủng hộ"
          width={size}
          height={size}
        />
      </div>
      <p className="text-muted-foreground max-w-xs text-center text-[13px] leading-relaxed">
        {DONATE_CAPTION}
      </p>
    </div>
  );
}
