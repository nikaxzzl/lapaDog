document.addEventListener('DOMContentLoaded', function () {
  var form = document.getElementById('leadForm');
  if (!form) return;

  var btn = form.querySelector('button[type="submit"]');
  var originalBtnText = btn.textContent;
  var endpoint = window.LEADS_ENDPOINT || '';

  var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];
  var params = new URLSearchParams(window.location.search);
  
  UTM_KEYS.forEach(function (key) {
    var value = params.get(key);
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

  var formStarted = false;
  form.addEventListener('input', function () {
    if (!formStarted) {
      formStarted = true;
      if (window.LapaAnalytics) window.LapaAnalytics.formStart('lead_form');
    }
  });

  function validate() {
    var nameEl = form.querySelector('[name="name"]');
    var phoneEl = form.querySelector('[name="phone"]');
    var emailEl = form.querySelector('[name="email"]');
    var consentEl = form.querySelector('[name="consent"]');

    if (nameEl.value.trim().length < 2 || nameEl.value.trim().length > 60) {
      showError(nameEl, 'Введите имя (от 2 до 60 символов)');
      if (window.LapaAnalytics) window.LapaAnalytics.formError('name', 'validation');
      return false;
    }

    if (!/^\+7\d{10}$/.test(phoneEl.value.trim())) {
      showError(phoneEl, 'Введите телефон в формате +7XXXXXXXXXX');
      if (window.LapaAnalytics) window.LapaAnalytics.formError('phone', 'validation');
      return false;
    }

    if (emailEl.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value.trim())) {
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

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate()) return;

    if (!endpoint || endpoint.indexOf('ВАША_ССЫЛКА') !== -1) {
      showError(btn, 'Форма временно недоступна. Позвоните: +7 900 777-90-90');
      return;
    }

    var requestId = getRequestId();
    
    // Берем выбранную радиокнопку
    var petEl = form.querySelector('[name="pet_type"]:checked');

    var payload = {
      request_id: requestId,
      name: form.querySelector('[name="name"]').value.trim(),
      phone: form.querySelector('[name="phone"]').value.trim(),
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
        showError(btn, 'Не удалось отправить заявку. Попробуйте ещё раз.');
        btn.disabled = false;
        btn.textContent = originalBtnText;
      });
  });

  function showError(input, message) {
    if (input.tagName === 'BUTTON') {
      var formErr = document.getElementById('formError');
      if (!formErr) {
        formErr = document.createElement('div');
        formErr.id = 'formError';
        formErr.style.color = '#e74c3c';
        formErr.style.fontSize = '14px';
        formErr.style.marginTop = '10px';
        form.appendChild(formErr);
      }
      formErr.textContent = message;
      formErr.hidden = false;
      return;
    }

    var name = input.getAttribute('name');
    var errEl = form.querySelector('.error-text[data-for="' + name + '"]');
    if (errEl) errEl.textContent = message;

    if (input.style) input.style.borderColor = '#e74c3c';
    if (input.focus) input.focus();

    input.addEventListener('input', function handler() {
      if (input.style) input.style.borderColor = '';
      if (errEl) errEl.textContent = '';
      input.removeEventListener('input', handler);
    });
  }
});