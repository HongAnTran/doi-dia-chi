"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Flag } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { track } from "@/lib/analytics";
import { submitFeedback } from "@/lib/feedback-client";
import { reportDataSchema, type ReportDataInput } from "@/lib/feedback-schema";

/** "Báo sai dữ liệu" affordance shown under a conversion result, prefilled
 * with the address the user is looking at. */
export function ReportDataDialog({ address }: { address?: string }) {
  const [open, setOpen] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReportDataInput>({
    resolver: zodResolver(reportDataSchema),
    defaultValues: {
      kind: "report",
      address: address ?? "",
      message: "",
      email: "",
    },
  });

  // Refresh the prefilled address whenever the dialog is (re)opened.
  React.useEffect(() => {
    if (open)
      reset({ kind: "report", address: address ?? "", message: "", email: "" });
  }, [open, address, reset]);

  async function onSubmit(values: ReportDataInput) {
    try {
      await submitFeedback({
        ...values,
        pageUrl:
          typeof window !== "undefined" ? window.location.href : undefined,
      });
      track("feedback_submit", { kind: "report" });
      toast.success("Đã gửi báo cáo. Cảm ơn bạn đã đóng góp!");
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không gửi được.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="text-muted-foreground hover:text-brand inline-flex items-center gap-1.5 text-[13px] font-medium transition-colors"
        >
          <Flag className="size-3.5" />
          Báo sai dữ liệu
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Báo sai dữ liệu</DialogTitle>
          <DialogDescription>
            Phát hiện kết quả chuyển đổi chưa đúng? Mô tả giúp chúng tôi để rà
            soát và chỉnh sửa.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="report-address">Địa chỉ liên quan</Label>
            <Input id="report-address" {...register("address")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="report-message">
              Mô tả vấn đề / thông tin đúng
            </Label>
            <Textarea
              id="report-message"
              rows={4}
              aria-invalid={!!errors.message}
              placeholder="VD: Xã này phải thuộc phường mới X chứ không phải Y…"
              {...register("message")}
            />
            {errors.message && (
              <p className="text-destructive text-xs">
                {errors.message.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="report-email">Email (không bắt buộc)</Label>
            <Input
              id="report-email"
              type="email"
              aria-invalid={!!errors.email}
              placeholder="Để chúng tôi phản hồi lại bạn"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-destructive text-xs">{errors.email.message}</p>
            )}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Hủy
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Đang gửi…" : "Gửi báo cáo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
