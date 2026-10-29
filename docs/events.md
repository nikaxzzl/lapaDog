# События GA4 — ТЗ-06/2026

ID ресурса: `G-XVT5FS2HTK`
Все вызовы `gtag('event', ...)` находятся в `js/analytics.js`.

## Обязательные 18 событий

| № | Событие | Тип | Когда | Параметры | Файл / строка |
|---|---|---|---|---|---|
| 1 | `page_view` | авто | Открытие любой страницы | `page_location`, `page_title` | Enhanced measurement |
| 2 | `scroll` | авто | Прокрутка до 90 % | `percent_scrolled` | `js/analytics.js:72` |
| 3 | `click` | авто | Переход по внешней ссылке | `link_url`, `outbound` | `js/analytics.js:82` |
| 4 | `file_download` | авто | Скачивание PDF | `file_name`, `file_extension` | `js/analytics.js:90` |
| 5 | `form_start` | авто | Первое взаимодействие с формой | `form_id` | `js/form.js:86` |
| 6 | `form_submit` | авто | Отправка формы | `form_id` | `js/form.js:141` |
| 7 | `generate_lead` | рекоменд. | Приёмник ответил `ok: true` | `lead_pet_type`, `lead_service`, `lead_source` | `js/form.js:144` |
| 8 | `cta_click` | своё | Клик по кнопке заявки | `button_name`, `page_section` | `js/analytics.js:48` |
| 9 | `pet_type_select` | своё | Выбор животного на главной | `pet_type` | `index.html` (data-event) |
| 10 | `service_view` | своё | Клик по карточке услуги | `service_name` | `services.html` |
| 11 | `select_service` | своё | Кнопка «Записаться на услугу» | `service_name`, `price_from` | `services.html` |
| 12 | `doctor_view` | своё | Клик по карточке врача | `doctor_id`, `specialty` | `doctors.html` |
| 13 | `vaccine_calc` | своё | Расчёт графика прививок | `pet_type`, `age_weeks` | `js/vaccines.js:49` |
| 14 | `promo_copy` | своё | Копирование промокода | `promo_code` | `pet-kit.html` |
| 15 | `contact_click` | своё | Клик по телефону/e-mail | `contact_type` | все страницы |
| 16 | `messenger_click` | своё | Клик по Telegram/WhatsApp | `messenger` | `contacts.html` |
| 17 | `social_click` | своё | Клик по соцсети в подвале | `network`, `page_section` | все страницы |
| 18 | `form_error` | своё | Ошибка валидации или сервера | `field_name`, `error_type` | `js/form.js:135` |

## Дополнительное событие (по выбору)

| № | Событие | Тип | Когда | Параметры | Файл / строка |
|---|---|---|---|---|---|
| 19 | `faq_open` | своё | Раскрытие вопроса в FAQ | `question_id` | `index.html` |

## 7 пользовательских параметров (Event scope)

| Параметр | Событие | Вопрос отчёта |
|---|---|---|
| `button_name` | `cta_click` | Какая кнопка заявки сработала |
| `page_section` | `cta_click`, `social_click` | В каком блоке был клик |
| `pet_type` | `pet_type_select`, `vaccine_calc` | Владельцы каких животных приходят |
| `service_name` | `service_view`, `select_service` | Какая услуга интересует |
| `age_weeks` | `vaccine_calc` | В каком возрасте ищут прививки |
| `lead_service` | `generate_lead` | Услуга в заявке |
| `messenger` | `messenger_click` | Какой мессенджер выбирают|

## Ключевые события

Только три: `generate_lead`, `contact_click`, `messenger_click`.

## Правила

- Имена и параметры — `snake_case`, ≤ 40 символов, значения ≤ 100.
- Персональные данные (имя, телефон, e-mail) в GA4 **не передаются**.
- `generate_lead` — только после `{"ok": true}` от приёмника. 
- При ошибке приёмника — `form_error` с `error_type = "server"`.