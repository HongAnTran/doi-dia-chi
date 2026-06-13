"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { track } from "@/lib/analytics";
import { submitFeedback } from "@/lib/feedback-client";
import { contactSchema, type ContactInput } from "@/lib/feedback-schema";

export function ContactForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: { kind: "contact", name: "", message: "", email: "" },
  });

  async function onSubmit(values: ContactInput) {
    try {
      await submitFeedback(values);
      track("feedback_submit", { kind: "contact" });
      toast.success("Đã gửi liên hệ. Chúng tôi sẽ phản hồi sớm nhất!");
      reset({ kind: "contact", name: "", message: "", email: "" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không gửi được.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contact-name">Họ tên</Label>
          <Input
            id="contact-name"
            aria-invalid={!!errors.name}
            {...register("name")}
          />
          {errors.name && (
            <p className="text-destructive text-xs">{errors.name.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-email">Email</Label>
          <Input
            id="contact-email"
            type="email"
            aria-invalid={!!errors.email}
            placeholder="Để chúng tôi phản hồi lại bạn"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-destructive text-xs">{errors.email.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-message">Nội dung</Label>
        <Textarea
          id="contact-message"
          rows={6}
          aria-invalid={!!errors.message}
          placeholder="Bạn cần hỗ trợ điều gì?"
          {...register("message")}
        />
        {errors.message && (
          <p className="text-destructive text-xs">{errors.message.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Đang gửi…" : "Gửi liên hệ"}
      </Button>
    </form>
  );
}
