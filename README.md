# Ветеринарная клиника «ЛапаДок» — сайт и сквозная аналитика заявок

Курсовая работа по дисциплине ОП.03 «Информационные технологии», ТЗ № ТЗ-06/2026.
Исполнитель: Кононова Ника, группа РПО3.

## Ссылки

| Что | Ссылка |
|---|---|
| Сайт | https://tz-06-vetklinika-lapadok.vercel.app |
| Таблица заявок | https://docs.google.com/spreadsheets/d/1k8PA1CkCwjY_hQaVpb9vShLfIKEiV_G_ti86mwSy5Q8/edit |
| Дашборд Looker Studio | https://datastudio.google.com/u/0/reporting/cddf4c15-4af3-4426-8722-7805f114949e |
| Instagram | https://www.instagram.com/klausl19/ |
| Reel с автоответами | https://www.instagram.com/p/De8E6ZMB6vk/ |
| ВКонтакте | https://vk.com/... (вставь ссылку на пост) |
| Telegram | https://t.me/... (вставь ссылку на пост) |
| YouTube | https://youtu.be/... (вставь ссылку на видео) |

## Google Analytics 4

- **ID ресурса:** `G-XVT5FS2HTK`
- **Доступ Viewer к ресурсу GA4 выдан:** smm@lapadok.example (e-mail Заказчика)

## UTM-реестр

- Реестр: `docs/utm.csv` (12 ссылок U-01 — U-12)
- Короткие ссылки VK: `vk.cc/...` (см. `docs/utm.csv`)
- Короткие ссылки Telegram: `clck.ru/...` (см. `docs/utm.csv`)
- QR-код: `docs/qr-u-12.png`
- Афиша: `docs/afisha.pdf`

## Что сделано

| Часть | Результат |
|---|---|
| Сайт | 8 страниц + `404.html`, статический HTML, Vercel |
| Lighthouse | Performance 82 / Accessibility 93 / SEO 100 (mobile) |
| GA4 | 20 событий, 7 пользовательских параметров, 3 ключевых |
| UTM | 12 ссылок, публикации в 4 соцсетях, QR на афише |
| Заявки | форма → Apps Script → лист `leads`, проверка полей и повторов |
| Instagram | ManyChat, две ветки: `АПТЕЧКА` и `ЩЕНОК` |
| Отчёты | Reports, Explore, воронка, путь, Looker Studio из 3 вкладок |
| CRM | HubSpot: воронка «ЛапаДок · Новые пациенты», импорт CSV |

## Технологии

`HTML` · `CSS` · `JavaScript` · `Google Analytics 4` · `Google Таблицы` · `Apps Script` · `ManyChat` · `Looker Studio` · `HubSpot CRM` · `GitHub` · `Vercel`

Сайт создан с помощью **DeepSeek**.

## Структура репозитория


Вся техническая документация и результаты тестов сохранены в репозитории согласно разделу 12 ТЗ:

```text
tz-06-vetklinika-lapadok/
├── index.html … 404.html
├── css/style.css
├── js/analytics.js, form.js, vaccines.js
├── apps-script/Code.gs
├── files/pet-kit.pdf, price.pdf
├── docs/prompts.md, events.md, utm.csv, images.md, report.md, afisha.pdf, qr-u-12.png
├── screens/ga4/, utm/, instagram/, crm/, datastudio/, Lighthouse/
└── presentation/
```

## Скриншоты верификации (Папка screens/)

*   `screens/ga4/` — Снимки фиксации отправки кастомных событий в интерфейсе DebugView.
*   `screens/utm/` — Подтверждение фиксации переходов по меткам в отчете Traffic acquisition
*   `screens/instagram/` — Логи работы сценариев ManyChat (триггер-комментарий, сообщение в Direct, клик).
*   `screens/crm/` — Снимки воронки сделок «ЛапаДок · Новые пациенты» и карточек импортированных контактов в HubSpot.
*   `screens/datastudio/` — Скриншоты интерактивного дашборда Looker Studio.
*   `screens/lighthouse/` — Результаты тестирования производительности, доступности и SEO главной страницы.


## Документация (Папка docs/)

* `docs/opisanie.md` - Описание работы с кадрами (по шаблону курса).
* `docs/scheme.png` - Схема работы (путь посетителя и данных).
* `docs/prompts.md` - Журнал хронологических запросов к нейросети и описание ручных правок кода.
* `docs/events.md` - Реестр и спецификация отправляемых событий GA4 (18 обязательных и 1 по выбору).
* `docs/utm.csv` - Заполненный реестр из 12 UTM-ссылок (U-01 — U-12) с формульной сборкой адресов.
* `docs/images.md` - Перечень источников графических материалов и лицензии стоков.
* `docs/report.md` -  Аналитическая записка по итогам сбора данных веб-аналитики.
* `docs/afisha.pdf` -  Маркетинговые материалы для размещения у касс зоомагазинов.
* `docs/qr-u-12.png` -  Маркетинговые материалы для размещения у касс зоомагазинов.

## Итоги выполнения работы

*   **Не получилось:** Настроить прямую нативную интеграцию бесплатной версии HubSpot CRM с Google Таблицами через вебхуки без использования сторонних коннекторов (реализован регламентированный ТЗ импорт через очищенный CSV-файл с листа `crm_import`).

*   **Нейросеть использовалась для:** Генерации семантической структуры адаптивной верстки страниц (v0 / Bolt.new), написания регулярных выражений для валидации номеров телефонов в Apps Script и построения логики формул разделения ФИО на `first_name` и `last_name` для импорта в CRM.
