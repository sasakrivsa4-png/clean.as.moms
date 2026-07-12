# clean.as.moms — Повна інструкція з запуску сайту

## Що у цій папці

```
clean-as-moms/
├── index.html                              ← сам сайт
├── README.md                               ← ця інструкція
└── supabase/
    ├── create_orders_table.sql             ← SQL для створення таблиці замовлень
    └── functions/
        └── send-order/
            └── index.ts                    ← серверна функція (Telegram + БД)
```

---

## Що потрібно встановити на комп'ютер

| Програма | Для чого | Посилання |
|----------|----------|-----------|
| **VS Code** | редагувати файли | https://code.visualstudio.com |
| **Node.js (LTS)** | потрібен для Supabase CLI | https://nodejs.org |
| **Supabase CLI** | деплой функції | встановлюється командою нижче |

---

## КРОК 1 — Реєстрація та налаштування Supabase

### 1.1 Створіть акаунт і проєкт
1. Зайдіть на **https://supabase.com** → **Start your project**
2. Увійдіть через GitHub або зареєструйтесь через email
3. Натисніть **New project**
4. Заповніть:
   - Name: `clean-as-moms`
   - Database Password: придумайте і збережіть (знадобиться)
   - Region: **West EU (Ireland)**
5. Натисніть **Create new project** і зачекайте ~1 хвилину

### 1.2 Збережіть Reference ID
1. Зайдіть у **Settings → General**
2. Знайдіть поле **Reference ID** (щось типу `abcxyzabcxyz`)
3. Скопіюйте його — знадобиться далі

---

## КРОК 2 — Створення таблиці замовлень

1. У Supabase Dashboard зліва натисніть **SQL Editor**
2. Натисніть **New query**
3. Відкрийте файл `supabase/create_orders_table.sql` у VS Code
4. Скопіюйте весь текст і вставте в поле SQL Editor
5. Натисніть **Run** (або Ctrl+Enter)
6. Побачите повідомлення `Success` — таблиця створена ✅

Перевірити: зліва натисніть **Table Editor** — побачите таблицю `orders`.

---

## КРОК 3 — Встановлення Supabase CLI і деплой функції

### 3.1 Відкрийте термінал у VS Code
У VS Code: **Terminal → New Terminal**
Переконайтесь що ви в папці `clean-as-moms` (там де лежить `index.html`)

### 3.2 Встановіть Supabase CLI
```bash
npm install -g supabase
```

### 3.3 Увійдіть в акаунт
```bash
supabase login
```
Відкриється браузер → натисніть **Allow**

### 3.4 Прив'яжіть папку до вашого проєкту
```bash
supabase link --project-ref ВАШ_REFERENCE_ID
```
> Замініть `ВАШ_REFERENCE_ID` на те що скопіювали в кроці 1.2
> Введіть пароль бази даних (той що придумали в кроці 1.1)

### 3.5 Додайте секрети (токен бота і chat id)
```bash
supabase secrets set TELEGRAM_BOT_TOKEN=8587631480:AAFGOvQ2f0mx8mHl3wD_GsM6hrzakDPD550
supabase secrets set TELEGRAM_CHAT_ID=978471607
```
> ⚠️ Ці дані вже вписані правильно — просто скопіюйте і вставте

### 3.6 Задеплойте функцію
```bash
supabase functions deploy send-order --no-verify-jwt
```

### 3.7 Скопіюйте URL функції
Після деплою у терміналі побачите щось типу:
```
✓ Done in 8s
```
URL функції буде такий (підставте ваш Reference ID):
```
https://ВАШ_REFERENCE_ID.supabase.co/functions/v1/send-order
```

---

## КРОК 4 — Вставте URL функції в index.html

1. Відкрийте `index.html` у VS Code
2. Натисніть **Ctrl+F** і знайдіть:
   ```
   EDGE_FUNCTION_URL
   ```
3. Замініть рядок:
   ```js
   const EDGE_FUNCTION_URL = "https://ВАШ_PROJECT_REF.supabase.co/functions/v1/send-order";
   ```
   на:
   ```js
   const EDGE_FUNCTION_URL = "https://ВАШ_REFERENCE_ID.supabase.co/functions/v1/send-order";
   ```
   (підставте свій реальний Reference ID)

4. Збережіть файл (**Ctrl+S**)

---

## КРОК 5 — Оновіть контакти в index.html

Поки відкритий index.html — замініть також:

| Знайти (Ctrl+F) | Замінити на |
|-----------------|-------------|
| `+38 (000) 000-00-00` | ваш перший номер телефону |
| `+38 (011) 111-11-11` | ваш другий номер телефону |
| `https://instagram.com/clean.as.moms` | ваш реальний Instagram |
| `https://t.me/clean_as_moms` | ваш реальний Telegram-канал |

---

## КРОК 6 — Публікація сайту на Vercel

### 6.1 Створіть акаунт
Зайдіть на **https://vercel.com** → **Sign Up** → через Google або email

### 6.2 Задеплойте сайт (drag & drop — найпростіше)
1. Після входу натисніть **Add New → Project**
2. Знизу сторінки побачите кнопку або область для завантаження
3. Перетягніть папку `clean-as-moms` (або тільки файл `index.html`) у вікно браузера
4. **Build Command** і **Output Directory** — залиште порожніми
5. Натисніть **Deploy**
6. Через ~30 секунд отримаєте посилання: `https://clean-as-moms.vercel.app`

> 💡 Кожного разу коли редагуєте index.html — просто знову перетягуйте папку на Vercel, сайт оновиться автоматично.

---

## КРОК 7 — Перевірка що все працює

1. Відкрийте ваш сайт на Vercel
2. Заповніть форму замовлення і натисніть **Відправити замовлення**
3. ✅ На сайті: з'явиться повідомлення *"Дякуємо! Замовлення прийнято, мама скоро зателефонує 💚"*
4. ✅ У Telegram: прийде повідомлення з деталями замовлення
5. ✅ У Supabase → **Table Editor → orders**: з'явиться новий рядок із замовленням

---

## Як переглядати замовлення в Supabase

1. Зайдіть на **https://supabase.com** → ваш проєкт
2. Зліва: **Table Editor → orders**
3. Побачите таблицю з колонками: дата, ім'я, прізвище, телефон, тип клінінгу, коментар, статус
4. Статус можна змінювати прямо в таблиці: `new` → `in_progress` → `done`
5. Можна фільтрувати і сортувати як в Excel

---

## Якщо щось не працює

**Повідомлення не приходить у Telegram:**
- Перевірте секрети: `supabase secrets list`
- Перегляньте логи: `supabase functions logs send-order`

**Замовлення не зберігаються в таблицю:**
- Перевірте чи запускали SQL з кроку 2 (таблиця `orders` має існувати)
- Перегляньте логи: `supabase functions logs send-order`

**Помилка CORS у консолі браузера:**
- Переконайтесь що деплоїли функцію з флагом `--no-verify-jwt`
- Передеплойте: `supabase functions deploy send-order --no-verify-jwt`

**Не знаєте свій Chat ID:**
Напишіть будь-яке повідомлення своєму боту, потім відкрийте в браузері:
`https://api.telegram.org/bot8587631480:AAFGOvQ2f0mx8mHl3wD_GsM6hrzakDPD550/getUpdates`
Знайдіть `"chat":{"id": ЧИСЛО}` — це і є ваш Chat ID.
