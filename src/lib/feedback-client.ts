import type { FeedbackInput } from "@/lib/feedback-schema";

/** Posts a feedback payload to the API. Throws with a user-facing message. */
export async function submitFeedback(payload: FeedbackInput): Promise<void> {
  const res = await fetch("/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ?? "Không gửi được. Vui lòng thử lại sau.");
  }
}
