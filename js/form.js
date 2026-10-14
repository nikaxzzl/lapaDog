document.addEventListener('DOMContentLoaded', function () {
  var form = document.getElementById('lead-form');
  if (!form) return;

  var btn = form.querySelector('button[type="submit"]');

  // Событие form_start — первое взаимодействие
  var formStarted = false;
  form.addEventListener('input', function () {
    if (!formStarted) {
      formStarted = true;
      if (window.LapaAnalytics) window.LapaAnalytics.formStart('lead_form');
    }
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    
    var name = form.name.value.trim();
    if (name.length < 2) {
      showError(form.name, 'Введите имя (минимум 2 символа)');
      if (window.LapaAnalytics) window.LapaAnalytics.formError('name', 'validation');
      return;
    }

    // 2. Проверка телефона
    var phone = form.phone.value.trim();
    var phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 11) {
      showError(form.phone, 'Введите телефон в формате +7XXXXXXXXXX');
      if (window.LapaAnalytics) window.LapaAnalytics.formError('phone', 'validation');
      return;
    }

    // 3. Проверка согласия
    if (!form.consent.checked) {
      if (window.LapaAnalytics) window.LapaAnalytics.formError('consent', 'validation');
      alert('Пожалуйста, согласитесь с политикой конфиденциальности');
      return;
    }


    var requestId = 'REQ-' + (crypto.randomUUID
      ? crypto.randomUUID()
      : Date.now() + '-' + Math.random().toString(36).slice(2));


    if (window.LapaAnalytics) {
      window.LapaAnalytics.formSubmit('lead_form');
      window.LapaAnalytics.generateLead(
        form.pet_type.value,
        form.service.value,
        sessionStorage.getItem('utm_source') || 'direct'
      );
    }

    window.location.href = 'thanks.html?request_id=' + encodeURIComponent(requestId);
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
    input.focus();


    input.addEventListener('input', function handler() {
      input.style.borderColor = '';
      var err = input.nextElementSibling;
      if (err && err.classList.contains('form-error')) err.remove();
      input.removeEventListener('input', handler);
    });
  }
});