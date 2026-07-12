// supabase/functions/send-order/index.ts
//
// Ця функція робить дві речі одночасно:
//   1. Зберігає замовлення в таблицю `orders` у базі даних Supabase
//   2. Відправляє повідомлення у Telegram-бот власника бізнесу
//
// ЯК НАЛАШТУВАТИ (детальніше — дивіться README.md):
//   supabase secrets set TELEGRAM_BOT_TOKEN=ваш_токен
//   supabase secrets set TELEGRAM_CHAT_ID=ваш_chat_id
//   supabase functions deploy send-order --no-verify-jwt

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS — дозволяємо запити з браузера (сайт на Vercel → функція на Supabase)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface OrderPayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
  cleaningType?: string;
  comment?: string;
}

serve(async (req: Request) => {
  // Preflight-запит від браузера — відповідаємо одразу
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Метод не підтримується" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body: OrderPayload = await req.json();

    const firstName    = (body.firstName    ?? "").trim();
    const lastName     = (body.lastName     ?? "").trim();
    const phone        = (body.phone        ?? "").trim();
    const cleaningType = (body.cleaningType ?? "").trim();
    const comment      = (body.comment      ?? "").trim();

    // Базова валідація обов'язкових полів
    if (!firstName || !lastName || !phone || !cleaningType) {
      return new Response(
        JSON.stringify({ error: "Будь ласка, заповніть усі обов'язкові поля" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 1. ЗБЕРЕЖЕННЯ В БАЗУ ДАНИХ SUPABASE ──────────────────────────────────
    // SUPABASE_URL та SUPABASE_SERVICE_ROLE_KEY — вбудовані змінні,
    // вони доступні автоматично у кожній Edge Function, нічого додавати не потрібно.
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error: dbError } = await supabase
      .from("orders")           // ← назва таблиці (створюємо нижче через SQL)
      .insert({
        first_name:    firstName,
        last_name:     lastName,
        phone:         phone,
        cleaning_type: cleaningType,
        comment:       comment || null,
        status:        "new",   // статус за замовчуванням
      });

    if (dbError) {
      // Логуємо помилку БД, але продовжуємо — Telegram все одно відправимо
      console.error("Помилка збереження в БД:", dbError.message);
    }

    // ── 2. ВІДПРАВКА В TELEGRAM ───────────────────────────────────────────────
    const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const TELEGRAM_CHAT_ID   = Deno.env.get("TELEGRAM_CHAT_ID");

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.error("Не задані секрети TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID");
      return new Response(
        JSON.stringify({ error: "Сервер не налаштований" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const text =
      `🧼 *Нове замовлення — clean\\.as\\.moms*\n\n` +
      `👤 Ім'я: ${firstName}\n` +
      `👤 Прізвище: ${lastName}\n` +
      `📞 Телефон: ${phone}\n` +
      `🧹 Тип клінінгу: ${cleaningType}\n` +
      `💬 Коментар: ${comment || "—"}\n\n` +
      `📋 Всі замовлення: https://supabase\\.com/dashboard`;

    const tgResponse = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id:    TELEGRAM_CHAT_ID,
          text,
          parse_mode: "MarkdownV2",
        }),
      }
    );

    if (!tgResponse.ok) {
      const errText = await tgResponse.text();
      console.error("Telegram API помилка:", errText);
      // Не повертаємо помилку клієнту — замовлення вже збережено в БД
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Помилка обробки запиту:", error);
    return new Response(
      JSON.stringify({ error: "Внутрішня помилка сервера" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
