// supabase/functions/send-order/index.ts
//
// Функція робить дві речі:
//   1. Зберігає замовлення в таблицю `orders` у Supabase (завжди)
//   2. Відправляє повідомлення в Telegram (якщо налаштовано — необов'язково)

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    if (!firstName || !lastName || !phone || !cleaningType) {
      return new Response(
        JSON.stringify({ error: "Будь ласка, заповніть усі обов'язкові поля" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 1. ЗБЕРЕЖЕННЯ В БАЗУ ДАНИХ (завжди виконується) ─────────────────────
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error: dbError } = await supabase
      .from("orders")
      .insert({
        first_name:    firstName,
        last_name:     lastName,
        phone:         phone,
        cleaning_type: cleaningType,
        comment:       comment || null,
        status:        "new",
      });

    if (dbError) {
      console.error("Помилка збереження в БД:", dbError.message);
      // Повертаємо помилку — замовлення не збережено
      return new Response(
        JSON.stringify({ error: "Не вдалося зберегти замовлення" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 2. TELEGRAM (необов'язково — якщо секрети не задані, просто пропускаємо) ──
    const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const TELEGRAM_CHAT_ID   = Deno.env.get("TELEGRAM_CHAT_ID");

    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
      const text =
        `🧼 *Нове замовлення — clean\\.as\\.moms*\n\n` +
        `👤 Ім'я: ${firstName}\n` +
        `👤 Прізвище: ${lastName}\n` +
        `📞 Телефон: ${phone}\n` +
        `🧹 Тип клінінгу: ${cleaningType}\n` +
        `💬 Коментар: ${comment || "—"}`;

      try {
        await fetch(
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
      } catch (tgError) {
        // Telegram не відправив — не критично, замовлення вже в БД
        console.warn("Telegram не відправлено:", tgError);
      }
    } else {
      console.log("Telegram не налаштовано — пропускаємо відправку");
    }

    // Успіх — замовлення збережено в БД
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
