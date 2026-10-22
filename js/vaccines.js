// js/vaccines.js — календарь прививок по правилам ТЗ (раздел 2)
(function () {
  'use strict';

  var VACCINES = {
    cat: [
      [8,  'Комплексная вакцинация (1-я)'],
      [12, 'Ревакцинация (2-я)'],
      [52, 'Ежегодная ревакцинация']
    ],
    dog: [
      [8,  'Комплексная вакцинация'],
      [12, 'Ревакцинация'],
      [16, 'Ревакцинация + бешенство'],
      [52, 'Ежегодная ревакцинация']
    ],
    rabbit: [
      [6,  'Вакцинация от миксоматоза'],
      [10, 'Вакцинация от ВГБК'],
      [52, 'Ежегодная ревакцинация']
    ]
  };

  var typeEl = document.getElementById('pet-type');
  var ageEl  = document.getElementById('age-weeks');
  var list   = document.getElementById('vaccine-list');
  if (!typeEl || !ageEl || !list) return;

  function formatDate(d) {
    return d.toLocaleDateString('ru-RU');
  }

  function render() {
    var type = typeEl.value;
    var age  = parseInt(ageEl.value, 10);
    if (isNaN(age) || age < 0) age = 0;

    list.innerHTML = '';

    if (type === 'other') {
      list.innerHTML = '<li>Для этого вида животного нужна консультация врача — запишитесь на приём.</li>';
      return;
    }

    var plan = VACCINES[type] || [];
    var today = new Date();
    var any = false;

    plan.forEach(function (item) {
      var week = item[0];
      var name = item[1];
      if (week < age) return;

      var date = new Date(today);
      date.setDate(date.getDate() + (week - age) * 7);
      list.innerHTML += '<li>' + name + ' — ' + formatDate(date) + '</li>';
      any = true;
    });

    if (!any) {
      list.innerHTML = '<li>Все плановые прививки по возрасту уже сделаны. Поддерживающая ревакцинация — раз в год.</li>';
    }
  }

  var timer = null;
  function trackDebounced() {
    clearTimeout(timer);
    timer = setTimeout(function () {
      if (window.LapaAnalytics) {
        window.LapaAnalytics.vaccineCalc(typeEl.value, parseInt(ageEl.value, 10) || 0);
      }
    }, 600);
  }

  function onChange() {
    render();
    trackDebounced();
  }

  typeEl.addEventListener('change', onChange);
  ageEl.addEventListener('input', onChange);
  ageEl.addEventListener('change', onChange);

  render();
  if (window.LapaAnalytics) {
    window.LapaAnalytics.vaccineCalc(typeEl.value, parseInt(ageEl.value, 10) || 0);
  }
})();