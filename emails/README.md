# Шаблоны писем — Творцы РФ 2026

Транзакционные письма ЛК в стиле проекта (токены из `src/styles/tokens.css`,
примитивы из `base.css` / `forms.css`). Каркас повторяет `AuthSplit`, схлопнутый
в одну колонку: **тёмный постер** (`var(--plate)`, радиус 36px) + **paper-панель**
(`var(--paper)`, радиус 36px) на белом фоне. Вёрстка email-safe: таблицы,
инлайн-стили; `border-radius` и web-шрифты мягко деградируют в Outlook.

## Превью

**GitHub Pages (прямо с GitHub):**
- [Галерея всех писем](https://artur-ershov.github.io/tvortsy-lk/emails/index.html)

Или открой `emails/index.html` локально в браузере — работает без сервера.
На dev-сервере: `/emails/index.html`.

## Соответствие коду

| Элемент письма | Источник в коде |
|----------------|-----------------|
| Постер (тёмная плита + mega-заголовок) | `components/AuthSplit.jsx`, `.auth-poster`, `.mega` |
| Кнопка (тёмная плита, 60px) | `.fbtn.submit` (base.css) — «правка Артура: тёмные, не жирные» |
| Код-ячейки (белые, рамка, Golos 42px) | `.code-cell` (forms.css), экран `auth/Confirm.jsx` |
| Статус-точка (квадрат + mono) | `.fst` / `StatusTag` (base.css, ui.jsx) |
| Статус-цикл (круглые точки + дорожка) | `StatusTimeline` (ui.jsx), `CYCLE` / `CYCLE_DATES` |
| Аватар-инициалы (sky-квадрат) | `.member-row .init` (app.css) |
| Логотип «Творцы РФ» (mono, 2 строки) | `Logo` (Nav.jsx) |
| pix-мозаика на постере | `Pix` / `PIX_A` (ui.jsx, `.pix.on-dark`) |

## Письма и плейсхолдеры

Текст в двойных фигурных скобках подставляется рассыльщиком.

| Файл | Флоу | Плейсхолдеры |
|------|------|--------------|
| `confirm.html`   | Подтверждение почты (`auth/Confirm.jsx`) | `{{code.0..3}}`, `{{confirmUrl}}`, `{{email}}` |
| `recovery.html`  | Сброс пароля (`auth/Recovery.jsx`)       | `{{code.0..3}}`, `{{resetUrl}}`, `{{email}}` |
| `invite.html`    | Приглашение в команду (`team/JoinInvite.jsx`) | `{{captainName}}`, `{{captainInit}}`, `{{teamName}}`, `{{nomination}}`, `{{joinUrl}}`, `{{email}}` |
| `submitted.html` | Заявка подана (`submit-app`)             | `{{name}}`, `{{appNum}}`, `{{appTitle}}`, `{{nomination}}`, `{{submittedAt}}`, `{{appUrl}}`, `{{email}}` |
| `admitted.html`  | Заявка допущена (статус `admitted`)      | `{{name}}`, `{{appNum}}`, `{{appTitle}}`, `{{nomination}}`, `{{appUrl}}`, `{{email}}` |
| `rework.html`    | На доработку (статус `rework`)           | `{{name}}`, `{{appNum}}`, `{{appTitle}}`, `{{reworkNote}}`, `{{deadline}}`, `{{appUrl}}`, `{{email}}` |
| `results.html`   | Итоги (статус `results`)                 | `{{name}}`, `{{appNum}}`, `{{appTitle}}`, `{{nomination}}`, `{{resultsUrl}}`, `{{email}}` |

- `{{code.0..3}}` — 4 отдельные ячейки (как `code-cell`). Удобнее одна строка —
  замени блок ячеек на один `{{code}}`.
- `{{captainInit}}` — инициалы капитана «Имя+Фамилия» (как `initialsOf`: «МС»).
- `{{submittedAt}}` — дата подачи для первого шага таймлайна (иначе «июнь»).
- Статус-цикл в `submitted` / `admitted` / `results` свёрстан под конкретный шаг.
  Если письмо генерится из общего шаблона — активный шаг (крупная точка,
  accent-дата, bold-лейбл) задаётся по индексу `CYCLE`, как в `StatusTimeline`.

## Это прототип

Бэкенда и реальной рассылки нет — письма самодостаточны и нужны как образец
вёрстки/копирайта. Адрес `help@tvortsy.online` — демо-плейсхолдер.
