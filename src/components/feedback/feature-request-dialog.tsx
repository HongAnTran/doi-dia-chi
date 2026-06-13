"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { featureSchema, type FeatureInput } from "@/lib/feedback-schema";

/** "Góp ý phát triển tính năng" — opened from the footer. */
export function FeatureRequestDialog() {
  const [open, setOpen] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FeatureInput>({
    resolver: zodResolver(featureSchema),
    defaultValues: { kind: "feature", message: "", email: "" },
  });

  async function onSubmit(values: FeatureInput) {
    try {
      await submitFeedback(values);
      track("feedback_submit", { kind: "feature" });
      toast.success("Đã gửi góp ý. Cảm ơn bạn!");
      reset({ kind: "feature", message: "", email: "" });
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
          className="hover:text-foreground transition-colors"
        >
          Góp ý phát triển
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Góp ý phát triển tính năng</DialogTitle>
          <DialogDescription>
            Bạn muốn công cụ có thêm tính năng gì? Mọi ý tưởng đều được hoan
            nghênh.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="feature-message">Ý tưởng của bạn</Label>
            <Textarea
              id="feature-message"
              rows={4}
              aria-invalid={!!errors.message}
              placeholder="VD: Cho phép xuất kết quả ra file PDF…"
              {...register("message")}
            />
            {errors.message && (
              <p className="text-destructive text-xs">
                {errors.message.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="feature-email">Email (không bắt buộc)</Label>
            <Input
              id="feature-email"
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
              {isSubmitting ? "Đang gửi…" : "Gửi góp ý"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
