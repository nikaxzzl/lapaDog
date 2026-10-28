// js/analytics.js
// Единый файл отправки событий в GA4.
// Все события описаны через data-event на элементах, здесь — их обработка.

(function () {
    'use strict';

    // ---------- Отправка ----------
    function send(event, params, callback) {
        if (typeof gtag !== 'function') {
            if (callback) callback();
            return;
        }
        gtag('event', event, Object.assign({}, params || {}, {
            event_callback: callback || undefined
        }));
    }

    // ---------- Публичный API для form.js / vaccines.js ----------
    window.LapaAnalytics = {
        send: send,
        formStart: function (id) {
            send('form_start', { form_id: id || 'lead_form' });
        },
        formSubmit: function (id) {
            send('form_submit', { form_id: id || 'lead_form' });
        },
        // callback вызывается после отправки — используется перед редиректом
        generateLead: function (pet, service, source, callback) {
            send('generate_lead', {
                lead_pet_type: pet,
                lead_service: service,
                lead_source: source
            }, callback);
        },
        formError: function (field, type) {
            send('form_error', { field_name: field, error_type: type });
        },
        vaccineCalc: function (pet, age) {
            send('vaccine_calc', { pet_type: pet, age_weeks: age });
        }
    };

    // ---------- Делегирование кликов ----------
    document.addEventListener('click', function (e) {
        var target = e.target;
        if (!target || !target.closest) return;

        var el = target.closest('[data-event]');
        if (!el) return;

        var event = el.dataset.event;

        // Эти события обрабатываем отдельно ниже, чтобы не было дублей
        if (event === 'faq_open') return;
        if (event === 'pet_type_select') return;

        var params = {};

        // Все data-* превращаем в snake_case
        for (var key in el.dataset) {
            if (key === 'event') continue;
            var snake = key.replace(/([A-Z])/g, '_$1').toLowerCase();
            params[snake] = el.dataset[key];
        }

        // ---------- Обязательные параметры ----------
        if (event === 'cta_click') {
            if (!params.button_name || !params.page_section) return;
        }
        if (event === 'contact_click') {
            params.contact_type = params.contact_type || 'phone';
        }
        if (event === 'messenger_click') {
            if (!params.messenger) return;
        }
        if (event === 'social_click') {
            if (!params.network) return;
            params.page_section = params.page_section || 'footer';
        }
        if (event === 'select_service') {
            if (!params.service_name) return;
        }

        // ---------- FIX: file_download ----------
        // Отправляем строго один раз и строго с file_name без расширения.
        if (event === 'file_download') {
            var anchor = el.closest('a') || el;
            var href = anchor.href || '';

            // Имя файла из URL, например "pet-kit.pdf"
            var rawName = href.split('/').pop().split('?')[0] || '';

            // file_name берём из data-file-name, иначе — из URL без расширения
            var fileName = el.dataset.fileName
                || rawName.replace(/\.[^.]+$/, '');

            // file_extension берём из data-file-extension, иначе — из URL
            var dot = rawName.lastIndexOf('.');
            var ext = el.dataset.fileExtension
                || (dot > -1 ? rawName.slice(dot + 1).toLowerCase() : '');

            send('file_download', {
                file_name: fileName,
                file_extension: ext
            });

            return; // FIX: важно — не даём отправить событие второй раз ниже
        }

        // ---------- FIX: promo_copy ----------
        // Событие должно уходить один раз, после успешного копирования (или попытки).
        if (event === 'promo_copy') {
            var code = el.dataset.promoCode || 'VAKCINA';

            var fire = function () {
                send('promo_copy', { promo_code: code });
            };

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(code).then(fire).catch(fire);
            } else {
                // Fallback: старый способ копирования
                try {
                    var ta = document.createElement('textarea');
                    ta.value = code;
                    ta.style.position = 'fixed';
                    ta.style.opacity = '0';
                    document.body.appendChild(ta);
                    ta.select();
                    document.execCommand('copy');
                    document.body.removeChild(ta);
                } catch (err) {
                    // игнорируем — событие всё равно отправим
                }
                fire();
            }

            return; // FIX: не отправляем второй раз ниже
        }

        // FIX: остальные события — отправляем как есть, с обрезкой параметров до 100 символов
        for (var p in params) {
            if (params[p] != null) params[p] = String(params[p]).slice(0, 100);
        }

        send(event, params);
    });

    // ---------- Выбор питомца на главной ----------
    document.addEventListener('click', function (e) {
        var target = e.target;
        if (!target || !target.closest) return;

        var el = target.closest('[data-event="pet_type_select"]');
        if (!el) return;

        var petType = el.dataset.petType;
        if (!petType) return;

        document.querySelectorAll('.pet-select__card').forEach(function (card) {
            card.classList.remove('pet-select__card--active');
        });
        el.classList.add('pet-select__card--active');
        sessionStorage.setItem('selected_pet', petType);

        // Отправляем событие (один раз)
        send('pet_type_select', { pet_type: petType });

        var services = document.querySelector('.services');
        if (services) services.scrollIntoView({ behavior: 'smooth' });
    });

    // ---------- FAQ (событие toggle) ----------
    document.addEventListener('toggle', function (e) {
        var el = e.target;
        if (el && el.tagName === 'DETAILS' && el.dataset.event === 'faq_open' && el.open) {
            send('faq_open', { question_id: el.dataset.questionId || 'unknown' });
        }
    }, true); // useCapture: true — toggle не всплывает

})();