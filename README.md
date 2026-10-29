# Ветеринарная клиника «ЛапаДок» — сайт и сквозная аналитика заявок

Курсовая работа по дисциплине ОП.03 «Информационные технологии», ТЗ № ТЗ-06/2026.
Исполнитель: Кононова Ника, группа РПО3.

Сайт кампании «Комплексная вакцинация −20 % в ноябре»: каждый посетитель приходит
с меткой источника, каждая заявка попадает в Google Таблицу и CRM HubSpot, а руководитель
видит на дашборде Looker Studio, какой канал приводит клиентов.

![Схема работы](docs/scheme.png)

## Ссылки

| Что | Ссылка |
|---|---|
| Сайт | https://tz-06-vetklinika-lapadok.vercel.app |
| Таблица заявок | https://docs.google.com/spreadsheets/d/1k8PA1CkCwjY_hQaVpb9vShLfIKEiV_G_ti86mwSy5Q8/edit?gid=0#gid=0 |
| Дашборд Looker Studio (Data Studio) | https://datastudio.google.com/u/0/reporting/cddf4c15-4af3-4426-8722-7805f114949e/page/0aGCG |
| Instagram и Reel с автоответом | https://www.instagram.com/klausl19/?hl=ru и https://www.instagram.com/p/De8E6ZMB6vk/?hl=ru |
| ВКонтакте · Telegram · YouTube | https://tz-06-vetklinika-lapadok.vercel.app/vaccines.html?utm_source=vk&utm_medium=social&utm_campaign=vaccine_nov_2026&utm_content=post_01 · https://tz-06-vetklinika-lapadok.vercel.app/vaccines.html?utm_source=telegram&utm_medium=social&utm_campaign=vaccine_nov_2026&utm_content=post_01 · https://tz-06-vetklinika-lapadok.vercel.app/pet-kit.html?utm_source=youtube&utm_medium=social&utm_campaign=vaccine_nov_2026&utm_content=video_description |
| Описание работы | [docs/opisanie.md](docs/opisanie.md) |
| Презентация к защите | [presentation/zashchita.pdf](presentation/zashchita.pdf) |


## Веб-аналитика Google Analytics 4

*   **ID ресурса:** `G-XVT5FS2HTK`


## Что сделано

| Часть | Результат |
|---|---|
| Сайт | 8 страниц + 404.html, статический HTML, Vercel, Lighthouse: 82 / 93 / 100 |
| GA4 | 20 событий, 7 пользовательских параметров, ключевые: `generate_lead`, `contact_click`, `messenger_click` |
| UTM | 12 ссылок в реестре, публикации в 4 соцсетях, QR на афише |
| Заявки | форма → Apps Script → лист `leads`, проверка полей и повторов, лист `crm_import` |
| Instagram | ManyChat, две ветки: `АПТЕЧКА` и `ЩЕНОК` |
| Отчёты | Reports, Explore, воронка, путь, дашборд Looker Studio из трёх вкладок |



## Технологии

`HTML` · `CSS` · `JavaScript` · `Google Analytics 4` · `Google Таблицы` · `Apps Script` · `ManyChat` · `Looker Studio (Data Studio)` · `HubSpot CRM` · `GitHub` · `Vercel`

Сайт создан с помощью **DeepSeek** 


## Структура репозитория и документация

Вся техническая документация и результаты тестов сохранены в репозитории согласно разделу 12 ТЗ:

```text
tz-06-vetklinika-lapadok/
├── index.html … 404.html      страницы сайта (8 штук + 404)
├── css/style.css              основные стили оформления
├── js/                        аналитика, формы, календарь
├── apps-script/Code.gs        приёмник заявок
├── files/                     документы для скачивания (pet-kit.pdf, price.pdf)
├── docs/                      описание, реестр UTM, события, записка, схема
├── screens/                   кадры-доказательства по разделам ТЗ
└── presentation/              презентация к защите (zashchita.pdf, zashchita.pptx)
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
