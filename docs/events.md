# Таблица событий GA4 (docs/events.md)

| № | Событие | Где отправляется (файл) | Параметры (пример) |
|---|---|---|---|
| 1 | `page_view` | Автоматически (GA4) | `page_location`, `page_title` |
| 2 | `scroll` | Автоматически (GA4) | `percent_scrolled` |
| 3 | `click` | Автоматически (GA4) | `link_url`, `outbound` |
| 4 | `file_download` | `js/analytics.js` | `file_name="price.pdf"`, `file_extension="pdf"` |
| 5 | `form_start` | `js/form.js` | `form_id="lead_form"` |
| 6 | `form_submit` | `js/form.js` | `form_id="lead_form"` |
| 7 | `generate_lead` | `js/form.js` | `lead_pet_type="cat"`, `lead_service="vaccine"`, `lead_source="instagram"` |
| 8 | `cta_click` | `js/analytics.js` | `button_name="hero_cta"`, `page_section="hero"` |
| 9 | `pet_type_select` | `js/analytics.js` | `pet_type="dog"` |
| 10 | `service_view` | `js/analytics.js` | `service_name="УЗИ"` |
| 11 | `select_service` | `js/analytics.js` | `service_name="Стерилизация"`, `price_from="6500"` |
| 12 | `doctor_view` | `js/analytics.js` | `doctor_id="doc-01"`, `specialty="Терапевт"` |
| 13 | `vaccine_calc` | `js/vaccines.js` | `pet_type="dog"`, `age_weeks="8"` |
| 14 | `promo_copy` | `js/analytics.js` | `promo_code="VACKINA"` |
| 15 | `contact_click` | `js/analytics.js` | `contact_type="phone"` |
| 16 | `messenger_click` | `js/analytics.js` | `messenger="telegram"` |
| 17 | `social_click` | `js/analytics.js` | `network="instagram"`, `page_section="footer"` |
| 18 | `faq_open` | `js/analytics.js` | `question_id="q1"` |
| 19 (по выбору) | `form_error` | `js/form.js` | `field_name="phone"`, `error_type="validation"` |