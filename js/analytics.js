// js/analytics.js
// Единый файл отправки событий в GA4.
// Все события описаны через data-event на элементах, здесь — их обработка.

(function () {
    'use strict';

    // ---------- FIX: Сбор UTM-меток на ЛЮБОЙ странице ----------
    (function captureUtm() {
        var keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];
        var urlParams = new URLSearchParams(window.location.search);
        keys.forEach(function (key) {
            var v = urlParams.get(key);
            if (v) sessionStorage.setItem(key, v);
        });
    })();

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

    // ---------- Публичный API ----------
    window.LapaAnalytics = {
        send: send,
        formStart: function (id) {
            send('form_start', { form_id: id || 'lead_form' });
        },
        formSubmit: function (id) {
            send('form_submit', { form_id: id || 'lead_form' });
        },
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

        if (event === 'faq_open') return;
        if (event === 'pet_type_select') return;

        var params = {};

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

        // ---------- file_download ----------
        if (event === 'file_download') {
            var anchor = el.closest('a') || el;
            var href = anchor.href || '';
            var rawName = href.split('/').pop().split('?')[0] || '';
            var fileName = el.dataset.fileName || rawName.replace(/\.[^.]+$/, '');
            var dot = rawName.lastIndexOf('.');
            var ext = el.dataset.fileExtension
                || (dot > -1 ? rawName.slice(dot + 1).toLowerCase() : '');

            send('file_download', {
                file_name: fileName,
                file_extension: ext
            });
            return;
        }

        // ---------- promo_copy ----------
        if (event === 'promo_copy') {
            var code = el.dataset.promoCode || 'VAKCINA';
            var fire = function () {
                send('promo_copy', { promo_code: code });
            };
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(code).then(fire).catch(fire);
            } else {
                try {
                    var ta = document.createElement('textarea');
                    ta.value = code;
                    ta.style.position = 'fixed';
                    ta.style.opacity = '0';
                    document.body.appendChild(ta);
                    ta.select();
                    document.execCommand('copy');
                    document.body.removeChild(ta);
                } catch (err) {}
                fire();
            }
            return;
        }

        for (var p in params) {
            if (params[p] != null) params[p] = String(params[p]).slice(0, 100);
        }

        send(event, params);
    });

    // ---------- Выбор питомца ----------
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

        send('pet_type_select', { pet_type: petType });

        var services = document.querySelector('.services');
        if (services) services.scrollIntoView({ behavior: 'smooth' });
    });

    // ---------- FAQ ----------
    document.addEventListener('toggle', function (e) {
        var el = e.target;
        if (el && el.tagName === 'DETAILS' && el.dataset.event === 'faq_open' && el.open) {
            send('faq_open', { question_id: el.dataset.questionId || 'unknown' });
        }
    }, true);

})();