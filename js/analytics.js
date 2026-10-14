// js/analytics.js
// Единый файл для отправки событий в Google Analytics 4.

(function () {
    'use strict';

    // Отправка события в GA4
    function send(event, params) {
        if (typeof gtag !== 'function') return;
        gtag('event', event, params || {});
    }

    // Экспорт для других скриптов (form.js, vaccines.js)
    window.LapaAnalytics = {
        send: send,
        formStart: function (id) { send('form_start', { form_id: id || 'lead_form' }); },
        formSubmit: function (id) { send('form_submit', { form_id: id || 'lead_form' }); },
        generateLead: function (pet, service, source) {
            send('generate_lead', { lead_pet_type: pet, lead_service: service, lead_source: source });
        },
        formError: function (field, type) {
            send('form_error', { field_name: field, error_type: type });
        },
        vaccineCalc: function (pet, age) {
            send('vaccine_calc', { pet_type: pet, age_weeks: age });
        }
    };

    // Обработка кликов по элементам с data-event
    document.addEventListener('click', function (e) {
        var el = e.target.closest('[data-event]');
        if (!el) return;

        var event = el.dataset.event;
        var params = {};

        // Собираем все data-* кроме data-event
        for (var key in el.dataset) {
            if (key === 'event') continue;
            var snake = key.replace(/([A-Z])/g, '_$1').toLowerCase();
            params[snake] = el.dataset[key];
        }

        // Обязательные параметры для конкретных событий
        if (event === 'cta_click') {
            params.button_name = params.button_name || 'unknown';
            params.page_section = params.page_section || 'unknown';
        }
        if (event === 'contact_click') params.contact_type = params.contact_type || 'phone';
        if (event === 'messenger_click') params.messenger = params.messenger || 'unknown';
        if (event === 'social_click') {
            params.network = params.network || 'unknown';
            params.page_section = params.page_section || 'footer';
        }

        // Особые случаи: file_download, promo_copy
        if (event === 'file_download' && el.href) {
            params.file_name = el.href.split('/').pop();
            params.file_extension = 'pdf';
        }
        if (event === 'promo_copy') {
            var code = el.dataset.promoCode || 'VAKCINA';
            if (navigator.clipboard) navigator.clipboard.writeText(code).catch(function(){});
            params.promo_code = code;
        }

        send(event, params);
    });

})();