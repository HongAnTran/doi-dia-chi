"use client";

import { Heart } from "lucide-react";

import { DonateQR } from "@/components/donate/donate-qr";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { track } from "@/lib/analytics";

/** "Ủng hộ" affordance — opens a modal with the donation QR. Used next to a
 * conversion result. */
export function DonateDialog() {
  return (
    <Dialog onOpenChange={(open) => open && track("donate_open")}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="text-muted-foreground hover:text-brand inline-flex items-center gap-1.5 text-[13px] font-medium transition-colors"
        >
          <Heart className="size-3.5" />
          Ủng hộ tác giả
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader className="items-center text-center">
          <DialogTitle>Ủng hộ tác giả</DialogTitle>
          <DialogDescription>
            Công cụ miễn phí. Nếu thấy hữu ích, bạn có thể ủng hộ để duy trì và
            phát triển thêm.
          </DialogDescription>
        </DialogHeader>
        <div className="pt-1">
          <DonateQR />
        </div>
      </DialogContent>
    </Dialog>
  );
}
