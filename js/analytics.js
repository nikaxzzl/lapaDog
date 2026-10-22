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
            // price_from берём из data-price-from, если есть
        }

        // ---------- Особые случаи ----------
        if (event === 'file_download') {
            if (!el.href) return;
            var fileName = el.href.split('/').pop().split('?')[0];
            params.file_name = fileName;
            var dot = fileName.lastIndexOf('.');
            params.file_extension = dot > -1 ? fileName.slice(dot + 1).toLowerCase() : '';
        }

        if (event === 'promo_copy') {
            var code = el.dataset.promoCode || 'VAKCINA';
            var fire = function () {
                params.promo_code = code;
                send('promo_copy', params);
            };
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(code).then(fire).catch(fire);
            } else {
                fire();
            }
            return; // не отправляем второй раз ниже
        }

        // ТЗ 4.3: значения параметров не длиннее 100 символов
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

        document.querySelectorAll('.pet-select__card').forEach(function (card) {
            card.classList.remove('pet-select__card--active');
        });
        el.classList.add('pet-select__card--active');
        sessionStorage.setItem('selected_pet', el.dataset.petType);

        var services = document.querySelector('.services');
        if (services) services.scrollIntoView({ behavior: 'smooth' });
    });
})();