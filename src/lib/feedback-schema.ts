import { z } from "zod";

// Shared between the client forms and the /api/feedback route so validation
// rules live in one place. The three feedback kinds funnel into one Telegram
// chat; `kind` selects the message format on the server.

const email = z
  .string()
  .trim()
  .max(254)
  .email("Email không hợp lệ")
  .optional()
  .or(z.literal("").transform(() => undefined));

const message = z
  .string()
  .trim()
  .min(10, "Vui lòng nhập ít nhất 10 ký tự")
  .max(4000, "Nội dung quá dài");

export const reportDataSchema = z.object({
  kind: z.literal("report"),
  address: z.string().trim().max(500).optional(),
  message,
  email,
  pageUrl: z.string().trim().max(2000).optional(),
});

export const contactSchema = z.object({
  kind: z.literal("contact"),
  name: z.string().trim().min(1, "Vui lòng nhập họ tên").max(120),
  message,
  email: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập email")
    .max(254)
    .email("Email không hợp lệ"),
});

export const featureSchema = z.object({
  kind: z.literal("feature"),
  message,
  email,
});

export const feedbackSchema = z.discriminatedUnion("kind", [
  reportDataSchema,
  contactSchema,
  featureSchema,
]);

export type ReportDataInput = z.infer<typeof reportDataSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type FeatureInput = z.infer<typeof featureSchema>;
export type FeedbackInput = z.infer<typeof feedbackSchema>;
