const SPREADSHEET_ID = '1k8PA1CkCwjY_hQaVpb9vShLfIKEiV_G_ti86mwSy5Q8';
const SHEET_NAME = 'leads';

function doPost(e) {
  try {
    var data;

    // Проверяем, как пришли данные: как параметры формы или как JSON
    if (e.parameter && e.parameter.json_data) {
      data = JSON.parse(e.parameter.json_data);
    } else if (e.parameter && e.parameter.request_id) {
      data = e.parameter; // Если данные пришли просто полями формы
    } else if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents); // Если пришел JSON (fetch)
    } else {
      return json({ ok: false, error: 'Пустой запрос' });
    }

    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);

    // Защита от дублей
    if (isDuplicate(sheet, data.request_id)) {
      return json({ ok: true, request_id: data.request_id, duplicate: true });
    }

    // Валидация
    const err = validate(data);
    if (err) return json({ ok: false, error: err });

    // Запись
    sheet.appendRow([
      data.request_id,
      new Date(),
      data.name.trim(),
      data.phone.trim(),
      (data.email || '').trim(),
      data.pet_type,
      data.service,
      data.utm_source || 'direct',
      data.utm_medium || 'none',
      data.utm_campaign || 'not_set',
      data.utm_content || 'not_set',
      'new',
    ]);

    return json({ ok: true, request_id: data.request_id });

  } catch (err) {
    return json({ ok: false, error: 'Ошибка сервера: ' + err.message });
  }
}

function isDuplicate(sheet, requestId) {
  if (!requestId) return false;
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;
  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat();
  return ids.indexOf(requestId) !== -1;
}

function validate(d) {
  const required = ['request_id', 'name', 'phone', 'pet_type', 'service'];
  for (const f of required) {
    if (d[f] === undefined || d[f] === null || String(d[f]).trim() === '') {
      return 'Поле «' + f + '» обязательно';
    }
  }
  
  const allFields = ['request_id', 'name', 'phone', 'email', 'pet_type', 'service', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];
  for (const f of allFields) {
    if (d[f] && String(d[f]).length > 200) {
      return 'Поле «' + f + '» длиннее 200 символов';
    }
  }
  
  const name = String(d.name).trim();
  if (name.length < 2 || name.length > 60) {
    return 'Имя должно быть от 2 до 60 символов';
  }
  
  // Телефон может прийти с плюсом или без
  const cleanPhone = String(d.phone).replace(/\D/g, '');
  if (cleanPhone.length !== 11 || cleanPhone.charAt(0) !== '7') {
    return 'Телефон должен быть в формате +7XXXXXXXXXX';
  }
  
  const email = (d.email || '').trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return 'Некорректный e-mail';
  }
  
  if (['cat', 'dog', 'rabbit', 'other'].indexOf(d.pet_type) === -1) {
    return 'Недопустимый pet_type';
  }
  
  if (['consult', 'vaccine', 'chip', 'sterilization', 'analysis', 'home_visit'].indexOf(d.service) === -1) {
    return 'Недопустимый service';
  }
  
  return null;
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// Функция для создания листа CRM (оставляем без изменений)
function createCrmImport() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName('crm_import');
  
  if (!sheet) {
    sheet = ss.insertSheet('crm_import');
  }
  sheet.clear();
  
  var headers = ['request_id', 'first_name', 'last_name', 'phone', 'email', 'pet_type', 'service', 'status_stage', 'deal_name', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
  
  var formulas = [
    '=ARRAYFORMULA(IF(leads!A2:A=""; ""; leads!A2:A))',
    '=ARRAYFORMULA(IF(leads!C2:C=""; ""; INDEX(SPLIT(СЖПРОБЕЛЫ(leads!C2:C); " "); 1)))',
    '=ARRAYFORMULA(IF(leads!C2:C=""; ""; IFERROR(INDEX(SPLIT(СЖПРОБЕЛЫ(leads!C2:C); " "); 2); "")))',
    '=ARRAYFORMULA(IF(leads!D2:D=""; ""; "+7"&REGEXREPLACE(REGEXREPLACE(leads!D2:D; "[^0-9]"; ""); "^8"; "")))',
    '=ARRAYFORMULA(IF(leads!E2:E=""; ""; leads!E2:E))',
    '=ARRAYFORMULA(IF(leads!F2:F=""; ""; leads!F2:F))',
    '=ARRAYFORMULA(IF(leads!G2:G=""; ""; leads!G2:G))',
    '=ARRAYFORMULA(IF(leads!L2:L=""; ""; ВПР(leads!L2:L; {"new"\\"New lead"; "contacted"\\"Contacted"; "appointment"\\"Appointment booked"; "visited"\\"Closed won"; "lost"\\"Closed lost"}; 2; ЛОЖЬ)))',
    '=ARRAYFORMULA(IF(leads!C2:C=""; ""; leads!C2:C & " — " & leads!F2:F & " — " & leads!G2:G))',
    '=ARRAYFORMULA(IF(leads!H2:H=""; ""; leads!H2:H))',
    '=ARRAYFORMULA(IF(leads!I2:I=""; ""; leads!I2:I))',
    '=ARRAYFORMULA(IF(leads!J2:J=""; ""; leads!J2:J))',
    '=ARRAYFORMULA(IF(leads!K2:K=""; ""; leads!K2:K))'
  ];
  
  sheet.getRange(2, 1, 1, formulas.length).setFormulas([formulas]);
  SpreadsheetApp.getUi().alert('Готово! Лист crm_import создан и заполнен формулами.');
}