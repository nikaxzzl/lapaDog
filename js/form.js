// ==========================================
// БЛОК СБОРА UTM-МЕТОК
// ==========================================
function getUtmParams() {
    const urlParams = new URLSearchParams(window.location.search);
    return {
        utm_source: urlParams.get('utm_source') || 'not_set',
        utm_medium: urlParams.get('utm_medium') || 'not_set',
        utm_campaign: urlParams.get('utm_campaign') || 'not_set',
        utm_content: urlParams.get('utm_content') || 'not_set'
    };
}
// ==========================================
// js/form.js — отправка заявки на Apps Script

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('leadForm');
    if (!form) return;

    var btn = form.querySelector('button[type="submit"]');
    var originalBtnText = btn ? btn.textContent : '';
    var endpoint = window.LEADS_ENDPOINT || '';

      // Ловим UTM-метки на любой странице и сохраняем в память браузера
    var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];
    var urlParams = new URLSearchParams(window.location.search);
  
    UTM_KEYS.forEach(function (key) {
    var value = urlParams.get(key);
    if (value) sessionStorage.setItem(key, value);
  });

    function getUtm(key, fallback) {
      return sessionStorage.getItem(key) || fallback;
    }

    function getRequestId() {
      var id = sessionStorage.getItem('request_id');
      if (!id) {
        id = 'REQ-' + (window.crypto && crypto.randomUUID
          ? crypto.randomUUID()
          : Date.now() + '-' + Math.random().toString(36).slice(2));
        sessionStorage.setItem('request_id', id);
      }
      return id;
    }

    function normalizePhone(raw) {
      var d = String(raw || '').replace(/\D/g, '');
      if (d.length === 11 && d.charAt(0) === '8') d = '7' + d.slice(1);
      if (d.length === 10) d = '7' + d;
      return (d.length === 11 && d.charAt(0) === '7') ? '+' + d : null;
    }

    var formStarted = false;
    form.addEventListener('input', function () {
      if (!formStarted) {
        formStarted = true;
        if (window.LapaAnalytics) window.LapaAnalytics.formStart('lead_form');
      }
    });

    function setFieldError(input, message) {
      if (input.tagName === 'BUTTON') {
        var formErr = document.getElementById('formError');
        if (!formErr) {
          formErr = document.createElement('div');
          formErr.id = 'formError';
          formErr.className = 'error-text';
          form.appendChild(formErr);
        }
        formErr.textContent = message;
        return;
      }

      var name = input.getAttribute('name');
      var errEl = form.querySelector('.error-text[data-for="' + name + '"]');
      if (errEl) errEl.textContent = message;

      input.style.borderColor = '#e74c3c';
      if (input.focus) input.focus();

      input.addEventListener('input', function handler() {
        input.style.borderColor = '';
        if (errEl) errEl.textContent = '';
        input.removeEventListener('input', handler);
      });
    }

    function validate() {
      var nameEl = form.querySelector('[name="name"]');
      var phoneEl = form.querySelector('[name="phone"]');
      var emailEl = form.querySelector('[name="email"]');
      var consentEl = form.querySelector('[name="consent"]');

      var name = nameEl.value.trim();
      if (name.length < 2 || name.length > 60) {
        setFieldError(nameEl, 'Введите имя (от 2 до 60 символов)');
        if (window.LapaAnalytics) window.LapaAnalytics.formError('name', 'validation');
        return false;
      }

      if (!normalizePhone(phoneEl.value)) {
        setFieldError(phoneEl, 'Телефон в формате +7XXXXXXXXXX');
        if (window.LapaAnalytics) window.LapaAnalytics.formError('phone', 'validation');
        return false;
      }

      var email = emailEl.value.trim();
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setFieldError(emailEl, 'Проверьте формат e-mail');
        if (window.LapaAnalytics) window.LapaAnalytics.formError('email', 'validation');
        return false;
      }

      if (!consentEl.checked) {
        setFieldError(consentEl, 'Согласитесь с политикой конфиденциальности');
        if (window.LapaAnalytics) window.LapaAnalytics.formError('consent', 'validation');
        return false;
      }

      return true;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate()) return;

      if (!endpoint || endpoint.indexOf('ВАШ') !== -1) {
        setFieldError(btn, 'Форма временно недоступна. Позвоните: +7 900 606-24-24');
        return;
      }

      var requestId = getRequestId();
      var petEl = form.querySelector('[name="pet_type"]:checked');

      var payload = {
        request_id: requestId,
        name: form.querySelector('[name="name"]').value.trim(),
        phone: normalizePhone(form.querySelector('[name="phone"]').value),
        email: form.querySelector('[name="email"]').value.trim(),
        pet_type: petEl ? petEl.value : 'other',
        service: form.querySelector('[name="service"]').value,
        utm_source: getUtm('utm_source', 'direct'),
        utm_medium: getUtm('utm_medium', 'none'),
        utm_campaign: getUtm('utm_campaign', 'not_set'),
        utm_content: getUtm('utm_content', 'not_set')
      };

      btn.disabled = true;
      btn.textContent = 'Отправляем…';
      if (window.LapaAnalytics) window.LapaAnalytics.formSubmit('lead_form');

      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (data && data.ok === true) {
            var go = function () {
              window.location.href = 'thanks.html?request_id=' + encodeURIComponent(requestId);
            };
            if (window.LapaAnalytics) {
              window.LapaAnalytics.generateLead(payload.pet_type, payload.service, payload.utm_source, go);
            } else {
              go();
            }
          } else {
            throw new Error((data && data.error) || 'server');
          }
        })
        .catch(function (err) {
          console.error('Ошибка отправки:', err);
          if (window.LapaAnalytics) window.LapaAnalytics.formError('form', 'server');
          setFieldError(btn, 'Не удалось отправить заявку. Попробуйте ещё раз.');
          btn.disabled = false;
          btn.textContent = originalBtnText;
        });
    });
  });
})();