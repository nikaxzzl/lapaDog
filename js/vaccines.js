const VACCINES = {
  cat: [
    [8,  "Комплексная вакцинация (1-я)"],
    [12, "Ревакцинация (2-я)"],
    [12, "Прививка от бешенства"],
    [52, "Ежегодная ревакцинация"]
  ],
  dog: [
    [6,  "Вакцинация от чумы и энтерита"],
    [9,  "Ревакцинация + бешенство"],
    [12, "Ревакцинация + лептоспироз"],
    [52, "Ежегодная ревакцинация"]
  ],
  rabbit: [
    [6,  "Вакцинация от миксоматоза"],
    [10, "Вакцинация от ВГБК"],
    [52, "Ежегодная ревакцинация"]
  ]
};
function update() {
  const type = document.getElementById('pet-type').value;
  const age  = +document.getElementById('age-weeks').value || 0;

  const list = document.getElementById('vaccine-list');
  list.innerHTML = '';

  const today = new Date();
   if (age > 52) {
    const date = new Date(today);
    date.setFullYear(date.getFullYear() + 1);
    list.innerHTML = `<li>Ежегодная ревакцинация — ${date.toLocaleDateString('ru-RU')}</li>`;
    return;
  }

  (VACCINES[type] || []).forEach(([week, name]) => {
    if (week < age) return; // уже прошло

    const date = new Date(today);
    date.setDate(date.getDate() + (week - age) * 7);

    list.innerHTML += `<li>${name} — ${date.toLocaleDateString('ru-RU')}</li>`;
  });
}

// Слушатели
document.getElementById('pet-type').onchange = update;
document.getElementById('age-weeks').oninput = update;

// Отправка события vaccine_calc
var typeEl = document.getElementById('pet-type');
var ageEl = document.getElementById('age-weeks');

if (typeEl && ageEl) {
  typeEl.addEventListener('change', function () {
    if (window.LapaAnalytics) {
      window.LapaAnalytics.vaccineCalc(typeEl.value, parseInt(ageEl.value) || 0);
    }
  });
  ageEl.addEventListener('change', function () {
    if (window.LapaAnalytics) {
      window.LapaAnalytics.vaccineCalc(typeEl.value, parseInt(ageEl.value) || 0);
    }
  });
}

update();