// js/form.js
// Валидация, сохранение UTM, отправка в Apps Script, события GA4.

document.addEventListener('DOMContentLoaded', function () {
  var form = document.getElementById('lead-form');
  if (!form) return;

  var btn = form.querySelector('button[type="submit"]');
  var endpoint = window.LEADS_ENDPOINT || '';

  // ---------- UTM: сохраняем в sessionStorage ----------
  var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];
  var params = new URLSearchParams(window.location.search);

  UTM_KEYS.forEach(function (key) {
    var value = params.get(key);
    if (value) sessionStorage.setItem(key, value);
  });

  function getUtm(key, fallback) {
    return sessionStorage.getItem(key) || fallback;
  }

  // ---------- form_start ----------
  var formStarted = false;
  form.addEventListener('input', function () {
    if (!formStarted) {
      formStarted = true;
      if (window.LapaAnalytics) window.LapaAnalytics.formStart('lead_form');
    }
  });

  // ---------- Валидация ----------
  function validate() {
    var nameEl = form.querySelector('[name="name"]');
    var phoneEl = form.querySelector('[name="phone"]');
    var emailEl = form.querySelector('[name="email"]');
    var consentEl = form.querySelector('[name="consent"]');

    var name = nameEl.value.trim();
    if (name.length < 2 || name.length > 60) {
      showError(nameEl, 'Введите имя (от 2 до 60 символов)');
      if (window.LapaAnalytics) window.LapaAnalytics.formError('name', 'validation');
      return false;
    }

    var phone = phoneEl.value.trim();
    if (!/^\+7\d{10}$/.test(phone)) {
      showError(phoneEl, 'Введите телефон в формате +7XXXXXXXXXX');
      if (window.LapaAnalytics) window.LapaAnalytics.formError('phone', 'validation');
      return false;
    }

    var email = emailEl.value.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError(emailEl, 'Проверьте формат e-mail');
      if (window.LapaAnalytics) window.LapaAnalytics.formError('email', 'validation');
      return false;
    }

    if (!consentEl.checked) {
      showError(consentEl, 'Согласитесь с политикой конфиденциальности');
      if (window.LapaAnalytics) window.LapaAnalytics.formError('consent', 'validation');
      return false;
    }

    return true;
  }

  // ---------- Отправка ----------
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate()) return;

    if (!endpoint) {
      showError(btn, 'Форма временно недоступна. Позвоните нам.');
      if (window.LapaAnalytics) window.LapaAnalytics.formError('form', 'server');
      return;
    }

    var requestId = 'REQ-' + (crypto.randomUUID
      ? crypto.randomUUID()
      : Date.now() + '-' + Math.random().toString(36).slice(2));

    var payload = {
      request_id: requestId,
      name: form.querySelector('[name="name"]').value.trim(),
      phone: form.querySelector('[name="phone"]').value.trim(),
      email: form.querySelector('[name="email"]').value.trim(),
      pet_type: form.querySelector('[name="pet_type"]:checked').value,
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
            window.LapaAnalytics.generateLead(
              payload.pet_type,
              payload.service,
              payload.utm_source,
              go
            );
          } else {
            go();
          }
        } else {
          throw new Error((data && data.error) || 'server');
        }
      })
      .catch(function () {
        if (window.LapaAnalytics) {
          window.LapaAnalytics.formError('form', 'server');
        }
        showError(btn, 'Не удалось отправить заявку. Попробуйте ещё раз или позвоните нам.');
        btn.disabled = false;
        btn.textContent = 'Отправить заявку';
      });
  });

  // ---------- Показ ошибки ----------
  function showError(input, message) {
    input.style.borderColor = '#e74c3c';
    var next = input.nextElementSibling;
    if (next && next.classList.contains('form-error')) {
      next.textContent = message;
    } else {
      var err = document.createElement('div');
      err.className = 'form-error';
      err.style.color = '#e74c3c';
      err.style.fontSize = '13px';
      err.style.marginTop = '4px';
      err.textContent = message;
      input.parentNode.insertBefore(err, input.nextSibling);
    }
    if (input.focus) input.focus();

    input.addEventListener('input', function handler() {
      input.style.borderColor = '';
      var err = input.nextElementSibling;
      if (err && err.classList.contains('form-error')) err.remove();
      input.removeEventListener('input', handler);
    });
  }
});