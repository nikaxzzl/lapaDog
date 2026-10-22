// js/analytics.js
(function () {
    'use strict';

    function send(event, params) {
        if (typeof gtag !== 'function') return;
        gtag('event', event, params || {});
    }

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

    document.addEventListener('click', function (e) {
        var el = e.target.closest('[data-event]');
        if (!el) return;

        var event = el.dataset.event;
        var params = {};

        for (var key in el.dataset) {
            if (key === 'event') continue;
            var snake = key.replace(/([A-Z])/g, '_$1').toLowerCase();
            params[snake] = el.dataset[key];
        }

        if (event === 'cta_click') {
            if (!params.button_name || !params.page_section) return;
        }
        if (event === 'contact_click' && !params.contact_type) params.contact_type = 'phone';
        if (event === 'messenger_click' && !params.messenger) return;
        if (event === 'social_click') {
            if (!params.network) return;
            if (!params.page_section) params.page_section = 'footer';
        }

        if (event === 'file_download' && el.href) {
            params.file_name = el.href.split('/').pop();
            params.file_extension = 'pdf';
        }
        if (event === 'promo_copy') {
            var code = el.dataset.promoCode || 'VAKCINA';
            if (navigator.clipboard) navigator.clipboard.writeText(code).catch(function () {});
            params.promo_code = code;
        }

        send(event, params);
    });

    document.addEventListener('click', function (e) {
        var el = e.target.closest('[data-event="pet_type_select"]');
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