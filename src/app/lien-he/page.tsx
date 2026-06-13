import type { Metadata } from "next";

import { ContactForm } from "@/components/feedback/contact-form";

export const metadata: Metadata = {
  title: "Liên hệ",
  description:
    "Liên hệ với đội ngũ Đổi Địa Chỉ — gửi câu hỏi, phản hồi hoặc yêu cầu hỗ trợ về công cụ chuyển đổi địa chỉ hành chính.",
  alternates: { canonical: "/lien-he" },
};

export default function ContactPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-bold tracking-tight">Liên hệ</h1>
      <p className="text-muted-foreground mt-2 text-[15px] leading-relaxed">
        Có câu hỏi, phản hồi hay cần hỗ trợ? Gửi tin nhắn cho chúng tôi qua mẫu
        dưới đây — chúng tôi sẽ phản hồi sớm nhất có thể.
      </p>

      <div className="bg-card border-border mt-8 rounded-md border p-5 sm:p-6">
        <ContactForm />
      </div>
    </main>
  );
}
