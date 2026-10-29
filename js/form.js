/* js/form.js — отправка заявки на Apps Script + события GA4 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('leadForm');
    if (!form) return;

    var btn = form.querySelector('button[type="submit"]');
    var originalBtnText = btn ? btn.textContent : 'Записаться';
    var endpoint = window.LEADS_ENDPOINT || '';
    var consentEl = form.querySelector('[name="consent"]');

    (function captureUtm() {
      var keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];
      var params = new URLSearchParams(window.location.search);
      keys.forEach(function (key) {
        var value = params.get(key);
        if (value) sessionStorage.setItem(key, value);
      });
    })();

    var requestId = sessionStorage.getItem('request_id');
    if (!requestId) {
      requestId = (window.crypto && crypto.randomUUID)
        ? 'REQ-' + crypto.randomUUID()
        : 'REQ-' + Date.now() + '-' + Math.random().toString(36).slice(2);
      sessionStorage.setItem('request_id', requestId);
    }

    function getUtm(key, fallback) {
      return sessionStorage.getItem(key) || fallback;
    }

    function normalizePhone(raw) {
      var digits = String(raw || '').replace(/\D/g, '');
      if (digits.length === 11 && digits.charAt(0) === '8') digits = '7' + digits.slice(1);
      if (digits.length === 10) digits = '7' + digits;
      return digits.length === 11 && digits.charAt(0) === '7' ? '+' + digits : null;
    }

    var formStarted = false;
    form.addEventListener('input', function () {
      if (!formStarted) {
        formStarted = true;
        if (window.LapaAnalytics) window.LapaAnalytics.formStart('lead_form');
      }
    });

    function showError(input, message) {
      if (!input) return;
      var name = input.getAttribute('name');
      var error = name ? form.querySelector('.error-text[data-for="' + name + '"]') : null;
      if (!error) {
        error = document.getElementById('formError');
        if (!error) {
          error = document.createElement('div');
          error.id = 'formError';
          error.className = 'error-text';
          form.appendChild(error);
        }
      }
      error.textContent = message;
      if (input.type !== 'checkbox' && input.style) {
        input.style.borderColor = '#e74c3c';
      }
      if (window.LapaAnalytics) window.LapaAnalytics.formError(name || 'form', 'validation');
    }

    function clearErrors() {
      form.querySelectorAll('.error-text').forEach(function (el) { el.textContent = ''; });
      form.querySelectorAll('input, select, textarea').forEach(function (el) { el.style.borderColor = ''; });
    }

    function validate() {
      clearErrors();
      var nameEl = form.querySelector('[name="name"]');
      var phoneEl = form.querySelector('[name="phone"]');
      var emailEl = form.querySelector('[name="email"]');
      var petEl = form.querySelector('[name="pet_type"]:checked');
      var serviceEl = form.querySelector('[name="service"]');

      var name = nameEl ? nameEl.value.trim() : '';
      var phone = phoneEl ? normalizePhone(phoneEl.value) : null;
      var email = emailEl ? emailEl.value.trim() : '';

      if (name.length < 2 || name.length > 60) { showError(nameEl, 'Введите имя от 2 до 60 символов.'); return false; }
      if (!phone) { showError(phoneEl, 'Введите телефон в формате +7XXXXXXXXXX.'); return false; }
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showError(emailEl, 'Проверьте формат электронной почты.'); return false; }
      if (!consentEl || !consentEl.checked) { showError(consentEl, 'Необходимо согласиться с политикой конфиденциальности.'); return false; }
      if (!petEl) { showError(form.querySelector('[name="pet_type"]'), 'Выберите вид питомца.'); return false; }
      if (!serviceEl || !serviceEl.value) { showError(serviceEl, 'Выберите услугу.'); return false; }
      return true;
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (!validate()) return;
      if (!endpoint || endpoint.indexOf('ВАШ') !== -1) {
        showError(btn, 'Приёмник заявок не настроен.');
        return;
      }

      var petEl = form.querySelector('[name="pet_type"]:checked');
      var serviceEl = form.querySelector('[name="service"]');

      var payload = {
        request_id: requestId,
        name: form.querySelector('[name="name"]').value.trim(),
        phone: normalizePhone(form.querySelector('[name="phone"]').value),
        email: form.querySelector('[name="email"]').value.trim(),
        pet_type: petEl.value,
        service: serviceEl.value,
        utm_source: getUtm('utm_source', 'direct'),
        utm_medium: getUtm('utm_medium', 'none'),
        utm_campaign: getUtm('utm_campaign', 'not_set'),
        utm_content: getUtm('utm_content', 'not_set')
      };

      if (btn) { btn.disabled = true; btn.textContent = 'Отправляем…'; }
      if (window.LapaAnalytics) window.LapaAnalytics.formSubmit('lead_form');

      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (res && res.ok === true) {
            sessionStorage.removeItem('request_id');
            var go = function () {
              window.location.href = 'thanks.html?request_id=' + encodeURIComponent(requestId);
            };
            if (window.LapaAnalytics) {
              window.LapaAnalytics.generateLead(payload.pet_type, payload.service, payload.utm_source, go);
            } else {
              go();
            }
          } else {
            throw new Error((res && res.error) || 'Ошибка приёмника');
          }
        })
        .catch(function () {
          showError(btn, 'Не удалось отправить. Попробуйте ещё раз или позвоните.');
          if (window.LapaAnalytics) window.LapaAnalytics.formError('form', 'server');
          if (btn) { btn.disabled = false; btn.textContent = originalBtnText; }
        });
    });
  });
})();