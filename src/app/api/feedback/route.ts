import { NextResponse } from "next/server";

import { feedbackSchema, type FeedbackInput } from "@/lib/feedback-schema";
import { escapeHtml, sendTelegramMessage } from "@/lib/telegram";

/** Builds the Telegram message body — one format per feedback kind. */
function formatMessage(data: FeedbackInput): string {
  const line = (label: string, value?: string) =>
    value?.trim() ? `<b>${label}:</b> ${escapeHtml(value.trim())}` : null;

  switch (data.kind) {
    case "report":
      return [
        "🛑 <b>BÁO SAI DỮ LIỆU</b>",
        line("Địa chỉ liên quan", data.address),
        `<b>Nội dung:</b>\n${escapeHtml(data.message)}`,
        line("Liên hệ", data.email),
        line("Trang", data.pageUrl),
      ]
        .filter(Boolean)
        .join("\n");
    case "contact":
      return [
        "✉️ <b>LIÊN HỆ</b>",
        line("Họ tên", data.name),
        `<b>Nội dung:</b>\n${escapeHtml(data.message)}`,
        line("Liên hệ", data.email),
      ]
        .filter(Boolean)
        .join("\n");
    case "feature":
      return [
        "💡 <b>GÓP Ý TÍNH NĂNG</b>",
        `<b>Nội dung:</b>\n${escapeHtml(data.message)}`,
        line("Liên hệ", data.email),
      ]
        .filter(Boolean)
        .join("\n");
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = feedbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dữ liệu không hợp lệ" },
      { status: 400 },
    );
  }

  try {
    await sendTelegramMessage(formatMessage(parsed.data));
  } catch (error) {
    console.error("Feedback send failed:", error);
    return NextResponse.json(
      { error: "Không gửi được. Vui lòng thử lại sau." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
