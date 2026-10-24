document.addEventListener('DOMContentLoaded', function () {
  var form = document.getElementById('lead-form');
  if (!form) return;

  var btn = form.querySelector('button[type="submit"]');
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
      showError(phoneEl, 'Введите телефон в формате +7XXXXXXXXXX (например, +79001234567)');
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
      showError(btn, 'Форма временно недоступна. Позвоните нам: +7 900 777-90-90');
      console.error('LEADS_ENDPOINT не настроен. Вставьте URL веб-приложения Apps Script.');
      return;
    }

    var requestId = 'REQ-' + (window.crypto && crypto.randomUUID
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
        showError(btn, 'Не удалось отправить заявку. Попробуйте ещё раз или позвоните нам.');
        btn.disabled = false;
        btn.textContent = 'Отправить заявку';
      });
  });
/**
 * Обработка формы записи. ТЗ-06/2026, раздел 6.3.
 */
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxZJ7GAqYHetg5LZ3DR8TZPyuyxJQ1M4dJYzdk7sYrJZxgYfLmtg08EDMyEqpTmGzLl/exec';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('leadForm');
  if (!form) return;

  // ===== 1. РАБОТА С UTM И SESSIONSTORAGE =====
  const urlParams = new URLSearchParams(window.location.search);
  const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];

  // Если в URL есть метки — сохраняем в sessionStorage
  utmKeys.forEach(key => {
    const val = urlParams.get(key);
    if (val) sessionStorage.setItem(key, val);
  });

  // Заполняем скрытые поля значениями из sessionStorage (или пустыми)
  function fillHiddenUtm() {
    utmKeys.forEach(key => {
      const el = document.getElementById(key);
      if (el) el.value = sessionStorage.getItem(key) || '';
    });
  }
  fillHiddenUtm();

  // ===== 2. ГЕНЕРАЦИЯ REQUEST_ID =====
  // Генерируем один раз за сессию, чтобы при повторной отправке не создавались дубли
  function getRequestId() {
    let id = sessionStorage.getItem('request_id');
    if (!id) {
      // Простая генерация UUID v4
      id = 'REQ-' + 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
      sessionStorage.setItem('request_id', id);
    }
    return id;
  }
  document.getElementById('request_id').value = getRequestId();

  // ===== 3. ОТПРАВКА ФОРМЫ =====
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Сброс ошибок
    document.querySelectorAll('.error-text').forEach(el => el.textContent = '');
    document.getElementById('formError').hidden = true;

    const submitBtn = document.getElementById('submitBtn');
    const originalBtnText = submitBtn.textContent;
    
    // Собираем данные формы
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Добавляем метки из sessionStorage (если в URL их не было, но они были сохранены ранее)
    fillHiddenUtm();
    utmKeys.forEach(key => {
      data[key] = document.getElementById(key).value || '';
    });

    // Принудительно ставим status: new (сервер его всё равно проигнорирует, но так безопаснее)
    data.status = 'new';

    // Валидация на клиенте (базовая, сервер проверит строже)
    if (!data.consent) {
      showError('consent', 'Необходимо согласие на обработку данных');
      return;
    }
    if (data.phone && !/^\+7\d{10}$/.test(data.phone)) {
      showError('phone', 'Телефон должен быть в формате +7XXXXXXXXXX');
      return;
    }

    // Меняем кнопку
    submitBtn.disabled = true;
    submitBtn.textContent = 'Отправка...';

    // Отправляем запрос
    try {
      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'text/plain;charset=utf-8' // Важно для Apps Script
        }
      });

      const result = await response.json();

      if (result.ok) {
        // Успех! Отправляем событие GA4
        if (window.gtag) {
          gtag('event', 'generate_lead', {
            lead_service: data.service,
            lead_pet_type: data.pet_type,
            lead_source: data.utm_source || 'direct'
          });
        }
        
        // Переходим на страницу благодарности
        window.location.href = 'thanks.html?request_id=' + encodeURIComponent(data.request_id);
      } else {
        // Ошибка от сервера
        throw new Error(result.error || 'Неизвестная ошибка');
      }
    } catch (err) {
      // Ошибка сети или сервера
      document.getElementById('formError').hidden = false;
      document.getElementById('formError').textContent = 'Ошибка отправки: ' + err.message;
      
      // Событие GA4
      if (window.gtag) {
        gtag('event', 'form_error', {
          error_type: 'server'
        });
      }
      
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
    }
  });

  // Функция для показа ошибки у поля
  function showError(fieldName, message) {
    const errorEl = document.querySelector(`.error-text[data-for="${fieldName}"]`);
    if (errorEl) errorEl.textContent = message;
    
    const inputEl = document.getElementById(fieldName);
    if (inputEl) inputEl.classList.add('input-error');
  }
});
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