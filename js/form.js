/* js/form.js — отправка заявки на Apps Script + события GA4 */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('leadForm');

    if (!form) return;

    var btn = form.querySelector('button[type="submit"]');
    var originalBtnText = btn ? btn.textContent : 'Отправить заявку';
    var endpoint = window.LEADS_ENDPOINT || '';

    var consentEl = form.querySelector('[name="consent"]');

    // --- FIX: Сбор UTM-меток при загрузке страницы (работает на всех страницах) ---
    (function captureUtm() {
      var keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];
      var params = new URLSearchParams(window.location.search);
      keys.forEach(function (key) {
        var value = params.get(key);
        if (value) {
          sessionStorage.setItem(key, value);
        }
      });
    })();

    // Синхронизируем скрытые поля формы с sessionStorage
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'].forEach(function (key) {
      var field = form.querySelector('[name="' + key + '"]');
      if (field) {
        field.value = sessionStorage.getItem(key) || '';
      }
    });

    function getUtm(key, fallback) {
      return sessionStorage.getItem(key) || fallback;
    }

    function getRequestId() {
      if (window.crypto && typeof window.crypto.randomUUID === 'function') {
        return 'REQ-' + window.crypto.randomUUID();
      }
      return 'REQ-' + Date.now() + '-' + Math.random().toString(36).slice(2);
    }

    function normalizePhone(raw) {
      var digits = String(raw || '').replace(/\D/g, '');
      if (digits.length === 11 && digits.charAt(0) === '8') {
        digits = '7' + digits.slice(1);
      }
      if (digits.length === 10) {
        digits = '7' + digits;
      }
      return digits.length === 11 && digits.charAt(0) === '7' ? '+' + digits : null;
    }

    // --- FIX: form_start при первом вводе ---
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
      var error = name
        ? form.querySelector('.error-text[data-for="' + name + '"]')
        : null;

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
        if (input.focus) input.focus();
      }

      // --- FIX: form_error при ошибке валидации ---
      if (window.LapaAnalytics) {
        window.LapaAnalytics.formError(name || 'form', 'validation');
      }
    }

    function clearErrors() {
      form.querySelectorAll('.error-text').forEach(function (el) {
        el.textContent = '';
      });
      form.querySelectorAll('input, select, textarea').forEach(function (el) {
        el.style.borderColor = '';
      });
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

      if (name.length < 2 || name.length > 60) {
        showError(nameEl, 'Введите имя от 2 до 60 символов.');
        return false;
      }

      if (!phone) {
        showError(phoneEl, 'Введите телефон в формате +7XXXXXXXXXX.');
        return false;
      }

      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showError(emailEl, 'Проверьте формат электронной почты.');
        return false;
      }

      if (!consentEl || !consentEl.checked) {
        showError(consentEl, 'Необходимо согласиться с политикой конфиденциальности.');
        return false;
      }

      if (!petEl) {
        showError(form.querySelector('[name="pet_type"]'), 'Выберите вид питомца.');
        return false;
      }

      if (!serviceEl || !serviceEl.value) {
        showError(serviceEl, 'Выберите услугу.');
        return false;
      }

      return true;
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      if (!validate()) return;

      if (!endpoint || endpoint.indexOf('ВАШ') !== -1) {
        showError(btn, 'Приёмник заявок не настроен. Проверьте LEADS_ENDPOINT.');
        return;
      }

      var petEl = form.querySelector('[name="pet_type"]:checked');
      var serviceEl = form.querySelector('[name="service"]');
      var requestId = getRequestId();

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

      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Отправляем…';
      }

      // --- FIX: form_submit перед отправкой ---
      if (window.LapaAnalytics) window.LapaAnalytics.formSubmit('lead_form');

      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      })
        .then(function (response) {
          if (!response.ok) {
            throw new Error('Ошибка HTTP: ' + response.status);
          }
          return response.json();
        })
        .then(function (data) {
          if (!data || data.ok !== true) {
            throw new Error(data && data.error ? data.error : 'Ошибка приёма заявки.');
          }

          // --- FIX: generate_lead перед редиректом (только после ok: true) ---
          var go = function () {
            window.location.href = 'thanks.html?request_id=' + encodeURIComponent(requestId);
          };

          if (window.LapaAnalytics) {
            window.LapaAnalytics.generateLead(
              payload.pet_type,
              payload.service,
              payload.utm_source,
              go
            );
          } else {
            go();
          }
        })
        .catch(function (error) {
          console.error('Ошибка отправки заявки:', error);
          showError(btn, 'Не удалось отправить заявку. Проверьте данные и попробуйте ещё раз.');
          
          // --- FIX: form_error при ошибке сервера ---
          if (window.LapaAnalytics) window.LapaAnalytics.formError('form', 'server');

          if (btn) {
            btn.disabled = false;
            btn.textContent = originalBtnText;
          }
        });
    });
  });
})();