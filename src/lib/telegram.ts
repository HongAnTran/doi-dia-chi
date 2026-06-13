// Server-only Telegram helper built on the Telegraf SDK. All three feedback
// features (báo sai dữ liệu, liên hệ, góp ý) post to a single chat — only the
// message body differs. Token & chat id come from env and are set later; when
// either is missing we throw so the route can return a clear error instead of
// silently dropping the message.
import { Telegraf } from "telegraf";

/** Escapes text for Telegram HTML parse mode (only &, <, > are special). */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Reuse one bot instance across requests; the Telegram client only issues HTTP
// calls (no polling/webhook is started since we never call bot.launch()).
let bot: Telegraf | null = null;

function getBot(token: string): Telegraf {
  if (!bot) bot = new Telegraf(token);
  return bot;
}

/** Sends an HTML-formatted message to the configured chat. Throws on failure. */
export async function sendTelegramMessage(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    throw new Error("Telegram bot is not configured");
  }

  await getBot(token).telegram.sendMessage(chatId, text, {
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
  });
}
